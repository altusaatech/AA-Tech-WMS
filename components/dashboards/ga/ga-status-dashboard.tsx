"use client";

import * as React from "react";
import {
  BadgeCheck, CheckCircle2, Clock3, Timer, Gauge as GaugeIcon, Search, X, Filter,
  Users, Building2, Hourglass,
} from "lucide-react";
import { Section, ExportButtons, DetailModal, compactInr } from "@/components/dashboards/shared/kit";
import { KpiCombo, RankedList, AgingChart, inr } from "@/components/dashboards/shared/panels";

export interface GaRow {
  ourSoNo: string; company: string; item: string; value: number; gaNo: string;
  gaStatus: string; approved: boolean; submissionDays: number | null; approvalDays: number | null; delay: number;
  submissionDate: string; approvalDate: string; aging: number | null; date: string;
}

const APPROVAL_BUCKETS = [
  { key: "0", label: "0–2 days", min: 0, max: 3, color: "#63b81e" },
  { key: "3", label: "3–5 days", min: 3, max: 6, color: "#9acd32" },
  { key: "6", label: "6–10 days", min: 6, max: 11, color: "#f59e0b" },
  { key: "11", label: "11–15 days", min: 11, max: 16, color: "#e0891b" },
  { key: "16", label: "16+ days", min: 16, max: Infinity, color: "#be123c" },
];

