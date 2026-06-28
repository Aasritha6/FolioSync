"use client";
import AppShell from "../components/AppShell";
import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, X } from "lucide-react";

type FileState = { file: File; status: "idle" | "parsing" | "done" | "error"; rows?: number };

export default function UploadPage() {
  const [growwFile, setGrowwFile] = useState<FileState | null>(null);
  const [casFile, setCasFile]     = useState<FileState | null>(null);
  const [parsed, setParsed]       = useState(false);

  const growwRef = useRef<HTMLInputElement>(null);
  const casRef   = useRef<HTMLInputElement>(null);

  function handleFile(
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (f: FileState | null) => void
  ) {
    const f = e.target.files?.[0];
    if (!f) return;
    setter({ file: f, status: "parsing" });
    setTimeout(() => {
      setter({ file: f, status: "done", rows: Math.floor(Math.random() * 10) + 4 });
    }, 1400);
  }

  function handleAnalyse() {
    setParsed(true);
  }

  const ready = growwFile?.status === "done" && casFile?.status === "done";

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Upload Portfolio</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            We need your Groww CSV and CAMS CAS PDF. Nothing is stored outside your session.
          </p>
        </div>

        {/* Upload zones */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UploadZone
            label="Groww Portfolio CSV"
            hint="Export from Groww → Portfolio → Download"
            accept=".csv"
            state={growwFile}
            onClear={() => setGrowwFile(null)}
            onClick={() => growwRef.current?.click()}
          />
          <input ref={growwRef} type="file" accept=".csv" className="hidden"
            onChange={(e) => handleFile(e, setGrowwFile)} />

          <UploadZone
            label="CAMS / Karvy CAS PDF"
            hint="Login to camsonline.com → Statement → Download"
            accept=".pdf"
            state={casFile}
            onClear={() => setCasFile(null)}
            onClick={() => casRef.current?.click()}
          />
          <input ref={casRef} type="file" accept=".pdf" className="hidden"
            onChange={(e) => handleFile(e, setCasFile)} />
        </div>

        {/* Instructions */}
        <div className="card p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-700">How to get your files</p>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex gap-2">
              <span className="text-green-600 font-bold shrink-0">1.</span>
              <span><b>Groww CSV:</b> Open Groww app → Portfolio → ⋯ menu → Download CSV</span>
            </div>
            <div className="flex gap-2">
              <span className="text-green-600 font-bold shrink-0">2.</span>
              <span><b>CAMS PDF:</b> Go to camsonline.com → myCAMS → Detailed Statement → Email/Download as PDF</span>
            </div>
            <div className="flex gap-2">
              <span className="text-green-600 font-bold shrink-0">3.</span>
              <span>Upload both above and click <b>Analyse Portfolio</b></span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleAnalyse}
          disabled={!ready}
          className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
            ready
              ? "bg-green-600 hover:bg-green-700 text-white shadow-sm"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          {ready ? "Analyse Portfolio →" : "Upload both files to continue"}
        </button>

        {/* Parsed result */}
        {parsed && (
          <div className="card p-4 border-green-200 bg-green-50">
            <div className="flex items-start gap-3">
              <CheckCircle size={18} className="text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800">Portfolio parsed successfully</p>
                <p className="text-sm text-green-700 mt-0.5">
                  Found <b>8 stocks</b> from Groww · <b>4 mutual funds</b> from CAS · <b>3 active SIPs</b>
                  <br />Total portfolio value: <b>₹5,00,000</b>
                </p>
                <a href="/" className="inline-block mt-3 px-4 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700">
                  Go to Dashboard →
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

// ─── sub-component ─────────────────────────────────────
function UploadZone({
  label, hint, accept, state, onClear, onClick,
}: {
  label: string; hint: string; accept: string;
  state: FileState | null;
  onClear: () => void;
  onClick: () => void;
}) {
  return (
    <div
      onClick={!state ? onClick : undefined}
      className={`card p-5 flex flex-col items-center justify-center gap-2 text-center min-h-[160px] cursor-pointer transition-all border-dashed ${
        state ? "cursor-default border-solid" : "hover:border-green-400 hover:bg-green-50/40"
      }`}
    >
      {!state && (
        <>
          <Upload size={22} className="text-gray-300" />
          <p className="text-sm font-semibold text-gray-700">{label}</p>
          <p className="text-xs text-gray-400">{hint}</p>
          <p className="text-xs text-gray-300 mt-1">Click to browse · {accept.replace(".", "").toUpperCase()}</p>
        </>
      )}

      {state?.status === "parsing" && (
        <>
          <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-600">Parsing {state.file.name}…</p>
        </>
      )}

      {state?.status === "done" && (
        <>
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-green-600" />
            <p className="text-sm font-semibold text-green-700">{state.file.name}</p>
            <button onClick={(e) => { e.stopPropagation(); onClear(); }} className="text-gray-300 hover:text-gray-500 ml-1">
              <X size={14} />
            </button>
          </div>
          <p className="text-xs text-gray-500">
            {label.includes("CSV") ? `${state.rows} holdings found` : `${state.rows} funds extracted`}
          </p>
        </>
      )}
    </div>
  );
}
