from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .services.anakin_wire import call_wire
from .services.groq_llm import analyze_macro_impact_with_llm
import pandas as pd
import io
import os
import tempfile

app = FastAPI(title="FolioSync API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "FolioSync API is running"}


def try_parse_csv(content: bytes) -> pd.DataFrame:
    for enc in ["utf-8", "cp1252", "latin1", "utf-8-sig"]:
        try:
            return pd.read_csv(io.BytesIO(content), encoding=enc)
        except UnicodeDecodeError:
            continue
    raise ValueError("Could not decode CSV with any known encoding.")


def parse_cas_pdf(content: bytes, password: str = "") -> dict:
    """Parse a CAMS/Karvy CAS PDF using casparser."""
    import casparser

    # Write to temp file since casparser needs a file path
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        cas_data = casparser.read(tmp_path, password=password, output="dict")
    finally:
        os.unlink(tmp_path)

    return cas_data


@app.post("/api/ingest")
async def ingest_portfolio(csv_file: UploadFile = File(...)):
    content = await csv_file.read()
    filename = (csv_file.filename or "").lower()

    # ── PDF: Parse CAS statement ──────────────────────────────────────────
    if filename.endswith(".pdf"):
        try:
            cas_data = parse_cas_pdf(content)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Could not parse PDF: {e}. Make sure it is a valid CAMS/Groww CAS statement.")

        # Extract investor info
        investor_info = cas_data.get("investor_info", {})

        # Extract MF holdings from folios
        mfs = []
        for folio in cas_data.get("folios", []):
            for scheme in folio.get("schemes", []):
                try:
                    scheme_name = scheme.get("scheme", "Unknown Scheme")
                    units = float(scheme.get("close", 0) or 0)
                    nav = float(scheme.get("nav", 0) or 0)
                    current_value = units * nav
                    invested = float(scheme.get("invested", 0) or 0)

                    mfs.append({
                        "scheme_name": scheme_name,
                        "folio": folio.get("folio", ""),
                        "isin": scheme.get("isin", ""),
                        "units": round(units, 3),
                        "nav": round(nav, 4),
                        "current_value": round(current_value, 2),
                        "invested": round(invested, 2),
                        "pnl": round(current_value - invested, 2),
                        "pnl_pct": round(((current_value - invested) / invested * 100), 2) if invested > 0 else 0,
                        "plan": scheme.get("plan", ""),
                        "type": scheme.get("type", ""),
                    })
                except Exception as e:
                    print(f"Skipping scheme {scheme.get('scheme','?')}: {e}")
                    continue

        total_invested = sum(m["invested"] for m in mfs)
        total_value = sum(m["current_value"] for m in mfs)

        return {
            "type": "cas_pdf",
            "investor": {
                "name": investor_info.get("name", ""),
                "pan": investor_info.get("pan", ""),
                "email": investor_info.get("email", ""),
            },
            "stocks": [],
            "mfs": mfs,
            "total_value": round(total_value, 2),
            "total_invested": round(total_invested, 2),
            "total_pnl": round(total_value - total_invested, 2),
            "total_pnl_pct": round((total_value - total_invested) / total_invested * 100, 2) if total_invested > 0 else 0,
            "columns": [],
        }

    # ── CSV: Parse Groww/Zerodha stock export ─────────────────────────────
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

    sym_col  = pick(["Symbol", "Stock Name", "Instrument Name", "Name", "Scrip Name", "script name"])
    qty_col  = pick(["Quantity", "Qty", "Units", "Shares"])
    cost_col = pick(["Avg. Cost", "Avg Cost", "Average Cost", "Buy Price", "Purchase Price", "Avg. price"])
    val_col  = pick(["Current Value", "Market Value", "Present Value", "Value", "LTP*Qty"])
    ltp_col  = pick(["LTP", "Current Price", "Market Price", "Close Price", "Price"])

    stocks = []
    for _, row in df.iterrows():
        try:
            symbol = str(row[sym_col]).strip() if sym_col else "Unknown"
            if not symbol or symbol in ("nan", "Unknown", ""):
                continue
            qty = float(str(row[qty_col]).replace(",", "")) if qty_col and not pd.isna(row.get(qty_col, float("nan"))) else 0.0
            avg_cost = float(str(row[cost_col]).replace(",", "")) if cost_col and not pd.isna(row.get(cost_col, float("nan"))) else 0.0
            if val_col and not pd.isna(row.get(val_col, float("nan"))):
                curr_val = float(str(row[val_col]).replace(",", ""))
            elif ltp_col and qty:
                curr_val = float(str(row[ltp_col]).replace(",", "")) * qty
            else:
                curr_val = avg_cost * qty
            stocks.append({"symbol": symbol, "quantity": qty, "avg_cost": avg_cost, "current_value": curr_val})
        except Exception as e:
            print(f"Skipping row: {e}")

    total_invested = sum(s["avg_cost"] * s["quantity"] for s in stocks)
    total_value = sum(s["current_value"] for s in stocks)
    return {
        "type": "csv",
        "stocks": stocks,
        "mfs": [],
        "total_value": round(total_value, 2),
        "total_invested": round(total_invested, 2),
        "total_pnl": round(total_value - total_invested, 2),
        "total_pnl_pct": round((total_value - total_invested) / total_invested * 100, 2) if total_invested > 0 else 0,
        "columns": list(df.columns),
    }


@app.get("/api/macro")
def get_macro_impact():
    headlines = []
    try:
        news_data = call_wire("e8f7cfde-7052-4dd5-80e5-5473707347b3", {})
        if isinstance(news_data, list):
            headlines = [i.get("title", i.get("headline", "")) for i in news_data[:6] if i.get("title") or i.get("headline")]
        elif isinstance(news_data, dict):
            items = news_data.get("news", news_data.get("articles", news_data.get("data", [])))
            headlines = [i.get("title", i.get("headline", "")) for i in items[:6]]
    except Exception as e:
        print(f"Macro news error: {e}")

    if not headlines:
        try:
            tv_data = call_wire("5cdf2cd5-a0c3-4774-9fe9-ce2847210dfa", {})
            if isinstance(tv_data, list):
                headlines = [i.get("title", "") for i in tv_data[:6]]
        except Exception as e:
            print(f"TV fallback error: {e}")

    if not headlines:
        headlines = [
            "RBI holds repo rate at 6.5% for 8th consecutive meeting",
            "India CPI inflation eases to 4.75% in May",
            "US Fed signals one more rate cut in 2024",
            "Crude oil rises amid Middle East tensions",
            "FIIs net buyers in Indian equities for third straight month",
        ]

    analysis = analyze_macro_impact_with_llm(
        news_items=headlines,
        portfolio_sectors=["Banking", "Technology", "Real Estate", "Consumer", "Energy"]
    )

    return {"headlines": headlines, "headline": headlines[0], "sentiment": "Mixed", "portfolio_impact": analysis}


@app.get("/api/ipo")
def get_ipo():
    try:
        data = call_wire("mc_ipo", {})
        return data or {}
    except Exception as e:
        print(f"IPO error: {e}")
        return {}


@app.get("/api/market")
def get_market_overview():
    result = {}
    for cat in ["gainers", "losers"]:
        try:
            data = call_wire("95555e4c-fb90-4f79-8b42-dfa31768944d", {"category": cat, "count": 5})
            result[cat] = data if isinstance(data, list) else []
        except:
            result[cat] = []
    return result


@app.get("/api/stock/{symbol}")
def get_stock_quote(symbol: str):
    try:
        return call_wire("661cf7ce-77f3-4cd4-b02f-8ff875613f37", {"ticker": symbol}) or {}
    except Exception as e:
        return {}


@app.get("/api/overlap")
def get_overlap():
    return {"nodes": [], "links": []}

@app.get("/api/pledge")
def get_pledge():
    return []

@app.get("/api/technical")
def get_technical():
    return []
