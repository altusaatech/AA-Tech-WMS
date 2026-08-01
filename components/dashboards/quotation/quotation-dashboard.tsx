"use client";

import * as React from "react";
import {
  Inbox, Send, Trophy, XCircle, Clock3, Percent, Search, X, Filter, Building2,
  PieChart as PieIcon, BarChart3, LineChart, Users, IndianRupee, TrendingUp,
} from "lucide-react";
import { Section, ExportButtons, DetailModal, compactInr } from "@/components/dashboards/shared/kit";

export interface QuoteRow {
  enquiryNo: string; quoteNo: string; company: string; item: string; value: number;
  status: string; sent: boolean; revised: boolean; revisions: number;
  piNo: string | null; piStatus: string; piSent: boolean; piApproved: boolean;
  converted: boolean; soNo: string | null; executive: string;
  created: string; updated: string; date: string;
}

const LOST_RE = /(lost|regret|cancel|drop|reject)/i;
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const inr = (v: number) => "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(v || 0));
const PIE_COLORS = ["#2a78d6", "#63b81e", "#f59e0b", "#7c3aed", "#0a7d8a", "#e87ba4", "#eb6834", "#94a3b8"];

const isWon = (r: QuoteRow) => r.converted;
const isLost = (r: QuoteRow) => !r.converted && LOST_RE.test(r.status);
const isPending = (r: QuoteRow) => r.sent && !r.converted && !LOST_RE.test(r.status);

