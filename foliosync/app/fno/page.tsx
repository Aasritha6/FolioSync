import AppShell from "../components/AppShell";
import { Lock, CheckCircle, Clock } from "lucide-react";

const stocks = [
  {
    ticker: "SUZLON",
    name: "Suzlon Energy",
    holding: "₹28,000",
    banStatus: "active",
    banDay: 3,
    banTotal: 5,
    daysLeft: 2,
    circuit: "10% / 10%",
    volumeDrop: 62,
    avgVolume: "₹4.2 Cr",
    currentVolume: "₹1.6 Cr",
    exitOptions: [
      "Cash market selling only (F&O hedge not available)",
      "Expect 3–5% slippage due to low volume",
      "AMO sell order recommended for better pricing",
      "Alternatively: wait 2 days for ban lift, monitor macro",
    ],
    macroRisk: "MODERATE",
  },
  {
    ticker: "RCOM",
    name: "Reliance Comm",
    holding: "₹15,000",
    banStatus: "lifting",
    banDay: 5,
    banTotal: 5,
    daysLeft: 0,
    circuit: "5% / 5%",
    volumeDrop: 28,
    avgVolume: "₹1.8 Cr",
    currentVolume: "₹1.3 Cr",
    exitOptions: [
      "Ban expected to lift at market open tomorrow",
      "F&O hedging will be available post-lift",
    ],
    macroRisk: "LOW",
  },
  {
    ticker: "HDFCBANK",
    name: "HDFC Bank",
    holding: "₹35,000",
    banStatus: "clear",
    banDay: 0,
    banTotal: 0,
    daysLeft: 0,
    circuit: "20% / 20%",
    volumeDrop: 0,
    avgVolume: "₹82 Cr",
    currentVolume: "₹79 Cr",
    exitOptions: ["No restrictions. Normal liquidity."],
    macroRisk: "LOW",
  },
];

const banColor: Record<string, { bar: string; bg: string; badge: string }> = {
  active:  { bar: "border-l-red-400",   bg: "bg-red-50",   badge: "bg-red-100 text-red-700"   },
  lifting: { bar: "border-l-amber-400", bg: "bg-amber-50", badge: "bg-amber-100 text-amber-700" },
  clear:   { bar: "border-l-green-400", bg: "bg-green-50", badge: "bg-green-100 text-green-700" },
};
const banLabel: Record<string, string> = { active: "BAN ACTIVE", lifting: "BAN LIFTING", clear: "NOT IN BAN" };
const macroColor: Record<string, string> = { HIGH: "text-red-600", MODERATE: "text-amber-600", LOW: "text-green-600" };

export default function FnoPage() {
  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">F&O Ban & Liquidity Traps</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            When a stock enters the F&O ban, you can't hedge. When bad news hits, you're stuck.
          </p>
        </div>

        {/* What is F&O ban */}
        <div className="card p-4 text-sm text-gray-600 space-y-1">
          <p className="font-semibold text-gray-800">What is an F&O ban?</p>
          <p>NSE puts a stock in F&O ban when open interest exceeds 95% of market-wide position limit. During the ban: no fresh F&O positions, only cash market selling, lower liquidity, higher slippage.</p>
        </div>

        <div className="space-y-4">
          {stocks.map((s) => {
            const st = banColor[s.banStatus];
            return (
              <div key={s.ticker} className={`card border-l-4 ${st.bar} ${st.bg} p-5`}>
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {s.banStatus === "clear" ? <CheckCircle size={18} className="text-green-600 shrink-0" /> : <Lock size={18} className="text-red-500 shrink-0" />}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${st.badge}`}>{banLabel[s.banStatus]}</span>
                        <span className="text-sm font-bold text-gray-900">{s.name}</span>
                        <span className="text-xs text-gray-400">{s.ticker}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">Holding: <b>{s.holding}</b></p>
                    </div>
                  </div>
                  {s.banStatus !== "clear" && (
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Ban progress</p>
                      <p className="text-sm font-bold mono text-gray-800">Day {s.banDay} of {s.banTotal}</p>
                      {s.daysLeft > 0 && (
                        <p className="text-xs text-red-600 font-medium flex items-center gap-1 justify-end">
                          <Clock size={10} /> {s.daysLeft} days remaining
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Ban progress bar */}
                {s.banStatus !== "clear" && (
                  <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-red-400 transition-all"
                      style={{ width: `${(s.banDay / s.banTotal) * 100}%` }}
                    />
                  </div>
                )}

                {/* Stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Circuit Limit</p>
                    <p className="text-sm font-bold mono text-gray-800 mt-0.5">{s.circuit}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Volume Drop</p>
                    <p className={`text-sm font-bold mono mt-0.5 ${s.volumeDrop > 40 ? "text-red-600" : s.volumeDrop > 0 ? "text-amber-600" : "text-green-600"}`}>
                      {s.volumeDrop > 0 ? `−${s.volumeDrop}%` : "Normal"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Avg Volume</p>
                    <p className="text-sm font-semibold mono text-gray-700 mt-0.5">{s.avgVolume}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Today's Volume</p>
                    <p className={`text-sm font-semibold mono mt-0.5 ${s.volumeDrop > 40 ? "text-red-600" : "text-gray-700"}`}>{s.currentVolume}</p>
                  </div>
                </div>

                {/* Exit options */}
                {s.exitOptions.length > 0 && (
                  <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Exit options</p>
                    <ul className="space-y-1">
                      {s.exitOptions.map((opt, i) => (
                        <li key={i} className="text-xs text-gray-700 flex gap-1.5">
                          <span className="text-gray-300 shrink-0">›</span>{opt}
                        </li>
                      ))}
                    </ul>
                    {s.macroRisk !== "LOW" && (
                      <p className="text-xs mt-2 font-medium">
                        Macro risk: <span className={macroColor[s.macroRisk]}>{s.macroRisk}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </AppShell>
  );
}
