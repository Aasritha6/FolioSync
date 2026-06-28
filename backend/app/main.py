from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from .models import UnifiedPortfolio, OverlapGraph, PledgeAlert, MacroEvent, FnOBanAlert, TechnicalHealth
from .services.anakin_wire import get_screener_overview, get_macro_news
from .services.groq_llm import analyze_macro_impact_with_llm
import pandas as pd
import io

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

@app.post("/api/ingest", response_model=UnifiedPortfolio)
async def ingest_portfolio(
    csv_file: UploadFile = File(...),
    # pdf_file is optional for now to simplify testing
):
    # Parse Groww CSV
    content = await csv_file.read()
    df = pd.read_csv(io.BytesIO(content))
    
    # We expect columns like Symbol, Quantity, Avg Cost, Current Value
    # This is a simplified extraction
    stocks = []
    for _, row in df.iterrows():
        try:
            # handle different possible column names
            symbol = row.get("Symbol", row.get("Stock Name", "Unknown"))
            qty = float(row.get("Quantity", 0))
            avg_cost = float(row.get("Avg. Cost", row.get("Buy Price", 0)))
            curr_val = float(row.get("Current Value", 0))
            if pd.isna(symbol): continue
            stocks.append({
                "symbol": str(symbol),
                "quantity": qty,
                "avg_cost": avg_cost,
                "current_value": curr_val
            })
        except Exception as e:
            print(f"Error parsing row: {e}")
            continue
            
    total_val = sum(s["current_value"] for s in stocks)
    return {"stocks": stocks, "mfs": [], "total_value": total_val}

@app.get("/api/macro")
def get_macro_impact():
    # Fetch real news using Anakin Wire (Trading Economics or similar)
    news_data = get_macro_news()
    headlines = []
    if news_data and isinstance(news_data, list):
        # Extract headlines
        headlines = [item.get("title", "") for item in news_data[:5]]
    
    if not headlines:
        headlines = ["RBI keeps repo rate unchanged", "Inflation shows slight uptick"]
        
    # Analyze with Groq
    analysis = analyze_macro_impact_with_llm(
        news_items=headlines, 
        portfolio_sectors=["Banking", "Technology", "Real Estate"]
    )
    
    return {
        "headline": headlines[0] if headlines else "Market Update",
        "event_type": "Macro News",
        "sentiment": "Mixed",
        "portfolio_impact": analysis
    }

# Mock endpoints for other features for now so UI doesn't break
@app.get("/api/overlap")
def get_overlap():
    return {"nodes": [], "links": []}

@app.get("/api/pledge")
def get_pledge():
    return []

@app.get("/api/technical")
def get_technical():
    return []
