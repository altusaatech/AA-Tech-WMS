"use client";

import * as React from "react";
import {
  HeartPulse, Database, CheckCircle2, AlertTriangle, Layers, Gauge as GaugeIcon,
  ListChecks, ArrowUpDown, Search,
} from "lucide-react";
import { KpiCard, Section, Gauge, InsightsPanel } from "@/components/dashboards/shared/kit";

export interface FieldStat { label: string; key: string; fillPct: number; filled: number; blanks: number }
export interface RegisterHygiene { key: string; label: string; total: number; overallPct: number; fields: FieldStat[] }

// On-brand thresholds (green good, blue ok, amber needs-attention — no red per theme).
function tone(pct: number): { from: string; to: string; text: string } {
  if (pct >= 80) return { from: "#63b81e", to: "#4a9616", text: "#3f7a14" };
  if (pct >= 50) return { from: "#0180cf", to: "#0069b3", text: "#0069b3" };
  return { from: "#f59e0b", to: "#d97706", text: "#b45309" };
}

export function HygieneDashboard({ registers }: { registers: RegisterHygiene[] }) {
  const withRows = registers.filter((r) => r.total > 0);
  const [sel, setSel] = React.useState(withRows[0]?.key ?? registers[0]?.key ?? "");
  const [q, setQ] = React.useState("");
  const [worstFirst, setWorstFirst] = React.useState(true);
  const active = registers.find((r) => r.key === sel) ?? registers[0]!;

  const k = React.useMemo(() => {
    const totalRecords = registers.reduce((s, r) => s + r.total, 0);
    const overall = totalRecords ? Math.round(registers.reduce((s, r) => s + r.overallPct * r.total, 0) / totalRecords) : 0;
    let complete = 0, attention = 0;
    for (const r of withRows) {
      for (const f of r.fields) {
        if (f.fillPct >= 100) complete++;
        else if (f.fillPct < 50) attention++;
      }
    }
    return { totalRecords, overall, complete, attention };
  }, [registers, withRows]);

  const fields = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    let f = active.fields.filter((x) => !needle || x.label.toLowerCase().includes(needle));
    f = [...f].sort((a, b) => (worstFirst ? a.fillPct - b.fillPct : b.fillPct - a.fillPct));
    return f;
  }, [active, q, worstFirst]);

  const insights = React.useMemo(() => {
    const out: string[] = [];
    if (k.totalRecords) out.push(`${k.totalRecords.toLocaleString("en-IN")} records tracked across ${withRows.length} register${withRows.length === 1 ? "" : "s"} — ${k.overall}% overall completeness.`);
    const ranked = [...withRows].sort((a, b) => b.overallPct - a.overallPct);
    if (ranked.length) out.push(`Cleanest: ${ranked[0]!.label} (${ranked[0]!.overallPct}%) · needs work: ${ranked[ranked.length - 1]!.label} (${ranked[ranked.length - 1]!.overallPct}%).`);
    const worst = active.fields.filter((f) => f.blanks > 0).sort((a, b) => a.fillPct - b.fillPct).slice(0, 3);
    if (worst.length) out.push(`${active.label}: fill in “${worst.map((w) => w.label).join("”, “")}” — ${worst[0]!.blanks} blank in the worst.`);
    if (k.attention) out.push(`${k.attention} field${k.attention === 1 ? "" : "s"} under 50% filled across all registers.`);
    if (out.length === 0) out.push("No records yet — import data into the registers to see completeness.");
    return out;
  }, [k, withRows, active]);

  return (
    <div className="mt-6 space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
        <KpiCard label="Total Records" value={k.totalRecords} blurb="Across all registers" Icon={Database} from="#0180cf" to="#0069b3" />
        <KpiCard label="Overall Completeness" value={k.overall} suffix="%" blurb="Fields filled" Icon={GaugeIcon} from="#0a7d8a" to="#0069b3" />
        <KpiCard label="Complete Fields" value={k.complete} blurb="100% filled" Icon={CheckCircle2} from="#63b81e" to="#3f7a14" />
        <KpiCard label="Needs Attention" value={k.attention} blurb="Under 50% filled" Icon={AlertTriangle} from="#f59e0b" to="#d97706" />
      </div>

      {/* completeness by register — clickable */}
      <Section title="Completeness by Register" Icon={Layers}>
        <div className="grid grid-cols-5 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {registers.map((r) => {
            const t = tone(r.overallPct);
            const on = r.key === sel;
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => r.total > 0 && setSel(r.key)}
                disabled={r.total === 0}
                className={`group relative overflow-hidden rounded-2xl border p-3.5 text-left transition-all ${on ? "border-transparent shadow-md" : "border-slate-200 bg-white hover:-translate-y-0.5 hover:shadow-sm"} ${r.total === 0 ? "cursor-not-allowed opacity-55" : ""}`}
                style={on ? { background: `linear-gradient(135deg, ${t.from}, ${t.to})`, boxShadow: `0 14px 30px -14px ${t.to}` } : undefined}
              >
                {on && <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />}
                <div className={`relative text-[12px] font-black uppercase tracking-[0.04em] ${on ? "text-white/85" : "text-slate-400"}`}>{r.label}</div>
                <div className={`relative mt-1 tabular-nums ${on ? "text-white" : "text-slate-900"}`} style={{ fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 900, fontSize: 30, lineHeight: 1 }}>{r.overallPct}%</div>
                <div className={`relative mt-0.5 text-[11.5px] font-semibold ${on ? "text-white/80" : "text-slate-400"}`}>{r.total.toLocaleString("en-IN")} record{r.total === 1 ? "" : "s"}</div>
                <div className={`relative mt-2 h-1.5 w-full overflow-hidden rounded-full ${on ? "bg-white/25" : "bg-slate-100"}`}>
                  <div className="h-full rounded-full" style={{ width: `${Math.max(4, r.overallPct)}%`, background: on ? "rgba(255,255,255,0.9)" : `linear-gradient(90deg, ${t.from}, ${t.to})` }} />
                </div>
              </button>
            );
          })}
        </div>
      </Section>

      {/* selected register detail */}
      <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-1">
        <Section title={`${active.label} · Health`} Icon={HeartPulse}>
          <div className="flex flex-col items-center gap-3">
            <Gauge pct={active.overallPct} label="Completeness" sub={`${active.total.toLocaleString("en-IN")} records`} from={tone(active.overallPct).from} to={tone(active.overallPct).to} />
            <div className="grid w-full grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-center">
                <div className="text-[11px] font-bold uppercase tracking-[0.05em] text-slate-400">Fields</div>
                <div className="text-[18px] font-black tabular-nums text-slate-800">{active.fields.length}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-center">
                <div className="text-[11px] font-bold uppercase tracking-[0.05em] text-slate-400">100% Full</div>
                <div className="text-[18px] font-black tabular-nums text-slate-800">{active.fields.filter((f) => f.fillPct >= 100).length}</div>
              </div>
            </div>
          </div>
        </Section>

        <div className="col-span-2 max-lg:col-span-1">
          <Section title={`${active.label} · Field Completeness`} Icon={ListChecks}>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <div className="relative"><Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a field…" className="h-9 w-[200px] max-w-[50vw] rounded-lg border border-slate-200 bg-white pl-8 pr-2.5 text-[13px] outline-none focus:border-[#0180cf]" /></div>
              <button type="button" onClick={() => setWorstFirst((v) => !v)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[12.5px] font-bold text-slate-600 hover:bg-slate-50"><ArrowUpDown size={14} /> {worstFirst ? "Worst first" : "Best first"}</button>
              <span className="ml-auto text-[12px] font-semibold text-slate-400">{fields.length} fields</span>
            </div>
            <div className="max-h-[420px] space-y-2.5 overflow-y-auto pr-1">
              {fields.map((f) => {
                const t = tone(f.fillPct);
                return (
                  <div key={f.key}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-[12.5px]">
                      <span className="truncate font-bold text-slate-600" title={f.label}>{f.label}</span>
                      <span className="shrink-0 tabular-nums font-black" style={{ color: t.text }}>{f.fillPct}%<span className="ml-1.5 font-semibold text-slate-400">{f.blanks ? `${f.blanks} blank` : "✓"}</span></span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100" style={{ boxShadow: "inset 0 1px 2px rgba(15,23,42,0.09)" }}>
                      <div className="relative h-full rounded-full transition-[width] duration-700" style={{ width: `${Math.max(3, f.fillPct)}%`, background: `linear-gradient(90deg, ${t.from}, ${t.to})`, boxShadow: `0 1px 5px -1px ${t.to}88` }}>
                        <span aria-hidden className="absolute inset-x-0 top-0 h-1/2 rounded-full bg-white/30" />
                      </div>
                    </div>
                  </div>
                );
              })}
              {fields.length === 0 && <p className="py-6 text-center text-[13px] text-slate-400">No fields match “{q}”.</p>}
            </div>
          </Section>
        </div>
      </div>

      <InsightsPanel items={insights} />
    </div>
  );
}
