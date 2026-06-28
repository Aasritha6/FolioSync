"use client";

const alerts = [
  { color: "bg-red-500",    label: "2 Critical" },
  { color: "bg-amber-400",  label: "3 Warnings" },
  { color: "bg-green-500",  label: "5 Healthy" },
];

export default function TopBar() {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between gap-4">
      {/* Ticker */}
      <div className="flex items-center gap-6 text-sm overflow-x-auto">
        <span className="text-gray-400 text-xs uppercase tracking-wider shrink-0">Live</span>
        {[
          { label: "HDFC Bank", val: "₹1,742", change: "+1.2%", up: true },
          { label: "Reliance",  val: "₹2,892", change: "+0.8%", up: true },
          { label: "DLF",       val: "₹812",   change: "−2.1%", up: false },
          { label: "Infosys",   val: "₹1,610", change: "+0.3%", up: true },
        ].map((t) => (
          <span key={t.label} className="flex items-center gap-1.5 shrink-0">
            <span className="text-gray-600 font-medium">{t.label}</span>
            <span className="mono text-gray-900 font-semibold">{t.val}</span>
            <span className={`mono text-xs font-medium ${t.up ? "text-green-600" : "text-red-500"}`}>
              {t.change}
            </span>
          </span>
        ))}
      </div>

      {/* Alert pills */}
      <div className="flex items-center gap-2 shrink-0">
        {alerts.map((a) => (
          <span key={a.label} className="flex items-center gap-1.5 text-xs bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1">
            <span className={`w-1.5 h-1.5 rounded-full ${a.color}`} />
            <span className="text-gray-600">{a.label}</span>
          </span>
        ))}
        <span className="text-xs text-gray-400 ml-1">VIX: 16.4</span>
      </div>
    </header>
  );
}
