"use client";

import * as React from "react";
import {
  ClipboardList, ClipboardCheck, Loader, Timer, RefreshCcw, CheckCircle2, Search, X, Filter,
  PieChart as PieIcon, Target, Hourglass, Users, Building2, TrendingUp, AlertTriangle,
} from "lucide-react";
import { Section, ExportButtons, DetailModal, StatusBars, compactInr } from "@/components/dashboards/shared/kit";
import { KpiCombo, PieChart, AgingChart, RankedList, TrendColumns, type Bucket, MON, inr } from "@/components/dashboards/shared/panels";

export interface BomRow {
  ourSoNo: string; company: string; item: string; value: number; bomNo: string;
  bomStatus: string; completed: boolean; amended: boolean; noOfDays: number | null;
  targetDate: string; actualDate: string; onTime: boolean | null; delay: number; aging: number | null; reason: string; date: string;
}

export function BomStatusDashboard({ rows }: { rows: BomRow[] }) {
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [customer, setCustomer] = React.useState("");
  const [modal, setModal] = React.useState<{ title: string; rows: BomRow[] } | null>(null);

  const statuses = React.useMemo(() => Array.from(new Set(rows.map((r) => r.bomStatus).filter(Boolean))).sort(), [rows]);
  const customers = React.useMemo(() => Array.from(new Set(rows.map((r) => r.company).filter(Boolean))).sort(), [rows]);

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (status && r.bomStatus !== status) return false;
      if (customer && r.company !== customer) return false;
      if (needle && ![r.ourSoNo, r.company, r.item, r.bomNo, r.bomStatus].some((v) => (v || "").toLowerCase().includes(needle))) return false;
      return true;
    });
  }, [rows, q, status, customer]);

  const years = React.useMemo(() => Array.from(new Set(filtered.map((r) => r.date.slice(0, 4)).filter(Boolean))).sort().reverse(), [filtered]);
  const [year, setYear] = React.useState("");
  React.useEffect(() => { if (years.length && !years.includes(year)) setYear(years[0]!); }, [years, year]);

  const k = React.useMemo(() => {
    const sum = (a: BomRow[]) => a.reduce((s, r) => s + r.value, 0);
    const done = filtered.filter((r) => r.completed), prog = filtered.filter((r) => !r.completed);
    const onTime = filtered.filter((r) => r.onTime === true), amended = filtered.filter((r) => r.amended);
    const days = done.map((r) => r.noOfDays).filter((d): d is number => d != null);
    return {
      total: filtered.length, value: sum(filtered),
      done: done.length, doneVal: sum(done), prog: prog.length, progVal: sum(prog),
      onTime: onTime.length, onTimePct: done.length ? Math.round((onTime.length / done.length) * 100) : 0,
      amended: amended.length, avgDays: days.length ? Math.round(days.reduce((s, x) => s + x, 0) / days.length) : 0,
      doneRows: done, progRows: prog, amendedRows: amended,
    };
  }, [filtered]);

  const statusDist = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtered) m.set(r.bomStatus || "—", (m.get(r.bomStatus || "—") ?? 0) + 1);
    return Array.from(m.entries()).map(([label, value]) => ({ label, value }));
  }, [filtered]);

  const tvaDist = [
    { label: "On Time", value: filtered.filter((r) => r.onTime === true).length },
    { label: "Delayed", value: filtered.filter((r) => r.onTime === false).length },
    { label: "In Progress", value: k.prog },
  ].filter((x) => x.value > 0);

  const monthly: Bucket<BomRow>[] = React.useMemo(() => {
    const inYear = filtered.filter((r) => r.date.slice(0, 4) === year);
    return MON.map((label, mi) => ({ key: `${year}-${mi}`, label, rows: inYear.filter((r) => Number(r.date.slice(5, 7)) === mi + 1) }));
  }, [filtered, year]);

  const topCustomers = React.useMemo(() => {
    const m = new Map<string, { count: number; value: number }>();
    for (const r of filtered) { if (!r.company) continue; const e = m.get(r.company) ?? { count: 0, value: 0 }; e.count++; e.value += r.value; m.set(r.company, e); }
    return Array.from(m.entries()).map(([name, e]) => ({ name, ...e })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [filtered]);

  const delayReasons = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtered) { const rr = r.reason.trim(); if (!rr || /^(na|n\/a|not applicable|-)$/i.test(rr)) continue; m.set(rr, (m.get(rr) ?? 0) + 1); }
    return Array.from(m.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [filtered]);

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
          <ExportButtons filename="bom-status" headers={["SO No", "Customer", "BOM No", "Status", "Target", "Actual", "Delay", "Value"]} rows={filtered.map((r) => [r.ourSoNo, r.company, r.bomNo, r.bomStatus, r.targetDate, r.actualDate, r.delay, r.value])} />
        </span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-6 gap-3.5 max-xl:grid-cols-3 max-md:grid-cols-2">
        <KpiCombo label="Total BOM" count={k.total} subLabel="BOM Value" subValue={compactInr(k.value)} Icon={ClipboardList} from="#2a78d6" to="#185fa5" onClick={() => setModal({ title: "All BOM", rows: filtered })} />
        <KpiCombo label="Completed" count={k.done} subLabel="Completed Value" subValue={compactInr(k.doneVal)} Icon={ClipboardCheck} from="#63b81e" to="#4a9616" onClick={() => setModal({ title: "BOM Completed", rows: k.doneRows })} />
        <KpiCombo label="In Progress" count={k.prog} subLabel="In-Progress Value" subValue={compactInr(k.progVal)} Icon={Loader} from="#f59e0b" to="#d97706" onClick={() => setModal({ title: "BOM In Progress", rows: k.progRows })} />
        <KpiCombo label="On-Time" count={k.onTime} subLabel="On-Time Rate" subValue={`${k.onTimePct}%`} Icon={CheckCircle2} from="#0069b3" to="#0180cf" />
        <KpiCombo label="Amended" count={k.amended} subLabel="Amendments" subValue={`${k.total ? Math.round((k.amended / k.total) * 100) : 0}%`} Icon={RefreshCcw} from="#7c3aed" to="#6d28d9" onClick={() => setModal({ title: "BOM Amended", rows: k.amendedRows })} />
        <KpiCombo label="Avg Days" count={`${k.avgDays}d`} subLabel="To complete" Icon={Timer} from="#0a7d8a" to="#0069b3" />
      </div>

      {/* status pie + target vs actual */}
      <div className="grid grid-cols-5 gap-5 max-lg:grid-cols-1">
        <div className="col-span-3 max-lg:col-span-1"><Section title="BOM Status Distribution" Icon={PieIcon}><PieChart data={statusDist} centerCaption="BOMs" /></Section></div>
        <div className="col-span-2 max-lg:col-span-1"><Section title="Target vs Actual" Icon={Target}>{tvaDist.length ? <PieChart data={tvaDist} centerCaption="BOMs" /> : <p className="py-8 text-center text-[13px] text-slate-400">No completion data.</p>}</Section></div>
      </div>

      {/* monthly completion trend */}
      <Section title="Monthly BOM Completion" Icon={TrendingUp}>
        <div className="mb-3 flex items-center gap-2">
          <select value={year} onChange={(e) => setYear(e.target.value)} className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[12.5px] font-bold text-slate-600 outline-none focus:border-[#0180cf]">{years.map((y) => <option key={y} value={y}>{y}</option>)}</select>
          <span className="ml-auto text-[11.5px] font-semibold text-slate-400">click a bar for details</span>
        </div>
        <TrendColumns data={monthly} valueOf={(r) => r.value} unit="BOMs" onSelect={(b) => setModal({ title: `${b.label} ${year} · BOM`, rows: b.rows })} />
      </Section>

      {/* aging + top customers + delay reasons */}
      <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-1">
        <Section title="BOM Aging (in progress)" Icon={Hourglass}><AgingChart rows={filtered} ageOf={(r) => r.aging} onSelect={(label, rs) => setModal({ title: `Aging ${label}`, rows: rs })} /></Section>
        <Section title="Top Customers by BOM Value" Icon={Users}><RankedList items={topCustomers} onPick={(name) => setModal({ title: `${name} · BOM`, rows: filtered.filter((r) => r.company === name) })} /></Section>
        <Section title="Top Reasons for Delay" Icon={AlertTriangle}>{delayReasons.length ? <StatusBars data={delayReasons} /> : <p className="py-6 text-center text-[13px] text-slate-400">No delays recorded 🎉</p>}</Section>
      </div>

      {/* popup */}
      {modal && (
        <DetailModal title={modal.title} subtitle={`${modal.rows.length} BOM · ${inr(modal.rows.reduce((s, r) => s + r.value, 0))}`} Icon={ClipboardList} from="#4a9616" to="#3f7a14" onClose={() => setModal(null)}>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full border-collapse text-[12px]">
              <thead className="bg-slate-50"><tr className="text-left text-[10.5px] font-bold uppercase tracking-[0.03em] text-slate-400">{["SO No", "Customer", "BOM No", "Status", "Target", "Actual", "Value"].map((h) => <th key={h} className="px-2.5 py-2">{h}</th>)}</tr></thead>
              <tbody>
                {modal.rows.slice(0, 200).map((r, i) => (
                  <tr key={`${r.ourSoNo}-${i}`} className="border-t border-slate-100">
                    <td className="px-2.5 py-1.5 font-bold text-slate-800">{r.ourSoNo}</td>
                    <td className="px-2.5 py-1.5 text-slate-600"><span className="flex items-center gap-1"><Building2 size={11} className="text-[#0069b3]" />{r.company || "—"}</span></td>
                    <td className="px-2.5 py-1.5 text-slate-500">{r.bomNo}</td>
                    <td className="px-2.5 py-1.5"><span className="rounded-full bg-[#0180cf]/10 px-1.5 py-0.5 text-[11px] font-bold text-[#0069b3]">{r.bomStatus}</span></td>
                    <td className="px-2.5 py-1.5 tabular-nums text-slate-500">{r.targetDate}</td>
                    <td className="px-2.5 py-1.5 tabular-nums text-slate-500">{r.actualDate}</td>
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
