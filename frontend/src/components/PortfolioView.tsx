import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface PortfolioViewProps {
  portfolio: any;
  macro: any;
  ipo: any;
  advancedData: any;
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

export default function PortfolioView({ portfolio, macro, ipo, advancedData, macroLoading, onReset }: PortfolioViewProps) {
  const [activeTab, setActiveTab] = useState<'holdings' | 'macro' | 'ipo' | 'advanced'>('holdings');

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
    { key: 'advanced', label: '📊 Advanced Data' },
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
                <p className="text-sm">Fetching live news & running AI analysis on your specific holdings…</p>
              </div>
            ) : macro ? (
              <div className="space-y-6">
                {/* AI Executive Summary & Outlook */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 opacity-10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                  
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <p className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                      🤖 AI Command Center
                    </p>
                    {macro.structured_analysis?.sentiment && (
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        macro.structured_analysis.sentiment === 'Bullish' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                        macro.structured_analysis.sentiment === 'Bearish' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                      }`}>
                        Market: {macro.structured_analysis.sentiment}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-4 relative z-10">
                    <p className="text-base text-gray-100 leading-relaxed">
                      {macro.structured_analysis?.executive_summary || "Analyzing portfolio..."}
                    </p>
                    {macro.structured_analysis?.outlook && (
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10 border-l-4 border-l-blue-500">
                        <p className="text-sm text-blue-200 font-semibold mb-1">Coming Days Outlook</p>
                        <p className="text-sm text-gray-300">{macro.structured_analysis.outlook}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Specific Alerts */}
                {macro.structured_analysis?.alerts && macro.structured_analysis.alerts.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">⚠️ Specific Asset Alerts</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {macro.structured_analysis.alerts.map((alert: any, i: number) => (
                        <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-gray-900">{alert.asset}</h4>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                              alert.impact === 'Bullish' ? 'bg-green-100 text-green-700' :
                              alert.impact === 'Bearish' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {alert.impact}
                            </span>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2.5 mb-3 border border-gray-100">
                            <p className="text-xs text-gray-500 mb-0.5">News Trigger:</p>
                            <p className="text-xs font-medium text-gray-800">"{alert.news_trigger}"</p>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed">{alert.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Live Headlines */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">📰 Live Headlines Analyzed</p>
                  <div className="space-y-2">
                    {(macro.headlines || [macro.headline]).filter(Boolean).map((h: string, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-100">
                        <span className="w-5 h-5 bg-white border border-gray-200 rounded-full text-xs text-gray-500 flex items-center justify-center flex-shrink-0 mt-0.5 font-medium shadow-sm">
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

          {/* ── ADVANCED DATA TAB ────────────────────────────────── */}
          {activeTab === 'advanced' && (
            <div className="space-y-8">
              {macroLoading && <EmptyState msg="Loading Advanced Market Data streams from Anakin Wires..." />}
              {!macroLoading && (
                <>
                  {/* Screener & RBI Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Screener Announcements */}
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                      <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="text-xl">📄</span> Screener: Corporate Announcements
                      </h3>
                      {advancedData?.screener?.documents?.Announcements ? (
                        <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                          {advancedData.screener.documents.Announcements.slice(0, 5).map((ann: any, i: number) => (
                            <a key={i} href={ann.url} target="_blank" rel="noreferrer" className="block p-3 rounded-lg bg-gray-50 hover:bg-blue-50 border border-gray-100 transition-colors">
                              <p className="text-xs text-blue-700 font-medium line-clamp-2">{ann.title}</p>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">No announcements available for top holding.</p>
                      )}
                    </div>

                    {/* RBI Forex Reserves */}
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                      <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="text-xl">🏦</span> RBI: Foreign Exchange Reserves
                      </h3>
                      {advancedData?.rbi?.status === 'processing' || !advancedData?.rbi ? (
                         <div className="flex items-center justify-center h-24 text-xs text-gray-400">Fetching latest RBI data...</div>
                      ) : (
                         <div className="flex flex-col justify-center h-full pb-4">
                           <p className="text-3xl font-bold text-gray-900">
                             ${((advancedData.rbi.latest_amount || 0) / 1e9).toFixed(1)} Billion
                           </p>
                           <p className="text-sm text-gray-500 mt-2 font-medium">
                             Total Reserves ({advancedData.rbi.currency_code})
                           </p>
                           <p className="text-xs text-gray-400 mt-1">
                             As of {new Date(advancedData.rbi.latest_report_date).toLocaleDateString()}
                           </p>
                         </div>
                      )}
                    </div>
                  </div>

                  {/* Market Breadth & High/Low */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* ET Advance / Decline */}
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                      <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="text-xl">📊</span> Market Breadth (Nifty 50)
                      </h3>
                      {advancedData?.et?.data?.[0] ? (
                        <div>
                          <div className="flex justify-between items-end mb-2">
                            <div>
                              <p className="text-2xl font-bold text-gray-900">{advancedData.et.data[0].current}</p>
                              <p className={`text-sm font-semibold ${advancedData.et.data[0].change > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {advancedData.et.data[0].change > 0 ? '+' : ''}{advancedData.et.data[0].change} ({advancedData.et.data[0].change_pct}%)
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Advances / Declines</p>
                              <p className="font-semibold text-gray-800">
                                <span className="text-green-600">{advancedData.et.data[0].advances}</span> / <span className="text-red-500">{advancedData.et.data[0].declines}</span>
                              </p>
                            </div>
                          </div>
                          <div className="w-full bg-red-500 rounded-full h-2 mt-4 flex overflow-hidden">
                            <div className="bg-green-500 h-full" style={{ width: `${(advancedData.et.data[0].advances / 50) * 100}%` }}></div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">Advance/Decline data unavailable.</p>
                      )}
                    </div>

                    {/* NSE 52 Week Highs */}
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                      <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="text-xl">🚀</span> NSE: New 52-Week Highs
                      </h3>
                      {advancedData?.nse?.data ? (
                        <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                          {advancedData.nse.data.slice(0, 5).map((stock: any, i: number) => (
                            <div key={i} className="flex justify-between items-center p-2 rounded bg-gray-50">
                              <p className="text-xs font-semibold text-gray-900">{stock.symbol}</p>
                              <div className="text-right">
                                <p className="text-xs font-medium text-gray-800">₹{stock.new_52w_value}</p>
                                <p className="text-[10px] text-green-600 font-bold">+{stock.pct_change.toFixed(2)}%</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">High/Low data unavailable.</p>
                      )}
                    </div>
                  </div>

                  {/* Morningstar Category Returns */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="text-xl">🌟</span> Morningstar: Fund Category Returns (1Y)
                    </h3>
                    {advancedData?.morningstar?.items ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="text-xs text-gray-500 border-b border-gray-100 uppercase tracking-wide">
                              <th className="pb-3 pr-4">Category</th>
                              <th className="pb-3 pr-4">Asset Class</th>
                              <th className="pb-3 pr-4 text-right">Avg Return</th>
                              <th className="pb-3 text-right">Top Performer</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {advancedData.morningstar.items.slice(0, 6).map((item: any, i: number) => (
                              <tr key={i} className="hover:bg-gray-50">
                                <td className="py-3 pr-4 font-medium text-gray-800">{item.category_name}</td>
                                <td className="py-3 pr-4 text-gray-500 text-xs">{item.asset_class}</td>
                                <td className={`py-3 pr-4 text-right font-semibold ${item.returns.category_average_pct >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                  {item.returns.category_average_pct}%
                                </td>
                                <td className="py-3 text-right font-semibold text-blue-600">
                                  {item.returns.top_performer_pct}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">Morningstar data unavailable.</p>
                    )}
                  </div>
                </>
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
