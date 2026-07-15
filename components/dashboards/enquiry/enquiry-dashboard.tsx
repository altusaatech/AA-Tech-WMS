"use client";

import * as React from "react";
import {
  Inbox, Send, FileCheck2, X, Building2, User, CalendarClock, IndianRupee, Tag,
  ChevronLeft, ChevronRight, FileText,
  Sparkles, Flame, Package, TrendingUp, TrendingDown, Users, Clock, XCircle, ShoppingCart, Filter,
  ReceiptText, Star, type LucideIcon,
} from "lucide-react";
import { useCountUp } from "@/lib/use-count-up";
import { Section, Heatmap, MetricChip, StatusBars } from "@/components/dashboards/shared/kit";

export interface EnquiryRow {
  enquiryNo: string; company: string; person: string; product: string; item: string; amount: number;
  quoteStatus: string; quoteSent: boolean; soCreated: boolean; soNo: string | null; source: string;
  date: string; createdAt: string;
}
export interface Activity { kind: "so" | "po" | "quote" | "enquiry"; title: string; subtitle: string; date: string; amount: number }
export interface WeekBar { label: string; quotations: number; converted: number }

interface Kpis { enquiries: number; quotationsSent: number; soCreated: number; revenue: number }
type KpiKey = "enquiries" | "quotationsSent" | "soCreated";

