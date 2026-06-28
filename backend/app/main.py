from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .services.anakin_wire import call_wire
from .services.groq_llm import analyze_macro_impact_with_llm
import pandas as pd
import io
import os
import re
import tempfile
import asyncio
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="FolioSync API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "FolioSync API is running"}


# ─── PDF Parsing ──────────────────────────────────────────────────────────────

def parse_cas_with_casparser(filepath: str, password: str = "") -> dict | None:
    """Try casparser first (works on real CAMS/KFin CAS PDFs)."""
    import casparser
    try:
        cas_data = casparser.read_cas_pdf(filepath, password=password, output="dict")
        if hasattr(cas_data, "model_dump"):
            return cas_data.model_dump()
        if hasattr(cas_data, "dict"):
            return cas_data.dict()
        return cas_data
    except Exception as e:
        err = str(e).lower()
        if "password" in err or "decrypt" in err or "encrypted" in err:
            return "NEEDS_PASSWORD"
        print(f"casparser failed (will try fallback): {e}")
        return None


def parse_cas_with_text_extraction(filepath: str) -> dict | None:
    """
    Fallback: extract text from the PDF and parse portfolio data using regex.
    Works on mock/demo CAS PDFs that have the expected visual layout.
    """
    try:
        import pypdfium2 as pdfium
    except ImportError:
        return None

    pdf = pdfium.PdfDocument(filepath)
    full_text = ""
    for page in pdf:
        textpage = page.get_textpage()
        full_text += textpage.get_text_bounded() + "\n"
    pdf.close()

    if not full_text.strip():
        return None

    # ── Extract investor info ──
    investor = {}
    name_m = re.search(r'Name\s+(.+?)(?:PAN|Email|\n)', full_text)
    if name_m:
        investor["name"] = name_m.group(1).strip()
    pan_m = re.search(r'PAN\s+([A-Z]{5}\d{4}[A-Z])', full_text)
    if pan_m:
        investor["pan"] = pan_m.group(1)
    email_m = re.search(r'Email\s+([\w.+-]+@[\w.-]+)', full_text)
    if email_m:
        investor["email"] = email_m.group(1)

    # ── Extract portfolio summary ──
    total_value = 0
    total_invested = 0
    val_m = re.search(r'(?:Current Value|Market Value)[:\s]*[^0-9]*([\d,]+(?:\.\d+)?)', full_text, re.IGNORECASE)
    if val_m:
        total_value = float(val_m.group(1).replace(",", ""))
    inv_m = re.search(r'(?:Total Invested|Invested)[:\s]*[^0-9]*([\d,]+(?:\.\d+)?)', full_text, re.IGNORECASE)
    if inv_m:
        total_invested = float(inv_m.group(1).replace(",", ""))

    # ── Extract fund details ──
    mfs = []

    # Pattern: "Fund: Mirae Asset Large Cap Fund | ... Units: 981.234 | NAV: ?90.82 | Current Value: ?89,124.40 | Invested: ?70,000"
    fund_blocks = re.findall(
        r'Fund:\s*(.+?)(?:\||\n)'
        r'.*?Units[.:]?\s*([\d,.]+).*?NAV[.:]?\s*[^0-9]*([\d,.]+)'
        r'.*?Current Value[.:]?\s*[^0-9]*([\d,.]+).*?Invested[.:]?\s*[^0-9]*([\d,.]+)',
        full_text,
        re.IGNORECASE | re.DOTALL
    )

    for match in fund_blocks:
        fund_name, units, nav, cur_val, invested = match
        units = float(units.replace(",", ""))
        nav = float(nav.replace(",", ""))
        cur_val = float(cur_val.replace(",", ""))
        invested = float(invested.replace(",", ""))
        pnl = cur_val - invested
        mfs.append({
            "scheme_name": fund_name.strip(),
            "folio": "",
            "amc": "",
            "isin": "",
            "units": round(units, 3),
            "nav": round(nav, 4),
            "current_value": round(cur_val, 2),
            "invested": round(invested, 2),
            "pnl": round(pnl, 2),
            "pnl_pct": round(pnl / invested * 100, 2) if invested > 0 else 0,
            "plan": "",
        })

    # If we didn't find the structured pattern, try the table-like pattern
    # from the screenshot: "Fund: Mirae Asset Large Cap Fund – Direct Growth"
    # with a later line: "Units: 981.234 | NAV: ₹90.82 | Current Value: ₹89,124.40 | Invested: ₹70,000.00"
    if not mfs:
        # Simpler approach: find any "Fund:" lines and associated numeric data
        fund_names = re.findall(r'Fund:\s*(.+?)(?:\||Plan|$)', full_text, re.MULTILINE)
        value_lines = re.findall(
            r'Units[.:]?\s*([\d,.]+).*?NAV[.:]?\s*[^0-9]*([\d,.]+).*?'
            r'Current Value[.:]?\s*[^0-9]*([\d,.]+).*?Invested[.:]?\s*[^0-9]*([\d,.]+)',
            full_text,
            re.IGNORECASE
        )
        for i, name in enumerate(fund_names):
            if i < len(value_lines):
                units_s, nav_s, val_s, inv_s = value_lines[i]
                units = float(units_s.replace(",", ""))
                nav = float(nav_s.replace(",", ""))
                cur_val = float(val_s.replace(",", ""))
                invested = float(inv_s.replace(",", ""))
                pnl = cur_val - invested
                mfs.append({
                    "scheme_name": name.strip(),
                    "folio": "",
                    "amc": "",
                    "isin": "",
                    "units": round(units, 3),
                    "nav": round(nav, 4),
                    "current_value": round(cur_val, 2),
                    "invested": round(invested, 2),
                    "pnl": round(pnl, 2),
                    "pnl_pct": round(pnl / invested * 100, 2) if invested > 0 else 0,
                    "plan": "",
                })

    # If we still got nothing from regex but have summary values, create a single entry
    if not mfs and (total_value > 0 or total_invested > 0):
        pnl = total_value - total_invested
        mfs.append({
            "scheme_name": "Combined Portfolio (from summary)",
            "folio": "",
            "amc": "",
            "isin": "",
            "units": 0,
            "nav": 0,
            "current_value": round(total_value, 2),
            "invested": round(total_invested, 2),
            "pnl": round(pnl, 2),
            "pnl_pct": round(pnl / total_invested * 100, 2) if total_invested > 0 else 0,
            "plan": "",
        })

    if not mfs and not investor:
        return None  # Couldn't extract anything useful

    if not total_value:
        total_value = sum(m["current_value"] for m in mfs)
    if not total_invested:
        total_invested = sum(m["invested"] for m in mfs)

    return {
        "investor_info": investor,
        "folios": [],  # raw folios not available in text mode
        "mfs_extracted": mfs,
        "total_value": total_value,
        "total_invested": total_invested,
    }


