import AppShell from "./components/AppShell";
import Link from "next/link";
import {
  Share2, AlertTriangle, Newspaper, Lock,
  TrendingUp, ArrowUpRight, ArrowDownRight, ChevronRight
} from "lucide-react";

// ─── mock data ───────────────────────────────────────────
const summaryCards = [
  { label: "Total Portfolio", value: "₹5,00,000", sub: "+₹12,400 today", up: true },
  { label: "Stocks",          value: "₹2,80,000", sub: "8 holdings",       up: null },
  { label: "Mutual Funds",    value: "₹2,20,000", sub: "4 funds · 3 SIPs", up: null },
  { label: "Overall P&L",     value: "+₹43,200",  sub: "+9.4% since buy",  up: true  },
];

const alerts = [
  {
    severity: "red",
    icon: AlertTriangle,
    title: "Critical — Promoter Pledge",
    body: "Stock X has 68% promoter pledge. Historical precedent: DHFL (75% → −90%).",
    href: "/pledge",
    cta: "View details",
  },
  {
    severity: "yellow",
    icon: Lock,
    title: "Liquidity Trap — Stock Y",
    body: "F&O ban active (Day 3 of 5). Volume down 62%. Cash market only.",
    href: "/fno",
    cta: "See exit options",
  },
  {
    severity: "yellow",
    icon: Newspaper,
    title: "Macro Alert — RBI Repo Hike",
    body: "RBI hiked by 25bps. Your banking stocks: +₹2,760. Real estate: −₹2,480. Home loan EMI: +₹2,400/mo.",
    href: "/macro",
    cta: "Full analysis",
  },
  {
    severity: "red",
    icon: Share2,
    title: "Overlap Warning — Reliance",
    body: "18.4% of portfolio in Reliance (₹92,000 across direct + 3 MF holdings).",
    href: "/overlap",
    cta: "See graph",
  },
];

const holdings = [
  { name: "Reliance Industries", ticker: "RELIANCE", type: "Stock", value: "₹45,000", pnl: "+8.2%",  up: true,  rsi: 72, rsiLabel: "Overbought", rsiColor: "text-amber-600" },
  { name: "HDFC Bank",           ticker: "HDFCBANK",  type: "Stock", value: "₹35,000", pnl: "+4.1%",  up: true,  rsi: 45, rsiLabel: "Neutral",    rsiColor: "text-gray-500"  },
  { name: "DLF Limited",         ticker: "DLF",       type: "Stock", value: "₹50,000", pnl: "−6.3%", up: false, rsi: 28, rsiLabel: "Oversold",   rsiColor: "text-red-600"   },
  { name: "Mirae Asset Large Cap",ticker: "—",         type: "MF",    value: "₹80,000", pnl: "+11.2%", up: true,  rsi: null, rsiLabel: null,     rsiColor: ""               },
  { name: "Axis Small Cap Fund",  ticker: "—",         type: "MF",    value: "₹60,000", pnl: "+6.8%", up: true,  rsi: null, rsiLabel: null,      rsiColor: ""               },
];

const severityStyle: Record<string, { bar: string; bg: string; dot: string }> = {
  red:    { bar: "border-l-red-400",    bg: "bg-red-50",    dot: "bg-red-400"    },
  yellow: { bar: "border-l-amber-400",  bg: "bg-amber-50",  dot: "bg-amber-400"  },
  green:  { bar: "border-l-green-400",  bg: "bg-green-50",  dot: "bg-green-400"  },
};

export default function Dashboard() {
  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Page title */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Last synced: Today, 2:41 PM — <Link href="/upload" className="text-green-600 hover:underline">Upload new data →</Link></p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((c) => (
            <div key={c.label} className="card p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider">{c.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1 mono">{c.value}</p>
              <p className={`text-xs font-medium mt-1 ${
                c.up === true ? "text-green-600" : c.up === false ? "text-red-500" : "text-gray-500"
              }`}>{c.sub}</p>
            </div>
          ))}
        </div>

        {/* Main grid: alerts + holdings */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Alerts — 2 cols */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Active Alerts</h2>
            {alerts.map((a) => {
              const s = severityStyle[a.severity];
              const Icon = a.icon;
              return (
                <div key={a.title} className={`card border-l-4 ${s.bar} ${s.bg} p-4`}>
                  <div className="flex items-start gap-2.5">
                    <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{a.title}</p>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">{a.body}</p>
                      <Link href={a.href} className="inline-flex items-center gap-0.5 text-xs text-green-600 font-medium mt-2 hover:underline">
                        {a.cta} <ChevronRight size={11} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Holdings table — 3 cols */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Your Holdings</h2>
              <Link href="/technical" className="text-xs text-green-600 hover:underline">Technical view →</Link>
            </div>
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-2.5 text-xs text-gray-400 font-medium">Name</th>
                    <th className="text-right px-4 py-2.5 text-xs text-gray-400 font-medium">Value</th>
                    <th className="text-right px-4 py-2.5 text-xs text-gray-400 font-medium">P&L</th>
                    <th className="text-right px-4 py-2.5 text-xs text-gray-400 font-medium hidden md:table-cell">RSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {holdings.map((h) => (
                    <tr key={h.name} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{h.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{h.ticker === "—" ? h.type : `${h.ticker} · ${h.type}`}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-900 font-medium">{h.value}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`flex items-center justify-end gap-0.5 text-xs font-semibold mono ${h.up ? "text-green-600" : "text-red-500"}`}>
                          {h.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                          {h.pnl}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right hidden md:table-cell">
                        {h.rsi !== null ? (
                          <span className={`text-xs font-medium ${h.rsiColor}`}>
                            {h.rsi} — {h.rsiLabel}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Feature shortcut cards */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Analysis Tools</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { href: "/overlap",   icon: Share2,        label: "Overlap Graph",    sub: "18.4% hidden in Reliance",          color: "text-red-500" },
              { href: "/pledge",    icon: AlertTriangle, label: "Pledge Alerts",    sub: "1 critical, 2 moderate",            color: "text-amber-500" },
              { href: "/macro",     icon: Newspaper,     label: "Macro & News",     sub: "RBI hike detected 2h ago",          color: "text-blue-500" },
              { href: "/technical", icon: TrendingUp,    label: "Technical Health", sub: "2 overbought, 1 oversold",          color: "text-green-600" },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <Link key={f.href} href={f.href} className="card p-4 flex flex-col gap-2 hover:border-green-200 transition-colors group">
                  <Icon size={18} className={f.color} />
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-green-700 transition-colors">{f.label}</p>
                  <p className="text-xs text-gray-500">{f.sub}</p>
                </Link>
              );
            })}
          </div>
        </div>

      </div>
    </AppShell>
  );
}
