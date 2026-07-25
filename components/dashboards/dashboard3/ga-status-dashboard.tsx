"use client";

import * as React from "react";
import { ClipboardList, Send, CheckCircle2, XCircle, Clock3, Target, AlarmClock, Timer, Search, Filter, X, Users, Hourglass, CalendarClock, PieChart, BarChart3, type LucideIcon } from "lucide-react";
import { Section, ExportButtons, DetailModal, DonutBreakdown } from "@/components/dashboards/shared/kit";

export interface GaRow {
  gaNo: string;
  soNo: string;
  poNo: string;
  company: string;
  item: string;
  status: string;
  soDate: string;
  submissionTargetDate: string;
  submissionDate: string;
  targetApprovalDate: string;
  actualApprovalDate: string;
  submissionDays: number;
  approvalDays: number;
  delayDays: number;
  approved: boolean;
  rejected: boolean;
  open: boolean;
  overdue: boolean;
  onTime: boolean;
  ageDays: number;
}

const selCls = "h-8 rounded-lg border border-slate-200 bg-white px-2 text-[12px] font-semibold text-slate-600 outline-none focus:border-[#0180cf]";

function diffDays(a: string, b: string): number {
  if (!a || !b) return 0;
  const t1 = Date.parse(a + "T00:00:00Z"), t2 = Date.parse(b + "T00:00:00Z");
  if (Number.isNaN(t1) || Number.isNaN(t2)) return 0;
  return Math.round((t2 - t1) / 86_400_000);
}
const targetApprovalDays = (r: GaRow) => Math.max(0, diffDays(r.submissionDate || r.submissionTargetDate, r.targetApprovalDate));
const actualApprovalDays = (r: GaRow) => r.approvalDays || Math.max(0, diffDays(r.submissionDate, r.actualApprovalDate));

function BucketSelect({ value, onChange, label = "Show top", total }: { value: number; onChange: (n: number) => void; label?: string; total?: number }) {
  return (
    <div className="mb-3 flex items-center gap-2 text-[12px] font-semibold text-slate-500">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(Number(e.target.value))} className={selCls}>
        <option value={5}>5</option>
        <option value={10}>10</option>
        <option value={15}>15</option>
        <option value={20}>20</option>
        <option value={999}>All</option>
      </select>
      {total != null && <span className="text-slate-400">of {total}</span>}
    </div>
  );
}

