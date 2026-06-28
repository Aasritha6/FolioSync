"use client";
import AppShell from "../components/AppShell";
import { useEffect, useRef } from "react";
import * as d3 from "d3";

// ── mock data for the force graph ──────────────────────────────────
const nodes = [
  { id: "RELIANCE",  label: "Reliance",   type: "both",   exposure: 92000 },
  { id: "HDFCBANK",  label: "HDFC Bank",  type: "both",   exposure: 67000 },
  { id: "INFY",      label: "Infosys",    type: "both",   exposure: 60000 },
  { id: "DLF",       label: "DLF",        type: "direct", exposure: 50000 },
  { id: "ITC",       label: "ITC",        type: "mf",     exposure: 35000 },
  { id: "KOTAKBANK", label: "Kotak Bank", type: "mf",     exposure: 28000 },
  { id: "HCLTECH",   label: "HCL Tech",   type: "mf",     exposure: 22000 },
  { id: "MIRAE",     label: "Mirae MF",   type: "fund",   exposure: 80000 },
  { id: "AXIS",      label: "Axis MF",    type: "fund",   exposure: 60000 },
  { id: "HDFC_MF",   label: "HDFC MF",    type: "fund",   exposure: 45000 },
  { id: "SBI_MF",    label: "SBI MF",     type: "fund",   exposure: 35000 },
];

const links = [
  { source: "RELIANCE",  target: "MIRAE",   weight: 9.2, overlap: true  },
  { source: "RELIANCE",  target: "AXIS",    weight: 7.1, overlap: true  },
  { source: "RELIANCE",  target: "HDFC_MF", weight: 6.8, overlap: true  },
  { source: "HDFCBANK",  target: "MIRAE",   weight: 8.1, overlap: true  },
  { source: "HDFCBANK",  target: "SBI_MF",  weight: 5.2, overlap: true  },
  { source: "INFY",      target: "AXIS",    weight: 6.3, overlap: true  },
  { source: "INFY",      target: "MIRAE",   weight: 4.1, overlap: false },
  { source: "ITC",       target: "MIRAE",   weight: 3.2, overlap: false },
  { source: "ITC",       target: "HDFC_MF", weight: 2.9, overlap: false },
  { source: "KOTAKBANK", target: "AXIS",    weight: 4.5, overlap: false },
  { source: "HCLTECH",   target: "SBI_MF",  weight: 3.8, overlap: false },
];

const typeColor: Record<string, string> = {
  both:   "#ef4444",
  direct: "#3b82f6",
  mf:     "#22c55e",
  fund:   "#8b5cf6",
};
const typeLabel: Record<string, string> = {
  both:   "Direct + MF (Overlap)",
  direct: "Direct holding",
  mf:     "MF holding only",
  fund:   "Your Fund",
};

export default function OverlapPage() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const el = svgRef.current;
    const W = el.clientWidth || 720;
    const H = 440;

    d3.select(el).selectAll("*").remove();

    const svg = d3.select(el)
      .attr("viewBox", `0 0 ${W} ${H}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const sim = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links as any).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-280))
      .force("center", d3.forceCenter(W / 2, H / 2))
      .force("collision", d3.forceCollide(36));

    // Edges
    const link = svg.append("g").selectAll("line")
      .data(links)
      .enter().append("line")
      .attr("stroke", (d) => d.overlap ? "#ef4444" : "#d1d5db")
      .attr("stroke-width", (d) => Math.max(1, d.weight / 2.5))
      .attr("stroke-opacity", 0.7);

    // Edge labels (weight %)
    const edgeLabel = svg.append("g").selectAll("text")
      .data(links.filter(l => l.overlap))
      .enter().append("text")
      .attr("font-size", "9px")
      .attr("fill", "#ef4444")
      .attr("font-family", "JetBrains Mono, monospace")
      .text((d) => `${d.weight}%`);

    // Nodes
    const node = svg.append("g").selectAll("g")
      .data(nodes)
      .enter().append("g")
      .style("cursor", "pointer")
      .call(
        d3.drag<any, any>()
          .on("start", (event, d) => {
            if (!event.active) sim.alphaTarget(0.3).restart();
            d.fx = d.x; d.fy = d.y;
          })
          .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
          .on("end", (event, d) => {
            if (!event.active) sim.alphaTarget(0);
            d.fx = null; d.fy = null;
          })
      );

    node.append("circle")
      .attr("r", (d: any) => Math.max(14, Math.sqrt(d.exposure / 800)))
      .attr("fill", (d: any) => typeColor[d.type])
      .attr("fill-opacity", 0.18)
      .attr("stroke", (d: any) => typeColor[d.type])
      .attr("stroke-width", (d: any) => d.type === "both" ? 2.5 : 1.5);

    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("font-size", "10px")
      .attr("font-weight", "600")
      .attr("fill", (d: any) => typeColor[d.type])
      .attr("font-family", "Inter, sans-serif")
      .text((d: any) => d.label);

    sim.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x).attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x).attr("y2", (d: any) => d.target.y);

      edgeLabel
        .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
        .attr("y", (d: any) => (d.source.y + d.target.y) / 2);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => { sim.stop(); };
  }, []);

  const overlaps = [
    { stock: "Reliance Industries", pct: "18.4%", amount: "₹92,000", funds: "3 funds + direct" },
    { stock: "HDFC Bank",           pct: "13.4%", amount: "₹67,000", funds: "2 funds + direct" },
    { stock: "Infosys",             pct: "12.0%", amount: "₹60,000", funds: "2 funds + direct" },
  ];

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cross-Asset Overlap</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            You think you're diversified. Here's where your exposure is actually concentrated.
          </p>
        </div>

        {/* Graph */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">Portfolio Network — Drag nodes to explore</p>
            {/* Legend */}
            <div className="flex items-center gap-3 text-xs">
              {Object.entries(typeLabel).map(([k, v]) => (
                <span key={k} className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: typeColor[k] }} />
                  <span className="text-gray-500">{v}</span>
                </span>
              ))}
            </div>
          </div>
          <svg ref={svgRef} className="w-full" style={{ height: 440 }} />
        </div>

        {/* Concentration alerts */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Top Overlaps (Risk)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {overlaps.map((o, i) => (
              <div key={o.stock} className={`card p-4 border-l-4 ${i === 0 ? "border-l-red-400 bg-red-50" : "border-l-amber-400 bg-amber-50"}`}>
                <p className="text-sm font-bold text-gray-900">{o.stock}</p>
                <p className="text-2xl font-bold mono mt-1" style={{ color: i === 0 ? "#dc2626" : "#d97706" }}>{o.pct}</p>
                <p className="text-xs text-gray-500 mt-1">of total portfolio</p>
                <p className="text-xs text-gray-600 mt-2">{o.amount} across {o.funds}</p>
                {parseFloat(o.pct) > 15 && (
                  <p className="text-xs text-red-600 font-medium mt-2">⚠ Over 15% threshold — reduce exposure</p>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </AppShell>
  );
}
