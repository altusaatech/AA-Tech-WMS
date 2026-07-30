"use client";

import * as React from "react";
import {
  FileCheck2, BadgeCheck, ClipboardCheck, Truck, CheckCircle2, Clock3,
  Search, X, Filter, PieChart as PieIcon, Target, Hourglass, Users, Building2, TrendingUp,
} from "lucide-react";
import { Section, ExportButtons, DetailModal, compactInr } from "@/components/dashboards/shared/kit";
import { KpiCombo, PieChart, AgingChart, RankedList, inr } from "@/components/dashboards/shared/panels";

export interface SoRow {
  ourSoNo: string; enquiryNo: string; poNo: string; company: string; item: string; value: number;
  scope: string; soDate: string;
  gaRequired: boolean; gaStatus: string; gaCompleted: boolean;
  inBom: boolean; bomStatus: string; bomCompleted: boolean; bomNo: string | null; woNo: string | null;
  salesperson: string; expectedCompletion: string; stage: string;
  targetDispatch: string; actualDispatch: string; dispatched: boolean; onTime: boolean | null; delay: number; agingDays: number | null;
  date: string;
}

export function SalesOrderDashboard({ rows }: { rows: SoRow[] }) {
  const [q, setQ] = React.useState("");
  const [stage, setStage] = React.useState("");
  const [customer, setCustomer] = React.useState("");
  const [modal, setModal] = React.useState<{ title: string; rows: SoRow[] } | null>(null);

  const stages = React.useMemo(() => Array.from(new Set(rows.map((r) => r.stage).filter(Boolean))).sort(), [rows]);
  const customers = React.useMemo(() => Array.from(new Set(rows.map((r) => r.company).filter(Boolean))).sort(), [rows]);

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (stage && r.stage !== stage) return false;
      if (customer && r.company !== customer) return false;
      if (needle && ![r.ourSoNo, r.enquiryNo, r.company, r.item, r.salesperson, r.stage].some((v) => (v || "").toLowerCase().includes(needle))) return false;
      return true;
    });
  }, [rows, q, stage, customer]);

  const k = React.useMemo(() => {
    const sum = (a: SoRow[]) => a.reduce((s, r) => s + r.value, 0);
    const gaDone = filtered.filter((r) => r.gaCompleted), bomDone = filtered.filter((r) => r.bomCompleted);
    const disp = filtered.filter((r) => r.dispatched), pending = filtered.filter((r) => !r.dispatched);
    const onTime = filtered.filter((r) => r.onTime === true), delayed = filtered.filter((r) => r.onTime === false);
    return {
      total: filtered.length, orderValue: sum(filtered),
      gaDone: gaDone.length, gaVal: sum(gaDone), bomDone: bomDone.length, bomVal: sum(bomDone),
      disp: disp.length, dispVal: sum(disp), pending: pending.length, pendingVal: sum(pending),
      onTime: onTime.length, delayed: delayed.length,
      onTimePct: disp.length ? Math.round((onTime.length / disp.length) * 100) : 0,
      gaRows: gaDone, bomRows: bomDone, dispRows: disp, pendingRows: pending,
    };
  }, [filtered]);

  const stageDist = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtered) m.set(r.stage || "—", (m.get(r.stage || "—") ?? 0) + 1);
    return Array.from(m.entries()).map(([label, value]) => ({ label, value }));
  }, [filtered]);

  const tvaDist = [
    { label: "On Time", value: k.onTime },
    { label: "Delayed", value: k.delayed },
    { label: "Pending", value: k.pending },
  ].filter((x) => x.value > 0);

  const topCustomers = React.useMemo(() => {
    const m = new Map<string, { count: number; value: number }>();
    for (const r of filtered) { if (!r.company) continue; const e = m.get(r.company) ?? { count: 0, value: 0 }; e.count++; e.value += r.value; m.set(r.company, e); }
    return Array.from(m.entries()).map(([name, e]) => ({ name, ...e })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [filtered]);

  const board = React.useMemo(() => {
    const m = new Map<string, SoRow[]>();
    for (const r of filtered) { const n = r.salesperson || "—"; const a = m.get(n) ?? []; a.push(r); m.set(n, a); }
    return Array.from(m.entries()).map(([name, rs]) => ({
      name, orders: rs.length, dispatched: rs.filter((r) => r.dispatched).length,
      onTime: rs.filter((r) => r.onTime === true).length, value: rs.reduce((s, r) => s + r.value, 0), rows: rs,
    })).sort((a, b) => b.value - a.value);
  }, [filtered]);

  const dispatchedRows = React.useMemo(() => filtered.filter((r) => r.dispatched || r.targetDispatch !== "—").sort((a, b) => b.delay - a.delay).slice(0, 60), [filtered]);

  const reset = () => { setQ(""); setStage(""); setCustomer(""); };
  const anyFilter = q || stage || customer;

  return (
    <div className="mt-6 space-y-5">
      {/* ── filters: single line ── */}
      <div className="flex items-center gap-2.5 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="relative shrink-0"><Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="h-9 w-[200px] rounded-lg border border-slate-200 bg-white pl-8 pr-2.5 text-[13px] outline-none focus:border-[#0180cf]" /></div>
        <select value={stage} onChange={(e) => setStage(e.target.value)} className="h-9 shrink-0 rounded-lg border border-slate-200 bg-white px-2 text-[12.5px] font-semibold text-slate-600 outline-none focus:border-[#0180cf]"><option value="">All stages</option>{stages.map((s) => <option key={s} value={s}>{s}</option>)}</select>
        <select value={customer} onChange={(e) => setCustomer(e.target.value)} className="h-9 max-w-[190px] shrink-0 rounded-lg border border-slate-200 bg-white px-2 text-[12.5px] font-semibold text-slate-600 outline-none focus:border-[#0180cf]"><option value="">All customers</option>{customers.map((c) => <option key={c} value={c}>{c}</option>)}</select>
        {anyFilter && <button type="button" onClick={reset} className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg px-2 text-[12.5px] font-bold text-slate-500 hover:text-[#0069b3]"><X size={13} /> Clear</button>}
        <span className="ml-auto flex shrink-0 items-center gap-2 whitespace-nowrap text-[12px] font-semibold text-slate-400"><Filter size={13} /> {filtered.length} of {rows.length}
          <ExportButtons filename="sales-order-status" headers={["SO No", "Customer", "Item", "Value", "Stage", "Dispatched", "Target", "Actual", "Delay", "Salesperson"]} rows={filtered.map((r) => [r.ourSoNo, r.company, r.item, r.value, r.stage, r.dispatched ? "Yes" : "No", r.targetDispatch, r.actualDispatch, r.delay, r.salesperson])} />
        </span>
      </div>

      {/* ── KPI count + value pairs ── */}
      <div className="grid grid-cols-6 gap-3.5 max-xl:grid-cols-3 max-md:grid-cols-2">
        <KpiCombo label="Total SOs" count={k.total} subLabel="Order Value" subValue={compactInr(k.orderValue)} Icon={FileCheck2} from="#2a78d6" to="#185fa5" onClick={() => setModal({ title: "All Sales Orders", rows: filtered })} />
        <KpiCombo label="GA Completed" count={k.gaDone} subLabel="GA Value" subValue={compactInr(k.gaVal)} Icon={BadgeCheck} from="#0a7d8a" to="#0069b3" onClick={() => setModal({ title: "GA Completed", rows: k.gaRows })} />
        <KpiCombo label="BOM Released" count={k.bomDone} subLabel="BOM Value" subValue={compactInr(k.bomVal)} Icon={ClipboardCheck} from="#63b81e" to="#4a9616" onClick={() => setModal({ title: "BOM Released", rows: k.bomRows })} />
        <KpiCombo label="Dispatched" count={k.disp} subLabel="Dispatched Value" subValue={compactInr(k.dispVal)} Icon={Truck} from="#4a9616" to="#3f7a14" onClick={() => setModal({ title: "Dispatched", rows: k.dispRows })} />
        <KpiCombo label="On-Time" count={k.onTime} subLabel="On-Time Rate" subValue={`${k.onTimePct}%`} Icon={CheckCircle2} from="#0069b3" to="#0180cf" />
        <KpiCombo label="Pending Dispatch" count={k.pending} subLabel="Pending Value" subValue={compactInr(k.pendingVal)} Icon={Clock3} from="#f59e0b" to="#d97706" onClick={() => setModal({ title: "Pending Dispatch", rows: k.pendingRows })} />
      </div>

      {/* ── status pie + target vs actual ── */}
      <div className="grid grid-cols-5 gap-5 max-lg:grid-cols-1">
        <div className="col-span-3 max-lg:col-span-1"><Section title="SO Status Distribution" Icon={PieIcon}><PieChart data={stageDist} centerCaption="Orders" /></Section></div>
        <div className="col-span-2 max-lg:col-span-1"><Section title="Target vs Actual" Icon={Target}>{tvaDist.length ? <PieChart data={tvaDist} centerCaption="Orders" /> : <p className="py-8 text-center text-[13px] text-slate-400">No dispatch data.</p>}</Section></div>
      </div>

      {/* ── order aging + top customers ── */}
      <div className="grid grid-cols-5 gap-5 max-lg:grid-cols-1">
        <div className="col-span-3 max-lg:col-span-1"><Section title="Order Aging (open orders)" Icon={Hourglass}><AgingChart rows={filtered} ageOf={(r) => r.agingDays} onSelect={(label, rs) => setModal({ title: `Aging ${label}`, rows: rs })} /></Section></div>
        <div className="col-span-2 max-lg:col-span-1"><Section title="Top Customers by SO Value" Icon={Users}><RankedList items={topCustomers} onPick={(name) => setModal({ title: `${name} · Sales Orders`, rows: filtered.filter((r) => r.company === name) })} /></Section></div>
      </div>

      {/* ── salesperson leaderboard ── */}
      <Section title="Salesperson Leaderboard" Icon={Users}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead><tr className="text-left text-[10.5px] font-black uppercase tracking-[0.03em] text-slate-400">{["#", "Salesperson", "Orders", "Dispatched", "On-Time", "SO Value"].map((h) => <th key={h} className="px-2 py-2">{h}</th>)}</tr></thead>
            <tbody>
              {board.map((b, i) => (
                <tr key={b.name} onClick={() => setModal({ title: `${b.name} · Sales Orders`, rows: b.rows })} className="cursor-pointer border-t border-slate-100 hover:bg-[#0180cf]/6">
                  <td className="px-2 py-1.5"><span className="inline-flex size-5 items-center justify-center rounded-full text-[10px] font-black text-white" style={{ background: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#b45309" : "#cbd5e1" }}>{i + 1}</span></td>
                  <td className="px-2 py-1.5 font-bold text-slate-800">{b.name}</td>
                  <td className="px-2 py-1.5 tabular-nums text-slate-600">{b.orders}</td>
                  <td className="px-2 py-1.5 tabular-nums font-bold text-[#3f7a14]">{b.dispatched}</td>
                  <td className="px-2 py-1.5 tabular-nums text-[#0069b3]">{b.onTime}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums font-black text-slate-700">{compactInr(b.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── target vs actual table ── */}
      <Section title="Target vs Actual Dispatch" Icon={TrendingUp}>
        <div className="max-h-[340px] overflow-auto rounded-xl border border-slate-200">
          <table className="w-full border-collapse text-[12px]">
            <thead className="sticky top-0 bg-slate-50"><tr className="text-left text-[10px] font-black uppercase tracking-[0.03em] text-slate-400">{["SO No", "Customer", "Target", "Actual", "Delay", "Status"].map((h) => <th key={h} className="px-2.5 py-2">{h}</th>)}</tr></thead>
            <tbody>
              {dispatchedRows.length === 0 ? <tr><td colSpan={6} className="px-3 py-6 text-center text-slate-400">No dispatch data.</td></tr> : dispatchedRows.map((r, i) => (
                <tr key={`${r.ourSoNo}-${i}`} className="border-t border-slate-100">
                  <td className="px-2.5 py-1.5 font-bold text-slate-800">{r.ourSoNo}</td>
                  <td className="px-2.5 py-1.5 text-slate-600"><span className="flex items-center gap-1"><Building2 size={11} className="text-[#0069b3]" />{r.company || "—"}</span></td>
                  <td className="px-2.5 py-1.5 tabular-nums text-slate-500">{r.targetDispatch}</td>
                  <td className="px-2.5 py-1.5 tabular-nums text-slate-500">{r.actualDispatch}</td>
                  <td className="px-2.5 py-1.5 tabular-nums font-bold text-slate-700">{r.delay ? `${r.delay}d` : "—"}</td>
                  <td className="px-2.5 py-1.5">{r.onTime == null ? <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10.5px] font-bold text-amber-700">Pending</span> : <span className="rounded-full px-1.5 py-0.5 text-[10.5px] font-bold" style={{ background: r.onTime ? "rgba(99,184,30,0.16)" : "rgba(190,18,60,0.10)", color: r.onTime ? "#3f7a14" : "#be123c" }}>{r.onTime ? "On time" : "Delayed"}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* popup */}
      {modal && (
        <DetailModal title={modal.title} subtitle={`${modal.rows.length} order${modal.rows.length === 1 ? "" : "s"} · ${inr(modal.rows.reduce((s, r) => s + r.value, 0))}`} Icon={FileCheck2} from="#0069b3" to="#0180cf" onClose={() => setModal(null)}>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full border-collapse text-[12px]">
              <thead className="bg-slate-50"><tr className="text-left text-[10.5px] font-bold uppercase tracking-[0.03em] text-slate-400">{["SO No", "Customer", "Item", "Value", "Stage", "Dispatch", "Salesperson"].map((h) => <th key={h} className="px-2.5 py-2">{h}</th>)}</tr></thead>
              <tbody>
                {modal.rows.slice(0, 200).map((r, i) => (
                  <tr key={`${r.ourSoNo}-${i}`} className="border-t border-slate-100">
                    <td className="px-2.5 py-1.5 font-bold text-slate-800">{r.ourSoNo}</td>
                    <td className="px-2.5 py-1.5 text-slate-600">{r.company || "—"}</td>
                    <td className="max-w-[150px] truncate px-2.5 py-1.5 text-slate-500" title={r.item}>{r.item || "—"}</td>
                    <td className="px-2.5 py-1.5 text-right tabular-nums font-semibold text-slate-700">{r.value ? inr(r.value) : "—"}</td>
                    <td className="px-2.5 py-1.5"><span className="rounded-full bg-[#0180cf]/10 px-1.5 py-0.5 text-[11px] font-bold text-[#0069b3]">{r.stage}</span></td>
                    <td className="px-2.5 py-1.5 tabular-nums text-slate-500">{r.actualDispatch !== "—" ? r.actualDispatch : r.targetDispatch}</td>
                    <td className="px-2.5 py-1.5 text-slate-500">{r.salesperson}</td>
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
