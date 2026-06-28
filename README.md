# 📊 FolioSync — Investment Command Center

A real-time investment intelligence dashboard that parses Indian portfolio statements (CAMS CAS PDFs, Groww CSVs) and delivers AI-powered macro analysis, IPO tracking, and portfolio health insights.

![License](https://img.shields.io/badge/license-MIT-blue)
![Python](https://img.shields.io/badge/python-3.11+-green)
![React](https://img.shields.io/badge/react-19-blue)

---

## ✨ Features

| Feature | Status | Description |
|---------|--------|-------------|
| **PDF/CSV Ingestion** | ✅ Live | Upload CAMS CAS PDFs (password-protected or mock) or Groww/Zerodha CSVs |
| **AI Macro Intelligence** | ✅ Live | Groq LLaMA 3.1 analyzes live news against your specific holdings |
| **Advanced Market Data**| ✅ Live | Live data on Market Breadth, 52W Highs, RBI Forex, Announcements |
| **IPO Tracker** | ✅ Live | Real-time IPO subscription data via Anakin Wire |

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│            Frontend (Vite + React)      │
│  Dashboard → PortfolioView (Tabs)      │
│  Upload │ Holdings │ Macro │ IPO       │
└────────────────┬────────────────────────┘
                 │ Axios
┌────────────────▼────────────────────────┐
│            Backend (FastAPI)            │
│                                         │
│  /api/ingest   → casparser + pypdfium2 │
│  /api/macro    → Anakin Wire + Groq AI │
│  /api/ipo      → Anakin Wire (mc_ipo)  │
│  /api/market   → Anakin Wire           │
│  /api/stock/:s → Anakin Wire           │
└────────────────┬────────────────────────┘
                 │
     ┌───────────┼───────────┐
     ▼           ▼           ▼
  Anakin.io   Groq Cloud   casparser
  (Wire API)  (LLaMA 3.1)  (PDF parse)
```

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- [Anakin API Key](https://anakin.io)
- [Groq API Key](https://console.groq.com)

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: .\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Create .env from example
cp .env.example .env
# Edit .env and add your API keys

uvicorn app.main:app --port 8000 --reload
```

### Frontend Setup
```bash
cd frontend
npm install

# Optionally create .env for custom API URL
cp .env.example .env

npm run dev
```

Open **http://localhost:5173** and upload your portfolio statement.

## 📁 Project Structure

```
foliosync/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, all endpoints
│   │   └── services/
│   │       ├── anakin_wire.py   # Anakin Wire API client (async polling)
│   │       └── groq_llm.py     # Groq LLaMA structured JSON analysis
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.tsx    # Upload + orchestration
│   │   │   └── PortfolioView.tsx # Tabbed display (Holdings/Macro/IPO)
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── .env.example
├── .gitignore
└── README.md
```

## 🔌 Anakin Wire Integrations

| Wire Action ID | Purpose |
|----------------|---------|
| `mc_ipo` | IPO subscription data |
| `mc_news` | Macro financial news for AI |
| `scr_company_documents` | Corporate Announcements |
| `act_morningstar_in_fund_category_returns` | Mutual Fund Category Returns |
| `nse_52week_highlow` | 52-Week Breakouts |
| `et_advance_decline` | Market Breadth (Advances/Declines) |
| `act_data_rbi_org_in_foreign_exchange_reserves` | RBI Forex Reserves |

## 🤖 AI Analysis

The Groq LLaMA 3.1 model receives your actual portfolio holdings and live macro news, then returns structured JSON with:
- **Market Sentiment** (Bullish / Bearish / Neutral)
- **Executive Summary** of current conditions
- **Coming Days Outlook** — what to watch
- **Specific Asset Alerts** — which of *your* holdings are impacted, by which news, and why

## 🔒 Security Notes

- API keys are stored in `.env` (gitignored) and never committed
- SSL verification is disabled for dev convenience — enable in production
- CORS is configurable via the `CORS_ORIGINS` env var

## 📄 License

MIT
