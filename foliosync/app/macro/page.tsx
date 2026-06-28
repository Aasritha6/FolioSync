import AppShell from "../components/AppShell";
import { Newspaper, TrendingUp, TrendingDown, Minus, Home } from "lucide-react";

const macroEvents = [
  {
    id: 1,
    title: "RBI Repo Rate Hike +25bps",
    source: "Economic Times + RBI DBIE",
    detectedAgo: "2 hours ago",
    headline: "RBI hikes repo rate by 25bps to 6.50% to combat sticky inflation. Governor signals further hikes possible if inflation doesn't ease.",
    type: "rate_hike",
    sectors: [
      { name: "Banking",      impact: "+2.3%", direction: "up",   holdings: ["HDFC Bank (₹35K)", "ICICI Bank (₹28K)", "SBI (₹18K)"], totalExp: "₹81,000",  projected: "+₹1,863" },
      { name: "Real Estate",  impact: "−3.1%", direction: "down", holdings: ["DLF (₹50K)"],                                           totalExp: "₹50,000",  projected: "−₹1,550" },
      { name: "IT",           impact: "+0.1%", direction: "flat", holdings: ["Infosys (₹60K)", "TCS (₹40K)"],                         totalExp: "₹1,00,000",projected: "+₹100"   },
      { name: "FMCG",         impact: "−0.5%", direction: "down", holdings: ["ITC (₹25K)"],                                           totalExp: "₹25,000",  projected: "−₹125"   },
    ],
    netImpact: "+₹288",
    netPct: "+0.06%",
    tradingviewSentiment: [
      { stock: "HDFC Bank", bullish: 78, note: "confirms positive impact" },
      { stock: "DLF",       bullish: 23, note: "confirms negative impact" },
    ],
    personalFinance: {
      applicable: true,
      loan: "₹40,00,000",
      emiIncrease: "+₹2,400/month",
      annualImpact: "₹28,800/year",
    },
    action: "Portfolio impact is broadly neutral. Personal finance hit is significant. Consider switching your home loan to a fixed rate or prepaying 10% principal this quarter.",
  },
  {
    id: 2,
    title: "FII Outflow — ₹4,200 Cr in 3 days",
    source: "NSE India + Economic Times",
    detectedAgo: "6 hours ago",
    headline: "Foreign institutional investors sold ₹4,200 crore in Indian equities over 3 sessions amid global risk-off sentiment. IT and large-cap exporters seeing pressure.",
    type: "fii_flow",
    sectors: [
      { name: "IT",       impact: "−1.4%", direction: "down", holdings: ["Infosys (₹60K)", "TCS (₹40K)"], totalExp: "₹1,00,000", projected: "−₹1,400" },
      { name: "Banking",  impact: "−0.8%", direction: "down", holdings: ["HDFC Bank (₹35K)"],              totalExp: "₹35,000",   projected: "−₹280"  },
    ],
    netImpact: "−₹1,680",
    netPct: "−0.34%",
    tradingviewSentiment: [
      { stock: "Infosys", bullish: 41, note: "bearish pressure from FII selling" },
    ],
    personalFinance: { applicable: false, loan: "", emiIncrease: "", annualImpact: "" },
    action: "FII outflows tend to reverse within 5-7 sessions if domestic macro stays strong. Hold IT positions unless VIX crosses 20.",
  },
];

const dirIcon = {
  up:   <TrendingUp  size={13} className="text-green-600" />,
  down: <TrendingDown size={13} className="text-red-500"  />,
  flat: <Minus        size={13} className="text-gray-400" />,
};
const dirColor = { up: "text-green-700", down: "text-red-600", flat: "text-gray-500" };

export default function MacroPage() {
  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Macro & News Impact</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Every macro event mapped to <em>your</em> portfolio — not the market in general.
          </p>
        </div>

        {/* Live sources */}
        <div className="flex flex-wrap gap-2">
          {["Economic Times", "Moneycontrol", "RBI DBIE", "NSE India", "TradingView"].map((s) => (
            <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full border border-gray-200">
              📡 {s}
            </span>
          ))}
        </div>

        {/* Events */}
        <div className="space-y-6">
          {macroEvents.map((ev) => (
            <div key={ev.id} className="card overflow-hidden">
              {/* Header */}
              <div className="px-5 pt-4 pb-3 border-b border-gray-100">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <Newspaper size={16} className="text-blue-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-gray-900">{ev.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{ev.source} · Detected {ev.detectedAgo}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold mono shrink-0 ${ev.netImpact.startsWith("+") ? "text-green-600" : "text-red-600"}`}>
                    {ev.netImpact}
                  </span>
                </div>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 leading-relaxed italic">"{ev.headline}"</p>
                </div>
              </div>

              {/* Sector breakdown */}
              <div className="px-5 py-3 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Your portfolio impact by sector</p>
                <div className="space-y-2.5">
                  {ev.sectors.map((s) => (
                    <div key={s.name} className="flex items-start gap-3">
                      <div className="flex items-center gap-1 w-24 shrink-0 mt-0.5">
                        {dirIcon[s.direction as keyof typeof dirIcon]}
                        <span className="text-xs font-semibold text-gray-700">{s.name}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">{s.holdings.join(", ")}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Total: {s.totalExp} · Historical avg: {s.impact}</p>
                      </div>
                      <span className={`text-xs font-bold mono shrink-0 ${s.direction === "up" ? "text-green-600" : s.direction === "down" ? "text-red-500" : "text-gray-400"}`}>
                        {s.projected}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-2 border-t border-dashed border-gray-200 flex justify-between">
                  <span className="text-xs font-semibold text-gray-600">Net portfolio impact</span>
                  <span className={`text-sm font-bold mono ${ev.netImpact.startsWith("+") ? "text-green-600" : "text-red-600"}`}>
                    {ev.netImpact} ({ev.netPct})
                  </span>
                </div>
              </div>

              {/* TradingView sentiment validation */}
              <div className="px-5 py-3 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">TradingView sentiment validation</p>
                <div className="flex gap-4">
                  {ev.tradingviewSentiment.map((tv) => (
                    <div key={tv.stock} className="flex-1">
                      <p className="text-xs text-gray-700 font-medium">{tv.stock}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-green-400 rounded-full" style={{ width: `${tv.bullish}%` }} />
                        </div>
                        <span className="text-xs font-semibold mono text-gray-700">{tv.bullish}% bullish</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">{tv.note}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Personal finance */}
              {ev.personalFinance.applicable && (
                <div className="px-5 py-3 border-b border-gray-100 bg-orange-50">
                  <div className="flex items-center gap-2 mb-1">
                    <Home size={13} className="text-orange-500" />
                    <p className="text-xs font-semibold text-orange-700">Personal Finance Impact</p>
                  </div>
                  <p className="text-xs text-gray-700">
                    Home loan ({ev.personalFinance.loan}) · EMI increase: <b>{ev.personalFinance.emiIncrease}</b> · Annual cost: <b>{ev.personalFinance.annualImpact}</b>
                  </p>
                </div>
              )}

              {/* Action */}
              <div className="px-5 py-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Recommended action</p>
                <p className="text-sm text-gray-700 leading-relaxed">{ev.action}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </AppShell>
  );
}
