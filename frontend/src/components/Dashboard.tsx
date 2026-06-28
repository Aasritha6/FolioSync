import React, { useState, useCallback } from 'react';
import axios from 'axios';
import PortfolioView from './PortfolioView';
import { UploadCloud, RefreshCw } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

export default function Dashboard() {
  const [portfolio, setPortfolio] = useState<any>(null);
  const [macro, setMacro] = useState<any>(null);
  const [ipo, setIpo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [macroLoading, setMacroLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [rawColumns, setRawColumns] = useState<string[]>([]);

  const handleFile = async (file: File) => {
    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('csv_file', file);

    try {
      const res = await axios.post(`${API_BASE}/ingest`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPortfolio(res.data);
      setRawColumns(res.data.columns || []);
      loadMacroAndIPO();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to parse file. Make sure it is a Groww CSV export.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const loadMacroAndIPO = async () => {
    setMacroLoading(true);
    try {
      const [macroRes, ipoRes] = await Promise.allSettled([
        axios.get(`${API_BASE}/macro`),
        axios.get(`${API_BASE}/ipo`),
      ]);
      if (macroRes.status === 'fulfilled') setMacro(macroRes.value.data);
      if (ipoRes.status === 'fulfilled') setIpo(ipoRes.value.data);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top banner */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">📊 FolioSync — Your Investment Command Center</h1>
          <p className="text-sm text-gray-500 mt-0.5">Upload your Groww CSV or CAMS CAS PDF to get real-time intelligence</p>
        </div>
        {portfolio && (
          <span className="text-xs bg-green-100 text-green-700 font-semibold px-3 py-1 rounded-full">
            ✓ Portfolio Synced
          </span>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* Upload zone */}
        {!portfolio && (
          <div
            className={`border-2 border-dashed rounded-2xl p-16 text-center transition-all ${
              dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/30'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            <div className="flex flex-col items-center gap-4">
              {loading ? (
                <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
              ) : (
                <UploadCloud className="w-12 h-12 text-blue-400" />
              )}
              <div>
                <p className="text-lg font-semibold text-gray-700">
                  {loading ? 'Reading your portfolio...' : 'Drop your portfolio file here'}
                </p>
                <p className="text-sm text-gray-400 mt-1">Supports Groww CSV exports and CAMS CAS PDFs</p>
              </div>
              {!loading && (
                <label className="mt-2 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium cursor-pointer transition-colors">
                  <UploadCloud className="w-4 h-4" />
                  Choose File
                  <input type="file" accept=".csv,.pdf,.xlsx" className="hidden" onChange={onFileInput} />
                </label>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl text-sm">
            <strong>Error:</strong> {error}
            {rawColumns.length > 0 && (
              <p className="mt-2 text-xs text-red-500">Detected columns: {rawColumns.join(', ')}</p>
            )}
            <button onClick={() => { setError(''); setPortfolio(null); }} className="mt-2 text-xs underline block">Try again</button>
          </div>
        )}

        {portfolio && (
          <PortfolioView
            portfolio={portfolio}
            macro={macro}
            ipo={ipo}
            macroLoading={macroLoading}
            onReset={() => { setPortfolio(null); setMacro(null); setIpo(null); setError(''); }}
          />
        )}
      </div>
    </div>
  );
}
