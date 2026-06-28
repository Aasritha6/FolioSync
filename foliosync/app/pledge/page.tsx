import AppShell from "../components/AppShell";
import { AlertTriangle, TrendingUp } from "lucide-react";

const pledgeData = [
  {
    ticker: "SUZLON",
    name: "Suzlon Energy",
    pledge: 68,
    trend: "+12% in 2 quarters",
    holding: "₹28,000",
    severity: "red",
    history: [
      { q: "Q1 FY24", pct: 56 },
      { q: "Q2 FY24", pct: 61 },
      { q: "Q3 FY24", pct: 64 },
      { q: "Q4 FY24", pct: 68 },
    ],
    precedents: [
      { co: "DHFL",       pledge: "75%", crash: "−90%", period: "3 months" },
      { co: "Yes Bank",   pledge: "60%", crash: "−85%", period: "2 months" },
      { co: "ADAG Group", pledge: "65%", crash: "−70%", period: "6 months" },
    ],
    action: "Reduce position by 50% or set trailing stop-loss at −8%.",
  },
  {
    ticker: "RCOM",
    name: "Reliance Comm",
    pledge: 42,
    trend: "+5% in 2 quarters",
    holding: "₹15,000",
    severity: "yellow",
    history: [
      { q: "Q1 FY24", pct: 34 },
      { q: "Q2 FY24", pct: 37 },
      { q: "Q3 FY24", pct: 40 },
      { q: "Q4 FY24", pct: 42 },
    ],
    precedents: [],
    action: "Monitor quarterly. Set alert at 50% pledge.",
  },
  {
    ticker: "HDFCBANK",
    name: "HDFC Bank",
    pledge: 4,
    trend: "Stable",
    holding: "₹35,000",
    severity: "green",
    history: [
      { q: "Q1 FY24", pct: 3 },
      { q: "Q2 FY24", pct: 4 },
      { q: "Q3 FY24", pct: 4 },
      { q: "Q4 FY24", pct: 4 },
    ],
    precedents: [],
    action: "No action required.",
  },
];

const bar: Record<string, string> = {
  red:    "border-l-red-400 bg-red-50",
  yellow: "border-l-amber-400 bg-amber-50",
  green:  "border-l-green-400 bg-green-50",
};
const pillStyle: Record<string, string> = {
  red:    "bg-red-100 text-red-700",
  yellow: "bg-amber-100 text-amber-700",
  green:  "bg-green-100 text-green-700",
};
const pledgeColor: Record<string, string> = {
  red: "#dc2626", yellow: "#d97706", green: "#16a34a",
};
const label: Record<string, string> = {
  red: "CRITICAL", yellow: "MODERATE", green: "SAFE",
};

export default function PledgePage() {
  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Promoter Pledge Alerts</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Pledge &gt;50% = forced selling risk if stock drops. Detect it before the crash.
          </p>
        </div>

        {/* Threshold guide */}
        <div className="card p-4 flex gap-6 text-sm">
          <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-green-500"/><span className="text-gray-600">&lt;20% — Safe</span></span>
          <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-400"/><span className="text-gray-600">20–50% — Watch</span></span>
          <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500"/><span className="text-gray-600">&gt;50% — Critical (SEBI danger zone)</span></span>
        </div>

        {/* Pledge cards */}
        <div className="space-y-4">
          {pledgeData.map((p) => (
            <div key={p.ticker} className={`card border-l-4 ${bar[p.severity]} p-5`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                {/* Left */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${pillStyle[p.severity]}`}>
                      {label[p.severity]}
                    </span>
                    <span className="text-base font-bold text-gray-900">{p.name}</span>
                    <span className="text-sm text-gray-400">{p.ticker}</span>
                  </div>
                  <p className="text-xs text-gray-500">Your holding: <b className="text-gray-700">{p.holding}</b></p>
                </div>
                {/* Pledge gauge */}
                <div className="text-right">
                  <p className="text-3xl font-bold mono" style={{ color: pledgeColor[p.severity] }}>{p.pledge}%</p>
                  <p className="text-xs text-gray-500">promoter pledge</p>
                </div>
              </div>

              {/* Pledge progress bar */}
              <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${p.pledge}%`, background: pledgeColor[p.severity] }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                <span>0%</span><span>20%</span><span>50%</span><span>100%</span>
              </div>

              {/* Trend */}
              <div className="flex items-center gap-1.5 mt-3">
                <TrendingUp size={13} className="text-gray-400" />
                <p className="text-xs text-gray-600">Trend: <b>{p.trend}</b></p>
              </div>

              {/* Historical quarters */}
              <div className="flex gap-3 mt-3">
                {p.history.map((h) => (
                  <div key={h.q} className="text-center">
                    <p className="text-[10px] text-gray-400">{h.q}</p>
                    <p className="text-xs font-semibold text-gray-700 mono">{h.pct}%</p>
                  </div>
                ))}
              </div>

              {/* Precedents */}
              {p.precedents.length > 0 && (
                <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                  <p className="text-xs font-semibold text-red-700 mb-2 flex items-center gap-1">
                    <AlertTriangle size={12} /> Historical precedents
                  </p>
                  <div className="space-y-1">
                    {p.precedents.map((pr) => (
                      <p key={pr.co} className="text-xs text-red-700">
                        <b>{pr.co}</b>: pledge {pr.pledge} → crashed <b>{pr.crash}</b> in {pr.period}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Action */}
              <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg">
                <p className="text-xs font-semibold text-gray-700 mb-1">Recommended action</p>
                <p className="text-xs text-gray-600">{p.action}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </AppShell>
  );
}
