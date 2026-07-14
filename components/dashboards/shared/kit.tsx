"use client";

import * as React from "react";
import { ArrowRight, X, Lightbulb, type LucideIcon } from "lucide-react";
import { useCountUp } from "@/lib/use-count-up";

export const inr = (v: number) => "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(v || 0));
export function compactInr(v: number): string {
  const n = Math.round(v || 0);
  if (n >= 1e7) return "₹" + (n / 1e7).toFixed(2) + " Cr";
  if (n >= 1e5) return "₹" + (n / 1e5).toFixed(2) + " L";
  if (n >= 1e3) return "₹" + (n / 1e3).toFixed(1) + "K";
  return "₹" + n;
}

/** Animated KPI card with a View Details button. Pass `display` for a
 *  pre-formatted value (currency), or `value` to count up a plain number. */
export function KpiCard({ label, value, display, suffix, blurb, Icon, from, to, onDetails }: {
  label: string; value?: number; display?: string; suffix?: string; blurb: string;
  Icon: LucideIcon; from: string; to: string; onDetails?: () => void;
}) {
  const v = useCountUp(value ?? 0, 900);
  return (
    <div className="group relative overflow-hidden rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      <span aria-hidden className="absolute inset-x-0 top-0 h-1.5" style={{ background: `linear-gradient(90deg, ${from}, ${to})` }} />
      <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1/2 -translate-x-[200%] -skew-x-12 bg-gradient-to-r from-transparent via-slate-100/70 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[260%]" />
      <Icon aria-hidden className="pointer-events-none absolute -bottom-6 -right-5" size={120} strokeWidth={1.3} style={{ color: to, opacity: 0.07 }} />
      <div className="relative flex items-start justify-between">
        <div className="min-w-0">
          <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-slate-400">{label}</div>
          <div className="mt-1.5 truncate tabular-nums text-slate-900" style={{ fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 900, fontSize: display ? "clamp(24px, 2.8vw, 34px)" : "clamp(32px, 4vw, 44px)", letterSpacing: "-0.03em", lineHeight: 1 }}>
            {display ?? v}{suffix}
          </div>
          <div className="mt-0.5 text-[12.5px] font-medium text-slate-500">{blurb}</div>
        </div>
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg transition-transform duration-300 group-hover:scale-105" style={{ background: `linear-gradient(135deg, ${from}, ${to})`, boxShadow: `0 12px 26px -12px ${to}` }}>
          <Icon size={22} strokeWidth={2.2} />
        </span>
      </div>
      {onDetails && (
        <button type="button" onClick={onDetails} className="relative mt-4 inline-flex h-9 items-center gap-1.5 rounded-xl px-3.5 text-[13px] font-extrabold text-white shadow-md transition-all hover:-translate-y-0.5" style={{ background: `linear-gradient(135deg, ${from}, ${to})`, boxShadow: `0 10px 22px -10px ${to}` }}>
          View Details <ArrowRight size={14} strokeWidth={2.7} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      )}
    </div>
  );
}

