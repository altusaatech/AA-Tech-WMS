"use client";

import * as React from "react";
import { FileText, Send, IndianRupee, Percent, TrendingUp, PieChart, Building2, Tag, CalendarClock, ListChecks } from "lucide-react";
import { KpiCard, Section, TrendBars, StatusBars, InsightsPanel, DetailModal, SummaryTile, inr, compactInr } from "@/components/dashboards/shared/kit";

export interface QuoteRow {
  enquiryNo: string;
  company: string;
  item: string;
  value: number;
  status: string;
  sent: boolean;
  converted: boolean;
  soNo: string | null;
  date: string;
}

type ModalKey = "sent" | "value" | "converted" | null;

export function QuotationDashboard({ rows, kpis, trend, statusDist }: {
  rows: QuoteRow[];
  kpis: { sent: number; value: number; converted: number; winRate: number };
  trend: { label: string; value: number }[];
  statusDist: { label: string; value: number }[];
}) {
  const [modal, setModal] = React.useState<ModalKey>(null);

  const recent = [...rows].sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 8);
  const modalRows =
    modal === "sent" ? rows.filter((r) => r.sent) :
    modal === "converted" ? rows.filter((r) => r.converted) :
    modal === "value" ? [...rows].sort((a, b) => b.value - a.value) : [];
  const modalMeta = {
    sent: { title: "Quotations Sent", Icon: Send, from: "#0a7d8a", to: "#0069b3" },
    value: { title: "Quotation Value", Icon: IndianRupee, from: "#0180cf", to: "#0069b3" },
    converted: { title: "Converted to Sales Order", Icon: Percent, from: "#63b81e", to: "#3f7a14" },
  } as const;

  return (
    <div className="mt-6 space-y-5">
      <div className="grid grid-cols-4 gap-5 max-xl:grid-cols-2 max-md:grid-cols-1">
        <KpiCard label="Quotations Sent" value={kpis.sent} blurb="Quotes issued to customers" Icon={FileText} from="#0180cf" to="#0069b3" onDetails={() => setModal("sent")} />
        <KpiCard label="Quotation Value" display={compactInr(kpis.value)} blurb="Total value quoted" Icon={IndianRupee} from="#0a7d8a" to="#0069b3" onDetails={() => setModal("value")} />
        <KpiCard label="Converted to SO" value={kpis.converted} blurb="Quotes won as orders" Icon={Percent} from="#63b81e" to="#3f7a14" onDetails={() => setModal("converted")} />
        <KpiCard label="Win Rate" value={kpis.winRate} suffix="%" blurb="Sent → order conversion" Icon={TrendingUp} from="#0069b3" to="#0180cf" />
      </div>

      <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-1">
        <div className="col-span-2 max-lg:col-span-1">
          <Section title="Quotation Value by Month" Icon={TrendingUp}>
            <TrendBars data={trend} format={compactInr} />
          </Section>
        </div>
        <Section title="Status Mix" Icon={PieChart}>
          <StatusBars data={statusDist} />
        </Section>
      </div>

      <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-1">
        <InsightsPanel items={buildInsights(rows, kpis)} />
        <div className="col-span-2 max-lg:col-span-1">
          <Section title="Recent Quotations" Icon={ListChecks}>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12.5px]">
                <thead>
                  <tr className="text-left text-[11px] font-bold uppercase tracking-[0.04em] text-slate-400">
                    <th className="px-2 py-1.5">Enquiry</th><th className="px-2 py-1.5">Company</th><th className="px-2 py-1.5">Item</th><th className="px-2 py-1.5 text-right">Value</th><th className="px-2 py-1.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.length === 0 ? <tr><td colSpan={5} className="px-2 py-6 text-center text-slate-400">No quotations.</td></tr> :
                    recent.map((r, i) => (
                      <tr key={`${r.enquiryNo}-${i}`} className="border-t border-slate-100">
                        <td className="px-2 py-2 font-bold text-slate-800">{r.enquiryNo}</td>
                        <td className="px-2 py-2 text-slate-600">{r.company || "—"}</td>
                        <td className="max-w-[150px] truncate px-2 py-2 text-slate-500" title={r.item}>{r.item || "—"}</td>
                        <td className="px-2 py-2 text-right font-semibold tabular-nums text-slate-700">{r.value ? inr(r.value) : "—"}</td>
                        <td className="px-2 py-2"><span className="inline-flex rounded-full bg-[#0180cf]/10 px-2 py-0.5 text-[11.5px] font-bold text-[#0069b3]">{r.status}</span></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Section>
        </div>
      </div>

      {modal && (
        <DetailModal title={modalMeta[modal].title} Icon={modalMeta[modal].Icon} from={modalMeta[modal].from} to={modalMeta[modal].to} onClose={() => setModal(null)}>
          <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-1">
            <SummaryTile icon={Tag} label="Records" value={String(modalRows.length)} />
            <SummaryTile icon={IndianRupee} label="Total Value" value={inr(modalRows.reduce((s, r) => s + r.value, 0))} />
            <SummaryTile icon={CalendarClock} label="Latest" value={modalRows.map((r) => r.date).filter(Boolean).sort().slice(-1)[0] ?? "—"} />
          </div>
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full border-collapse text-[12.5px]">
              <thead className="bg-slate-50"><tr className="text-left text-[11px] font-bold uppercase tracking-[0.04em] text-slate-400">
                <th className="px-3 py-2">Enquiry</th><th className="px-3 py-2">Company</th><th className="px-3 py-2">Item</th><th className="px-3 py-2 text-right">Value</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Date</th>
              </tr></thead>
              <tbody>
                {modalRows.map((r, i) => (
                  <tr key={`${r.enquiryNo}-${i}`} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-bold text-slate-800">{r.enquiryNo}</td>
                    <td className="px-3 py-2 text-slate-600"><span className="flex items-center gap-1.5"><Building2 size={12} className="text-[#0069b3]" /> {r.company || "—"}</span></td>
                    <td className="max-w-[150px] truncate px-3 py-2 text-slate-500" title={r.item}>{r.item || "—"}</td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-700">{r.value ? inr(r.value) : "—"}</td>
                    <td className="px-3 py-2"><span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11.5px] font-bold text-slate-600">{r.status}{r.soNo ? ` · ${r.soNo}` : ""}</span></td>
                    <td className="px-3 py-2 tabular-nums text-slate-500">{r.date || "—"}</td>
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

function buildInsights(rows: QuoteRow[], kpis: { sent: number; value: number; converted: number; winRate: number }): string[] {
  const out: string[] = [];
  if (kpis.sent) out.push(`${kpis.sent} quotation${kpis.sent === 1 ? "" : "s"} sent, worth ${compactInr(kpis.value)}.`);
  if (kpis.sent) out.push(`${kpis.converted} converted to Sales Orders — a ${kpis.winRate}% win rate.`);
  const pending = rows.filter((r) => r.sent && !r.converted).length;
  if (pending) out.push(`${pending} sent quote${pending === 1 ? "" : "s"} still awaiting a decision.`);
  const avg = kpis.sent ? Math.round(kpis.value / kpis.sent) : 0;
  if (avg) out.push(`Average quotation value is ${compactInr(avg)}.`);
  if (out.length === 0) out.push("No quotations in range yet.");
  return out;
}