def try_parse_csv(content: bytes) -> pd.DataFrame:
    for enc in ["utf-8", "cp1252", "latin1", "utf-8-sig"]:
        try:
            return pd.read_csv(io.BytesIO(content), encoding=enc)
        except UnicodeDecodeError:
            continue
    raise ValueError("Could not decode CSV with any known encoding.")


# ─── API Endpoints ────────────────────────────────────────────────────────────

@app.post("/api/ingest")
async def ingest_portfolio(
    csv_file: UploadFile = File(...),
    password: str = "",
):
    content = await csv_file.read()
    filename = (csv_file.filename or "").lower()

    # ── PDF ────────────────────────────────────────────────────────────────
    if filename.endswith(".pdf"):
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        try:
            # 1) Try casparser (real CAMS PDFs)
            cas_result = parse_cas_with_casparser(tmp_path, password=password.strip().upper())

            if cas_result == "NEEDS_PASSWORD":
                raise HTTPException(status_code=401, detail=(
                    "This PDF is password-protected. "
                    "CAMS CAS PDFs use your PAN number as the password (e.g. ABCPS1234F). "
                    "Please enter your PAN and try again."
                ))

            if cas_result and isinstance(cas_result, dict):
                # Successfully parsed with casparser
                investor_info = cas_result.get("investor_info", {}) or {}
                mfs = []
                for folio in cas_result.get("folios", []):
                    for scheme in folio.get("schemes", []):
                        try:
                            valuation = scheme.get("valuation") or {}
                            units = float(scheme.get("close", 0) or 0)
                            nav = float(valuation.get("nav", 0) or 0)
                            cost = float(valuation.get("cost", 0) or 0)
                            value = float(valuation.get("value", 0) or 0)
                            if value == 0 and units > 0 and nav > 0:
                                value = units * nav
                            pnl = value - cost
                            mfs.append({
                                "scheme_name": scheme.get("scheme", "Unknown"),
                                "folio": folio.get("folio", ""),
                                "amc": folio.get("amc", ""),
                                "isin": scheme.get("isin", ""),
                                "units": round(units, 3),
                                "nav": round(nav, 4),
                                "current_value": round(value, 2),
                                "invested": round(cost, 2),
                                "pnl": round(pnl, 2),
                                "pnl_pct": round(pnl / cost * 100, 2) if cost > 0 else 0,
                                "plan": str(scheme.get("type", "") or ""),
                            })
                        except Exception as e:
                            print(f"Skipping scheme: {e}")
                total_val = sum(m["current_value"] for m in mfs)
                total_inv = sum(m["invested"] for m in mfs)
                return build_cas_response(investor_info, mfs, total_val, total_inv)

            # 2) casparser failed → fallback to text extraction
            text_result = parse_cas_with_text_extraction(tmp_path)
            if text_result:
                investor_info = text_result.get("investor_info", {})
                mfs = text_result.get("mfs_extracted", [])
                total_val = text_result.get("total_value", sum(m["current_value"] for m in mfs))
                total_inv = text_result.get("total_invested", sum(m["invested"] for m in mfs))
                return build_cas_response(investor_info, mfs, total_val, total_inv)

            raise HTTPException(status_code=400, detail="Could not parse the PDF. Make sure it's a valid CAS statement.")
        finally:
            os.unlink(tmp_path)

    # ── CSV ────────────────────────────────────────────────────────────────
    try:
        df = try_parse_csv(content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse file: {e}")

    df.columns = [str(c).strip() for c in df.columns]
    col_map = {c.lower(): c for c in df.columns}

    def pick(options):
        for opt in options:
            if opt.lower() in col_map:
                return col_map[opt.lower()]
        return None

    sym_col  = pick(["Symbol", "Stock Name", "Instrument Name", "Name", "Scrip Name"])
    qty_col  = pick(["Quantity", "Qty", "Units", "Shares"])
    cost_col = pick(["Avg. Cost", "Avg Cost", "Average Cost", "Buy Price", "Avg. price"])
    val_col  = pick(["Current Value", "Market Value", "Present Value", "Value"])
    ltp_col  = pick(["LTP", "Current Price", "Market Price", "Close Price", "Price"])

    stocks = []
    for _, row in df.iterrows():
        try:
            symbol = str(row[sym_col]).strip() if sym_col else "Unknown"
            if not symbol or symbol in ("nan", "Unknown", ""):
                continue
            qty = float(str(row[qty_col]).replace(",", "")) if qty_col and not pd.isna(row.get(qty_col)) else 0.0
            avg_cost = float(str(row[cost_col]).replace(",", "")) if cost_col and not pd.isna(row.get(cost_col)) else 0.0
            if val_col and not pd.isna(row.get(val_col)):
                curr_val = float(str(row[val_col]).replace(",", ""))
            elif ltp_col and qty:
                curr_val = float(str(row[ltp_col]).replace(",", "")) * qty
            else:
                curr_val = avg_cost * qty
            stocks.append({"symbol": symbol, "quantity": qty, "avg_cost": avg_cost, "current_value": curr_val})
        except Exception:
            continue

    total_inv = sum(s["avg_cost"] * s["quantity"] for s in stocks)
    total_val = sum(s["current_value"] for s in stocks)
    return {
        "type": "csv", "stocks": stocks, "mfs": [],
        "total_value": round(total_val, 2), "total_invested": round(total_inv, 2),
        "total_pnl": round(total_val - total_inv, 2),
        "total_pnl_pct": round((total_val - total_inv) / total_inv * 100, 2) if total_inv > 0 else 0,
        "columns": list(df.columns),
    }


def build_cas_response(investor_info: dict, mfs: list, total_val: float, total_inv: float) -> dict:
    pnl = total_val - total_inv
    return {
        "type": "cas_pdf",
        "investor": {
            "name": investor_info.get("name", ""),
            "pan": investor_info.get("pan", ""),
            "email": investor_info.get("email", ""),
        },
        "stocks": [],
        "mfs": mfs,
        "total_value": round(total_val, 2),
        "total_invested": round(total_inv, 2),
        "total_pnl": round(pnl, 2),
        "total_pnl_pct": round(pnl / total_inv * 100, 2) if total_inv > 0 else 0,
        "columns": [],
    }


# ─── Other API Endpoints ─────────────────────────────────────────────────────

class PortfolioContext(BaseModel):
    stocks: list = []
    mfs: list = []

@app.post("/api/macro")
async def get_macro_impact(portfolio: PortfolioContext = Body(default=PortfolioContext())):
    headlines = []
    try:
        news_data = await asyncio.to_thread(call_wire, "mc_news", {})
        if isinstance(news_data, list):
            headlines = [i.get("title", i.get("headline", "")) for i in news_data[:6] if i.get("title") or i.get("headline")]
        elif isinstance(news_data, dict):
            items = news_data.get("news", news_data.get("articles", news_data.get("data", [])))
            headlines = [i.get("title", i.get("headline", "")) for i in items[:6]]
    except Exception as e:
        print(f"Macro news error: {e}")

    if not headlines:
        headlines = [
            "RBI holds repo rate at 6.5% for 8th consecutive meeting",
            "India CPI inflation eases to 4.75% in May",
            "US Fed signals one more rate cut in 2024",
            "Crude oil rises amid Middle East tensions",
            "FIIs net buyers in Indian equities for third straight month",
        ]

    # Convert Pydantic model to dict to pass to LLM
    portfolio_dict = portfolio.dict() if portfolio else {}
    
    analysis = await asyncio.to_thread(
        analyze_macro_impact_with_llm,
        news_items=headlines,
        portfolio_context=portfolio_dict
    )
    
    return {
        "headlines": headlines, 
        "headline": headlines[0] if headlines else "Market Update", 
        "structured_analysis": analysis
    }


@app.get("/api/ipo")
async def get_ipo():
    try:
        return await asyncio.to_thread(call_wire, "mc_ipo", {}) or {}
    except:
        return {}

@app.get("/api/screener/{symbol}")
async def get_screener_docs(symbol: str):
    try:
        return await asyncio.to_thread(call_wire, "scr_company_documents", {"company": symbol, "consolidated": True}) or {}
    except:
        return {}

@app.get("/api/morningstar")
async def get_morningstar():
    try:
        return await asyncio.to_thread(call_wire, "act_morningstar_in_fund_category_returns", {"period": "Y1"}) or {}
    except:
        return {}

@app.get("/api/nse/highlow")
async def get_nse_highlow():
    try:
        return await asyncio.to_thread(call_wire, "nse_52week_highlow", {}) or {}
    except:
        return {}

@app.get("/api/et/adv-dec")
async def get_et_adv_dec():
    try:
        return await asyncio.to_thread(call_wire, "et_advance_decline", {}) or {}
    except:
        return {}

@app.get("/api/rbi/forex")
async def get_rbi_forex():
    try:
        # Hardcoding the dates as per user request just to ensure it fires properly
        params = {
            "fx_component": "TR",
            "currency_code": "USD",
            "from_date": "2025-06-06 00:00:00",
            "to_date": "2026-06-06 00:00:00",
            "frequency": "Weekly"
        }
        return await asyncio.to_thread(call_wire, "act_data_rbi_org_in_foreign_exchange_reserves", params) or {}
    except:
        return {}