/** Two-series grouped bar chart (e.g. Target vs Actual approval days). */
function GroupedBars({ data, labelA, labelB, colorA, colorB }: {
  data: { label: string; a: number; b: number }[];
  labelA: string; labelB: string; colorA: string; colorB: string;
}) {
  const max = Math.max(1, ...data.map((d) => Math.max(d.a, d.b)));
  const hasData = data.some((d) => d.a || d.b);
  if (!hasData) return <p className="py-10 text-center text-[13px] text-slate-400">No approved GA with dates in range.</p>;
  return (
    <div>
      <div className="mb-2.5 flex items-center gap-4 text-[11px] font-bold text-slate-500">
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: colorA }} />{labelA}</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: colorB }} />{labelB}</span>
      </div>
      <div className="flex h-36 items-end gap-1.5 overflow-x-auto">
        {data.map((d, idx) => (
          <div key={d.label + idx} className="flex min-w-[34px] flex-1 flex-col items-center gap-1">
            <div className="flex h-28 w-full items-end justify-center gap-[3px]">
              <div className="w-1/2 max-w-[16px] rounded-t transition-[height] duration-700" style={{ height: `${(d.a / max) * 100}%`, minHeight: d.a ? 3 : 0, background: colorA }} title={`${labelA}: ${d.a}`} />
              <div className="w-1/2 max-w-[16px] rounded-t transition-[height] duration-700" style={{ height: `${(d.b / max) * 100}%`, minHeight: d.b ? 3 : 0, background: colorB }} title={`${labelB}: ${d.b}`} />
            </div>
            <span className="max-w-[52px] truncate text-[10px] font-semibold text-slate-400" title={d.label}>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GaStatusDashboard({ rows }: { rows: GaRow[] }) {
  const [agingBucket, setAgingBucket] = React.useState<number | null>(null);
  const [agingRowsN, setAgingRowsN] = React.useState(10);
  const [topCustN, setTopCustN] = React.useState(5);
  const [tvaN, setTvaN] = React.useState(10);
  const [q, setQ] = React.useState("");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [customer, setCustomer] = React.useState("");
  const [status, setStatus] = React.useState("");

  const customers = React.useMemo(() => Array.from(new Set(rows.map((r) => r.company).filter(Boolean))).sort(), [rows]);
  const statuses = React.useMemo(() => Array.from(new Set(rows.map((r) => r.status).filter(Boolean))).sort(), [rows]);

  const f = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      const d = r.submissionDate || r.soDate;
      if (from && d < from) return false;
      if (to && d > to) return false;
      if (customer && r.company !== customer) return false;
      if (status && r.status !== status) return false;
      if (needle && ![r.gaNo, r.soNo, r.poNo, r.company, r.item, r.status].some((v) => v.toLowerCase().includes(needle))) return false;
      return true;
    });
  }, [rows, q, from, to, customer, status]);

  const total = f.length;
  const submitted = f.filter((r) => r.submissionDate).length;
  const approved = f.filter((r) => r.approved).length;
  const rejected = f.filter((r) => r.rejected).length;
  const pending = f.filter((r) => r.open).length;
  const overdue = f.filter((r) => r.open && r.overdue).length;
  const submittedRows = f.filter((r) => r.submissionDays > 0);
  const approvedRows = f.filter((r) => r.approved);
  const avgSub = submittedRows.length ? Math.round(submittedRows.reduce((a, r) => a + r.submissionDays, 0) / submittedRows.length) : 0;
  const avgApr = approvedRows.length ? Math.round(approvedRows.reduce((a, r) => a + (r.approvalDays || 0), 0) / approvedRows.length) : 0;

  const tiles: { label: string; value: string; sub?: string; from: string; to: string; Icon: LucideIcon }[] = [
    { label: "Total GA", value: String(total), sub: "Nos", from: "#2a78d6", to: "#185fa5", Icon: ClipboardList },
    { label: "Submitted", value: String(submitted), sub: "Nos", from: "#0180cf", to: "#0069b3", Icon: Send },
    { label: "Approved", value: String(approved), sub: "Nos", from: "#63b81e", to: "#4a9616", Icon: CheckCircle2 },
    { label: "Pending", value: String(pending), sub: "Nos", from: "#f59e0b", to: "#d97706", Icon: Clock3 },
    { label: "Rejected", value: String(rejected), sub: "Nos", from: "#ef4444", to: "#b91c1c", Icon: XCircle },
    { label: "Overdue", value: String(overdue), sub: "Nos", from: "#b45309", to: "#92400e", Icon: AlarmClock },
    { label: "Avg Sub Days", value: String(avgSub), sub: "days", from: "#0a7d8a", to: "#0069b3", Icon: Timer },
    { label: "Avg Appr Days", value: String(avgApr), sub: "days", from: "#7c3aed", to: "#6d28d9", Icon: Timer },
  ];

  // Status distribution (mutually exclusive).
  const statusDist = React.useMemo(() => {
    let ap = 0, rj = 0, pe = 0;
    for (const r of f) { if (r.approved) ap++; else if (r.rejected) rj++; else pe++; }
    return [
      { label: "Approved", value: ap },
      { label: "Rejected", value: rj },
      { label: "Pending", value: pe },
    ];
  }, [f]);

  // Target vs Actual approval summary.
  const tva = React.useMemo(() => {
    let onTime = 0, delayed = 0, pend = 0;
    for (const r of f) {
      if (!r.approved) { pend++; continue; }
      if (r.onTime) onTime++; else delayed++;
    }
    return { onTime, delayed, pend };
  }, [f]);

  // Comparative chart — Target vs Actual approval days (worst delay first).
  const approvalCompare = React.useMemo(() => {
    const withDates = f.filter((r) => r.approved && (r.targetApprovalDate || r.submissionDate) && r.actualApprovalDate);
    return [...withDates].sort((a, b) => b.delayDays - a.delayDays).slice(0, 12)
      .map((r) => ({ label: r.gaNo || r.soNo || "—", a: targetApprovalDays(r), b: actualApprovalDays(r) }));
  }, [f]);

  // Detailed target-vs-actual rows (worst delay first).
  const tvaDetail = React.useMemo(() => [...f].sort((a, b) => (b.delayDays - a.delayDays) || (b.approvalDays - a.approvalDays)), [f]);
  const shownTva = tvaN >= 999 ? tvaDetail : tvaDetail.slice(0, tvaN);

  // Top customers by GA count.
  const topCustomers = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const r of f) m.set(r.company || "—", (m.get(r.company || "—") ?? 0) + 1);
    return Array.from(m.entries()).map(([company, count]) => ({ company, count })).sort((a, b) => b.count - a.count);
  }, [f]);
  const shownCustomers = topCustN >= 999 ? topCustomers : topCustomers.slice(0, topCustN);

  // Aging (open GA items by days since submission/SO date).
  const aging = React.useMemo(() => {
    const b: { label: string; rows: GaRow[] }[] = [
      { label: "0–7 days", rows: [] }, { label: "8–15 days", rows: [] }, { label: "16–30 days", rows: [] }, { label: "30+ days", rows: [] },
    ];
    for (const r of f) {
      if (!r.open) continue;
      const d = r.ageDays;
      b[d <= 7 ? 0 : d <= 15 ? 1 : d <= 30 ? 2 : 3]!.rows.push(r);
    }
    return b;
  }, [f]);
  const agingMax = Math.max(1, ...aging.map((a) => a.rows.length));

  const reset = () => { setQ(""); setFrom(""); setTo(""); setCustomer(""); setStatus(""); };
  const anyFilter = q || from || to || customer || status;

  const bucketRows = agingBucket != null && aging[agingBucket] ? [...aging[agingBucket]!.rows].sort((a, b) => b.ageDays - a.ageDays) : [];
  const shownBucketRows = agingRowsN >= 999 ? bucketRows : bucketRows.slice(0, agingRowsN);

  return (
    <div className="space-y-4">
      {/* filter bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search GA / SO / PO no…" className="h-9 w-[220px] max-w-[50vw] rounded-lg border border-slate-200 bg-white pl-8 pr-2.5 text-[13px] outline-none focus:border-[#0180cf]" />
        </div>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} title="Start date" className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-[12.5px] outline-none focus:border-[#0180cf]" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} title="End date" className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-[12.5px] outline-none focus:border-[#0180cf]" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-[12.5px] font-semibold text-slate-600 outline-none focus:border-[#0180cf]"><option value="">All GA statuses</option>{statuses.map((s) => <option key={s} value={s}>{s}</option>)}</select>
        <select value={customer} onChange={(e) => setCustomer(e.target.value)} className="h-9 max-w-[180px] rounded-lg border border-slate-200 bg-white px-2 text-[12.5px] font-semibold text-slate-600 outline-none focus:border-[#0180cf]"><option value="">All customers</option>{customers.map((c) => <option key={c} value={c}>{c}</option>)}</select>
        {anyFilter && <button type="button" onClick={reset} className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-[12.5px] font-bold text-slate-500 hover:text-[#0069b3]"><X size={13} /> Clear</button>}
        <span className="ml-auto flex items-center gap-2 text-[12px] font-semibold text-slate-400"><Filter size={13} /> {f.length} of {rows.length}
          <ExportButtons filename="ga-status" headers={["GA No", "SO No", "PO No", "Customer", "Item", "Status", "Sub Target", "Sub Date", "Target Approval", "Actual Approval", "Approval Days", "Delay Days"]} rows={f.map((r) => [r.gaNo, r.soNo, r.poNo, r.company, r.item, r.status, r.submissionTargetDate, r.submissionDate, r.targetApprovalDate, r.actualApprovalDate, r.approvalDays, r.delayDays])} />
        </span>
      </div>

      {/* KPI grid — all eight in one straight line */}
      <Section title="GA Approval Status — Overview" Icon={Target}>
        <div className="grid grid-cols-8 gap-2.5 max-2xl:grid-cols-4 max-sm:grid-cols-2">
          {tiles.map((t) => (
            <div key={t.label} className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-[#f6fafd] p-3 shadow-[0_10px_26px_-20px_rgba(1,128,207,0.4)]">
              <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${t.from}, ${t.to})` }} />
              <div className="flex items-center justify-between gap-1.5">
                <div className="min-w-0 truncate text-[10px] font-black uppercase tracking-[0.04em] text-slate-400" title={t.label}>{t.label}</div>
                <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-lg text-white shadow-sm" style={{ background: `linear-gradient(140deg, ${t.from}, ${t.to})` }}><t.Icon size={12} strokeWidth={2.4} /></span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="truncate tabular-nums text-slate-900" style={{ fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 900, fontSize: 18, letterSpacing: "-0.02em", lineHeight: 1 }}>{t.value}</span>
                {t.sub && <span className="text-[10px] font-bold text-slate-400">{t.sub}</span>}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Distribution + Target vs Actual summary + Aging */}
      <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-1">
        <Section title="GA Status Distribution" Icon={PieChart}>
          <DonutBreakdown data={statusDist} centerLabel="GA" />
        </Section>

        <Section title="Target vs Actual Approval" Icon={CalendarClock}>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { label: "On Time", value: tva.onTime, desc: "Approved on/before target", to: "#4a9616" },
              { label: "Delayed", value: tva.delayed, desc: "Approved after target", to: "#b91c1c" },
              { label: "Pending", value: tva.pend, desc: "Not yet approved", to: "#d97706" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-slate-200 bg-slate-50/60 px-2 py-3 text-center">
                <div className="tabular-nums" style={{ fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 900, fontSize: 24, lineHeight: 1, color: s.to }}>{s.value}</div>
                <div className="mt-1 text-[11px] font-black uppercase tracking-[0.03em] text-slate-500">{s.label}</div>
                <div className="mt-0.5 text-[10px] font-semibold leading-tight text-slate-400">{s.desc}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[10.5px] font-medium leading-snug text-slate-400">Compares each GA&apos;s <b>Target GA Approval Date</b> with its <b>Actual GA Approval Date</b>. On&nbsp;Time = approved on or before the target; Pending GAs aren&apos;t approved yet.</p>
        </Section>

        <Section title="GA Aging (open items)" Icon={Hourglass}>
          <div className="space-y-3.5 pt-1">
            {aging.map((a, i) => (
              <button key={a.label} type="button" onClick={() => a.rows.length && (setAgingRowsN(10), setAgingBucket(i))} className="w-full text-left transition-transform hover:-translate-y-0.5 disabled:cursor-default" disabled={a.rows.length === 0}>
                <div className="mb-1 flex items-center justify-between text-[12.5px] font-bold text-slate-600"><span>{a.label}</span><span className="tabular-nums font-black text-slate-800">{a.rows.length}</span></div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100" style={{ boxShadow: "inset 0 1px 2px rgba(15,23,42,0.09)" }}>
                  <div className="relative h-full rounded-full transition-[width] duration-700" style={{ width: `${Math.max(4, (a.rows.length / agingMax) * 100)}%`, background: "linear-gradient(90deg, #f59e0b, #ef4444)" }}><span aria-hidden className="absolute inset-x-0 top-0 h-1/2 rounded-full bg-white/30" /></div>
                </div>
              </button>
            ))}
            <p className="pt-1 text-[10.5px] font-semibold text-slate-400">Click a bar to see the GAs in that aging bucket.</p>
          </div>
        </Section>
      </div>

      {/* Comparative chart — Target vs Actual approval days */}
      <Section title="Approval Days — Target vs Actual (comparative)" Icon={BarChart3}>
        <GroupedBars data={approvalCompare} labelA="Target Days" labelB="Actual Days" colorA="#c7d2e0" colorB="#0180cf" />
        <p className="mt-2 text-[10.5px] font-medium text-slate-400">Per GA (worst delay first): planned approval days (submission → target) vs actual days taken (submission → actual approval).</p>
      </Section>

      {/* Detailed Target vs Actual dates table */}
      <Section title="Target vs Actual — GA Dates" Icon={CalendarClock}>
        <BucketSelect value={tvaN} onChange={setTvaN} total={tvaDetail.length} />
        <div className="max-h-[440px] overflow-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[900px] text-[12px]">
            <thead className="sticky top-0 z-10">
              <tr className="text-left text-[10px] font-extrabold uppercase tracking-[0.03em] text-white" style={{ background: "linear-gradient(180deg, #0069b3, #00598f)" }}>
                <th className="px-2.5 py-2 text-center">#</th><th className="px-2.5 py-2">GA No</th><th className="px-2.5 py-2">Customer</th><th className="px-2.5 py-2">Sub Target</th><th className="px-2.5 py-2">Sub Date</th><th className="px-2.5 py-2">Target Approval</th><th className="px-2.5 py-2">Actual Approval</th><th className="px-2.5 py-2 text-center">Appr Days</th><th className="px-2.5 py-2 text-center">Delay</th>
              </tr>
            </thead>
            <tbody>
              {shownTva.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-400">No GA records in range.</td></tr>
              ) : shownTva.map((r, i) => (
                <tr key={(r.gaNo || r.soNo) + i} className={i % 2 ? "bg-[#f5fafe]" : "bg-white"}>
                  <td className="border-b border-[#e7eff6] px-2.5 py-1.5 text-center tabular-nums text-slate-400">{i + 1}</td>
                  <td className="border-b border-[#e7eff6] px-2.5 py-1.5 font-bold text-slate-700">{r.gaNo || r.soNo || "—"}</td>
                  <td className="border-b border-[#e7eff6] px-2.5 py-1.5 text-slate-600">{r.company || "—"}</td>
                  <td className="border-b border-[#e7eff6] px-2.5 py-1.5 tabular-nums text-slate-500">{r.submissionTargetDate || "—"}</td>
                  <td className="border-b border-[#e7eff6] px-2.5 py-1.5 tabular-nums text-slate-500">{r.submissionDate || "—"}</td>
                  <td className="border-b border-[#e7eff6] px-2.5 py-1.5 tabular-nums text-slate-500">{r.targetApprovalDate || "—"}</td>
                  <td className="border-b border-[#e7eff6] px-2.5 py-1.5 tabular-nums font-semibold text-slate-700">{r.actualApprovalDate || "—"}</td>
                  <td className="border-b border-[#e7eff6] px-2.5 py-1.5 text-center tabular-nums text-slate-600">{r.approvalDays || "—"}</td>
                  <td className="border-b border-[#e7eff6] px-2.5 py-1.5 text-center"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-black tabular-nums ${r.delayDays > 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>{r.delayDays > 0 ? `+${r.delayDays}` : 0}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Top customers by GA count */}
      <Section title="Top Customers by GA Count" Icon={Users}>
        <BucketSelect value={topCustN} onChange={setTopCustN} total={topCustomers.length} />
        {shownCustomers.length === 0 ? <p className="py-6 text-center text-[13px] text-slate-400">No data.</p> : (
          <div className="max-h-[360px] overflow-y-auto pr-1">
            <ol className="grid grid-cols-2 gap-2 max-md:grid-cols-1">
              {shownCustomers.map((c, i) => (
                <li key={c.company} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2">
                  <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-black text-white" style={{ background: "linear-gradient(135deg, #63b81e, #0180cf)" }}>{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-slate-700" title={c.company}>{c.company}</span>
                  <span className="shrink-0 text-right"><span className="block text-[14px] font-black tabular-nums text-[#0069b3]">{c.count}</span><span className="text-[10.5px] font-semibold text-slate-400">GA{c.count === 1 ? "" : "s"}</span></span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </Section>

      {/* Aging bucket popup */}
      {agingBucket != null && aging[agingBucket] && (
        <DetailModal title={`GA aging ${aging[agingBucket]!.label}`} subtitle={`${aging[agingBucket]!.rows.length} open GA${aging[agingBucket]!.rows.length === 1 ? "" : "s"}`} Icon={Hourglass} from="#f59e0b" to="#d97706" onClose={() => setAgingBucket(null)}>
          <BucketSelect value={agingRowsN} onChange={setAgingRowsN} total={bucketRows.length} />
          <table className="w-full text-[12.5px]">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="text-left text-[10.5px] font-extrabold uppercase tracking-[0.04em] text-slate-400">
                <th className="px-2 py-1.5">GA No</th><th className="px-2 py-1.5">SO No</th><th className="px-2 py-1.5">Customer</th><th className="px-2 py-1.5 text-center">Age</th><th className="px-2 py-1.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {shownBucketRows.map((r, i) => (
                <tr key={(r.gaNo || r.soNo) + i} className="border-t border-slate-100">
                  <td className="px-2 py-1.5 font-bold text-slate-700">{r.gaNo || "—"}</td>
                  <td className="px-2 py-1.5 text-slate-600">{r.soNo || "—"}</td>
                  <td className="px-2 py-1.5 text-slate-600">{r.company || "—"}</td>
                  <td className="px-2 py-1.5 text-center tabular-nums font-black text-[#b45309]">{r.ageDays}d</td>
                  <td className="px-2 py-1.5"><span className="inline-flex items-center rounded-full bg-[#0180cf]/10 px-2 py-0.5 text-[11px] font-bold text-[#0069b3]">{r.status || "—"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </DetailModal>
      )}
    </div>
  );
}