const inr = (v: number) => "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(v || 0));
function compactInr(v: number): string {
  const n = Math.round(v || 0);
  if (n >= 1e7) return "₹" + (n / 1e7).toFixed(2) + " Cr";
  if (n >= 1e5) return "₹" + (n / 1e5).toFixed(2) + " L";
  if (n >= 1e3) return "₹" + (n / 1e3).toFixed(1) + "K";
  return "₹" + n;
}
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function ago(dateStr: string): string {
  if (!dateStr) return "";
  const then = new Date(dateStr + (dateStr.length <= 10 ? "T00:00:00Z" : "")).getTime();
  const days = Math.round((Date.now() - then) / 86400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  const mo = Math.round(days / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.round(mo / 12)}y ago`;
}

export function EnquiryDashboard({
  rows, kpis, series, deltas, funnel, weekly, activities, initialYear, initialMonth,
}: {
  rows: EnquiryRow[];
  kpis: Kpis;
  series: { enquiries: number[]; quotations: number[]; sales: number[]; revenue: number[] };
  deltas: { enquiries: number; quotations: number; sales: number; revenue: number };
  funnel: { label: string; value: number; from: string; to: string }[];
  weekly: WeekBar[];
  activities: Activity[];
  initialYear: number;
  initialMonth: number;
}) {
  const [modal, setModal] = React.useState<KpiKey | null>(null);

  const KPIS = [
    { key: "enquiries" as const, label: "Total Enquiries", value: kpis.enquiries, display: String(kpis.enquiries), delta: deltas.enquiries, spark: series.enquiries, Icon: Inbox, from: "#2a78d6", to: "#185fa5", filter: (_: EnquiryRow) => true, clickable: true },
    { key: "quotationsSent" as const, label: "Total Quotations", value: kpis.quotationsSent, display: String(kpis.quotationsSent), delta: deltas.quotations, spark: series.quotations, Icon: Send, from: "#63b81e", to: "#4a9616", filter: (r: EnquiryRow) => r.quoteSent, clickable: true },
    { key: "soCreated" as const, label: "Sales Orders", value: kpis.soCreated, display: String(kpis.soCreated), delta: deltas.sales, spark: series.sales, Icon: ShoppingCart, from: "#7c3aed", to: "#6d28d9", filter: (r: EnquiryRow) => r.soCreated, clickable: false },
    { key: "revenue" as const, label: "Total Revenue", value: kpis.revenue, display: compactInr(kpis.revenue), delta: deltas.revenue, spark: series.revenue, Icon: IndianRupee, from: "#f59e0b", to: "#d97706", filter: (_: EnquiryRow) => true, clickable: false },
  ];

  const activeKey = KPIS.find((k) => k.key === modal);
  const modalRows = activeKey ? rows.filter(activeKey.filter) : [];

  const conv = kpis.enquiries ? Math.round((kpis.soCreated / kpis.enquiries) * 100) : 0;
  const soGrowth = deltas.sales;

  return (
    <div className="mt-6 space-y-5">
      {/* ── KPI cards: value + delta + sparkline ── */}
      <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
        {KPIS.map((k) => (
          <StatCard key={k.key} label={k.label} display={k.display} delta={k.delta} spark={k.spark} Icon={k.Icon} from={k.from} to={k.to} onDetails={k.clickable ? () => setModal(k.key as KpiKey) : undefined} />
        ))}
      </div>

      {/* ── funnel · conversion+weekly · activity ── */}
      <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-1">
        <Section title="Enquiry Funnel" Icon={Filter}><FunnelChart stages={funnel} /></Section>

        <Section title="Quotation vs Conversion" Icon={FileCheck2}>
          <div className="flex items-center gap-4 max-sm:flex-col">
            <Donut pct={conv} />
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center gap-4">
                <div><div className="text-[11px] font-bold uppercase tracking-[0.05em] text-slate-400">Quotations</div><div className="text-[20px] font-black tabular-nums text-slate-800" style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}>{kpis.quotationsSent}</div></div>
                <div><div className="text-[11px] font-bold uppercase tracking-[0.05em] text-slate-400">Converted</div><div className="text-[20px] font-black tabular-nums text-[#0069b3]" style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}>{kpis.soCreated}</div></div>
              </div>
              <WeeklyBars data={weekly} />
            </div>
          </div>
        </Section>

        <Section title="Recent Activity" Icon={Clock}><ActivityFeed items={activities} /></Section>
      </div>

      {/* ── celebratory banner ── */}
      <div className="relative flex flex-wrap items-center justify-between gap-3 overflow-hidden rounded-[22px] border border-[#63b81e]/25 px-5 py-4 shadow-sm" style={{ background: "linear-gradient(120deg, #eef6ec, #ffffff 60%, #eaf3fd)" }}>
        <span aria-hidden className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(99,184,30,0.10) 1px, transparent 0)", backgroundSize: "20px 20px" }} />
        <div className="relative flex items-center gap-3">
          <span className="inline-flex size-11 items-center justify-center rounded-2xl text-white shadow-lg" style={{ background: "linear-gradient(135deg, #63b81e, #0180cf)", boxShadow: "0 12px 26px -12px #0069b3" }}><Star size={20} strokeWidth={2.3} /></span>
          <p className="text-[14px] font-bold text-slate-700">
            {soGrowth >= 0
              ? <>Great momentum — <b className="text-[#3f7a14]">{soGrowth}% more</b> sales orders month-on-month, {conv}% of enquiries converted.</>
              : <>{conv}% of enquiries converted to date · {kpis.soCreated} sales orders booked.</>}
          </p>
        </div>
        <span className="relative text-[13px] font-black tabular-nums text-[#0069b3]">{compactInr(kpis.revenue)} order value</span>
      </div>

      {/* ── calendar ── */}
      <EnquiryCalendar rows={rows} initialYear={initialYear} initialMonth={initialMonth} />

      {/* ── advanced: smart business insights ── */}
      <SmartInsights rows={rows} />

      {/* ── KPI detail modal ── */}
      {activeKey && <DetailModal title={activeKey.label} Icon={activeKey.Icon} from={activeKey.from} to={activeKey.to} rows={modalRows} onClose={() => setModal(null)} />}
    </div>
  );
}

/* ── KPI stat card with sparkline + delta ── */
function StatCard({ label, display, delta, spark, Icon, from, to, onDetails }: {
  label: string; display: string; delta: number; spark: number[]; Icon: LucideIcon; from: string; to: string; onDetails?: () => void;
}) {
  const up = delta >= 0;
  return (
    <div
      onClick={onDetails}
      className={`group relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-gradient-to-br from-white to-[#f6fafd] p-5 shadow-[0_16px_40px_-24px_rgba(1,128,207,0.35)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_28px_58px_-28px_rgba(1,128,207,0.5)] ${onDetails ? "cursor-pointer" : ""}`}
    >
      <span aria-hidden className="absolute inset-x-0 top-0 h-1.5" style={{ background: `linear-gradient(90deg, ${from}, ${to})` }} />
      <div className="relative flex items-start justify-between gap-2">
        <span className="relative inline-flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-white shadow-lg transition-transform duration-300 group-hover:scale-105" style={{ background: `linear-gradient(140deg, ${from}, ${to})`, boxShadow: `0 12px 24px -10px ${to}` }}>
          <span aria-hidden className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent" />
          <Icon size={21} strokeWidth={2.3} className="relative" />
        </span>
        <div className="min-w-0 flex-1 text-right">
          <div className="truncate text-[11.5px] font-black uppercase tracking-[0.06em] text-slate-400">{label}</div>
          <div className="tabular-nums text-slate-900" style={{ fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 900, fontSize: "clamp(26px, 3vw, 34px)", letterSpacing: "-0.03em", lineHeight: 1.05 }}>{display}</div>
        </div>
      </div>
      <div className="relative mt-3 flex items-end justify-between gap-2">
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[12px] font-black tabular-nums" style={{ background: up ? "rgba(99,184,30,0.14)" : "rgba(245,158,11,0.16)", color: up ? "#3f7a14" : "#b45309" }}>
          {up ? <TrendingUp size={13} strokeWidth={2.8} /> : <TrendingDown size={13} strokeWidth={2.8} />}{up ? "+" : ""}{delta}%
        </span>
        <Sparkline data={spark} to={to} />
      </div>
      <div className="relative mt-1 text-[11px] font-semibold text-slate-400">vs last month</div>
    </div>
  );
}

function Sparkline({ data, to }: { data: number[]; to: string }) {
  const w = 118, h = 38;
  if (!data || data.length < 2) return <span className="text-[11px] text-slate-300">—</span>;
  const max = Math.max(...data), min = Math.min(...data), rng = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - 4 - ((v - min) / rng) * (h - 8)] as const);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  const id = `sp-${to.replace(/\W/g, "")}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={to} stopOpacity="0.28" /><stop offset="100%" stopColor={to} stopOpacity="0" /></linearGradient></defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={to} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1]![0]} cy={pts[pts.length - 1]![1]} r="3" fill={to} stroke="#fff" strokeWidth="1.5" />
    </svg>
  );
}

/* ── colourful funnel ── */
function FunnelChart({ stages }: { stages: { label: string; value: number; from: string; to: string }[] }) {
  const max = Math.max(1, ...stages.map((s) => s.value));
  return (
    <div className="space-y-2.5">
      {stages.map((s, i) => {
        const w = 40 + Math.round((s.value / max) * 60);
        const prev = i > 0 ? stages[i - 1]!.value : 0;
        const drop = i > 0 && prev ? Math.round((s.value / prev) * 100) : null;
        return (
          <div key={s.label} className="flex items-center gap-3">
            <div className="flex min-w-0 flex-1 justify-center">
              <div className="relative flex h-9 items-center justify-center overflow-hidden rounded-lg text-[12.5px] font-black text-white shadow-md transition-all" style={{ width: `${w}%`, background: `linear-gradient(135deg, ${s.from}, ${s.to})`, boxShadow: `0 8px 18px -8px ${s.to}` }}>
                <span aria-hidden className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent" />
                <span className="relative tabular-nums">{s.value}</span>
              </div>
            </div>
            <div className="w-[112px] shrink-0">
              <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-600"><span className="inline-block size-2 rounded-full" style={{ background: s.to }} />{s.label}</div>
              {drop != null && <div className="pl-3.5 text-[10.5px] font-semibold text-slate-400">{drop}% of prev</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── conversion donut ── */
function Donut({ pct }: { pct: number }) {
  const p = Math.max(0, Math.min(100, pct));
  const r = 46, c = 2 * Math.PI * r, off = c * (1 - p / 100);
  return (
    <div className="relative shrink-0">
      <svg viewBox="0 0 120 120" className="w-[128px]">
        <defs><linearGradient id="donutg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#63b81e" /><stop offset="100%" stopColor="#0180cf" /></linearGradient></defs>
        <circle cx="60" cy="60" r={r} fill="none" stroke="#eef2f6" strokeWidth="13" />
        <circle cx="60" cy="60" r={r} fill="none" stroke="url(#donutg)" strokeWidth="13" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 60 60)" style={{ transition: "stroke-dashoffset 1s ease-out", filter: "drop-shadow(0 2px 4px rgba(1,128,207,0.35))" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="tabular-nums text-slate-900" style={{ fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 900, fontSize: 24, lineHeight: 1 }}>{p}%</div>
        <div className="text-[10px] font-bold uppercase tracking-[0.04em] text-slate-400">Conversion</div>
      </div>
    </div>
  );
}

/* ── weekly grouped bars ── */
function WeeklyBars({ data }: { data: WeekBar[] }) {
  const max = Math.max(1, ...data.flatMap((d) => [d.quotations, d.converted]));
  if (data.length === 0) return <p className="py-4 text-center text-[12px] text-slate-400">No weekly data.</p>;
  return (
    <div>
      <div className="flex h-24 items-end gap-2.5">
        {data.map((d, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-full w-full items-end justify-center gap-1">
              <div className="w-1/2 max-w-[12px] rounded-t" style={{ height: `${Math.max(4, (d.quotations / max) * 100)}%`, background: "linear-gradient(180deg, #7ed957, #63b81e)" }} title={`Quotations: ${d.quotations}`} />
              <div className="w-1/2 max-w-[12px] rounded-t" style={{ height: `${Math.max(4, (d.converted / max) * 100)}%`, background: "linear-gradient(180deg, #4aa3e0, #0180cf)" }} title={`Converted: ${d.converted}`} />
            </div>
            <span className="text-[9.5px] font-semibold text-slate-400">{d.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-4 text-[11px] font-semibold text-slate-500">
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: "#63b81e" }} /> Quotations</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: "#0180cf" }} /> Converted</span>
      </div>
    </div>
  );
}

/* ── recent activity feed ── */
const ACT_META: Record<Activity["kind"], { Icon: LucideIcon; from: string; to: string }> = {
  so: { Icon: ShoppingCart, from: "#7c3aed", to: "#6d28d9" },
  po: { Icon: ReceiptText, from: "#63b81e", to: "#4a9616" },
  quote: { Icon: FileText, from: "#0180cf", to: "#0069b3" },
  enquiry: { Icon: Inbox, from: "#0a7d8a", to: "#0069b3" },
};
function ActivityFeed({ items }: { items: Activity[] }) {
  if (items.length === 0) return <p className="py-6 text-center text-[13px] text-slate-400">No recent activity.</p>;
  return (
    <div className="space-y-2">
      {items.map((a, i) => {
        const m = ACT_META[a.kind];
        return (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2 transition-colors hover:bg-slate-50/70">
            <span className="relative inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl text-white shadow" style={{ background: `linear-gradient(140deg, ${m.from}, ${m.to})` }}>
              <span aria-hidden className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent" />
              <m.Icon size={16} strokeWidth={2.3} className="relative" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12.5px] font-bold text-slate-700" title={a.title}>{a.title}</div>
              <div className="truncate text-[11.5px] text-slate-400">{a.subtitle}</div>
            </div>
            <div className="shrink-0 text-right">
              {a.amount > 0 && <div className="text-[12px] font-black tabular-nums text-slate-600">{compactInr(a.amount)}</div>}
              <div className="text-[10.5px] font-semibold text-slate-400">{ago(a.date)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── detail modal ── */
function DetailModal({ title, Icon, from, to, rows, onClose }: { title: string; Icon: LucideIcon; from: string; to: string; rows: EnquiryRow[]; onClose: () => void }) {
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const byStatus = new Map<string, number>();
  for (const r of rows) byStatus.set(r.quoteStatus, (byStatus.get(r.quoteStatus) ?? 0) + 1);
  const statuses = Array.from(byStatus.entries()).sort(([, a], [, b]) => b - a);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex max-h-[90vh] w-[min(760px,96vw)] flex-col overflow-hidden rounded-2xl border border-white/70 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <header className="relative overflow-hidden px-6 py-4 text-white" style={{ background: `linear-gradient(120deg, ${from}, ${to} 70%, #63b81e)` }}>
          <span aria-hidden className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.25) 1px, transparent 0)", backgroundSize: "18px 18px" }} />
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/30"><Icon size={20} /></span>
              <div>
                <div className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-white/80">Details</div>
                <div className="text-[18px] font-black tracking-[-0.01em]">{title}</div>
              </div>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-white/85 hover:bg-white/20"><X size={18} /></button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-auto px-6 py-5">
          <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-1">
            <SummaryTile icon={Tag} label="Records" value={String(rows.length)} />
            <SummaryTile icon={IndianRupee} label="Total Value" value={inr(total)} />
            <SummaryTile icon={CalendarClock} label="Latest" value={rows.map((r) => r.date).filter(Boolean).sort().slice(-1)[0] ?? "—"} />
          </div>
          <div className="mt-4">
            <div className="mb-2 text-[11px] font-black uppercase tracking-[0.08em] text-slate-400">Status Breakdown</div>
            <div className="flex flex-wrap gap-2">
              {statuses.map(([s, n]) => (
                <span key={s} className="inline-flex items-center gap-1.5 rounded-full bg-[#0180cf]/10 px-3 py-1 text-[12.5px] font-bold text-[#0069b3]">{s} <span className="tabular-nums text-slate-500">· {n}</span></span>
              ))}
            </div>
          </div>
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full border-collapse text-[12.5px]">
              <thead className="bg-slate-50">
                <tr className="text-left text-[11px] font-bold uppercase tracking-[0.04em] text-slate-400">
                  <th className="px-3 py-2">Enquiry</th><th className="px-3 py-2">Customer</th><th className="px-3 py-2">Item</th><th className="px-3 py-2 text-right">Value</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={6} className="px-3 py-6 text-center text-slate-400">No records.</td></tr>
                ) : rows.slice(0, 200).map((r, i) => (
                  <tr key={`${r.enquiryNo}-${i}`} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-bold text-slate-800">{r.enquiryNo}</td>
                    <td className="px-3 py-2 text-slate-600">
                      <span className="flex items-center gap-1.5"><Building2 size={12} className="text-[#0069b3]" /> {r.company || "—"}</span>
                      {r.person && <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400"><User size={11} /> {r.person}</span>}
                    </td>
                    <td className="max-w-[160px] truncate px-3 py-2 text-slate-600" title={r.item}>{r.item || "—"}</td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-700">{r.amount ? inr(r.amount) : "—"}</td>
                    <td className="px-3 py-2"><span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11.5px] font-bold text-slate-600">{r.quoteStatus}{r.soNo ? ` · ${r.soNo}` : ""}</span></td>
                    <td className="px-3 py-2 tabular-nums text-slate-500">{r.date || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryTile({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5">
      <div className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.05em] text-slate-400"><Icon size={12} className="text-[#0069b3]" /> {label}</div>
      <div className="mt-0.5 text-[16px] font-black tabular-nums text-slate-800" style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}>{value}</div>
    </div>
  );
}

/* ── calendar ── */
function EnquiryCalendar({ rows, initialYear, initialMonth }: { rows: EnquiryRow[]; initialYear: number; initialMonth: number }) {
  const [y, setY] = React.useState(initialYear);
  const [m, setM] = React.useState(initialMonth);
  const [day, setDay] = React.useState<string | null>(null);

  const byDate = React.useMemo(() => {
    const map = new Map<string, EnquiryRow[]>();
    for (const r of rows) { if (!r.date) continue; const list = map.get(r.date) ?? []; list.push(r); map.set(r.date, list); }
    return map;
  }, [rows]);

  const first = new Date(y, m, 1);
  const lead = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const pad = (n: number) => String(n).padStart(2, "0");
  const dateStr = (d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
  const maxCount = Math.max(1, ...Array.from(byDate.values()).map((l) => l.length));

  function shift(delta: number) {
    let nm = m + delta, ny = y;
    if (nm < 0) { nm = 11; ny -= 1; }
    if (nm > 11) { nm = 0; ny += 1; }
    setM(nm); setY(ny); setDay(null);
  }

  const dayRows = day ? byDate.get(day) ?? [] : [];

  return (
    <Section title="Enquiry Activity Calendar" Icon={CalendarClock}>
      <div className="mb-4 flex items-center justify-end">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => shift(-1)} className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"><ChevronLeft size={16} /></button>
          <span className="min-w-[150px] text-center text-[14px] font-black text-slate-700">{MONTHS[m]} {y}</span>
          <button type="button" onClick={() => shift(1)} className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"><ChevronRight size={16} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {DOW.map((d) => <div key={d} className="pb-1 text-center text-[11px] font-black uppercase tracking-[0.04em] text-slate-400">{d}</div>)}
        {cells.map((d, i) => {
          if (d === null) return <div key={`e${i}`} />;
          const ds = dateStr(d); const list = byDate.get(ds) ?? []; const n = list.length; const selected = day === ds;
          const intensity = n ? 0.18 + 0.5 * (n / maxCount) : 0;
          return (
            <button key={ds} type="button" onClick={() => n && setDay(selected ? null : ds)} disabled={!n}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-xl border text-[13px] transition-all ${selected ? "border-[#0180cf] ring-2 ring-[#0180cf]/30" : "border-slate-100"} ${n ? "cursor-pointer font-bold text-slate-800 hover:-translate-y-0.5" : "text-slate-300"}`}
              style={n ? { background: `rgba(1,128,207,${intensity})` } : undefined}>
              {d}
              {n > 0 && <span className="mt-0.5 inline-flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-black text-white" style={{ background: "linear-gradient(135deg, #63b81e, #0180cf)" }}>{n}</span>}
            </button>
          );
        })}
      </div>
      {day && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
          <div className="mb-2 flex items-center gap-2 text-[12.5px] font-black text-slate-700"><CalendarClock size={14} className="text-[#0069b3]" /> {day} · {dayRows.length} enquir{dayRows.length === 1 ? "y" : "ies"}</div>
          <div className="space-y-1.5">
            {dayRows.map((r, i) => (
              <div key={`${r.enquiryNo}-${i}`} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-1.5 text-[12.5px] shadow-sm">
                <span className="flex min-w-0 items-center gap-2"><span className="font-bold text-slate-800">{r.enquiryNo}</span><span className="truncate text-slate-500">{r.company}</span></span>
                <span className="inline-flex shrink-0 items-center gap-1.5"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">{r.quoteStatus}</span><span className="tabular-nums font-semibold text-slate-600">{r.amount ? inr(r.amount) : ""}</span></span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}

/* ── advanced: Smart Business Insights ── */
function SmartInsights({ rows }: { rows: EnquiryRow[] }) {
  const months = Array.from(new Set(rows.map((r) => r.date.slice(0, 7)).filter(Boolean))).sort().slice(-6);
  const matrix = DOW.map(() => months.map(() => 0));
  const monthCount = new Map<string, number>();
  for (const r of rows) {
    if (!r.date) continue;
    const mk = r.date.slice(0, 7); monthCount.set(mk, (monthCount.get(mk) ?? 0) + 1);
    const ci = months.indexOf(mk); if (ci < 0) continue;
    const wd = (new Date(r.date + "T00:00:00Z").getUTCDay() + 6) % 7; matrix[wd]![ci]! += 1;
  }
  const colLabels = months.map((m) => (MONTHS[Number(m.slice(5, 7)) - 1] ?? m).slice(0, 3));
  const byCustomer = topN(rows.map((r) => r.company).filter(Boolean));
  const byProduct = topN(rows.map((r) => r.product).filter(Boolean));
  const sortedM = Array.from(monthCount.keys()).sort();
  const last = monthCount.get(sortedM[sortedM.length - 1] ?? "") ?? 0;
  const prev = monthCount.get(sortedM[sortedM.length - 2] ?? "") ?? 0;
  const growth = prev ? Math.round(((last - prev) / prev) * 100) : last ? 100 : 0;
  const converted = rows.filter((r) => r.soCreated).length;
  const convRate = rows.length ? Math.round((converted / rows.length) * 100) : 0;
  const lost = rows.filter((r) => /lost|regret|cancel|drop|reject/i.test(r.quoteStatus)).length;
  const wdTotals = DOW.map((_, i) => matrix[i]!.reduce((s, v) => s + v, 0));
  const peakIdx = wdTotals.indexOf(Math.max(...wdTotals));

  return (
    <section className="relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-gradient-to-br from-white to-[#f7fbfe] p-6 shadow-sm max-md:p-4">
      <div className="mb-5 flex items-center gap-3">
        <span className="inline-flex size-11 items-center justify-center rounded-2xl text-white shadow-lg" style={{ background: "linear-gradient(135deg, #63b81e, #0180cf)", boxShadow: "0 12px 26px -12px #0069b3" }}><Sparkles size={22} strokeWidth={2.2} /></span>
        <div>
          <div className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-slate-400">Advanced</div>
          <h2 className="text-[19px] font-black tracking-[-0.01em] text-slate-800" style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}>Smart Business Insights</h2>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2">
        <MetricChip icon={TrendingUp} label="Monthly Growth" value={`${growth >= 0 ? "+" : ""}${growth}%`} tint={growth >= 0 ? "#3f7a14" : "#b45309"} />
        <MetricChip icon={FileCheck2} label="Conversion Rate" value={`${convRate}%`} tint="#0069b3" />
        <MetricChip icon={Package} label="Products Enquired" value={String(new Set(rows.map((r) => r.product)).size)} tint="#0a7d8a" />
        <MetricChip icon={XCircle} label="Lost Enquiries" value={String(lost)} tint="#b45309" />
      </div>
      <div className="mt-5 grid grid-cols-3 gap-5 max-lg:grid-cols-1">
        <div className="col-span-2 max-lg:col-span-1">
          <div className="mb-2 flex items-center gap-2 text-[13px] font-black text-slate-700"><Flame size={15} className="text-[#0069b3]" /> Activity Heatmap <span className="text-[11.5px] font-semibold text-slate-400">· busiest day: {DOW[peakIdx]}</span></div>
          <Heatmap matrix={matrix} rowLabels={DOW} colLabels={colLabels} />
        </div>
        <div className="space-y-4">
          <div><div className="mb-2 flex items-center gap-2 text-[13px] font-black text-slate-700"><Users size={15} className="text-[#0069b3]" /> Top Customers</div><StatusBars data={byCustomer} /></div>
          <div><div className="mb-2 flex items-center gap-2 text-[13px] font-black text-slate-700"><Package size={15} className="text-[#0069b3]" /> Most Requested</div><StatusBars data={byProduct} /></div>
        </div>
      </div>
    </section>
  );
}

function topN(values: string[], n = 4): { label: string; value: number }[] {
  const m = new Map<string, number>();
  for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
  return Array.from(m.entries()).sort(([, a], [, b]) => b - a).slice(0, n).map(([label, value]) => ({ label, value }));
}