export function Section({ title, Icon, children, className = "" }: { title: string; Icon?: LucideIcon; children: React.ReactNode; className?: string }) {
  return (
    <section className={`relative overflow-hidden rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <span aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.45]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(1,128,207,0.05) 1px, transparent 0)", backgroundSize: "24px 24px" }} />
      <h2 className="relative mb-4 flex items-center gap-2 text-[15px] font-black text-slate-800" style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}>
        {Icon && <Icon size={16} className="text-[#0069b3]" />} {title}
      </h2>
      <div className="relative">{children}</div>
    </section>
  );
}

/** Vertical bar chart (monthly trends). */
export function TrendBars({ data, format }: { data: { label: string; value: number }[]; format?: (v: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (data.length === 0) return <p className="py-8 text-center text-[13px] text-slate-400">No data in range.</p>;
  return (
    <div className="flex h-44 items-end gap-3">
      {data.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
          <span className="text-[11.5px] font-black tabular-nums text-slate-700">{format ? format(d.value) : d.value}</span>
          <div className="w-full rounded-t-lg transition-all" style={{ height: `${(d.value / max) * 100}%`, minHeight: 6, background: "linear-gradient(180deg, #63b81e, #0180cf)" }} />
          <span className="text-[10.5px] font-semibold text-slate-400">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/** Horizontal breakdown bars. */
export function StatusBars({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (data.length === 0) return <p className="py-6 text-center text-[13px] text-slate-400">No data.</p>;
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.label}>
          <div className="mb-1 flex items-center justify-between text-[12.5px] font-semibold text-slate-600">
            <span className="truncate">{d.label}</span>
            <span className="tabular-nums font-black text-slate-800">{d.value}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full" style={{ width: `${Math.max(5, (d.value / max) * 100)}%`, background: "linear-gradient(90deg, #63b81e, #0180cf)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function InsightsPanel({ items }: { items: string[] }) {
  return (
    <section className="relative overflow-hidden rounded-[22px] border border-slate-200 p-5 shadow-sm" style={{ background: "linear-gradient(135deg, #eef6ec, #f4fbf6)" }}>
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.5]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(99,184,30,0.08) 1px, transparent 0)", backgroundSize: "20px 20px" }} />
      <h2 className="relative mb-3 flex items-center gap-2 text-[15px] font-black text-slate-800" style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}><Lightbulb size={16} className="text-[#3f7a14]" /> Insights</h2>
      <ul className="relative space-y-2.5">
        {items.map((t, i) => (
          <li key={i} className="flex items-start gap-2 text-[13px] font-medium text-slate-700"><span className="mt-1.5 inline-block size-1.5 shrink-0 rounded-full bg-[#63b81e]" /> {t}</li>
        ))}
      </ul>
    </section>
  );
}

/** Generic themed modal shell used by the KPI View Details popups. */
export function DetailModal({ title, subtitle, Icon, from, to, onClose, children }: {
  title: string; subtitle?: string; Icon: LucideIcon; from: string; to: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex max-h-[90vh] w-[min(780px,96vw)] flex-col overflow-hidden rounded-2xl border border-white/70 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <header className="relative overflow-hidden px-6 py-4 text-white" style={{ background: `linear-gradient(120deg, ${from}, ${to} 70%, #63b81e)` }}>
          <span aria-hidden className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.25) 1px, transparent 0)", backgroundSize: "18px 18px" }} />
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/30"><Icon size={20} /></span>
              <div>
                <div className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-white/80">Details</div>
                <div className="text-[18px] font-black tracking-[-0.01em]">{title}</div>
                {subtitle && <div className="text-[12px] text-white/85">{subtitle}</div>}
              </div>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-white/85 hover:bg-white/20"><X size={18} /></button>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

/** Conversion funnel — each stage a shrinking bar, with stage-to-stage %. */
export function Funnel({ stages }: { stages: { label: string; value: number }[] }) {
  const max = Math.max(1, ...stages.map((s) => s.value));
  return (
    <div className="space-y-2">
      {stages.map((s, i) => {
        const prev = i > 0 ? stages[i - 1]!.value : 0;
        const conv = i > 0 && prev ? Math.round((s.value / prev) * 100) : null;
        return (
          <div key={s.label} className="flex items-center gap-3">
            <div className="w-28 shrink-0 truncate text-right text-[12px] font-semibold text-slate-600" title={s.label}>{s.label}</div>
            <div className="relative h-8 flex-1 overflow-hidden rounded-lg bg-slate-100">
              <div className="flex h-full min-w-[34px] items-center rounded-lg px-2.5 text-[12px] font-black text-white transition-all" style={{ width: `${Math.max(9, (s.value / max) * 100)}%`, background: "linear-gradient(90deg, #63b81e, #0180cf)" }}>{s.value}</div>
            </div>
            <div className="w-10 shrink-0 text-[11px] font-bold text-slate-400">{conv != null ? `${conv}%` : ""}</div>
          </div>
        );
      })}
    </div>
  );
}

/** Progress bar with done/total and %. */
export function ProgressStat({ label, done, total, from = "#63b81e", to = "#0180cf" }: { label: string; done: number; total: number; from?: string; to?: string }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[12.5px] font-semibold text-slate-600"><span>{label}</span><span className="tabular-nums font-black text-slate-800">{done}/{total} · {pct}%</span></div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${from}, ${to})` }} /></div>
    </div>
  );
}

/** Horizontal workflow timeline with gradient connectors. */
export function WorkflowTimeline({ stages, icons }: { stages: { label: string; count: number }[]; icons: LucideIcon[] }) {
  return (
    <div className="flex items-start justify-between gap-2 max-md:flex-col max-md:gap-4">
      {stages.map((s, i) => {
        const Icon = icons[i] ?? icons[0]!;
        return (
          <React.Fragment key={s.label}>
            <div className="flex flex-1 flex-col items-center text-center max-md:w-full max-md:flex-row max-md:gap-3 max-md:text-left">
              <span className="inline-flex size-11 items-center justify-center rounded-2xl text-white shadow-lg" style={{ background: "linear-gradient(135deg, #63b81e, #0180cf)", boxShadow: "0 12px 26px -12px #0069b3" }}><Icon size={20} strokeWidth={2.2} /></span>
              <div className="max-md:flex max-md:items-baseline max-md:gap-2">
                <div className="mt-1.5 text-[20px] font-black tabular-nums text-slate-800 max-md:mt-0" style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}>{s.count}</div>
                <div className="text-[11px] font-bold text-slate-500">{s.label}</div>
              </div>
            </div>
            {i < stages.length - 1 && <div className="mt-5 flex-1 max-md:hidden"><div className="h-[3px] w-full rounded-full" style={{ background: "linear-gradient(90deg, #63b81e, #0180cf)", opacity: 0.35 }} /></div>}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function downloadBlob(content: BlobPart, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

/** Export the given rows to CSV or Excel. */
export function ExportButtons({ filename, headers, rows }: { filename: string; headers: string[]; rows: (string | number)[][] }) {
  function csv() {
    const esc = (v: string | number) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const content = "﻿" + [headers, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
    downloadBlob(content, `${filename}.csv`, "text/csv;charset=utf-8");
  }
  async function excel() {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = headers.map((h) => ({ wch: Math.min(40, Math.max(10, h.length + 4)) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Export");
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={excel} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#63b81e]/40 bg-[#63b81e]/10 px-3 text-[12.5px] font-bold text-[#3f7a14] transition-all hover:-translate-y-0.5">Excel</button>
      <button type="button" onClick={csv} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[12.5px] font-bold text-slate-600 transition-all hover:-translate-y-0.5 hover:bg-slate-50">CSV</button>
    </div>
  );
}

export function SummaryTile({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5">
      <div className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.05em] text-slate-400"><Icon size={12} className="text-[#0069b3]" /> {label}</div>
      <div className="mt-0.5 text-[16px] font-black tabular-nums text-slate-800" style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}>{value}</div>
    </div>
  );
}
