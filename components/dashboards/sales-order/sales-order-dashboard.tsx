"use client";

import * as React from "react";
import { FileCheck2, PackageCheck, IndianRupee, Timer, TrendingUp, Layers, Building2, Tag, CalendarClock, ListChecks, FileText, ClipboardCheck } from "lucide-react";
import { KpiCard, Section, TrendBars, StatusBars, InsightsPanel, DetailModal, SummaryTile, inr, compactInr } from "@/components/dashboards/shared/kit";

export interface SoRow {
  ourSoNo: string;
  enquiryNo: string;
  poNo: string;
  company: string;
  item: string;
  value: number;
  scope: string;
  soDate: string;
  targetDispatch: string;
  actualDispatch: string;
  dispatched: boolean;
  onTime: boolean;
  woNo: string | null;
}

type KpiKey = "all" | "value" | "dispatched" | null;

export function SalesOrderDashboard({ rows, kpis, trend, scopeDist }: {
  rows: SoRow[];
  kpis: { count: number; value: number; dispatched: number; onTimePct: number };
  trend: { label: string; value: number }[];
  scopeDist: { label: string; value: number }[];
}) {
  const [kpi, setKpi] = React.useState<KpiKey>(null);
  const [row, setRow] = React.useState<SoRow | null>(null);

  const recent = [...rows].sort((a, b) => (b.soDate || "").localeCompare(a.soDate || "")).slice(0, 8);
  const kpiRows = kpi === "dispatched" ? rows.filter((r) => r.dispatched) : kpi === "value" ? [...rows].sort((a, b) => b.value - a.value) : rows;
  const kpiMeta = {
    all: { title: "Sales Orders", Icon: FileCheck2, from: "#0180cf", to: "#0069b3" },
    value: { title: "Order Book Value", Icon: IndianRupee, from: "#0a7d8a", to: "#0069b3" },
    dispatched: { title: "Dispatched Orders", Icon: PackageCheck, from: "#63b81e", to: "#3f7a14" },
  } as const;

  return (
    <div className="mt-6 space-y-5">
      <div className="grid grid-cols-4 gap-5 max-xl:grid-cols-2 max-md:grid-cols-1">
        <KpiCard label="Sales Orders" value={kpis.count} blurb="Confirmed orders" Icon={FileCheck2} from="#0180cf" to="#0069b3" onDetails={() => setKpi("all")} />
        <KpiCard label="Order Book Value" display={compactInr(kpis.value)} blurb="Total confirmed value" Icon={IndianRupee} from="#0a7d8a" to="#0069b3" onDetails={() => setKpi("value")} />
        <KpiCard label="Dispatched" value={kpis.dispatched} blurb="Orders shipped" Icon={PackageCheck} from="#63b81e" to="#3f7a14" onDetails={() => setKpi("dispatched")} />
        <KpiCard label="On-time Dispatch" value={kpis.onTimePct} suffix="%" blurb="Shipped by target date" Icon={Timer} from="#0069b3" to="#0180cf" />
      </div>

      <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-1">
        <div className="col-span-2 max-lg:col-span-1">
          <Section title="Order Book Value by Month" Icon={TrendingUp}><TrendBars data={trend} format={compactInr} /></Section>
        </div>
        <Section title="Orders by Scope" Icon={Layers}><StatusBars data={scopeDist} /></Section>
      </div>

      <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-1">
        <InsightsPanel items={buildInsights(rows, kpis)} />
        <div className="col-span-2 max-lg:col-span-1">
          <Section title="Recent Sales Orders" Icon={ListChecks}>
            <p className="mb-2 text-[11.5px] font-semibold text-slate-400">click a row for full details</p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12.5px]">
                <thead><tr className="text-left text-[11px] font-bold uppercase tracking-[0.04em] text-slate-400">
                  <th className="px-2 py-1.5">SO No</th><th className="px-2 py-1.5">Company</th><th className="px-2 py-1.5 text-right">Value</th><th className="px-2 py-1.5">Dispatch</th>
                </tr></thead>
                <tbody>
                  {recent.length === 0 ? <tr><td colSpan={4} className="px-2 py-6 text-center text-slate-400">No sales orders.</td></tr> :
                    recent.map((r) => (
                      <tr key={r.ourSoNo} onClick={() => setRow(r)} className="cursor-pointer border-t border-slate-100 transition-colors hover:bg-[#0180cf]/6">
                        <td className="px-2 py-2 font-bold text-slate-800">{r.ourSoNo}</td>
                        <td className="max-w-[160px] truncate px-2 py-2 text-slate-600" title={r.company}>{r.company || "—"}</td>
                        <td className="px-2 py-2 text-right font-semibold tabular-nums text-slate-700">{r.value ? inr(r.value) : "—"}</td>
                        <td className="px-2 py-2"><span className="inline-flex items-center gap-1 text-[12px] font-semibold" style={{ color: !r.dispatched ? "#64748b" : r.onTime ? "#3f7a14" : "#b45309" }}><span className="size-1.5 rounded-full" style={{ background: !r.dispatched ? "#94a3b8" : r.onTime ? "#63b81e" : "#f59e0b" }} />{!r.dispatched ? "Pending" : r.onTime ? "On time" : "Delayed"}</span></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Section>
        </div>
      </div>

      {/* KPI popup */}
      {kpi && (
        <DetailModal title={kpiMeta[kpi].title} Icon={kpiMeta[kpi].Icon} from={kpiMeta[kpi].from} to={kpiMeta[kpi].to} onClose={() => setKpi(null)}>
          <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-1">
            <SummaryTile icon={Tag} label="Records" value={String(kpiRows.length)} />
            <SummaryTile icon={IndianRupee} label="Total Value" value={inr(kpiRows.reduce((s, r) => s + r.value, 0))} />
            <SummaryTile icon={CalendarClock} label="Latest SO" value={kpiRows.map((r) => r.soDate).filter(Boolean).sort().slice(-1)[0] ?? "—"} />
          </div>
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full border-collapse text-[12.5px]">
              <thead className="bg-slate-50"><tr className="text-left text-[11px] font-bold uppercase tracking-[0.04em] text-slate-400">
                <th className="px-3 py-2">SO No</th><th className="px-3 py-2">Company</th><th className="px-3 py-2">Item</th><th className="px-3 py-2 text-right">Value</th><th className="px-3 py-2">Scope</th><th className="px-3 py-2">SO Date</th>
              </tr></thead>
              <tbody>
                {kpiRows.map((r) => (
                  <tr key={r.ourSoNo} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-bold text-slate-800">{r.ourSoNo}</td>
                    <td className="px-3 py-2 text-slate-600"><span className="flex items-center gap-1.5"><Building2 size={12} className="text-[#0069b3]" /> {r.company || "—"}</span></td>
                    <td className="max-w-[150px] truncate px-3 py-2 text-slate-500" title={r.item}>{r.item || "—"}</td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-700">{r.value ? inr(r.value) : "—"}</td>
                    <td className="px-3 py-2 text-slate-600">{r.scope || "—"}</td>
                    <td className="px-3 py-2 tabular-nums text-slate-500">{r.soDate || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DetailModal>
      )}

      {/* row detail popup */}
      {row && (
        <DetailModal title={row.ourSoNo} subtitle={row.company} Icon={FileCheck2} from="#0069b3" to="#0180cf" onClose={() => setRow(null)}>
          <div className="grid grid-cols-2 gap-x-5 gap-y-3.5">
            <Field icon={FileText} label="Enquiry No" value={row.enquiryNo} />
            <Field icon={Building2} label="PO No" value={row.poNo} />
            <Field icon={Tag} label="Item" value={row.item} span />
            <Field icon={IndianRupee} label="Order Value" value={row.value ? inr(row.value) : "—"} />
            <Field icon={Layers} label="Scope" value={row.scope} />
            <Field icon={ClipboardCheck} label="Work Order" value={row.woNo ?? "—"} />
            <Field icon={CalendarClock} label="SO Date" value={row.soDate} />
            <Field icon={CalendarClock} label="Target Dispatch" value={row.targetDispatch} />
            <Field icon={CalendarClock} label="Actual Dispatch" value={row.actualDispatch} />
            <div className="col-span-2 mt-1 flex items-center gap-2 rounded-xl px-3 py-2 text-[12.5px] font-bold" style={{ background: !row.dispatched ? "rgba(100,116,139,0.10)" : row.onTime ? "rgba(99,184,30,0.12)" : "rgba(245,158,11,0.12)", color: !row.dispatched ? "#475569" : row.onTime ? "#3f7a14" : "#b45309" }}>
              <span className="size-2 rounded-full" style={{ background: !row.dispatched ? "#94a3b8" : row.onTime ? "#63b81e" : "#f59e0b" }} />
              {!row.dispatched ? "Not yet dispatched." : row.onTime ? "Dispatched on or before the target date." : "Dispatched after the target date."}
            </div>
          </div>
        </DetailModal>
      )}
    </div>
  );
}

function Field({ icon: Icon, label, value, span }: { icon: typeof Building2; label: string; value: string; span?: boolean }) {
  return (
    <div className={span ? "col-span-2" : ""}>
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.05em] text-slate-400"><Icon size={13} strokeWidth={2.3} className="text-[#0069b3]" /> {label}</div>
      <div className="mt-0.5 text-[14px] font-semibold text-slate-800 break-words">{value || "—"}</div>
    </div>
  );
}

function buildInsights(rows: SoRow[], kpis: { count: number; value: number; dispatched: number; onTimePct: number }): string[] {
  const out: string[] = [];
  if (kpis.count) out.push(`${kpis.count} sales order${kpis.count === 1 ? "" : "s"} on the book, worth ${compactInr(kpis.value)}.`);
  const pending = kpis.count - kpis.dispatched;
  if (pending > 0) out.push(`${pending} order${pending === 1 ? "" : "s"} still in production / pending dispatch.`);
  if (kpis.dispatched) out.push(`${kpis.dispatched} dispatched — ${kpis.onTimePct}% on or before target.`);
  const avg = kpis.count ? Math.round(kpis.value / kpis.count) : 0;
  if (avg) out.push(`Average order value is ${compactInr(avg)}.`);
  if (out.length === 0) out.push("No sales orders in range yet.");
  return out;
}
