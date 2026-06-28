import React from 'react';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">F</span>
                </div>
                <span className="font-bold text-xl text-slate-900 tracking-tight">FolioSync</span>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                Connected
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Dashboard />
      </main>
    </div>
  );
}

export default App;
