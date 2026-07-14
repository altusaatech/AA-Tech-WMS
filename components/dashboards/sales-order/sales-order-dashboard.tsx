"use client";

import * as React from "react";
import {
  FileCheck2, PencilRuler, CheckCircle2, Clock3, ClipboardList, PackageCheck, Hourglass,
  TrendingUp, Layers, Users, GitBranch, Filter, Search, X, Building2, IndianRupee, CalendarClock,
  FileText, ClipboardCheck, Workflow, Wrench,
} from "lucide-react";
import {
  KpiCard, Section, TrendBars, StatusBars, InsightsPanel, DetailModal, ProgressStat,
  WorkflowTimeline, ExportButtons, inr, compactInr,
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

      {/* KPIs (7) */}
      <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
        <KpiCard label="Total Sales Orders" value={k.total} blurb="Confirmed orders" Icon={FileCheck2} from="#0180cf" to="#0069b3" onDetails={() => setModal("all")} />
        <KpiCard label="GA Drawings Required" value={k.gaReq} blurb="Orders needing GA" Icon={PencilRuler} from="#0a7d8a" to="#0069b3" onDetails={() => setModal("gaReq")} />
        <KpiCard label="GA Drawings Completed" value={k.gaDone} blurb="GA approved" Icon={CheckCircle2} from="#63b81e" to="#3f7a14" onDetails={() => setModal("gaDone")} />
        <KpiCard label="GA Drawings Pending" value={k.gaPend} blurb="GA awaited" Icon={Clock3} from="#b45309" to="#92400e" onDetails={() => setModal("gaPend")} />
        <KpiCard label="Orders Sent for BOM" value={k.bomSent} blurb="Reached BOM stage" Icon={ClipboardList} from="#0069b3" to="#0180cf" onDetails={() => setModal("bomSent")} />
        <KpiCard label="BOM Completed" value={k.bomDone} blurb="BOM released" Icon={PackageCheck} from="#63b81e" to="#3f7a14" onDetails={() => setModal("bomDone")} />
        <KpiCard label="BOM Pending" value={k.bomPend} blurb="BOM in progress" Icon={Hourglass} from="#b45309" to="#92400e" onDetails={() => setModal("bomPend")} />
        <KpiCard label="Order Book Value" display={compactInr(k.value)} blurb="Confirmed value" Icon={IndianRupee} from="#0a7d8a" to="#0069b3" />
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
        <div className="col-span-2 max-lg:col-span-1"><Section title="Sales Order Status" Icon={Layers}><StatusBars data={stageDist} /></Section></div>
      </div>

      {/* trend + pending + engineer */}
      <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-1">
        <Section title="Monthly Sales Order Trend" Icon={TrendingUp}><TrendBars data={trend} /></Section>
        <Section title="Pending Work Analysis" Icon={Hourglass}>{pendingWork.length ? <StatusBars data={pendingWork} /> : <p className="py-6 text-center text-[13px] text-slate-400">Nothing pending 🎉</p>}</Section>
        <Section title="Engineer Workload (sample)" Icon={Users}><StatusBars data={engLoad} /></Section>
      </div>

      {/* workflow */}
      <Section title="Workflow" Icon={GitBranch}>
        <WorkflowTimeline stages={[{ label: "Sales Order", count: k.total }, { label: "GA Drawing", count: k.gaDone }, { label: "BOM", count: k.bomDone }, { label: "Work Order", count: filtered.filter((r) => r.woNo).length }]} icons={[FileCheck2, PencilRuler, ClipboardCheck, Wrench]} />
      </Section>

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