export function GaStatusDashboard({ rows }: { rows: GaRow[] }) {
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [customer, setCustomer] = React.useState("");
  const [modal, setModal] = React.useState<{ title: string; rows: GaRow[] } | null>(null);

  const statuses = React.useMemo(() => Array.from(new Set(rows.map((r) => r.gaStatus).filter(Boolean))).sort(), [rows]);
  const customers = React.useMemo(() => Array.from(new Set(rows.map((r) => r.company).filter(Boolean))).sort(), [rows]);

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (status && r.gaStatus !== status) return false;
      if (customer && r.company !== customer) return false;
      if (needle && ![r.ourSoNo, r.company, r.item, r.gaNo, r.gaStatus].some((v) => (v || "").toLowerCase().includes(needle))) return false;
      return true;
    });
  }, [rows, q, status, customer]);

  const k = React.useMemo(() => {
    const sum = (a: GaRow[]) => a.reduce((s, r) => s + r.value, 0);
    const approved = filtered.filter((r) => r.approved), pending = filtered.filter((r) => !r.approved);
    const onTime = filtered.filter((r) => r.approved && r.delay <= 0);
    const appvDays = approved.map((r) => r.approvalDays).filter((d): d is number => d != null);
    const subDays = filtered.map((r) => r.submissionDays).filter((d): d is number => d != null);
    const avg = (a: number[]) => (a.length ? Math.round(a.reduce((s, x) => s + x, 0) / a.length) : 0);
    return {
      total: filtered.length, value: sum(filtered),
      approved: approved.length, apprVal: sum(approved), pending: pending.length, pendVal: sum(pending),
      onTime: onTime.length, onTimePct: approved.length ? Math.round((onTime.length / approved.length) * 100) : 0,
      avgApproval: avg(appvDays), avgSubmission: avg(subDays),
      approvedRows: approved, pendingRows: pending,
    };
  }, [filtered]);

  const approvalDist = React.useMemo(() => {
    const approved = filtered.filter((r) => r.approved && r.approvalDays != null);
    return APPROVAL_BUCKETS.map((b) => ({ ...b, rows: approved.filter((r) => (r.approvalDays as number) >= b.min && (r.approvalDays as number) < b.max) }));
  }, [filtered]);
  const apprMax = Math.max(1, ...approvalDist.map((b) => b.rows.length));
  const [hi, setHi] = React.useState<number | null>(null);

  const topByCount = React.useMemo(() => custAgg(filtered).sort((a, b) => b.count - a.count).slice(0, 8), [filtered]);
  const topByValue = React.useMemo(() => custAgg(filtered).sort((a, b) => b.value - a.value).slice(0, 8), [filtered]);

  const reset = () => { setQ(""); setStatus(""); setCustomer(""); };
  const anyFilter = q || status || customer;

  return (
    <div className="mt-6 space-y-5">
      {/* filters */}
      <div className="flex items-center gap-2.5 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="relative shrink-0"><Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="h-9 w-[200px] rounded-lg border border-slate-200 bg-white pl-8 pr-2.5 text-[13px] outline-none focus:border-[#0180cf]" /></div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 shrink-0 rounded-lg border border-slate-200 bg-white px-2 text-[12.5px] font-semibold text-slate-600 outline-none focus:border-[#0180cf]"><option value="">All statuses</option>{statuses.map((s) => <option key={s} value={s}>{s}</option>)}</select>
        <select value={customer} onChange={(e) => setCustomer(e.target.value)} className="h-9 max-w-[190px] shrink-0 rounded-lg border border-slate-200 bg-white px-2 text-[12.5px] font-semibold text-slate-600 outline-none focus:border-[#0180cf]"><option value="">All customers</option>{customers.map((c) => <option key={c} value={c}>{c}</option>)}</select>
        {anyFilter && <button type="button" onClick={reset} className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg px-2 text-[12.5px] font-bold text-slate-500 hover:text-[#0069b3]"><X size={13} /> Clear</button>}
        <span className="ml-auto flex shrink-0 items-center gap-2 whitespace-nowrap text-[12px] font-semibold text-slate-400"><Filter size={13} /> {filtered.length} of {rows.length}
          <ExportButtons filename="ga-approval-status" headers={["SO No", "Customer", "GA No", "Status", "Submission Days", "Approval Days", "Delay", "Value"]} rows={filtered.map((r) => [r.ourSoNo, r.company, r.gaNo, r.gaStatus, r.submissionDays ?? "", r.approvalDays ?? "", r.delay, r.value])} />
        </span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-5 gap-3.5 max-xl:grid-cols-3 max-md:grid-cols-2">
        <KpiCombo label="Total GA" count={k.total} subLabel="GA Value" subValue={compactInr(k.value)} Icon={BadgeCheck} from="#2a78d6" to="#185fa5" onClick={() => setModal({ title: "All GA", rows: filtered })} />
        <KpiCombo label="Approved" count={k.approved} subLabel="Approved Value" subValue={compactInr(k.apprVal)} Icon={CheckCircle2} from="#63b81e" to="#4a9616" onClick={() => setModal({ title: "GA Approved", rows: k.approvedRows })} />
        <KpiCombo label="Pending" count={k.pending} subLabel="Pending Value" subValue={compactInr(k.pendVal)} Icon={Clock3} from="#f59e0b" to="#d97706" onClick={() => setModal({ title: "GA Pending", rows: k.pendingRows })} />
        <KpiCombo label="Avg Approval" count={`${k.avgApproval}d`} subLabel="Avg Submission" subValue={`${k.avgSubmission}d`} Icon={Timer} from="#0a7d8a" to="#0069b3" />
        <KpiCombo label="On-Time" count={k.onTime} subLabel="On-Time Rate" subValue={`${k.onTimePct}%`} Icon={GaugeIcon} from="#0069b3" to="#0180cf" />
      </div>

      {/* approval days chart (hover + click + legend) */}
      <Section title="GA Approval Days" Icon={Timer}>
        <div className="relative">
          {hi != null && (
            <div className="pointer-events-none absolute -top-1 z-10 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-center shadow-lg" style={{ left: `${((hi + 0.5) / approvalDist.length) * 100}%` }}>
              <div className="text-[11px] font-black text-slate-700">{approvalDist[hi]!.label}</div>
              <div className="text-[11px] font-bold tabular-nums text-[#0069b3]">{approvalDist[hi]!.rows.length} GA{k.approved ? ` · ${Math.round((approvalDist[hi]!.rows.length / k.approved) * 100)}%` : ""}</div>
            </div>
          )}
          <div className="flex h-48 items-end gap-3 pt-8">
            {approvalDist.map((b, i) => (
              <button key={b.key} type="button" onMouseEnter={() => setHi(i)} onMouseLeave={() => setHi(null)} onClick={() => b.rows.length && setModal({ title: `Approval ${b.label}`, rows: b.rows })} className="flex flex-1 flex-col items-center gap-1 focus:outline-none">
                <span className="text-[10.5px] font-black tabular-nums text-slate-600">{b.rows.length || ""}</span>
                <div className="w-full max-w-[54px] overflow-hidden rounded-t-md transition-all" style={{ height: `${(b.rows.length / apprMax) * 100}%`, minHeight: b.rows.length ? 6 : 2, background: `linear-gradient(180deg, ${b.color}, ${b.color}cc)`, filter: hi === i ? "brightness(1.08)" : undefined }}>
                  <span aria-hidden className="block h-1/3 bg-gradient-to-b from-white/40 to-transparent" />
                </div>
              </button>
            ))}
          </div>
        </div>
        {/* legend */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-slate-100 pt-2.5 text-[11.5px] font-semibold text-slate-500">
          {APPROVAL_BUCKETS.map((b) => <span key={b.key} className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: b.color }} /> {b.label}</span>)}
        </div>
      </Section>

      {/* top customers (count + value) + aging */}
      <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-1">
        <Section title="Top Customers by GA Count" Icon={Users}><RankedList items={topByCount} primary="count" onPick={(name) => setModal({ title: `${name} · GA`, rows: filtered.filter((r) => r.company === name) })} /></Section>
        <Section title="Top Customers by GA Value" Icon={Users}><RankedList items={topByValue} primary="value" onPick={(name) => setModal({ title: `${name} · GA`, rows: filtered.filter((r) => r.company === name) })} /></Section>
        <Section title="GA Aging (pending approval)" Icon={Hourglass}><AgingChart rows={filtered} ageOf={(r) => r.aging} onSelect={(label, rs) => setModal({ title: `Aging ${label}`, rows: rs })} /></Section>
      </div>

      {/* popup */}
      {modal && (
        <DetailModal title={modal.title} subtitle={`${modal.rows.length} GA · ${inr(modal.rows.reduce((s, r) => s + r.value, 0))}`} Icon={BadgeCheck} from="#0a7d8a" to="#0069b3" onClose={() => setModal(null)}>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full border-collapse text-[12px]">
              <thead className="bg-slate-50"><tr className="text-left text-[10.5px] font-bold uppercase tracking-[0.03em] text-slate-400">{["SO No", "Customer", "GA No", "Status", "Appr. Days", "Delay", "Value"].map((h) => <th key={h} className="px-2.5 py-2">{h}</th>)}</tr></thead>
              <tbody>
                {modal.rows.slice(0, 200).map((r, i) => (
                  <tr key={`${r.ourSoNo}-${i}`} className="border-t border-slate-100">
                    <td className="px-2.5 py-1.5 font-bold text-slate-800">{r.ourSoNo}</td>
                    <td className="px-2.5 py-1.5 text-slate-600"><span className="flex items-center gap-1"><Building2 size={11} className="text-[#0069b3]" />{r.company || "—"}</span></td>
                    <td className="px-2.5 py-1.5 text-slate-500">{r.gaNo}</td>
                    <td className="px-2.5 py-1.5"><span className="rounded-full bg-[#0180cf]/10 px-1.5 py-0.5 text-[11px] font-bold text-[#0069b3]">{r.gaStatus}</span></td>
                    <td className="px-2.5 py-1.5 tabular-nums text-slate-500">{r.approvalDays ?? "—"}</td>
                    <td className="px-2.5 py-1.5 tabular-nums font-bold text-slate-700">{r.delay ? `${r.delay}d` : "—"}</td>
                    <td className="px-2.5 py-1.5 text-right tabular-nums font-semibold text-slate-700">{r.value ? inr(r.value) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DetailModal>
      )}
    </div>
  );
}

function custAgg(rows: GaRow[]): { name: string; count: number; value: number }[] {
  const m = new Map<string, { count: number; value: number }>();
  for (const r of rows) { if (!r.company) continue; const e = m.get(r.company) ?? { count: 0, value: 0 }; e.count++; e.value += r.value; m.set(r.company, e); }
  return Array.from(m.entries()).map(([name, e]) => ({ name, ...e }));
}
