"use client";

import * as React from "react";
import { Database, CheckCircle2, AlertTriangle, Clock, Search } from "lucide-react";
import { KpiCard } from "@/components/dashboards/shared/kit";

export interface FieldStat { label: string; key: string; fillPct: number; filled: number; blanks: number }
export interface RegisterHygiene { key: string; label: string; total: number; overallPct: number; fields: FieldStat[] }

// On-brand thresholds (green good, blue ok, amber needs-attention).
function tone(pct: number): { from: string; to: string; text: string; chip: string } {
  if (pct >= 80) return { from: "#63b81e", to: "#4a9616", text: "#3f7a14", chip: "bg-green-100 text-green-700" };
  if (pct >= 50) return { from: "#0180cf", to: "#0069b3", text: "#0069b3", chip: "bg-sky-100 text-sky-700" };
  return { from: "#f59e0b", to: "#d97706", text: "#b45309", chip: "bg-amber-100 text-amber-700" };
}

/** Spreadsheet-style column letter for a 0-based index (A, B … Z, AA, AB …). */
function colLetter(i: number): string {
  let n = i + 1, s = "";
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

function RegisterCard({ reg, needle }: { reg: RegisterHygiene; needle: string }) {
  const t = tone(reg.overallPct);
  const fields = reg.fields
    .map((f, i) => ({ ...f, col: colLetter(i) }))
    .filter((f) => !needle || f.label.toLowerCase().includes(needle) || f.col.toLowerCase() === needle);
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_26px_-22px_rgba(1,128,207,0.5)]">
      {/* card header */}
      <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 text-white" style={{ background: `linear-gradient(120deg, ${t.from}, ${t.to})` }}>
        <span className="truncate text-[13px] font-black uppercase tracking-[0.06em]" title={reg.label}>{reg.label}</span>
        <span className="flex shrink-0 items-center gap-2">
          <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-[11px] font-bold tabular-nums ring-1 ring-white/30">{reg.total.toLocaleString("en-IN")} rec</span>
          <span className="tabular-nums text-[15px] font-black">{reg.overallPct}%</span>
        </span>
      </div>
      {/* field table */}
      <div className="max-h-[360px] overflow-auto">
        <table className="w-full text-[11.5px]">
          <thead className="sticky top-0 z-10 bg-[#f1f5f9]">
            <tr className="text-left text-[9.5px] font-extrabold uppercase tracking-[0.05em] text-slate-500">
              <th className="px-2 py-1.5">Col</th><th className="px-2 py-1.5">Field Name</th><th className="px-2 py-1.5 text-center">Blanks</th><th className="px-2 py-1.5 text-right">Fill %</th>
            </tr>
          </thead>
          <tbody>
            {fields.length === 0 ? (
              <tr><td colSpan={4} className="px-3 py-6 text-center text-[12px] text-slate-400">{reg.total === 0 ? "No records yet." : "No fields match."}</td></tr>
            ) : fields.map((f, i) => {
              const ft = tone(f.fillPct);
              return (
                <tr key={f.key} className={i % 2 ? "bg-[#f8fbfe]" : "bg-white"}>
                  <td className="border-b border-slate-100 px-2 py-1 font-bold text-slate-400 tabular-nums">{f.col}</td>
                  <td className="border-b border-slate-100 px-2 py-1 font-semibold text-slate-700"><span className="line-clamp-1" title={f.label}>{f.label}</span></td>
                  <td className="border-b border-slate-100 px-2 py-1 text-center tabular-nums text-slate-500">{f.blanks || "—"}</td>
                  <td className="border-b border-slate-100 px-2 py-1 text-right"><span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10.5px] font-black tabular-nums ${ft.chip}`}>{f.fillPct}%</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function HygieneDashboard({ registers, lastUpdated, missing = [] }: { registers: RegisterHygiene[]; lastUpdated?: string; missing?: string[] }) {
  const [q, setQ] = React.useState("");
  const needle = q.trim().toLowerCase();
  const withRows = registers.filter((r) => r.total > 0);

  const k = React.useMemo(() => {
    const totalRecords = registers.reduce((s, r) => s + r.total, 0);
    const overall = totalRecords ? Math.round(registers.reduce((s, r) => s + r.overallPct * r.total, 0) / totalRecords) : 0;
    let complete = 0, attention = 0;
    for (const r of withRows) for (const f of r.fields) { if (f.fillPct >= 100) complete++; else if (f.fillPct < 50) attention++; }
    return { totalRecords, overall, complete, attention };
  }, [registers, withRows]);

  return (
    <div className="space-y-4">
      {/* Last updated + field search */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
        <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-500"><Clock size={13} /> Last updated: <b className="text-slate-700">{lastUpdated ?? "—"}</b></span>
        <div className="relative ml-auto">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a field across registers…" className="h-9 w-[240px] max-w-[55vw] rounded-lg border border-slate-200 bg-white pl-8 pr-2.5 text-[13px] outline-none focus:border-[#0180cf]" />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
        <KpiCard label="Total Records" value={k.totalRecords} blurb="Across all registers" Icon={Database} from="#0180cf" to="#0069b3" />
        <KpiCard label="Overall Completeness" value={k.overall} suffix="%" blurb="Fields filled" Icon={CheckCircle2} from="#0a7d8a" to="#0069b3" />
        <KpiCard label="Complete Fields" value={k.complete} blurb="100% filled" Icon={CheckCircle2} from="#63b81e" to="#3f7a14" />
        <KpiCard label="Needs Attention" value={k.attention} blurb="Under 50% filled" Icon={AlertTriangle} from="#f59e0b" to="#d97706" />
      </div>

      {/* Per-register hygiene tables (Col · Field Name · Blanks · Fill %) */}
      <div className="grid grid-cols-3 gap-4 max-lg:grid-cols-2 max-md:grid-cols-1">
        {registers.map((r) => <RegisterCard key={r.key} reg={r} needle={needle} />)}
      </div>

      {missing.length > 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white/70 px-3 py-2 text-[11.5px] font-medium text-slate-400">
          Not shown — no register/table in the system yet: {missing.join(", ")}.
        </p>
      )}
    </div>
  );
}
