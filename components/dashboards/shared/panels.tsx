"use client";

import * as React from "react";
import { Building2, type LucideIcon } from "lucide-react";
import { compactInr } from "@/components/dashboards/shared/kit";

export const inr = (v: number) => "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(v || 0));
export const PIE_COLORS = ["#2a78d6", "#63b81e", "#f59e0b", "#7c3aed", "#0a7d8a", "#e87ba4", "#eb6834", "#94a3b8"];
export const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function daysSince(dateStr: string): number | null {
  if (!dateStr) return null;
  const t = new Date(dateStr + "T00:00:00Z").getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.round((Date.now() - t) / 86400_000));
}

/* ── KPI card: big count on top, its value beneath ── */
export function KpiCombo({ label, count, subLabel, subValue, Icon, from, to, onClick }: {
  label: string; count: number | string; subLabel: string; subValue?: string; Icon: LucideIcon; from: string; to: string; onClick?: () => void;
}) {
  return (
    <div onClick={onClick} className={`group relative overflow-hidden rounded-[20px] border border-slate-200/80 bg-gradient-to-br from-white to-[#f6fafd] p-4 shadow-[0_14px_34px_-24px_rgba(1,128,207,0.4)] transition-all duration-300 hover:-translate-y-1 ${onClick ? "cursor-pointer" : ""}`}>
      <span aria-hidden className="absolute inset-x-0 top-0 h-1.5" style={{ background: `linear-gradient(90deg, ${from}, ${to})` }} />
      <div className="flex items-center gap-2">
        <span className="relative inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl text-white shadow" style={{ background: `linear-gradient(140deg, ${from}, ${to})` }}>
          <span aria-hidden className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent" />
          <Icon size={17} strokeWidth={2.3} className="relative" />
        </span>
        <span className="min-w-0 truncate text-[11px] font-black uppercase tracking-[0.04em] text-slate-400">{label}</span>
      </div>
      <div className="mt-2 tabular-nums text-slate-900" style={{ fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 900, fontSize: "clamp(24px, 2.6vw, 32px)", lineHeight: 1 }}>{count}</div>
      <div className="mt-2 flex items-center justify-between gap-1 border-t border-slate-100 pt-2">
        <span className="truncate text-[10.5px] font-bold uppercase tracking-[0.03em] text-slate-400">{subLabel}</span>
        {subValue && <span className="shrink-0 text-[13px] font-black tabular-nums text-[#0069b3]">{subValue}</span>}
      </div>
    </div>
  );
}

