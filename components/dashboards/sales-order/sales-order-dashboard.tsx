"use client";

import * as React from "react";
import {
  FileCheck2, PencilRuler, CheckCircle2, Clock3, ClipboardList, PackageCheck, Hourglass,
  TrendingUp, Layers, Users, GitBranch, Filter, Search, X, Building2, IndianRupee, CalendarClock,
  FileText, ClipboardCheck, Workflow, Wrench, Rocket, Zap, Star, AlertTriangle, Timer,
} from "lucide-react";
import {
  Section, StatusBars, InsightsPanel, DetailModal, ProgressStat,
  WorkflowTimeline, ExportButtons, inr, compactInr, Gauge, MetricChip,
  StatCard, ActivityFeed, Donut, AreaChart, DonutBreakdown, type Activity,
} from "@/components/dashboards/shared/kit";

export interface SoRow {
  ourSoNo: string; enquiryNo: string; poNo: string; company: string; item: string; value: number;
  scope: string; soDate: string;
  gaRequired: boolean; gaStatus: string; gaCompleted: boolean;
  inBom: boolean; bomStatus: string; bomCompleted: boolean; bomNo: string | null; woNo: string | null;
  engineer: string; expectedCompletion: string; stage: string; date: string;
}

type ModalKey = "all" | "gaReq" | "gaDone" | "gaPend" | "bomSent" | "bomDone" | "bomPend" | null;
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function SalesOrderDashboard({ rows }: { rows: SoRow[] }) {
  const [q, setQ] = React.useState("");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [stage, setStage] = React.useState("");
  const [customer, setCustomer] = React.useState("");
  const [modal, setModal] = React.useState<ModalKey>(null);
  const [row, setRow] = React.useState<SoRow | null>(null);

  const stages = React.useMemo(() => Array.from(new Set(rows.map((r) => r.stage))).sort(), [rows]);
  const customers = React.useMemo(() => Array.from(new Set(rows.map((r) => r.company).filter(Boolean))).sort(), [rows]);

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (from && r.date < from) return false;
      if (to && r.date > to) return false;
      if (stage && r.stage !== stage) return false;
      if (customer && r.company !== customer) return false;
      if (needle && ![r.ourSoNo, r.enquiryNo, r.company, r.item, r.engineer, r.poNo, r.stage].some((v) => v.toLowerCase().includes(needle))) return false;
      return true;
    });
  }, [rows, q, from, to, stage, customer]);

  const k = React.useMemo(() => {
    const total = filtered.length;
    const gaReq = filtered.filter((r) => r.gaRequired).length;
    const gaDone = filtered.filter((r) => r.gaCompleted).length;
    const bomSent = filtered.filter((r) => r.inBom).length;
    const bomDone = filtered.filter((r) => r.bomCompleted).length;
    return { total, gaReq, gaDone, gaPend: gaReq - gaDone, bomSent, bomDone, bomPend: bomSent - bomDone, value: filtered.reduce((s, r) => s + r.value, 0) };
  }, [filtered]);

  const trend = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtered) if (r.date) m.set(r.date.slice(0, 7), (m.get(r.date.slice(0, 7)) ?? 0) + 1);
    return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-8).map(([key, v]) => ({ label: MON[Number(key.slice(5, 7)) - 1] ?? key, value: v }));
  }, [filtered]);

  const stageDist = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtered) m.set(r.stage, (m.get(r.stage) ?? 0) + 1);
    return Array.from(m.entries()).sort(([, a], [, b]) => b - a).map(([label, v]) => ({ label, value: v }));
  }, [filtered]);

  const engLoad = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtered) m.set(r.engineer, (m.get(r.engineer) ?? 0) + 1);
    return Array.from(m.entries()).sort(([, a], [, b]) => b - a).map(([label, v]) => ({ label, value: v }));
  }, [filtered]);

  const pendingWork = [
    { label: "GA Pending", value: k.gaPend },
    { label: "BOM Pending", value: k.bomPend },
    { label: "Not in BOM", value: k.total - k.bomSent },
  ].filter((x) => x.value > 0);

  // monthly sparklines + deltas (respond to filters)
  const sp = React.useMemo(() => {
    const g = () => new Map<string, number>();
    const soM = g(), gaM = g(), bomM = g(), valM = g();
    for (const r of filtered) {
      if (!r.date) continue; const m = r.date.slice(0, 7);
      soM.set(m, (soM.get(m) ?? 0) + 1);
      if (r.gaCompleted) gaM.set(m, (gaM.get(m) ?? 0) + 1);
      if (r.bomCompleted) bomM.set(m, (bomM.get(m) ?? 0) + 1);
      valM.set(m, (valM.get(m) ?? 0) + r.value);
    }
    const months = [...new Set([...soM.keys(), ...gaM.keys(), ...bomM.keys(), ...valM.keys()])].sort().slice(-8);
    const arr = (mp: Map<string, number>) => months.map((m) => mp.get(m) ?? 0);
    const d = (mp: Map<string, number>) => { const a = mp.get(months[months.length - 1] ?? "") ?? 0, b = mp.get(months[months.length - 2] ?? "") ?? 0; return b ? Math.max(-999, Math.min(999, Math.round(((a - b) / b) * 100))) : a ? 100 : 0; };
    return { so: arr(soM), ga: arr(gaM), bom: arr(bomM), val: arr(valM), dSo: d(soM), dGa: d(gaM), dBom: d(bomM), dVal: d(valM) };
  }, [filtered]);

  const readiness = k.total ? Math.round((k.bomDone / k.total) * 100) : 0;

  const activities: Activity[] = React.useMemo(() => {
    const acts = filtered.map((r): Activity => {
      if (r.bomCompleted) return { kind: "bom", title: `BOM ready · ${r.ourSoNo}`, subtitle: r.company, date: r.date, amount: r.value };
      if (r.gaCompleted) return { kind: "ga", title: `GA approved · ${r.ourSoNo}`, subtitle: r.company, date: r.date, amount: r.value };
      return { kind: "so", title: `Sales Order ${r.ourSoNo}`, subtitle: r.company, date: r.date, amount: r.value };
    });
    return acts.filter((a) => a.date).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
  }, [filtered]);

  const meta = {
    all: { title: "Sales Orders", Icon: FileCheck2, from: "#0180cf", to: "#0069b3", rows: filtered },
    gaReq: { title: "GA Drawings Required", Icon: PencilRuler, from: "#0a7d8a", to: "#0069b3", rows: filtered.filter((r) => r.gaRequired) },
    gaDone: { title: "GA Drawings Completed", Icon: CheckCircle2, from: "#63b81e", to: "#3f7a14", rows: filtered.filter((r) => r.gaCompleted) },
    gaPend: { title: "GA Drawings Pending", Icon: Clock3, from: "#b45309", to: "#92400e", rows: filtered.filter((r) => r.gaRequired && !r.gaCompleted) },
    bomSent: { title: "Orders Sent for BOM", Icon: ClipboardList, from: "#0069b3", to: "#0180cf", rows: filtered.filter((r) => r.inBom) },
    bomDone: { title: "BOM Completed", Icon: PackageCheck, from: "#63b81e", to: "#3f7a14", rows: filtered.filter((r) => r.bomCompleted) },
    bomPend: { title: "BOM Pending", Icon: Hourglass, from: "#b45309", to: "#92400e", rows: filtered.filter((r) => r.inBom && !r.bomCompleted) },
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
          <ExportButtons filename="sales-orders" headers={["SO No", "Enquiry", "PO No", "Customer", "Item", "Value", "Scope", "GA Status", "BOM Status", "Engineer", "Stage", "SO Date", "Expected"]} rows={filtered.map((r) => [r.ourSoNo, r.enquiryNo, r.poNo, r.company, r.item, r.value, r.scope, r.gaStatus, r.bomStatus, r.engineer, r.stage, r.soDate, r.expectedCompletion])} />
        </span>
      </div>

      {/* hero stat cards */}
      <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
        <StatCard label="Sales Orders" display={String(k.total)} delta={sp.dSo} spark={sp.so} Icon={FileCheck2} from="#2a78d6" to="#185fa5" onDetails={() => setModal("all")} />
        <StatCard label="GA Completed" display={String(k.gaDone)} delta={sp.dGa} spark={sp.ga} Icon={CheckCircle2} from="#63b81e" to="#4a9616" onDetails={() => setModal("gaDone")} />
        <StatCard label="BOM Completed" display={String(k.bomDone)} delta={sp.dBom} spark={sp.bom} Icon={PackageCheck} from="#7c3aed" to="#6d28d9" onDetails={() => setModal("bomDone")} />
        <StatCard label="Order Book Value" display={compactInr(k.value)} delta={sp.dVal} spark={sp.val} Icon={IndianRupee} from="#f59e0b" to="#d97706" />
      </div>

      {/* recent activity + readiness */}
      <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-1">
        <div className="col-span-2 max-lg:col-span-1"><Section title="Recent Activity" Icon={Clock3}><ActivityFeed items={activities} /></Section></div>
        <Section title="Production Readiness" Icon={Rocket}>
          <div className="flex flex-col items-center gap-3 py-1">
            <Donut pct={readiness} caption="Ready" />
            <div className="grid w-full grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-center"><div className="text-[11px] font-bold uppercase tracking-[0.05em] text-slate-400">GA Req.</div><div className="text-[18px] font-black tabular-nums text-slate-800">{k.gaReq}</div></div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-center"><div className="text-[11px] font-bold uppercase tracking-[0.05em] text-slate-400">In BOM</div><div className="text-[18px] font-black tabular-nums text-[#0069b3]">{k.bomSent}</div></div>
            </div>
          </div>
        </Section>
      </div>

      {/* progress + status */}
      <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-1">
        <Section title="GA & BOM Progress" Icon={Workflow}>
          <div className="space-y-4">
            <ProgressStat label="GA Drawings Completed" done={k.gaDone} total={k.gaReq} />
            <ProgressStat label="BOM Completed" done={k.bomDone} total={k.bomSent} from="#0180cf" to="#0069b3" />
            <ProgressStat label="Orders Production-ready" done={k.bomDone} total={k.total} from="#0a7d8a" to="#0069b3" />
          </div>
        </Section>
        <div className="col-span-2 max-lg:col-span-1"><Section title="Sales Order Status" Icon={Layers}><DonutBreakdown data={stageDist} centerLabel="Orders" /></Section></div>
      </div>

      {/* trend + pending + engineer */}
      <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-1">
        <Section title="Monthly Sales Order Trend" Icon={TrendingUp}><AreaChart data={trend} /></Section>
        <Section title="Pending Work Analysis" Icon={Hourglass}>{pendingWork.length ? <StatusBars data={pendingWork} /> : <p className="py-6 text-center text-[13px] text-slate-400">Nothing pending 🎉</p>}</Section>
        <Section title="Engineer Workload (sample)" Icon={Users}><StatusBars data={engLoad} /></Section>
      </div>

      {/* workflow */}
      <Section title="Workflow" Icon={GitBranch}>
        <WorkflowTimeline stages={[{ label: "Sales Order", count: k.total }, { label: "GA Drawing", count: k.gaDone }, { label: "BOM", count: k.bomDone }, { label: "Work Order", count: filtered.filter((r) => r.woNo).length }]} icons={[FileCheck2, PencilRuler, ClipboardCheck, Wrench]} />
      </Section>

      {/* ── advanced: Production Readiness & Operations ── */}
      <ProductionReadiness rows={filtered} />

      {/* Insights always last */}
      <InsightsPanel items={insights(k)} />

      {/* KPI popup */}
      {active && (
        <DetailModal title={active.title} Icon={active.Icon} from={active.from} to={active.to} onClose={() => setModal(null)}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-[13px] font-bold text-slate-500">{active.rows.length} record{active.rows.length === 1 ? "" : "s"} · <span className="text-slate-400">engineer & expected date are sample</span></span>
            <ExportButtons filename={active.title.replace(/\s+/g, "-").toLowerCase()} headers={["SO No", "Customer", "SO Date", "GA Status", "BOM Status", "Engineer", "Stage", "Expected"]} rows={active.rows.map((r) => [r.ourSoNo, r.company, r.soDate, r.gaStatus, r.bomStatus, r.engineer, r.stage, r.expectedCompletion])} />
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full border-collapse text-[12px]">
              <thead className="bg-slate-50"><tr className="text-left text-[10.5px] font-bold uppercase tracking-[0.03em] text-slate-400">
                {["SO No", "Customer", "SO Date", "GA Status", "BOM Status", "Engineer", "Stage", "Expected"].map((h) => <th key={h} className="px-2.5 py-2">{h}</th>)}
              </tr></thead>
              <tbody>
                {active.rows.map((r) => (
                  <tr key={r.ourSoNo} onClick={() => { setRow(r); setModal(null); }} className="cursor-pointer border-t border-slate-100 hover:bg-[#0180cf]/6">
                    <td className="px-2.5 py-1.5 font-bold text-slate-800">{r.ourSoNo}</td>
                    <td className="px-2.5 py-1.5 text-slate-600"><span className="flex items-center gap-1"><Building2 size={11} className="text-[#0069b3]" />{r.company || "—"}</span></td>
                    <td className="px-2.5 py-1.5 tabular-nums text-slate-500">{r.soDate || "—"}</td>
                    <td className="px-2.5 py-1.5"><span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-600">{r.gaStatus}</span></td>
                    <td className="px-2.5 py-1.5"><span className="rounded-full bg-[#0180cf]/10 px-1.5 py-0.5 text-[11px] font-bold text-[#0069b3]">{r.bomStatus}</span></td>
                    <td className="px-2.5 py-1.5 text-slate-500">{r.engineer}</td>
                    <td className="px-2.5 py-1.5 text-slate-600">{r.stage}</td>
                    <td className="px-2.5 py-1.5 tabular-nums text-slate-500">{r.expectedCompletion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DetailModal>
      )}

      {/* row detail */}
      {row && (
        <DetailModal title={row.ourSoNo} subtitle={row.company} Icon={FileCheck2} from="#0069b3" to="#0180cf" onClose={() => setRow(null)}>
          <div className="grid grid-cols-2 gap-x-5 gap-y-3.5">
            <Field icon={FileText} label="Enquiry No" value={row.enquiryNo} />
            <Field icon={Building2} label="PO No" value={row.poNo} />
            <Field icon={Layers} label="Item" value={row.item} span />
            <Field icon={IndianRupee} label="Order Value" value={row.value ? inr(row.value) : "—"} />
            <Field icon={Layers} label="Scope" value={row.scope} />
            <Field icon={PencilRuler} label="GA Status" value={row.gaStatus} />
            <Field icon={ClipboardCheck} label="BOM Status" value={row.bomStatus} />
            <Field icon={Users} label="Assigned Engineer" value={row.engineer} />
            <Field icon={Workflow} label="Workflow Stage" value={row.stage} />
            <Field icon={CalendarClock} label="Order Date" value={row.soDate} />
            <Field icon={CalendarClock} label="Expected Completion" value={row.expectedCompletion} />
          </div>
          <p className="mt-4 text-[11.5px] text-slate-400">Assigned engineer & expected completion are sample values.</p>
        </DetailModal>
      )}
    </div>
  );
}

function Field({ icon: Icon, label, value, span }: { icon: typeof Building2; label: string; value: string; span?: boolean }) {
  return <div className={span ? "col-span-2" : ""}><div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.05em] text-slate-400"><Icon size={13} strokeWidth={2.3} className="text-[#0069b3]" /> {label}</div><div className="mt-0.5 text-[14px] font-semibold text-slate-800 break-words">{value || "—"}</div></div>;
}

function insights(k: { total: number; gaReq: number; gaDone: number; gaPend: number; bomSent: number; bomDone: number; bomPend: number; value: number }): string[] {
  const out: string[] = [];
  if (k.total) out.push(`${k.total} sales order${k.total === 1 ? "" : "s"} worth ${compactInr(k.value)} in view.`);
  if (k.gaReq) out.push(`GA drawings: ${k.gaDone} of ${k.gaReq} done, ${k.gaPend} pending.`);
  if (k.bomSent) out.push(`BOM: ${k.bomDone} of ${k.bomSent} completed, ${k.bomPend} in progress.`);
  const ready = k.bomDone;
  if (k.total) out.push(`${ready} of ${k.total} orders are production-ready (${Math.round((ready / k.total) * 100)}%).`);
  if (out.length === 0) out.push("No sales orders match the current filters.");
  return out;
}

/* ── advanced: Production Readiness & Operations ── */
function daysBetween(a: string, b: string): number {
  try { return Math.round((new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime()) / 86400000); } catch { return 0; }
}

function ProductionReadiness({ rows }: { rows: SoRow[] }) {
  const total = rows.length;
  const ready = rows.filter((r) => r.bomCompleted).length;
  const waitingGa = rows.filter((r) => r.gaRequired && !r.gaCompleted).length;
  const waitingBom = rows.filter((r) => !r.bomCompleted && (r.gaCompleted || !r.gaRequired)).length;
  const gaReq = rows.filter((r) => r.gaRequired).length;
  const gaDone = rows.filter((r) => r.gaCompleted).length;
  const bomSent = rows.filter((r) => r.inBom).length;
  const bomDone = rows.filter((r) => r.bomCompleted).length;
  const readiness = total ? Math.round((ready / total) * 100) : 0;
  const throughput = gaReq + bomSent ? Math.round(((gaDone + bomDone) / (gaReq + bomSent)) * 100) : 0;

  const procs = rows.map((r) => (r.soDate && r.expectedCompletion && r.expectedCompletion !== "—" ? daysBetween(r.soDate, r.expectedCompletion) : 0)).filter((x) => x > 0);
  const avgProc = procs.length ? Math.round(procs.reduce((s, x) => s + x, 0) / procs.length) : 0;

  const byVal = [...rows].sort((a, b) => b.value - a.value);
  const topVal = byVal[0]?.value ?? 0;
  const priority = byVal.filter((r) => !r.bomCompleted).slice(0, 5);

  const breakdown = [
    { label: "Ready for Production", value: ready },
    { label: "Waiting for BOM", value: waitingBom },
    { label: "Waiting for GA", value: waitingGa },
  ].filter((x) => x.value > 0);

  return (
    <section className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm max-md:p-4">
      <div className="mb-5 flex items-center gap-3">
        <span className="inline-flex size-11 items-center justify-center rounded-2xl text-white shadow-lg" style={{ background: "linear-gradient(135deg, #63b81e, #0180cf)", boxShadow: "0 12px 26px -12px #0069b3" }}><Rocket size={22} strokeWidth={2.2} /></span>
        <div>
          <div className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-slate-400">Advanced</div>
          <h2 className="text-[19px] font-black tracking-[-0.01em] text-slate-800" style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}>Production Readiness &amp; Operations</h2>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2">
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/50 p-3"><Gauge pct={readiness} label="Production Ready" sub={`${ready} of ${total}`} /></div>
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/50 p-3"><Gauge pct={throughput} label="Eng. Throughput" from="#0180cf" to="#0069b3" /></div>
        <div className="col-span-2 max-lg:col-span-2">
          <div className="mb-2 text-[12.5px] font-black text-slate-700">Readiness Breakdown</div>
          {breakdown.length ? <StatusBars data={breakdown} /> : <p className="py-4 text-center text-[13px] text-slate-400">All orders production-ready 🎉</p>}
          <div className="mt-3 grid grid-cols-3 gap-2.5">
            <MetricChip icon={Timer} label="Avg Processing" value={`${avgProc}d`} tint="#0a7d8a" />
            <MetricChip icon={AlertTriangle} label="Pending Orders" value={String(total - ready)} tint="#b45309" />
            <MetricChip icon={Zap} label="Eng. Efficiency" value={`${throughput}%`} tint="#3f7a14" />
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center gap-2 text-[13px] font-black text-slate-700"><Star size={15} className="text-[#0069b3]" /> Priority Orders <span className="text-[11px] font-semibold text-slate-400">(highest value, not yet ready)</span></div>
        {priority.length === 0 ? <p className="py-4 text-center text-[13px] text-slate-400">No pending priority orders.</p> : (
          <div className="grid grid-cols-2 gap-2.5 max-md:grid-cols-1">
            {priority.map((r) => {
              const high = r.value >= topVal * 0.7;
              return (
                <div key={r.ourSoNo} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2 shadow-sm">
                  <span className="flex min-w-0 items-center gap-2"><span className="inline-flex rounded-full px-2 py-0.5 text-[10.5px] font-black" style={{ background: high ? "rgba(190,18,60,0.10)" : "rgba(245,158,11,0.12)", color: high ? "#be123c" : "#b45309" }}>{high ? "High" : "Medium"}</span><span className="truncate text-[12.5px] font-bold text-slate-700">{r.ourSoNo}</span><span className="truncate text-[12px] text-slate-400">{r.company}</span></span>
                  <span className="shrink-0 text-[12.5px] font-black tabular-nums text-slate-700">{inr(r.value)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
