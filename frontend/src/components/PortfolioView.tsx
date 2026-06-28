import React, { useState } from 'react';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  portfolio: any;
  macro: any;
  ipo: any;
  macroLoading: boolean;
  onReset: () => void;
}

const fmt = (n: number) =>
  n?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00';

const fmtCompact = (n: number) => {
  if (!n) return '₹0';
  if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return `₹${fmt(n)}`;
};

export default function PortfolioView({ portfolio, macro, ipo, macroLoading, onReset }: Props) {
  const [activeTab, setActiveTab] = useState<'holdings' | 'macro' | 'ipo'>('holdings');

  const isCAS = portfolio?.type === 'cas_pdf';
  const mfs: any[]    = portfolio?.mfs    || [];
  const stocks: any[] = portfolio?.stocks || [];
  const totalValue    = portfolio?.total_value    || 0;
  const totalInvested = portfolio?.total_invested || 0;
  const totalPnl      = portfolio?.total_pnl      || 0;
  const totalPnlPct   = portfolio?.total_pnl_pct  || 0;
  const investor      = portfolio?.investor;

  const ipoActive  = ipo?.subscription_status || ipo?.data?.subscription_status || [];
  const ipoRecent  = ipo?.recently_listed     || ipo?.data?.recently_listed     || [];

  const tabs = [
    { key: 'holdings', label: isCAS ? '📂 MF Holdings' : '📋 Stock Holdings' },
    { key: 'macro',    label: '🌐 Macro Intelligence' },
    { key: 'ipo',      label: '🚀 IPO Tracker' },
  ];

  return (
    <div className="space-y-5">

      {/* Investor banner for CAS */}
      {isCAS && investor?.name && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-base flex-shrink-0">
            {investor.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{investor.name}</p>
            <p className="text-xs text-gray-500">{investor.pan} · {investor.email}</p>
          </div>
          <span className="ml-auto text-xs bg-blue-100 text-blue-700 font-semibold px-3 py-1 rounded-full">
            CAMS CAS Statement
          </span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Current Value"   value={fmtCompact(totalValue)} />
        <StatCard label="Total Invested"  value={fmtCompact(totalInvested)} />
        <StatCard
          label="Total Gain / Loss"
          value={`${totalPnl >= 0 ? '+' : ''}${fmtCompact(totalPnl)}`}
          sub={`${totalPnlPct >= 0 ? '+' : ''}${totalPnlPct.toFixed(2)}%`}
          positive={totalPnl >= 0}
        />
        <StatCard label={isCAS ? 'Funds' : 'Stocks'} value={`${isCAS ? mfs.length : stocks.length}`} />
      </div>

      {/* Main Card with Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              className={`px-5 py-4 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px ${
                activeTab === t.key
                  ? 'border-blue-500 text-blue-600 bg-blue-50/40'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {t.label}
            </button>
          ))}
          <div className="flex-1" />
          <button onClick={onReset} className="px-4 text-xs text-gray-400 hover:text-blue-500 transition-colors shrink-0">
            ↩ Upload new
          </button>
        </div>

        <div className="p-6">

          {/* ── HOLDINGS TAB ───────────────────────────── */}
          {activeTab === 'holdings' && (
            isCAS ? (
              /* Mutual Fund holdings from CAS PDF */
              mfs.length === 0 ? (
                <EmptyState msg="No mutual fund data found in the PDF." />
              ) : (
                <div className="space-y-3">
                  {mfs.map((f, i) => (
                    <div key={i} className="border border-gray-100 rounded-xl p-4 hover:border-blue-100 hover:bg-blue-50/20 transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm leading-snug">{f.scheme_name}</p>
                          <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                            {f.plan && <span className="bg-gray-100 px-2 py-0.5 rounded-full">{f.plan}</span>}
                            {f.isin && <span>ISIN: {f.isin}</span>}
                            <span>{f.units} units @ NAV ₹{fmt(f.nav)}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-gray-900 text-sm">₹{fmt(f.current_value)}</p>
                          <p className={`text-xs font-medium mt-0.5 ${f.pnl >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {f.pnl >= 0 ? '▲ +' : '▼ '}₹{fmt(Math.abs(f.pnl))} ({f.pnl_pct >= 0 ? '+' : ''}{f.pnl_pct}%)
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">Invested: ₹{fmt(f.invested)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              /* Stock holdings from CSV */
              stocks.length === 0 ? (
                <EmptyState msg="No stocks found. Make sure your CSV has columns like Symbol, Quantity, Avg. Cost, Current Value." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                        <th className="pb-3 pr-4">Stock</th>
                        <th className="pb-3 pr-4 text-right">Qty</th>
                        <th className="pb-3 pr-4 text-right">Avg Cost</th>
                        <th className="pb-3 pr-4 text-right">Value</th>
                        <th className="pb-3 text-right">P&L</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {stocks.map((s: any, i: number) => {
                        const cost = s.avg_cost * s.quantity;
                        const gain = s.current_value - cost;
                        const gainPct = cost > 0 ? (gain / cost) * 100 : 0;
                        return (
                          <tr key={i} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3 pr-4 font-medium text-gray-900">{s.symbol}</td>
                            <td className="py-3 pr-4 text-right text-gray-600">{s.quantity}</td>
                            <td className="py-3 pr-4 text-right text-gray-600">₹{fmt(s.avg_cost)}</td>
                            <td className="py-3 pr-4 text-right font-semibold text-gray-900">₹{fmt(s.current_value)}</td>
                            <td className="py-3 text-right">
                              <span className={`font-medium text-sm ${gain >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {gain >= 0 ? '+' : ''}₹{fmt(gain)}<br />
                                <span className="text-xs opacity-80">({gainPct >= 0 ? '+' : ''}{gainPct.toFixed(1)}%)</span>
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            )
          )}

          {/* ── MACRO TAB ──────────────────────────────── */}
          {activeTab === 'macro' && (
            macroLoading ? (
              <div className="py-14 flex flex-col items-center gap-3 text-gray-400">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
                <p className="text-sm">Fetching live news + running AI analysis…</p>
              </div>
            ) : macro ? (
              <div className="space-y-5">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5">
                  <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-2">
                    🤖 AI Portfolio Impact (Groq / LLaMA 3.1)
                  </p>
                  <p className="text-gray-800 leading-relaxed text-sm">{macro.portfolio_impact}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">📰 Live Headlines</p>
                  <div className="space-y-2">
                    {(macro.headlines || [macro.headline]).filter(Boolean).map((h: string, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <span className="w-5 h-5 bg-gray-200 rounded-full text-xs text-gray-500 flex items-center justify-center flex-shrink-0 mt-0.5 font-medium">
                          {i + 1}
                        </span>
                        <p className="text-sm text-gray-700">{h}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState msg="Macro data unavailable right now." />
            )
          )}

          {/* ── IPO TAB ────────────────────────────────── */}
          {activeTab === 'ipo' && (
            <div className="space-y-6">
              {ipoActive.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">🔴 Live Subscription</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                          <th className="pb-3 pr-4">Company</th>
                          <th className="pb-3 pr-4">Type</th>
                          <th className="pb-3 pr-4 text-right">Price</th>
                          <th className="pb-3 pr-4 text-right">QIB</th>
                          <th className="pb-3 pr-4 text-right">NII</th>
                          <th className="pb-3 text-right">Retail</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {ipoActive.map((item: any, i: number) => (
                          <tr key={i} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3 pr-4 font-medium text-gray-900 text-xs">{item.company}</td>
                            <td className="py-3 pr-4">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                item.type === 'Mainline' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                              }`}>{item.type}</span>
                            </td>
                            <td className="py-3 pr-4 text-right text-gray-600 text-xs">{item.issue_price}</td>
                            <td className="py-3 pr-4 text-right font-semibold text-blue-600 text-xs">{item.qib}</td>
                            <td className="py-3 pr-4 text-right font-semibold text-green-600 text-xs">{item.nii}</td>
                            <td className="py-3 text-right font-medium text-gray-700 text-xs">{item.retail}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {ipoRecent.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">📊 Recently Listed</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ipoRecent.slice(0, 6).map((item: any, i: number) => (
                      <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <p className="font-medium text-gray-900 text-sm">{item.company}</p>
                        <div className="flex justify-between mt-2 text-xs text-gray-500 flex-wrap gap-1">
                          <span>Issue: {item.issue_price}</span>
                          <span>Listed: {item.listing_open || '—'}</span>
                          <span className="text-blue-600 font-medium">{item.total_subscription} sub</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {ipoActive.length === 0 && ipoRecent.length === 0 && (
                <EmptyState msg="No active IPO data at this time." />
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, positive }: {
  label: string; value: string; sub?: string; positive?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</p>
      <p className="text-xl font-bold text-gray-900 truncate">{value}</p>
      {sub && (
        <p className={`text-sm font-medium mt-1 flex items-center gap-1 ${positive ? 'text-green-600' : 'text-red-500'}`}>
          {positive ? <span>▲</span> : <span>▼</span>} {sub}
        </p>
      )}
    </div>
  );
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <div className="py-14 text-center text-gray-400">
      <p className="text-4xl mb-3">📭</p>
      <p className="text-sm">{msg}</p>
    </div>
  );
}
