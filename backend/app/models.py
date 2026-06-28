from pydantic import BaseModel
from typing import List, Optional

class StockHolding(BaseModel):
    symbol: str
    quantity: float
    avg_cost: float
    current_value: float

class MFHolding(BaseModel):
    scheme_name: str
    units: float
    nav: float
    current_value: float

class UnifiedPortfolio(BaseModel):
    stocks: List[StockHolding]
    mfs: List[MFHolding]
    total_value: float

class OverlapNode(BaseModel):
    id: str
    name: str
    type: str  # 'stock' or 'mf'
    exposure: float
    is_direct: bool
    is_mf_holding: bool
    val: float # for D3 size
    group: str # for D3 color

class OverlapEdge(BaseModel):
    source: str
    target: str
    value: float

class OverlapGraph(BaseModel):
    nodes: List[OverlapNode]
    links: List[OverlapEdge]

class PledgeAlert(BaseModel):
    symbol: str
    pledge_pct: float
    risk_level: str
    message: str

class MacroEvent(BaseModel):
    headline: str
    event_type: str
    sentiment: str
    portfolio_impact: str

class FnOBanAlert(BaseModel):
    symbol: str
    status: str
    message: str

class TechnicalHealth(BaseModel):
    symbol: str
    rsi: Optional[float]
    macd_signal: Optional[str]
    health_status: str
    message: str
