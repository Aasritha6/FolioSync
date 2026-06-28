import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UploadCloud, TrendingUp, AlertTriangle, Activity, Globe, RefreshCw } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

export default function Dashboard() {
  const [portfolio, setPortfolio] = useState<any>(null);
  const [macroNews, setMacroNews] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [macroLoading, setMacroLoading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    const formData = new FormData();
    formData.append('csv_file', file);

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/ingest`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPortfolio(res.data);
      fetchMacroImpact();
    } catch (err) {
      console.error('Error uploading file:', err);
      alert('Failed to parse portfolio file.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMacroImpact = async () => {
    setMacroLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/macro`);
      setMacroNews(res.data);
    } catch (err) {
      console.error('Error fetching macro news:', err);
    } finally {
      setMacroLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Upload */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Portfolio Overview</h1>
          <p className="text-slate-500 mt-1">Upload your Groww CSV or CAMS CAS PDF to sync your holdings.</p>
        </div>
        
        <div className="relative">
          <input 
            type="file" 
            accept=".csv,.pdf" 
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm shadow-blue-200">
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
            {loading ? 'Processing...' : 'Upload Statement'}
          </button>
        </div>
      </div>

      {portfolio && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Portfolio Stats */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
                <p className="text-sm font-medium text-slate-500 mb-1">Total Value</p>
                <h2 className="text-3xl font-bold text-slate-900">
                  ₹{portfolio.total_value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </h2>
                <div className="flex items-center gap-1 mt-2 text-green-600 text-sm font-medium">
                  <TrendingUp className="w-4 h-4" />
                  <span>Sync successful</span>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
                <p className="text-sm font-medium text-slate-500 mb-1">Holdings Found</p>
                <h2 className="text-3xl font-bold text-slate-900">{portfolio.stocks.length} Assets</h2>
                <p className="mt-2 text-sm text-slate-500">Across Stocks & Mutual Funds</p>
              </div>
            </div>

            {/* Holdings Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-semibold text-slate-900">Your Holdings</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Asset</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Quantity</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {portfolio.stocks.slice(0, 5).map((stock: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-slate-900">{stock.symbol}</div>
                          <div className="text-xs text-slate-500 mt-0.5">Avg: ₹{stock.avg_cost.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-slate-700">
                          {stock.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-slate-900">
                          ₹{stock.current_value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {portfolio.stocks.length > 5 && (
                <div className="px-6 py-4 border-t border-slate-100 text-center">
                  <button className="text-sm font-medium text-blue-600 hover:text-blue-700">View all holdings</button>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Intelligence */}
          <div className="space-y-6">
            {/* Macro News Impact */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                <Globe className="w-24 h-24 text-blue-600" />
              </div>
              
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <Activity className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-slate-900">Macro Intelligence</h3>
              </div>

              {macroLoading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                  <div className="h-16 bg-slate-100 rounded mt-4"></div>
                </div>
              ) : macroNews ? (
                <div className="space-y-4 relative z-10">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Latest Event</span>
                    <p className="text-sm font-medium text-slate-800 line-clamp-2">
                      {macroNews.headline}
                    </p>
                  </div>
                  
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">AI Impact Analysis</span>
                    <p className="text-sm text-slate-600 leading-relaxed bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
                      {macroNews.portfolio_impact}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-500 py-4 text-center">
                  Upload portfolio to see AI-driven macro impacts.
                </div>
              )}
            </div>

            {/* Alerts Placeholder */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-2xl shadow-sm border border-orange-100/50">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <h3 className="font-semibold text-slate-900">Active Alerts</h3>
              </div>
              <p className="text-sm text-slate-600 mb-4">No critical alerts for your portfolio right now. Everything looks healthy.</p>
              <div className="flex gap-2">
                <span className="px-2.5 py-1 bg-white rounded-md text-xs font-medium text-slate-500 border border-slate-200">0 Pledge Warnings</span>
                <span className="px-2.5 py-1 bg-white rounded-md text-xs font-medium text-slate-500 border border-slate-200">0 F&O Bans</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {!portfolio && (
        <div className="py-24 text-center px-4">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600">
            <Activity className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Unified Portfolio Intelligence</h2>
          <p className="text-slate-500 max-w-md mx-auto">
            Upload your statements to instantly connect macroeconomic events, check technical health, and find hidden mutual fund overlaps.
          </p>
        </div>
      )}
    </div>
  );
}