/* ── ordered pie chart with legend (%, sums to 100%) ── */
function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}
export function PieChart({ data, centerCaption }: { data: { label: string; value: number }[]; centerCaption?: string }) {
  const clean = data.filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
  if (clean.length === 0) return <p className="py-8 text-center text-[13px] text-slate-400">No data.</p>;
  const top = clean.slice(0, 7);
  const rest = clean.slice(7);
  const items = rest.length ? [...top, { label: "Other", value: rest.reduce((s, x) => s + x.value, 0) }] : top;
  const total = items.reduce((s, x) => s + x.value, 0);
  let acc = 0;
  const cx = 70, cy = 70, r = 66;
  return (
    <div className="flex items-center gap-4 max-sm:flex-col">
      <svg viewBox="0 0 140 140" className="w-[164px] shrink-0">
        {items.map((it, i) => {
          const start = (acc / total) * 360; acc += it.value; const end = (acc / total) * 360;
          const [x1, y1] = polar(cx, cy, r, start); const [x2, y2] = polar(cx, cy, r, end);
          const large = end - start > 180 ? 1 : 0;
          const d = it.value / total >= 0.9999 ? `M${cx - r} ${cy} A${r} ${r} 0 1 1 ${cx + r} ${cy} A${r} ${r} 0 1 1 ${cx - r} ${cy} Z` : `M${cx} ${cy} L${x1.toFixed(2)} ${y1.toFixed(2)} A${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
          return <path key={i} d={d} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="#fff" strokeWidth="1.5"><title>{`${it.label}: ${it.value} (${Math.round((it.value / total) * 100)}%)`}</title></path>;
        })}
      </svg>
      <ul className="min-w-0 flex-1 space-y-1.5">
        {centerCaption && <li className="mb-1 text-[11px] font-black uppercase tracking-wide text-slate-400">{centerCaption}: {total}</li>}
        {items.map((it, i) => (
          <li key={i} className="flex items-center justify-between gap-2 text-[12.5px]">
            <span className="flex min-w-0 items-center gap-2"><span className="size-2.5 shrink-0 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} /><span className="truncate font-semibold text-slate-600" title={it.label}>{it.label}</span></span>
            <span className="shrink-0 tabular-nums font-black text-slate-800">{it.value} <span className="font-semibold text-slate-400">{Math.round((it.value / total) * 100)}%</span></span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── interactive column chart (hover tooltip + click) ── */
export interface Bucket<T> { key: string; label: string; rows: T[] }
export function TrendColumns<T>({ data, valueOf, onSelect, unit = "orders" }: { data: Bucket<T>[]; valueOf: (r: T) => number; onSelect: (b: Bucket<T>) => void; unit?: string }) {
  const [hi, setHi] = React.useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.rows.length));
  return (
    <div className="relative">
      {hi != null && (
        <div className="pointer-events-none absolute -top-1 z-10 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-center shadow-lg" style={{ left: `${((hi + 0.5) / data.length) * 100}%` }}>
          <div className="text-[11px] font-black text-slate-700">{data[hi]!.label}</div>
          <div className="text-[11px] font-bold tabular-nums text-[#0069b3]">{data[hi]!.rows.length} {unit} · {compactInr(data[hi]!.rows.reduce((s, r) => s + valueOf(r), 0))}</div>
        </div>
      )}
      <div className="flex h-52 items-end gap-2 pt-8">
        {data.map((d, i) => {
          const c = d.rows.length;
          return (
            <button key={d.key} type="button" onMouseEnter={() => setHi(i)} onMouseLeave={() => setHi(null)} onClick={() => onSelect(d)} className="flex flex-1 flex-col items-center gap-1 focus:outline-none">
              <span className="text-[10.5px] font-black tabular-nums text-slate-600">{c || ""}</span>
              <div className="w-full max-w-[36px] overflow-hidden rounded-t-md transition-all duration-300" style={{ height: `${(c / max) * 100}%`, minHeight: c ? 6 : 2, background: hi === i ? "linear-gradient(180deg,#0180cf,#0069b3)" : "linear-gradient(180deg,#7ed957,#63b81e)", boxShadow: hi === i ? "0 -4px 14px -2px rgba(1,128,207,0.5)" : undefined }}>
                <span aria-hidden className="block h-1/3 bg-gradient-to-b from-white/40 to-transparent" />
              </div>
              <span className="text-[10px] font-bold text-slate-400">{d.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── grouped 2-series column chart (hover + click) ── */
export interface GBucket<T> { key: string; label: string; a: number; b: number; rows: T[] }
export function GroupedColumns<T>({ data, aLabel, bLabel, onSelect }: { data: GBucket<T>[]; aLabel: string; bLabel: string; onSelect: (b: GBucket<T>) => void }) {
  const [hi, setHi] = React.useState<number | null>(null);
  const max = Math.max(1, ...data.flatMap((d) => [d.a, d.b]));
  return (
    <div>
      <div className="relative">
        {hi != null && (
          <div className="pointer-events-none absolute -top-1 z-10 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-center shadow-lg" style={{ left: `${((hi + 0.5) / data.length) * 100}%` }}>
            <div className="text-[11px] font-black text-slate-700">{data[hi]!.label}</div>
            <div className="text-[11px] font-bold tabular-nums"><span className="text-[#0a7d8a]">{data[hi]!.a} {aLabel.toLowerCase()}</span> · <span className="text-[#3f7a14]">{data[hi]!.b} {bLabel.toLowerCase()}</span></div>
          </div>
        )}
        <div className="flex h-52 items-end gap-2 pt-8">
          {data.map((d, i) => (
            <button key={d.key} type="button" onMouseEnter={() => setHi(i)} onMouseLeave={() => setHi(null)} onClick={() => onSelect(d)} className="flex flex-1 flex-col items-center gap-1 focus:outline-none">
              <div className="flex h-full w-full items-end justify-center gap-1">
                <div className="w-1/2 max-w-[15px] overflow-hidden rounded-t" style={{ height: `${(d.a / max) * 100}%`, minHeight: d.a ? 5 : 2, background: "linear-gradient(180deg,#38bdf8,#0a7d8a)", opacity: hi == null || hi === i ? 1 : 0.55 }} />
                <div className="w-1/2 max-w-[15px] overflow-hidden rounded-t" style={{ height: `${(d.b / max) * 100}%`, minHeight: d.b ? 5 : 2, background: "linear-gradient(180deg,#7ed957,#3f7a14)", opacity: hi == null || hi === i ? 1 : 0.55 }} />
              </div>
              <span className="text-[10px] font-bold text-slate-400">{d.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-4 text-[11.5px] font-semibold text-slate-500">
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: "#0a7d8a" }} /> {aLabel}</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: "#63b81e" }} /> {bLabel}</span>
      </div>
    </div>
  );
}

/* ── aging buckets (>7 … >60), each clickable ── */
export const AGING_BUCKETS = [
  { key: "7", label: "> 7 days", min: 7, max: 15 },
  { key: "15", label: "> 15 days", min: 15, max: 22 },
  { key: "22", label: "> 22 days", min: 22, max: 30 },
  { key: "30", label: "> 30 days", min: 30, max: 45 },
  { key: "45", label: "> 45 days", min: 45, max: 60 },
  { key: "60", label: "> 60 days", min: 60, max: Infinity },
];
const AGE_COLORS = ["#63b81e", "#9acd32", "#f59e0b", "#e0891b", "#d9662e", "#be123c"];
export function AgingChart<T>({ rows, ageOf, onSelect }: { rows: T[]; ageOf: (r: T) => number | null; onSelect: (label: string, rows: T[]) => void }) {
  const buckets = AGING_BUCKETS.map((b, i) => ({ ...b, color: AGE_COLORS[i]!, rows: rows.filter((r) => { const a = ageOf(r); return a != null && a >= b.min && a < b.max; }) }));
  const max = Math.max(1, ...buckets.map((b) => b.rows.length));
  return (
    <div className="space-y-2">
      {buckets.map((b) => (
        <button key={b.key} type="button" onClick={() => onSelect(b.label, b.rows)} disabled={b.rows.length === 0} className="flex w-full items-center gap-3 text-left disabled:cursor-default">
          <span className="w-[74px] shrink-0 text-[12px] font-bold text-slate-600">{b.label}</span>
          <span className="relative h-6 flex-1 overflow-hidden rounded-lg bg-slate-100" style={{ boxShadow: "inset 0 1px 2px rgba(15,23,42,0.08)" }}>
            <span className="absolute inset-y-0 left-0 flex items-center rounded-lg px-2 text-[11px] font-black text-white" style={{ width: `${Math.max(b.rows.length ? 9 : 0, (b.rows.length / max) * 100)}%`, background: `linear-gradient(90deg, ${b.color}, ${b.color}cc)` }}>{b.rows.length || ""}</span>
          </span>
          <span className="w-8 shrink-0 text-right text-[11px] font-bold tabular-nums text-slate-400">{b.rows.length}</span>
        </button>
      ))}
    </div>
  );
}

/* ── ranked list (top customers 1,2,3…). primary = which metric leads. ── */
export function RankedList({ items, onPick, primary = "value" }: { items: { name: string; count: number; value: number }[]; onPick?: (name: string) => void; primary?: "value" | "count" }) {
  if (items.length === 0) return <p className="py-6 text-center text-[13px] text-slate-400">No data.</p>;
  const metric = (it: { count: number; value: number }) => (primary === "count" ? it.count : it.value);
  const max = Math.max(1, ...items.map(metric));
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={it.name} onClick={() => onPick?.(it.name)} className={`flex items-center gap-2.5 rounded-lg px-1 py-0.5 ${onPick ? "cursor-pointer hover:bg-[#0180cf]/6" : ""}`}>
          <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white" style={{ background: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#b45309" : "#cbd5e1" }}>{i + 1}</span>
          <span className="flex min-w-0 flex-1 items-center gap-1.5"><Building2 size={12} className="shrink-0 text-[#0069b3]" /><span className="truncate text-[12.5px] font-bold text-slate-700" title={it.name}>{it.name}</span></span>
          <div className="hidden h-2 w-24 shrink-0 overflow-hidden rounded-full bg-slate-100 sm:block"><div className="h-full rounded-full" style={{ width: `${Math.max(6, (metric(it) / max) * 100)}%`, background: "linear-gradient(90deg,#63b81e,#0180cf)" }} /></div>
          {primary === "count"
            ? <><span className="w-8 shrink-0 text-right text-[13px] font-black tabular-nums text-slate-800">{it.count}</span><span className="w-16 shrink-0 text-right text-[11px] font-semibold tabular-nums text-slate-400">{compactInr(it.value)}</span></>
            : <><span className="w-16 shrink-0 text-right text-[12px] font-black tabular-nums text-slate-700">{compactInr(it.value)}</span><span className="w-8 shrink-0 text-right text-[11px] font-semibold tabular-nums text-slate-400">×{it.count}</span></>}
        </div>
      ))}
    </div>
  );
}
