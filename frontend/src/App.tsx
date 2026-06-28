import Dashboard from './components/Dashboard'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">F</div>
        <span className="font-bold text-xl text-gray-900">FolioSync</span>
        <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full font-medium">Beta</span>
      </header>
      <Dashboard />
    </div>
  )
}

export default App
