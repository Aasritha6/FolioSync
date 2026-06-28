import AppShell from "../components/AppShell";

const holdings = [
  {
    ticker: "RELIANCE",
    name: "Reliance Industries",
    exposure: "₹45,000",
    rsi: 72,    rsiLabel: "Overbought",
    macd: "Bearish crossover",
    dma200: "+18%",  dma200Bull: true,
    sentiment: 82,
    support: "₹2,740",
    resistance: "₹3,020",
    status: "yellow",
    insight: "Overbought RSI with bearish MACD divergence. Consider partial profit booking (₹10–15K).",
  },
  {
    ticker: "HDFCBANK",
    name: "HDFC Bank",
    exposure: "₹35,000",
    rsi: 45,    rsiLabel: "Neutral",
    macd: "Bullish crossover",
    dma200: "+5%",   dma200Bull: true,
    sentiment: 78,
    support: "₹1,680",
    resistance: "₹1,800",
    status: "green",
    insight: "Clean technical setup. RSI neutral, bullish MACD, price above 200 DMA. Hold.",
  },
  {
    ticker: "DLF",
    name: "DLF Limited",
    exposure: "₹50,000",
    rsi: 28,    rsiLabel: "Oversold",
    macd: "Bearish",
    dma200: "−12%",  dma200Bull: false,
    sentiment: 31,
    support: "₹770",
    resistance: "₹860",
    status: "red",
    insight: "Oversold with downtrend below 200 DMA and weak sentiment. Check fundamentals. If weak, consider exiting.",
  },
  {
    ticker: "INFY",
    name: "Infosys",
    exposure: "₹60,000",
    rsi: 55,    rsiLabel: "Neutral",
    macd: "Neutral",
    dma200: "+2%",   dma200Bull: true,
    sentiment: 52,
    support: "₹1,560",
    resistance: "₹1,680",
    status: "green",
    insight: "No strong signal in either direction. Stable setup. Hold and review post-earnings.",
  },
  {
    ticker: "ICICIBANK",
    name: "ICICI Bank",
    exposure: "₹28,000",
    rsi: 62,    rsiLabel: "Neutral",
    macd: "Bullish",
    dma200: "+9%",   dma200Bull: true,
    sentiment: 71,
    support: "₹1,020",
    resistance: "₹1,120",
    status: "green",
    insight: "Bullish momentum. RSI heading toward 70 — watch for entry of overbought zone.",
  },
];

const statusStyle: Record<string, { bar: string; bg: string; emoji: string }> = {
  red:    { bar: "border-l-red-400",    bg: "bg-red-50",   emoji: "🔴" },
  yellow: { bar: "border-l-amber-400",  bg: "bg-amber-50", emoji: "🟡" },
  green:  { bar: "border-l-green-400",  bg: "bg-green-50", emoji: "🟢" },
};

function RSIBar({ value }: { value: number }) {
  const color = value >= 70 ? "#ef4444" : value <= 30 ? "#ef4444" : "#22c55e";
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full relative overflow-visible">
        {/* Danger zones */}
        <div className="absolute left-0 top-0 h-full bg-red-100 rounded-l-full" style={{ width: "30%" }} />
        <div className="absolute right-0 top-0 h-full bg-red-100 rounded-r-full" style={{ width: "30%" }} />
        {/* Pointer */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow"
          style={{ left: `${value}%`, background: color, transform: "translate(-50%, -50%)" }}
        />
      </div>
      <span className="text-xs mono font-semibold" style={{ color }}>{value}</span>
    </div>
  );
}

function SentimentBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 bg-red-100 rounded-full overflow-hidden">
        <div className="h-full bg-green-400 rounded-full" style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs mono font-semibold text-gray-700">{value}%</span>
    </div>
  );
}

export default function TechnicalPage() {
  const healthy  = holdings.filter(h => h.status === "green").length;
  const caution  = holdings.filter(h => h.status === "yellow").length;
  const weak     = holdings.filter(h => h.status === "red").length;

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Technical Health</h1>
          <p className="text-sm text-gray-500 mt-0.5">RSI, MACD, moving averages and crowd sentiment — all from TradingView.</p>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Healthy",  count: healthy, color: "text-green-600",  bg: "bg-green-50  border-green-200" },
            { label: "Caution",  count: caution, color: "text-amber-600",  bg: "bg-amber-50  border-amber-200" },
            { label: "Weak",     count: weak,    color: "text-red-600",    bg: "bg-red-50    border-red-200"   },
          ].map((s) => (
            <div key={s.label} className={`card p-4 text-center border ${s.bg}`}>
              <p className={`text-3xl font-bold ${s.color}`}>{s.count}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Holdings */}
        <div className="space-y-4">
          {holdings.map((h) => {
            const s = statusStyle[h.status];
            return (
              <div key={h.ticker} className={`card border-l-4 ${s.bar} ${s.bg} p-5`}>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span>{s.emoji}</span>
                      <p className="text-sm font-bold text-gray-900">{h.name}</p>
                      <span className="text-xs text-gray-400">{h.ticker}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">Exposure: <b>{h.exposure}</b></p>
                  </div>
                  <div className="flex gap-3 text-center text-xs">
                    <div>
                      <p className="text-gray-400">Support</p>
                      <p className="font-semibold mono text-gray-700">{h.support}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Resistance</p>
                      <p className="font-semibold mono text-gray-700">{h.resistance}</p>
                    </div>
                  </div>
                </div>

                {/* Indicators grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">RSI (14)</p>
                    <p className={`text-xs font-medium mt-0.5 ${h.rsi >= 70 ? "text-red-600" : h.rsi <= 30 ? "text-red-600" : "text-gray-700"}`}>{h.rsiLabel}</p>
                    <RSIBar value={h.rsi} />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">MACD</p>
                    <p className={`text-xs font-medium mt-1 ${h.macd.includes("Bull") ? "text-green-600" : h.macd.includes("Bear") ? "text-red-600" : "text-gray-500"}`}>{h.macd}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">vs 200 DMA</p>
                    <p className={`text-sm font-bold mono mt-1 ${h.dma200Bull ? "text-green-600" : "text-red-600"}`}>{h.dma200}</p>
                    <p className="text-[10px] text-gray-400">{h.dma200Bull ? "Uptrend" : "Downtrend"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Sentiment</p>
                    <SentimentBar value={h.sentiment} />
                    <p className="text-[10px] text-gray-400 mt-0.5">{h.sentiment >= 60 ? "Bullish" : h.sentiment <= 40 ? "Bearish" : "Neutral"} crowd</p>
                  </div>
                </div>

                {/* Insight */}
                <div className="mt-3 p-2.5 bg-white rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-700">{h.insight}</p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </AppShell>
  );
}
