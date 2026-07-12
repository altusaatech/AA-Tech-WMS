"use client";

import * as React from "react";
import {
  Inbox, Send, FileCheck2, ArrowRight, X, Building2, User, CalendarClock, IndianRupee, Tag,
  ChevronLeft, ChevronRight, MessagesSquare, FileText, PhoneCall, PartyPopper, type LucideIcon,
} from "lucide-react";
import { useCountUp } from "@/lib/use-count-up";

export interface EnquiryRow {
  enquiryNo: string;
  company: string;
  person: string;
  item: string;
  amount: number;
  quoteStatus: string;
  quoteSent: boolean;
  soCreated: boolean;
  soNo: string | null;
  source: string;
  date: string; // YYYY-MM-DD
  createdAt: string; // ISO
}

interface Kpis { enquiries: number; quotationsSent: number; soCreated: number }
type KpiKey = "enquiries" | "quotationsSent" | "soCreated";

const inr = (v: number) => "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(v || 0));
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const TIMELINE_ICONS: LucideIcon[] = [MessagesSquare, FileText, Send, PhoneCall, PartyPopper];

export function EnquiryDashboard({
  rows, kpis, timeline, initialYear, initialMonth,
}: {
  rows: EnquiryRow[];
  kpis: Kpis;
  timeline: { label: string; count: number }[];
  initialYear: number;
  initialMonth: number;
}) {
  const [modal, setModal] = React.useState<KpiKey | null>(null);

  const KPIS: { key: KpiKey; label: string; value: number; blurb: string; Icon: LucideIcon; from: string; to: string; filter: (r: EnquiryRow) => boolean }[] = [
    { key: "enquiries", label: "Total Enquiries Received", value: kpis.enquiries, blurb: "All enquiries logged", Icon: Inbox, from: "#0180cf", to: "#0069b3", filter: () => true },
    { key: "quotationsSent", label: "Total Quotations Sent", value: kpis.quotationsSent, blurb: "Quotes sent to customers", Icon: Send, from: "#0a7d8a", to: "#0069b3", filter: (r) => r.quoteSent },
    { key: "soCreated", label: "Sales Orders Created", value: kpis.soCreated, blurb: "Enquiries won as Sales Orders", Icon: FileCheck2, from: "#63b81e", to: "#3f7a14", filter: (r) => r.soCreated },
  ];

  const active = KPIS.find((k) => k.key === modal);
  const modalRows = active ? rows.filter(active.filter) : [];

  const tlMax = Math.max(1, ...timeline.map((t) => t.count));

  return (
    <div className="mt-6 space-y-5">
      {/* ── KPI cards ── */}
      <div className="grid grid-cols-3 gap-5 max-md:grid-cols-1">
        {KPIS.map((k) => (
          <KpiCard key={k.key} label={k.label} value={k.value} blurb={k.blurb} Icon={k.Icon} from={k.from} to={k.to} onDetails={() => setModal(k.key)} />
        ))}
      </div>

      {/* ── timeline ── */}
      <section className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm max-md:p-4">
        <span aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.45]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(1,128,207,0.05) 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        <h2 className="relative mb-6 text-[15px] font-black text-slate-800" style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}>Enquiry Lifecycle</h2>
        <div className="relative flex items-start justify-between gap-2 max-md:flex-col max-md:gap-5">
          {timeline.map((t, i) => {
            const Icon = TIMELINE_ICONS[i] ?? MessagesSquare;
            return (
              <React.Fragment key={t.label}>
                <div className="flex flex-1 flex-col items-center text-center max-md:w-full max-md:flex-row max-md:gap-3 max-md:text-left">
                  <span className="inline-flex size-12 items-center justify-center rounded-2xl text-white shadow-lg" style={{ background: "linear-gradient(135deg, #63b81e, #0180cf)", boxShadow: "0 12px 26px -12px #0069b3" }}>
                    <Icon size={22} strokeWidth={2.2} />
                  </span>
                  <div className="max-md:flex max-md:items-baseline max-md:gap-2">
                    <div className="mt-2 text-[22px] font-black tabular-nums text-slate-800 max-md:mt-0" style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}>{t.count}</div>
                    <div className="mt-0.5 text-[12px] font-bold text-slate-500">{t.label}</div>
                  </div>
                  {/* mini progress bar under each node */}
                  <div className="mt-2 h-1.5 w-4/5 overflow-hidden rounded-full bg-slate-100 max-md:hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.max(6, (t.count / tlMax) * 100)}%`, background: "linear-gradient(90deg, #63b81e, #0180cf)" }} />
                  </div>
                </div>
                {i < timeline.length - 1 && (
                  <div className="mt-6 flex-1 max-md:hidden">
                    <div className="h-[3px] w-full rounded-full" style={{ background: "linear-gradient(90deg, #63b81e, #0180cf)", opacity: 0.35 }} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </section>

      {/* ── calendar ── */}
      <EnquiryCalendar rows={rows} initialYear={initialYear} initialMonth={initialMonth} />

      {/* ── KPI detail modal ── */}
      {active && <DetailModal title={active.label} Icon={active.Icon} from={active.from} to={active.to} rows={modalRows} onClose={() => setModal(null)} />}
    </div>
  );
}

/* ── KPI card ── */
function KpiCard({ label, value, blurb, Icon, from, to, onDetails }: { label: string; value: number; blurb: string; Icon: LucideIcon; from: string; to: string; onDetails: () => void }) {
  const v = useCountUp(value, 900);
  return (
    <div className="group relative overflow-hidden rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      <span aria-hidden className="absolute inset-x-0 top-0 h-1.5" style={{ background: `linear-gradient(90deg, ${from}, ${to})` }} />
      <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1/2 -translate-x-[200%] -skew-x-12 bg-gradient-to-r from-transparent via-slate-100/70 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[260%]" />
      <Icon aria-hidden className="pointer-events-none absolute -bottom-6 -right-5" size={120} strokeWidth={1.3} style={{ color: to, opacity: 0.07 }} />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-slate-400">{label}</div>
          <div className="mt-1.5 tabular-nums text-slate-900" style={{ fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 900, fontSize: "clamp(34px, 4vw, 46px)", letterSpacing: "-0.03em", lineHeight: 1 }}>{v}</div>
          <div className="mt-0.5 text-[12.5px] font-medium text-slate-500">{blurb}</div>
        </div>
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg transition-transform duration-300 group-hover:scale-105" style={{ background: `linear-gradient(135deg, ${from}, ${to})`, boxShadow: `0 12px 26px -12px ${to}` }}>
          <Icon size={22} strokeWidth={2.2} />
        </span>
      </div>
      <button
        type="button"
        onClick={onDetails}
        className="relative mt-4 inline-flex h-9 items-center gap-1.5 rounded-xl px-3.5 text-[13px] font-extrabold text-white shadow-md transition-all hover:-translate-y-0.5"
        style={{ background: `linear-gradient(135deg, ${from}, ${to})`, boxShadow: `0 10px 22px -10px ${to}` }}
      >
        View Details <ArrowRight size={14} strokeWidth={2.7} className="transition-transform group-hover:translate-x-0.5" />
      </button>
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
          {/* summary tiles */}
          <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-1">
            <SummaryTile icon={Tag} label="Records" value={String(rows.length)} />
            <SummaryTile icon={IndianRupee} label="Total Value" value={inr(total)} />
            <SummaryTile icon={CalendarClock} label="Latest" value={rows.map((r) => r.date).filter(Boolean).sort().slice(-1)[0] ?? "—"} />
          </div>

          {/* status breakdown */}
          <div className="mt-4">
            <div className="mb-2 text-[11px] font-black uppercase tracking-[0.08em] text-slate-400">Status Breakdown</div>
            <div className="flex flex-wrap gap-2">
              {statuses.map(([s, n]) => (
                <span key={s} className="inline-flex items-center gap-1.5 rounded-full bg-[#0180cf]/10 px-3 py-1 text-[12.5px] font-bold text-[#0069b3]">
                  {s} <span className="tabular-nums text-slate-500">· {n}</span>
                </span>
              ))}
            </div>
          </div>

          {/* records table */}
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full border-collapse text-[12.5px]">
              <thead className="bg-slate-50">
                <tr className="text-left text-[11px] font-bold uppercase tracking-[0.04em] text-slate-400">
                  <th className="px-3 py-2">Enquiry</th>
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2">Item</th>
                  <th className="px-3 py-2 text-right">Value</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={6} className="px-3 py-6 text-center text-slate-400">No records.</td></tr>
                ) : rows.map((r, i) => (
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
    for (const r of rows) {
      if (!r.date) continue;
      const list = map.get(r.date) ?? [];
      list.push(r);
      map.set(r.date, list);
    }
    return map;
  }, [rows]);

  const first = new Date(y, m, 1);
  const lead = (first.getDay() + 6) % 7; // 0 = Monday
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const pad = (n: number) => String(n).padStart(2, "0");
  const dateStr = (d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
  const maxCount = Math.max(1, ...Array.from(byDate.values()).map((l) => l.length));

  function shift(delta: number) {
    let nm = m + delta;
    let ny = y;
    if (nm < 0) { nm = 11; ny -= 1; }
    if (nm > 11) { nm = 0; ny += 1; }
    setM(nm); setY(ny); setDay(null);
  }

  const dayRows = day ? byDate.get(day) ?? [] : [];

  return (
    <section className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm max-md:p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[15px] font-black text-slate-800" style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}>Enquiry Activity</h2>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => shift(-1)} className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"><ChevronLeft size={16} /></button>
          <span className="min-w-[150px] text-center text-[14px] font-black text-slate-700">{MONTHS[m]} {y}</span>
          <button type="button" onClick={() => shift(1)} className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"><ChevronRight size={16} /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {DOW.map((d) => (
          <div key={d} className="pb-1 text-center text-[11px] font-black uppercase tracking-[0.04em] text-slate-400">{d}</div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={`e${i}`} />;
          const ds = dateStr(d);
          const list = byDate.get(ds) ?? [];
          const n = list.length;
          const selected = day === ds;
          const intensity = n ? 0.18 + 0.5 * (n / maxCount) : 0;
          return (
            <button
              key={ds}
              type="button"
              onClick={() => n && setDay(selected ? null : ds)}
              disabled={!n}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-xl border text-[13px] transition-all ${
                selected ? "border-[#0180cf] ring-2 ring-[#0180cf]/30" : "border-slate-100"
              } ${n ? "cursor-pointer font-bold text-slate-800 hover:-translate-y-0.5" : "text-slate-300"}`}
              style={n ? { background: `rgba(1,128,207,${intensity})` } : undefined}
            >
              {d}
              {n > 0 && (
                <span className="mt-0.5 inline-flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-black text-white" style={{ background: "linear-gradient(135deg, #63b81e, #0180cf)" }}>{n}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* selected-day panel */}
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
    </section>
  );
}