export function QuotationDashboard({ rows }: { rows: QuoteRow[] }) {
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [customer, setCustomer] = React.useState("");
  const [modal, setModal] = React.useState<{ title: string; rows: QuoteRow[] } | null>(null);

  const statuses = React.useMemo(() => Array.from(new Set(rows.map((r) => r.status).filter(Boolean))).sort(), [rows]);
  const customers = React.useMemo(() => Array.from(new Set(rows.map((r) => r.company).filter(Boolean))).sort(), [rows]);

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (status && r.status !== status) return false;
      if (customer && r.company !== customer) return false;
      if (needle && ![r.enquiryNo, r.quoteNo, r.company, r.item, r.executive, r.status].some((v) => (v || "").toLowerCase().includes(needle))) return false;
      return true;
    });
  }, [rows, q, status, customer]);

  const years = React.useMemo(() => Array.from(new Set(filtered.map((r) => r.date.slice(0, 4)).filter(Boolean))).sort().reverse(), [filtered]);
  const [year, setYear] = React.useState("");
  const [month, setMonth] = React.useState("all");
  React.useEffect(() => { if (years.length && !years.includes(year)) setYear(years[0]!); }, [years, year]);

  const k = React.useMemo(() => {
    const won = filtered.filter(isWon), lost = filtered.filter(isLost), pending = filtered.filter(isPending), sent = filtered.filter((r) => r.sent);
    const sum = (a: QuoteRow[]) => a.reduce((s, r) => s + r.value, 0);
    const total = filtered.length;
    return {
      total, sent: sent.length, won: won.length, lost: lost.length, pending: pending.length,
      conv: total ? Math.round((won.length / total) * 100) : 0,
      enqValue: sum(filtered), sentValue: sum(sent), wonValue: sum(won), lostValue: sum(lost),
      avgValue: total ? Math.round(sum(filtered) / total) : 0,
      wonRows: won, lostRows: lost, pendingRows: pending, sentRows: sent,
    };
  }, [filtered]);

  // status distribution (real statuses → 100%)
  const statusDist = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtered) m.set(r.status || "—", (m.get(r.status || "—") ?? 0) + 1);
    return Array.from(m.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [filtered]);

  // trend buckets — months of the selected year, or weeks of the selected month
  const trend = React.useMemo(() => {
    const inYear = filtered.filter((r) => r.date.slice(0, 4) === year);
    if (month === "all") {
      return MON.map((label, mi) => {
        const rs = inYear.filter((r) => Number(r.date.slice(5, 7)) === mi + 1);
        return { key: `${year}-${mi}`, label, rows: rs };
      });
    }
    const mi = Number(month);
    const inMonth = inYear.filter((r) => Number(r.date.slice(5, 7)) === mi);
    return [1, 2, 3, 4, 5].map((w) => {
      const rs = inMonth.filter((r) => Math.ceil(Number(r.date.slice(8, 10)) / 7) === w);
      return { key: `${year}-${mi}-w${w}`, label: `W${w}`, rows: rs };
    });
  }, [filtered, year, month]);

  const reset = () => { setQ(""); setStatus(""); setCustomer(""); };
  const anyFilter = q || status || customer;

  return (
    <div className="mt-6 space-y-5">
      {/* ── filters: single line ── */}
      <div className="flex items-center gap-2.5 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="relative shrink-0">
          <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="h-9 w-[200px] rounded-lg border border-slate-200 bg-white pl-8 pr-2.5 text-[13px] outline-none focus:border-[#0180cf]" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 shrink-0 rounded-lg border border-slate-200 bg-white px-2 text-[12.5px] font-semibold text-slate-600 outline-none focus:border-[#0180cf]"><option value="">All statuses</option>{statuses.map((s) => <option key={s} value={s}>{s}</option>)}</select>
        <select value={customer} onChange={(e) => setCustomer(e.target.value)} className="h-9 max-w-[190px] shrink-0 rounded-lg border border-slate-200 bg-white px-2 text-[12.5px] font-semibold text-slate-600 outline-none focus:border-[#0180cf]"><option value="">All customers</option>{customers.map((c) => <option key={c} value={c}>{c}</option>)}</select>
        {anyFilter && <button type="button" onClick={reset} className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg px-2 text-[12.5px] font-bold text-slate-500 hover:text-[#0069b3]"><X size={13} /> Clear</button>}
        <span className="ml-auto flex shrink-0 items-center gap-2 whitespace-nowrap text-[12px] font-semibold text-slate-400"><Filter size={13} /> {filtered.length} of {rows.length}
          <ExportButtons filename="quote-status" headers={["Enquiry", "Quote No", "Customer", "Item", "Executive", "Status", "Value", "Won", "Date"]} rows={filtered.map((r) => [r.enquiryNo, r.quoteNo, r.company, r.item, r.executive, r.status, r.value, r.converted ? "Yes" : "No", r.date])} />
        </span>
      </div>

      {/* ── KPI section: counts row, then separate value KPIs below ── */}
      <div className="grid grid-cols-6 gap-3.5 max-xl:grid-cols-3 max-md:grid-cols-2">
        <KpiCombo label="Enquiries Received" count={k.total} Icon={Inbox} from="#2a78d6" to="#185fa5" onClick={() => setModal({ title: "Enquiries Received", rows: filtered })} />
        <KpiCombo label="Quotes Sent" count={k.sent} Icon={Send} from="#0a7d8a" to="#0069b3" onClick={() => setModal({ title: "Quotes Sent", rows: k.sentRows })} />
        <KpiCombo label="Quotes Won" count={k.won} Icon={Trophy} from="#63b81e" to="#4a9616" onClick={() => setModal({ title: "Quotes Won", rows: k.wonRows })} />
        <KpiCombo label="Quotes Lost" count={k.lost} Icon={XCircle} from="#f59e0b" to="#d97706" onClick={() => setModal({ title: "Quotes Lost", rows: k.lostRows })} />
        <KpiCombo label="Pending Quotes" count={k.pending} Icon={Clock3} from="#7c3aed" to="#6d28d9" onClick={() => setModal({ title: "Pending Quotes", rows: k.pendingRows })} />
        <KpiCombo label="Conversion" count={`${k.conv}%`} Icon={Percent} from="#0069b3" to="#0180cf" />
      </div>
      <div className="grid grid-cols-6 gap-3.5 max-xl:grid-cols-3 max-md:grid-cols-2">
        <KpiCombo label="Enquiry Value" count={compactInr(k.enqValue)} Icon={IndianRupee} from="#2a78d6" to="#185fa5" onClick={() => setModal({ title: "Enquiries Received", rows: filtered })} />
        <KpiCombo label="Quotes Sent Value" count={compactInr(k.sentValue)} Icon={IndianRupee} from="#0a7d8a" to="#0069b3" onClick={() => setModal({ title: "Quotes Sent", rows: k.sentRows })} />
        <KpiCombo label="Quotes Won Value" count={compactInr(k.wonValue)} Icon={IndianRupee} from="#63b81e" to="#4a9616" onClick={() => setModal({ title: "Quotes Won", rows: k.wonRows })} />
        <KpiCombo label="Quotes Lost Value" count={compactInr(k.lostValue)} Icon={IndianRupee} from="#f59e0b" to="#d97706" onClick={() => setModal({ title: "Quotes Lost", rows: k.lostRows })} />
        <KpiCombo label="Avg Quote Value" count={compactInr(k.avgValue)} Icon={TrendingUp} from="#7c3aed" to="#6d28d9" />
        <KpiCombo label="Won of Total" count={`${k.won} / ${k.total}`} Icon={Trophy} from="#0069b3" to="#0180cf" onClick={() => setModal({ title: "Quotes Won", rows: k.wonRows })} />
      </div>

      {/* ── status pie + monthly trend ── */}
      <div className="grid grid-cols-5 gap-5 max-lg:grid-cols-1">
        <div className="col-span-2 max-lg:col-span-1"><Section title="Status Distribution" Icon={PieIcon}><PieChart data={statusDist} /></Section></div>
        <div className="col-span-3 max-lg:col-span-1">
          <Section title="Monthly Quote Trend" Icon={LineChart}>
            <div className="mb-3 flex items-center gap-2">
              <select value={year} onChange={(e) => setYear(e.target.value)} className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[12.5px] font-bold text-slate-600 outline-none focus:border-[#0180cf]">{years.map((y) => <option key={y} value={y}>{y}</option>)}</select>
              <select value={month} onChange={(e) => setMonth(e.target.value)} className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[12.5px] font-semibold text-slate-600 outline-none focus:border-[#0180cf]"><option value="all">All months</option>{MON.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select>
              <span className="ml-auto text-[11.5px] font-semibold text-slate-400">click a bar for details</span>
            </div>
            <TrendColumns data={trend} onSelect={(b) => setModal({ title: `${b.label} ${year} · Quotes`, rows: b.rows })} />
          </Section>
        </div>
      </div>

      {/* ── enquiry vs quote trend ── */}
      <Section title="Enquiry vs Quote Trend" Icon={BarChart3}>
        <GroupedColumns
          data={MON.map((label, mi) => {
            const rs = filtered.filter((r) => r.date.slice(0, 4) === year && Number(r.date.slice(5, 7)) === mi + 1);
            return { key: `${year}-${mi}`, label, enquiries: rs.length, quotes: rs.filter((r) => r.sent).length, rows: rs };
          })}
          onSelect={(b) => setModal({ title: `${b.label} ${year} · Enquiries & Quotes`, rows: b.rows })}
        />
      </Section>

      {/* ── leaderboard + pending ── */}
      <div className="grid grid-cols-2 gap-5 max-lg:grid-cols-1">
        <Section title="Salesperson Leaderboard" Icon={Users}><Leaderboard rows={filtered} onPick={(name, rs) => setModal({ title: `${name} · Quotes`, rows: rs })} /></Section>
        <Section title="Pending Quotes" Icon={Clock3}><PendingQuotes rows={k.pendingRows} /></Section>
      </div>

      {/* bucket / KPI popup */}
      {modal && (
        <DetailModal title={modal.title} subtitle={`${modal.rows.length} record${modal.rows.length === 1 ? "" : "s"} · ${inr(modal.rows.reduce((s, r) => s + r.value, 0))}`} Icon={TrendingUp} from="#0069b3" to="#0180cf" onClose={() => setModal(null)}>
          <QuoteTable rows={modal.rows} />
        </DetailModal>
      )}
    </div>
  );
}

/* ── KPI card (big count/value, optional sub-line) ── */
function KpiCombo({ label, count, subLabel, subValue, Icon, from, to, onClick }: {
  label: string; count: number | string; subLabel?: string; subValue?: string; Icon: typeof Inbox; from: string; to: string; onClick?: () => void;
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
      {subLabel && (
        <div className="mt-2 flex items-center justify-between gap-1 border-t border-slate-100 pt-2">
          <span className="truncate text-[10.5px] font-bold uppercase tracking-[0.03em] text-slate-400">{subLabel}</span>
          {subValue && <span className="shrink-0 text-[13px] font-black tabular-nums text-[#0069b3]">{subValue}</span>}
        </div>
      )}
    </div>
  );
}

/* ── pie chart (ordered, %, 100%) ── */
function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}
function PieChart({ data }: { data: { label: string; value: number }[] }) {
  const clean = data.filter((d) => d.value > 0);
  if (clean.length === 0) return <p className="py-8 text-center text-[13px] text-slate-400">No quotes.</p>;
  const top = clean.slice(0, 7);
  const rest = clean.slice(7);
  const items = rest.length ? [...top, { label: "Other", value: rest.reduce((s, x) => s + x.value, 0) }] : top;
  const total = items.reduce((s, x) => s + x.value, 0);
  let acc = 0;
  const cx = 70, cy = 70, r = 66;
  return (
    <div className="flex items-center gap-4 max-sm:flex-col">
      <svg viewBox="0 0 140 140" className="w-[168px] shrink-0">
        {items.map((it, i) => {
          const start = (acc / total) * 360;
          acc += it.value;
          const end = (acc / total) * 360;
          const [x1, y1] = polar(cx, cy, r, start);
          const [x2, y2] = polar(cx, cy, r, end);
          const large = end - start > 180 ? 1 : 0;
          const d = it.value / total >= 0.9999 ? `M${cx - r} ${cy} A${r} ${r} 0 1 1 ${cx + r} ${cy} A${r} ${r} 0 1 1 ${cx - r} ${cy} Z` : `M${cx} ${cy} L${x1.toFixed(2)} ${y1.toFixed(2)} A${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
          return <path key={i} d={d} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="#fff" strokeWidth="1.5"><title>{`${it.label}: ${it.value} (${Math.round((it.value / total) * 100)}%)`}</title></path>;
        })}
      </svg>
      <ul className="min-w-0 flex-1 space-y-1.5">
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

/* ── interactive single-series column chart ── */
interface Bucket { key: string; label: string; rows: QuoteRow[] }
function TrendColumns({ data, onSelect }: { data: Bucket[]; onSelect: (b: Bucket) => void }) {
  const [hi, setHi] = React.useState<number | null>(null);
  const counts = data.map((d) => d.rows.length);
  const max = Math.max(1, ...counts);
  return (
    <div className="relative">
      {hi != null && (
        <div className="pointer-events-none absolute -top-1 z-10 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-center shadow-lg" style={{ left: `${((hi + 0.5) / data.length) * 100}%` }}>
          <div className="text-[11px] font-black text-slate-700">{data[hi]!.label}</div>
          <div className="text-[11px] font-bold tabular-nums text-[#0069b3]">{data[hi]!.rows.length} quotes · {compactInr(data[hi]!.rows.reduce((s, r) => s + r.value, 0))}</div>
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

/* ── interactive grouped column chart (enquiries vs quotes) ── */
interface GBucket { key: string; label: string; enquiries: number; quotes: number; rows: QuoteRow[] }
function GroupedColumns({ data, onSelect }: { data: GBucket[]; onSelect: (b: GBucket) => void }) {
  const [hi, setHi] = React.useState<number | null>(null);
  const max = Math.max(1, ...data.flatMap((d) => [d.enquiries, d.quotes]));
  return (
    <div>
      <div className="relative">
        {hi != null && (
          <div className="pointer-events-none absolute -top-1 z-10 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-center shadow-lg" style={{ left: `${((hi + 0.5) / data.length) * 100}%` }}>
            <div className="text-[11px] font-black text-slate-700">{data[hi]!.label}</div>
            <div className="text-[11px] font-bold tabular-nums"><span className="text-[#0a7d8a]">{data[hi]!.enquiries} enq</span> · <span className="text-[#3f7a14]">{data[hi]!.quotes} quotes</span> · <span className="text-[#0069b3]">{compactInr(data[hi]!.rows.reduce((s, r) => s + r.value, 0))}</span></div>
          </div>
        )}
        <div className="flex h-52 items-end gap-2 pt-8">
          {data.map((d, i) => (
            <button key={d.key} type="button" onMouseEnter={() => setHi(i)} onMouseLeave={() => setHi(null)} onClick={() => onSelect(d)} className="flex flex-1 flex-col items-center gap-1 focus:outline-none">
              <div className="flex h-full w-full items-end justify-center gap-1">
                <div className="w-1/2 max-w-[15px] overflow-hidden rounded-t" style={{ height: `${(d.enquiries / max) * 100}%`, minHeight: d.enquiries ? 5 : 2, background: "linear-gradient(180deg,#38bdf8,#0a7d8a)", opacity: hi == null || hi === i ? 1 : 0.55 }} title={`Enquiries: ${d.enquiries}`} />
                <div className="w-1/2 max-w-[15px] overflow-hidden rounded-t" style={{ height: `${(d.quotes / max) * 100}%`, minHeight: d.quotes ? 5 : 2, background: "linear-gradient(180deg,#7ed957,#3f7a14)", opacity: hi == null || hi === i ? 1 : 0.55 }} title={`Quotes: ${d.quotes}`} />
              </div>
              <span className="text-[10px] font-bold text-slate-400">{d.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-4 text-[11.5px] font-semibold text-slate-500">
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: "#0a7d8a" }} /> Enquiries</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: "#63b81e" }} /> Quotes</span>
      </div>
    </div>
  );
}

/* ── salesperson leaderboard ── */
function Leaderboard({ rows, onPick }: { rows: QuoteRow[]; onPick: (name: string, rows: QuoteRow[]) => void }) {
  const map = new Map<string, QuoteRow[]>();
  for (const r of rows) { const n = r.executive || "—"; const arr = map.get(n) ?? []; arr.push(r); map.set(n, arr); }
  const board = Array.from(map.entries()).map(([name, rs]) => {
    const won = rs.filter(isWon).length;
    return { name, quotes: rs.length, won, lost: rs.filter(isLost).length, conv: rs.length ? Math.round((won / rs.length) * 100) : 0, value: rs.reduce((s, r) => s + r.value, 0), wonValue: rs.filter(isWon).reduce((s, r) => s + r.value, 0), rows: rs };
  }).sort((a, b) => b.wonValue - a.wonValue || b.won - a.won);
  if (board.length === 0) return <p className="py-6 text-center text-[13px] text-slate-400">No data.</p>;
  const medal = ["#f59e0b", "#94a3b8", "#b45309"];
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12.5px]">
        <thead><tr className="text-left text-[10.5px] font-black uppercase tracking-[0.03em] text-slate-400">
          {["#", "Salesperson", "Quotes", "Won", "Lost", "Conv %", "Won Value"].map((h) => <th key={h} className="px-2 py-2">{h}</th>)}
        </tr></thead>
        <tbody>
          {board.map((b, i) => (
            <tr key={b.name} onClick={() => onPick(b.name, b.rows)} className="cursor-pointer border-t border-slate-100 hover:bg-[#0180cf]/6">
              <td className="px-2 py-1.5"><span className="inline-flex size-5 items-center justify-center rounded-full text-[10px] font-black text-white" style={{ background: medal[i] ?? "#cbd5e1" }}>{i + 1}</span></td>
              <td className="px-2 py-1.5 font-bold text-slate-800">{b.name}</td>
              <td className="px-2 py-1.5 tabular-nums text-slate-600">{b.quotes}</td>
              <td className="px-2 py-1.5 tabular-nums font-bold text-[#3f7a14]">{b.won}</td>
              <td className="px-2 py-1.5 tabular-nums text-[#b45309]">{b.lost}</td>
              <td className="px-2 py-1.5 tabular-nums font-bold text-[#0069b3]">{b.conv}%</td>
              <td className="px-2 py-1.5 text-right tabular-nums font-black text-slate-700">{compactInr(b.wonValue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── pending quotes list ── */
function daysSince(dateStr: string): number | null {
  if (!dateStr) return null;
  const t = new Date(dateStr + "T00:00:00Z").getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.round((Date.now() - t) / 86400_000));
}
function PendingQuotes({ rows }: { rows: QuoteRow[] }) {
  const sorted = [...rows].sort((a, b) => (b.value - a.value)).slice(0, 40);
  if (sorted.length === 0) return <p className="py-6 text-center text-[13px] text-slate-400">No pending quotes 🎉</p>;
  return (
    <div className="max-h-[320px] overflow-auto rounded-xl border border-slate-200">
      <table className="w-full border-collapse text-[12px]">
        <thead className="sticky top-0 bg-slate-50"><tr className="text-left text-[10px] font-black uppercase tracking-[0.03em] text-slate-400">
          {["Enquiry", "Customer", "Item", "Value", "Age", "Salesperson"].map((h) => <th key={h} className="px-2.5 py-2">{h}</th>)}
        </tr></thead>
        <tbody>
          {sorted.map((r, i) => {
            const age = daysSince(r.date);
            return (
              <tr key={`${r.enquiryNo}-${i}`} className="border-t border-slate-100">
                <td className="px-2.5 py-1.5 font-bold text-slate-800">{r.enquiryNo}</td>
                <td className="px-2.5 py-1.5 text-slate-600"><span className="flex items-center gap-1"><Building2 size={11} className="text-[#0069b3]" />{r.company || "—"}</span></td>
                <td className="max-w-[120px] truncate px-2.5 py-1.5 text-slate-500" title={r.item}>{r.item || "—"}</td>
                <td className="px-2.5 py-1.5 text-right tabular-nums font-semibold text-slate-700">{r.value ? inr(r.value) : "—"}</td>
                <td className="px-2.5 py-1.5 tabular-nums"><span className={`rounded-full px-1.5 py-0.5 text-[10.5px] font-bold ${age != null && age > 21 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>{age != null ? `${age}d` : "—"}</span></td>
                <td className="px-2.5 py-1.5 text-slate-500">{r.executive}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── shared quote table for popups ── */
function QuoteTable({ rows }: { rows: QuoteRow[] }) {
  const stat = (r: QuoteRow) => isWon(r) ? "Won" : isLost(r) ? "Lost" : isPending(r) ? "Pending" : "Open";
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full border-collapse text-[12px]">
        <thead className="bg-slate-50"><tr className="text-left text-[10.5px] font-bold uppercase tracking-[0.03em] text-slate-400">
          {["Enquiry", "Customer", "Item", "Value", "Status", "Salesperson", "Date"].map((h) => <th key={h} className="px-2.5 py-2">{h}</th>)}
        </tr></thead>
        <tbody>
          {rows.length === 0 ? <tr><td colSpan={7} className="px-3 py-6 text-center text-slate-400">No records.</td></tr> : rows.slice(0, 200).map((r, i) => (
            <tr key={`${r.enquiryNo}-${i}`} className="border-t border-slate-100">
              <td className="px-2.5 py-1.5 font-bold text-slate-800">{r.enquiryNo}</td>
              <td className="px-2.5 py-1.5 text-slate-600">{r.company || "—"}</td>
              <td className="max-w-[150px] truncate px-2.5 py-1.5 text-slate-500" title={r.item}>{r.item || "—"}</td>
              <td className="px-2.5 py-1.5 text-right tabular-nums font-semibold text-slate-700">{r.value ? inr(r.value) : "—"}</td>
              <td className="px-2.5 py-1.5"><span className="rounded-full bg-[#0180cf]/10 px-1.5 py-0.5 text-[11px] font-bold text-[#0069b3]">{stat(r)}</span></td>
              <td className="px-2.5 py-1.5 text-slate-500">{r.executive}</td>
              <td className="px-2.5 py-1.5 tabular-nums text-slate-500">{r.date || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
