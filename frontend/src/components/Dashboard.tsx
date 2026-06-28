import React, { useState, useCallback } from 'react';
import axios from 'axios';
import PortfolioView from './PortfolioView';
import { UploadCloud, RefreshCw, Lock } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function Dashboard() {
  const [portfolio, setPortfolio]     = useState<any>(null);
  const [macro, setMacro]             = useState<any>(null);
  const [ipo, setIpo]                 = useState<any>(null);
  const [loading, setLoading]         = useState(false);
  const [macroLoading, setMacroLoading] = useState(false);
  const [dragOver, setDragOver]       = useState(false);
  const [error, setError]             = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword]       = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const uploadFile = async (file: File, pwd: string = '') => {
    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('csv_file', file);
    if (pwd) formData.append('password', pwd);

    try {
      const res = await axios.post(`${API_BASE}/ingest`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPortfolio(res.data);
      setNeedsPassword(false);
      setPendingFile(null);
      loadMacroAndIPO(res.data);
    } catch (err: any) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail || 'Upload failed.';
      if (status === 401) {
        // PDF needs a password (PAN)
        setNeedsPassword(true);
        setPendingFile(file);
        setError(detail);
      } else {
        setError(detail);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFile = (file: File) => {
    setNeedsPassword(false);
    setPassword('');
    uploadFile(file);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pendingFile && password) uploadFile(pendingFile, password);
  };

  const loadMacroAndIPO = async (portfolioData: any) => {
    setMacroLoading(true);
    try {
      const [macroRes, ipoRes] = await Promise.allSettled([
        axios.post(`${API_BASE}/macro`, portfolioData),
        axios.get(`${API_BASE}/ipo`),
      ]);
      if (macroRes.status === 'fulfilled') setMacro(macroRes.value.data);
      if (ipoRes.status  === 'fulfilled') setIpo(ipoRes.value.data);
    } catch (e) {
      console.error(e);
    } finally {
      setMacroLoading(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const reset = () => {
    setPortfolio(null);
    setMacro(null);
    setIpo(null);
    setError('');
    setNeedsPassword(false);
    setPendingFile(null);
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Banner */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">📊 FolioSync — Investment Command Center</h1>
          <p className="text-sm text-gray-400 mt-0.5">Upload your Groww CSV or CAMS CAS PDF to get real-time intelligence</p>
        </div>
        {portfolio && (
          <span className="text-xs bg-green-100 text-green-700 font-semibold px-3 py-1 rounded-full flex items-center gap-1">
            ✓ Portfolio Synced
          </span>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Upload zone (only shown if no portfolio loaded) */}
        {!portfolio && !needsPassword && (
          <div
            className={`border-2 border-dashed rounded-2xl p-16 text-center transition-all cursor-pointer ${
              dragOver
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/30'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            <div className="flex flex-col items-center gap-4">
              {loading
                ? <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
                : <UploadCloud className="w-12 h-12 text-blue-400" />
              }
              <div>
                <p className="text-lg font-semibold text-gray-700">
                  {loading ? 'Reading your portfolio…' : 'Drop your statement here'}
                </p>
                <p className="text-sm text-gray-400 mt-1">Supports Groww CSV · CAMS CAS PDF · Zerodha CSV</p>
              </div>
              {!loading && (
                <label className="mt-2 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium cursor-pointer transition-colors shadow-sm">
                  <UploadCloud className="w-4 h-4" />
                  Choose File
                  <input type="file" accept=".csv,.pdf,.xlsx" className="hidden" onChange={onFileInput} />
                </label>
              )}
            </div>
          </div>
        )}

        {/* PAN / Password prompt for encrypted CAS PDFs */}
        {needsPassword && !portfolio && (
          <div className="bg-white rounded-2xl shadow-sm border border-amber-200 p-8 max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Lock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">PDF is password protected</h2>
                <p className="text-xs text-gray-500">CAMS CAS PDFs are encrypted with your PAN number</p>
              </div>
            </div>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enter your PAN</label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value.toUpperCase())}
                  placeholder="e.g. ABCPS1234F"
                  maxLength={10}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-1">Your PAN is only used locally to decrypt the PDF — never sent to any server.</p>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading || password.length < 6}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                  {loading ? 'Decrypting…' : 'Unlock & Parse'}
                </button>
                <button type="button" onClick={reset} className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Error message */}
        {error && !needsPassword && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl text-sm">
            <strong>Error:</strong> {error}
            <button onClick={reset} className="mt-2 text-xs underline block">Try again with a different file</button>
          </div>
        )}

        {/* Main portfolio view */}
        {portfolio && (
          <PortfolioView
            portfolio={portfolio}
            macro={macro}
            ipo={ipo}
            macroLoading={macroLoading}
            onReset={reset}
          />
        )}
      </div>
    </div>
  );
}
