"use client";

import * as React from "react";
import {
  Factory, BadgeCheck, ClipboardCheck, Wrench, Truck, CheckCircle2, Clock3, Timer,
  TrendingUp, Layers, GitBranch, Filter, Search, X, Building2, IndianRupee, CalendarClock,
  FileText, Workflow, Rocket, Zap, Star, AlertTriangle, PackageCheck, Hourglass, MapPin, PencilRuler,
} from "lucide-react";
import {
  Section, TrendBars, StatusBars, InsightsPanel, DetailModal, ProgressStat,
  WorkflowTimeline, ExportButtons, inr, compactInr, Gauge, MetricChip,
  StatCard, ActivityFeed, Donut, type Activity,
} from "@/components/dashboards/shared/kit";

export interface ProdRow {
  ourSoNo: string; company: string; item: string; value: number; scope: string; soDate: string;
  gaRequired: boolean; gaApproved: boolean; gaDelay: number;
  bomReleased: boolean; bomDelay: number;
  woIssued: boolean; woPendingWhere: string;
  dispatched: boolean; dispatchTarget: string; dispatchActual: string; dispatchDelay: number;
  onTime: boolean | null;
  stage: string; delayReason: string; date: string;
}

type ModalKey = "all" | "ga" | "bom" | "wo" | "disp" | "ontime" | "delayed" | null;
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function ProductionDashboard({ rows }: { rows: ProdRow[] }) {
  const [q, setQ] = React.useState("");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [stage, setStage] = React.useState("");
  const [customer, setCustomer] = React.useState("");
  const [modal, setModal] = React.useState<ModalKey>(null);
  const [row, setRow] = React.useState<ProdRow | null>(null);

  const stages = React.useMemo(() => Array.from(new Set(rows.map((r) => r.stage))).sort(), [rows]);
  const customers = React.useMemo(() => Array.from(new Set(rows.map((r) => r.company).filter(Boolean))).sort(), [rows]);

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (from && r.date && r.date < from) return false;
      if (to && r.date && r.date > to) return false;
      if (stage && r.stage !== stage) return false;
      if (customer && r.company !== customer) return false;
      if (needle && ![r.ourSoNo, r.company, r.item, r.scope, r.stage, r.delayReason].some((v) => v.toLowerCase().includes(needle))) return false;
      return true;
    });
  }, [rows, q, from, to, stage, customer]);

  const k = React.useMemo(() => {
    const total = filtered.length;
    const gaApproved = filtered.filter((r) => r.gaApproved).length;
    const bomReleased = filtered.filter((r) => r.bomReleased).length;
    const woIssued = filtered.filter((r) => r.woIssued).length;
    const dispatched = filtered.filter((r) => r.dispatched).length;
    const onTime = filtered.filter((r) => r.onTime === true).length;
    const delayed = filtered.filter((r) => r.onTime === false).length;
    const value = filtered.reduce((s, r) => s + r.value, 0);
    const delays = filtered.filter((r) => r.onTime === false).map((r) => r.dispatchDelay);
    const avgDelay = delays.length ? Math.round(delays.reduce((s, x) => s + x, 0) / delays.length) : 0;
    const onTimePct = dispatched ? Math.round((onTime / dispatched) * 100) : 0;
    return { total, gaApproved, bomReleased, woIssued, dispatched, onTime, delayed, value, avgDelay, onTimePct };
  }, [filtered]);

  const trend = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtered) if (r.dispatched && r.dispatchActual && r.dispatchActual !== "—") {
      const key = r.dispatchActual.slice(0, 7);
      m.set(key, (m.get(key) ?? 0) + 1);
    }
    return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-8).map(([key, v]) => ({ label: MON[Number(key.slice(5, 7)) - 1] ?? key, value: v }));
  }, [filtered]);

  const stageDist = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtered) m.set(r.stage, (m.get(r.stage) ?? 0) + 1);
    return Array.from(m.entries()).sort(([, a], [, b]) => b - a).map(([label, v]) => ({ label, value: v }));
  }, [filtered]);

  const onTimeDist = [
    { label: "On Time", value: k.onTime },
    { label: "Delayed", value: k.delayed },
    { label: "In Production", value: k.total - k.dispatched },
  ].filter((x) => x.value > 0);

  const bottleneck = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtered) {
      if (r.dispatched) continue;
      const where = r.woPendingWhere || (r.stage === "Order Confirmed" ? "Awaiting GA" : `Stuck at ${r.stage}`);
      m.set(where, (m.get(where) ?? 0) + 1);
    }
    return Array.from(m.entries()).sort(([, a], [, b]) => b - a).slice(0, 6).map(([label, v]) => ({ label, value: v }));
  }, [filtered]);

  // monthly sparklines + deltas (respond to filters)
  const sp = React.useMemo(() => {
    const g = () => new Map<string, number>();
    const totM = g(), dispM = g(), valM = g();
    for (const r of filtered) {
      if (!r.date) continue; const m = r.date.slice(0, 7);
      totM.set(m, (totM.get(m) ?? 0) + 1);
      if (r.dispatched) dispM.set(m, (dispM.get(m) ?? 0) + 1);
      valM.set(m, (valM.get(m) ?? 0) + r.value);
    }
    const months = [...new Set([...totM.keys(), ...dispM.keys(), ...valM.keys()])].sort().slice(-8);
    const arr = (mp: Map<string, number>) => months.map((m) => mp.get(m) ?? 0);
    const d = (mp: Map<string, number>) => { const a = mp.get(months[months.length - 1] ?? "") ?? 0, b = mp.get(months[months.length - 2] ?? "") ?? 0; return b ? Math.max(-999, Math.min(999, Math.round(((a - b) / b) * 100))) : a ? 100 : 0; };
    return { tot: arr(totM), disp: arr(dispM), val: arr(valM), dTot: d(totM), dDisp: d(dispM), dVal: d(valM) };
  }, [filtered]);

  const activities: Activity[] = React.useMemo(() => {
    const acts = filtered.map((r): Activity => {
      if (r.dispatched) return { kind: "dispatch", title: `Dispatched · ${r.ourSoNo}`, subtitle: r.company, date: r.date, amount: r.value };
      if (r.woIssued) return { kind: "so", title: `Work Order · ${r.ourSoNo}`, subtitle: r.company, date: r.date, amount: r.value };
      if (r.bomReleased) return { kind: "bom", title: `BOM released · ${r.ourSoNo}`, subtitle: r.company, date: r.date, amount: r.value };
      if (r.gaApproved) return { kind: "ga", title: `GA approved · ${r.ourSoNo}`, subtitle: r.company, date: r.date, amount: r.value };
      return { kind: "so", title: `Order ${r.ourSoNo}`, subtitle: r.company, date: r.date, amount: r.value };
    });
    return acts.filter((a) => a.date).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
  }, [filtered]);

  const meta = {
    all: { title: "Orders in Production", Icon: Factory, from: "#0180cf", to: "#0069b3", rows: filtered },
    ga: { title: "GA Approved", Icon: BadgeCheck, from: "#0a7d8a", to: "#0069b3", rows: filtered.filter((r) => r.gaApproved) },
    bom: { title: "BOM Released", Icon: ClipboardCheck, from: "#4a9616", to: "#3f7a14", rows: filtered.filter((r) => r.bomReleased) },
    wo: { title: "Work Orders Issued", Icon: Wrench, from: "#0069b3", to: "#0180cf", rows: filtered.filter((r) => r.woIssued) },
    disp: { title: "Dispatched", Icon: Truck, from: "#63b81e", to: "#3f7a14", rows: filtered.filter((r) => r.dispatched) },
    ontime: { title: "On-Time Dispatches", Icon: CheckCircle2, from: "#63b81e", to: "#3f7a14", rows: filtered.filter((r) => r.onTime === true) },
    delayed: { title: "Delayed Dispatches", Icon: Clock3, from: "#b45309", to: "#92400e", rows: filtered.filter((r) => r.onTime === false) },
  } as const;
  const active = modal ? meta[modal] : null;

  const reset = () => { setQ(""); setFrom(""); setTo(""); setStage(""); setCustomer(""); };
  const anyFilter = q || from || to || stage || customer;

  return (
    <div className="mt-6 space-y-5">
      {/* filters */}
      <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="relative"><Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search records…" className="h-9 w-[220px] max-w-[52vw] rounded-lg border border-slate-200 bg-white pl-8 pr-2.5 text-[13px] outline-none focus:border-[#0180cf]" /></div>
        <label className="inline-flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[0.04em] text-slate-400">From<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-[12.5px] outline-none focus:border-[#0180cf]" /></label>
        <label className="inline-flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[0.04em] text-slate-400">To<input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-[12.5px] outline-none focus:border-[#0180cf]" /></label>
        <select value={stage} onChange={(e) => setStage(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-[12.5px] font-semibold text-slate-600 outline-none focus:border-[#0180cf]"><option value="">All stages</option>{stages.map((s) => <option key={s} value={s}>{s}</option>)}</select>
        <select value={customer} onChange={(e) => setCustomer(e.target.value)} className="h-9 max-w-[180px] rounded-lg border border-slate-200 bg-white px-2 text-[12.5px] font-semibold text-slate-600 outline-none focus:border-[#0180cf]"><option value="">All customers</option>{customers.map((c) => <option key={c} value={c}>{c}</option>)}</select>
        {anyFilter && <button type="button" onClick={reset} className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-[12.5px] font-bold text-slate-500 hover:text-[#0069b3]"><X size={13} /> Clear</button>}
        <span className="ml-auto flex items-center gap-2 text-[12px] font-semibold text-slate-400"><Filter size={13} /> {filtered.length} of {rows.length}
          <ExportButtons filename="production" headers={["SO No", "Customer", "Item", "Value", "Scope", "Stage", "GA", "BOM", "Work Order", "Dispatched", "Target Dispatch", "Actual Dispatch", "Delay (d)", "On Time"]} rows={filtered.map((r) => [r.ourSoNo, r.company, r.item, r.value, r.scope, r.stage, r.gaApproved ? "Yes" : "No", r.bomReleased ? "Yes" : "No", r.woIssued ? "Yes" : "No", r.dispatched ? "Yes" : "No", r.dispatchTarget, r.dispatchActual, r.dispatchDelay, r.onTime == null ? "—" : r.onTime ? "Yes" : "No"])} />
        </span>
      </div>

      {/* hero stat cards */}
      <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
        <StatCard label="In Production" display={String(k.total)} delta={sp.dTot} spark={sp.tot} Icon={Factory} from="#2a78d6" to="#185fa5" onDetails={() => setModal("all")} />
        <StatCard label="Dispatched" display={String(k.dispatched)} delta={sp.dDisp} spark={sp.disp} Icon={Truck} from="#63b81e" to="#4a9616" onDetails={() => setModal("disp")} />
        <StatCard label="On-Time Rate" display={`${k.onTimePct}%`} Icon={Timer} from="#7c3aed" to="#6d28d9" />
        <StatCard label="Order Value" display={compactInr(k.value)} delta={sp.dVal} spark={sp.val} Icon={IndianRupee} from="#f59e0b" to="#d97706" />
      </div>

      {/* recent activity + on-time */}
      <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-1">
        <div className="col-span-2 max-lg:col-span-1"><Section title="Recent Activity" Icon={Clock3}><ActivityFeed items={activities} /></Section></div>
        <Section title="On-Time Delivery" Icon={Timer}>
          <div className="flex flex-col items-center gap-3 py-1">
            <Donut pct={k.onTimePct} caption="On-Time" />
            <div className="grid w-full grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-center"><div className="text-[11px] font-bold uppercase tracking-[0.05em] text-slate-400">On Time</div><div className="text-[18px] font-black tabular-nums text-[#3f7a14]">{k.onTime}</div></div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-center"><div className="text-[11px] font-bold uppercase tracking-[0.05em] text-slate-400">Delayed</div><div className="text-[18px] font-black tabular-nums text-[#b45309]">{k.delayed}</div></div>
            </div>
          </div>
        </Section>
      </div>

      {/* progress + stage */}
      <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-1">
        <Section title="Pipeline Progress" Icon={Workflow}>
          <div className="space-y-4">
            <ProgressStat label="GA Approved" done={k.gaApproved} total={k.total} from="#0a7d8a" to="#0069b3" />
            <ProgressStat label="BOM Released" done={k.bomReleased} total={k.total} from="#4a9616" to="#3f7a14" />
            <ProgressStat label="Work Orders Issued" done={k.woIssued} total={k.total} from="#0069b3" to="#0180cf" />
            <ProgressStat label="Dispatched" done={k.dispatched} total={k.total} />
          </div>
        </Section>
        <div className="col-span-2 max-lg:col-span-1"><Section title="Production Stage" Icon={Layers}><StatusBars data={stageDist} /></Section></div>
      </div>

      {/* trend + on-time + bottleneck */}
      <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-1">
        <Section title="Monthly Dispatch Trend" Icon={TrendingUp}><TrendBars data={trend} /></Section>
        <Section title="On-Time vs Delayed" Icon={Timer}>{onTimeDist.length ? <StatusBars data={onTimeDist} /> : <p className="py-6 text-center text-[13px] text-slate-400">No dispatches yet.</p>}</Section>
        <Section title="Bottleneck Analysis" Icon={MapPin}>{bottleneck.length ? <StatusBars data={bottleneck} /> : <p className="py-6 text-center text-[13px] text-slate-400">Nothing stuck 🎉</p>}</Section>
      </div>

      {/* workflow */}
      <Section title="Production Workflow" Icon={GitBranch}>
        <WorkflowTimeline
          stages={[{ label: "Sales Order", count: k.total }, { label: "GA Approved", count: k.gaApproved }, { label: "BOM Released", count: k.bomReleased }, { label: "Work Order", count: k.woIssued }, { label: "Dispatched", count: k.dispatched }]}
          icons={[FileText, PencilRuler, ClipboardCheck, Wrench, Truck]}
        />
      </Section>

      {/* ── advanced: Delivery Performance & Bottlenecks ── */}
      <DeliveryPerformance rows={filtered} k={k} />

      {/* Insights always last */}
      <InsightsPanel items={insights(k)} />

      {/* KPI popup */}
      {active && (
        <DetailModal title={active.title} Icon={active.Icon} from={active.from} to={active.to} onClose={() => setModal(null)}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-[13px] font-bold text-slate-500">{active.rows.length} record{active.rows.length === 1 ? "" : "s"}</span>
            <ExportButtons filename={active.title.replace(/\s+/g, "-").toLowerCase()} headers={["SO No", "Customer", "Item", "Stage", "Target Dispatch", "Actual Dispatch", "Delay (d)"]} rows={active.rows.map((r) => [r.ourSoNo, r.company, r.item, r.stage, r.dispatchTarget, r.dispatchActual, r.dispatchDelay])} />
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full border-collapse text-[12px]">
              <thead className="bg-slate-50"><tr className="text-left text-[10.5px] font-bold uppercase tracking-[0.03em] text-slate-400">
                {["SO No", "Customer", "Stage", "Target", "Actual", "Delay", "On Time"].map((h) => <th key={h} className="px-2.5 py-2">{h}</th>)}
              </tr></thead>
              <tbody>
                {active.rows.map((r) => (
                  <tr key={r.ourSoNo} onClick={() => { setRow(r); setModal(null); }} className="cursor-pointer border-t border-slate-100 hover:bg-[#0180cf]/6">
                    <td className="px-2.5 py-1.5 font-bold text-slate-800">{r.ourSoNo}</td>
                    <td className="px-2.5 py-1.5 text-slate-600"><span className="flex items-center gap-1"><Building2 size={11} className="text-[#0069b3]" />{r.company || "—"}</span></td>
                    <td className="px-2.5 py-1.5"><span className="rounded-full bg-[#0180cf]/10 px-1.5 py-0.5 text-[11px] font-bold text-[#0069b3]">{r.stage}</span></td>
                    <td className="px-2.5 py-1.5 tabular-nums text-slate-500">{r.dispatchTarget}</td>
                    <td className="px-2.5 py-1.5 tabular-nums text-slate-500">{r.dispatchActual}</td>
                    <td className="px-2.5 py-1.5 tabular-nums font-bold text-slate-700">{r.dispatchDelay ? `${r.dispatchDelay}d` : "—"}</td>
                    <td className="px-2.5 py-1.5">{r.onTime == null ? <span className="text-slate-300">—</span> : <span className="rounded-full px-1.5 py-0.5 text-[11px] font-bold" style={{ background: r.onTime ? "rgba(99,184,30,0.16)" : "rgba(190,18,60,0.10)", color: r.onTime ? "#3f7a14" : "#be123c" }}>{r.onTime ? "On time" : "Late"}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DetailModal>
      )}

      {/* row detail */}
      {row && (
        <DetailModal title={row.ourSoNo} subtitle={row.company} Icon={Factory} from="#0069b3" to="#0180cf" onClose={() => setRow(null)}>
          <div className="grid grid-cols-2 gap-x-5 gap-y-3.5">
            <Field icon={Layers} label="Item" value={row.item} span />
            <Field icon={IndianRupee} label="Order Value" value={row.value ? inr(row.value) : "—"} />
            <Field icon={Layers} label="Scope" value={row.scope} />
            <Field icon={BadgeCheck} label="GA Approved" value={row.gaApproved ? "Yes" : row.gaRequired ? "Pending" : "Not required"} />
            <Field icon={ClipboardCheck} label="BOM Released" value={row.bomReleased ? "Yes" : "No"} />
            <Field icon={Wrench} label="Work Order Issued" value={row.woIssued ? "Yes" : "No"} />
            <Field icon={Workflow} label="Stage" value={row.stage} />
            <Field icon={CalendarClock} label="SO Date" value={row.soDate} />
            <Field icon={CalendarClock} label="Target Dispatch" value={row.dispatchTarget} />
            <Field icon={Truck} label="Actual Dispatch" value={row.dispatchActual} />
            <Field icon={Timer} label="Delay" value={row.dispatchDelay ? `${row.dispatchDelay} days late` : row.dispatched ? "On time" : "In production"} />
            {row.delayReason && <Field icon={AlertTriangle} label="Reason / Pending" value={row.delayReason} span />}
          </div>
        </DetailModal>
      )}
    </div>
  );
}

function Field({ icon: Icon, label, value, span }: { icon: typeof Building2; label: string; value: string; span?: boolean }) {
  return <div className={span ? "col-span-2" : ""}><div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.05em] text-slate-400"><Icon size={13} strokeWidth={2.3} className="text-[#0069b3]" /> {label}</div><div className="mt-0.5 text-[14px] font-semibold text-slate-800 break-words">{value || "—"}</div></div>;
}

interface Kpis { total: number; gaApproved: number; bomReleased: number; woIssued: number; dispatched: number; onTime: number; delayed: number; value: number; avgDelay: number; onTimePct: number }

function insights(k: Kpis): string[] {
  const out: string[] = [];
  if (k.total) out.push(`${k.total} order${k.total === 1 ? "" : "s"} worth ${compactInr(k.value)} in production.`);
  if (k.total) out.push(`Pipeline: ${k.gaApproved} GA approved · ${k.bomReleased} BOM released · ${k.woIssued} work orders · ${k.dispatched} dispatched.`);
  if (k.dispatched) out.push(`On-time delivery ${k.onTimePct}% — ${k.onTime} on time, ${k.delayed} late${k.delayed ? ` (avg ${k.avgDelay}d)` : ""}.`);
  const inProd = k.total - k.dispatched;
  if (inProd > 0) out.push(`${inProd} order${inProd === 1 ? "" : "s"} still on the floor, not yet dispatched.`);
  if (out.length === 0) out.push("No production orders match the current filters.");
  return out;
}

/* ── advanced: Delivery Performance & Bottlenecks ── */
function DeliveryPerformance({ rows, k }: { rows: ProdRow[]; k: Kpis }) {
  const throughput = k.total ? Math.round(((k.gaApproved + k.bomReleased + k.woIssued + k.dispatched) / (k.total * 4)) * 100) : 0;

  const buckets = [
    { label: "On time", value: rows.filter((r) => r.onTime === true).length },
    { label: "1–7 days late", value: rows.filter((r) => r.onTime === false && r.dispatchDelay <= 7).length },
    { label: "8–15 days late", value: rows.filter((r) => r.onTime === false && r.dispatchDelay > 7 && r.dispatchDelay <= 15).length },
    { label: "15+ days late", value: rows.filter((r) => r.onTime === false && r.dispatchDelay > 15).length },
  ].filter((x) => x.value > 0);

  const topDelayed = [...rows].filter((r) => r.dispatchDelay > 0).sort((a, b) => b.dispatchDelay - a.dispatchDelay).slice(0, 5);
  const cycles = rows.map((r) => (r.soDate && r.dispatchActual && r.dispatchActual !== "—" ? daysBetween(r.soDate, r.dispatchActual) : null)).filter((x): x is number => x != null && x > 0);
  const avgCycle = cycles.length ? Math.round(cycles.reduce((s, x) => s + x, 0) / cycles.length) : 0;

  return (
    <section className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm max-md:p-4">
      <div className="mb-5 flex items-center gap-3">
        <span className="inline-flex size-11 items-center justify-center rounded-2xl text-white shadow-lg" style={{ background: "linear-gradient(135deg, #63b81e, #0180cf)", boxShadow: "0 12px 26px -12px #0069b3" }}><Rocket size={22} strokeWidth={2.2} /></span>
        <div>
          <div className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-slate-400">Advanced</div>
          <h2 className="text-[19px] font-black tracking-[-0.01em] text-slate-800" style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}>Delivery Performance &amp; Bottlenecks</h2>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2">
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/50 p-3"><Gauge pct={k.onTimePct} label="On-Time Rate" sub={`${k.onTime} of ${k.dispatched}`} /></div>
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/50 p-3"><Gauge pct={throughput} label="Pipeline Throughput" from="#0180cf" to="#0069b3" /></div>
        <div className="col-span-2 max-lg:col-span-2">
          <div className="mb-2 text-[12.5px] font-black text-slate-700">Delay Distribution</div>
          {buckets.length ? <StatusBars data={buckets} /> : <p className="py-4 text-center text-[13px] text-slate-400">No delivery data yet.</p>}
          <div className="mt-3 grid grid-cols-3 gap-2.5">
            <MetricChip icon={Timer} label="Avg Cycle" value={`${avgCycle}d`} tint="#0a7d8a" />
            <MetricChip icon={AlertTriangle} label="In Production" value={String(k.total - k.dispatched)} tint="#b45309" />
            <MetricChip icon={Zap} label="Avg Delay" value={`${k.avgDelay}d`} tint="#be123c" />
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center gap-2 text-[13px] font-black text-slate-700"><Star size={15} className="text-[#0069b3]" /> Most Delayed Orders <span className="text-[11px] font-semibold text-slate-400">(longest slip vs target)</span></div>
        {topDelayed.length === 0 ? <p className="py-4 text-center text-[13px] text-slate-400">No delayed orders 🎉</p> : (
          <div className="grid grid-cols-2 gap-2.5 max-md:grid-cols-1">
            {topDelayed.map((r) => {
              const severe = r.dispatchDelay > 15;
              return (
                <div key={r.ourSoNo} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2 shadow-sm">
                  <span className="flex min-w-0 items-center gap-2"><span className="inline-flex rounded-full px-2 py-0.5 text-[10.5px] font-black" style={{ background: severe ? "rgba(190,18,60,0.10)" : "rgba(245,158,11,0.12)", color: severe ? "#be123c" : "#b45309" }}>{severe ? "Critical" : "Late"}</span><span className="truncate text-[12.5px] font-bold text-slate-700">{r.ourSoNo}</span><span className="truncate text-[12px] text-slate-400">{r.company}</span></span>
                  <span className="shrink-0 text-[12.5px] font-black tabular-nums text-slate-700">{r.dispatchDelay}d</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function daysBetween(a: string, b: string): number | null {
  try {
    const t1 = new Date(a + "T00:00:00Z").getTime();
    const t2 = new Date(b + "T00:00:00Z").getTime();
    if (Number.isNaN(t1) || Number.isNaN(t2)) return null;
    return Math.round((t2 - t1) / 86400000);
  } catch {
    return null;
  }
}
