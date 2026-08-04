"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { Receipt, Plus, Trash2, Loader2, FolderOpen, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { fireToast } from "@/lib/toast";
import { createQuotation, deleteQuotation } from "@/app/(app)/quotation/actions";
import { RegisterExcelButtons } from "@/components/quotation/register-excel";
import { inr } from "@/lib/quotation/types";

export interface QuoteSummary {
  id: string;
  enquiryNo: string;
  offerNo: string;
  project: string;
  customer: string;
  subject: string;
  quoteDate: string;
  doors: number;
  qty: number;
  doorTotal: number;
  hardwareTotal: number;
  installTotal: number;
  subtotal: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
}

const th = "whitespace-nowrap px-3 py-3";
const td = "whitespace-nowrap border-b border-[#e7eff6] px-3 py-2.5";

type SortState = { key: "enquiryNo" | "offerNo"; dir: "asc" | "desc" } | null;

/** Clickable header for the sortable number columns (asc → desc → toggle). */
function SortTh({ label, colKey, sort, onSort }: { label: string; colKey: "enquiryNo" | "offerNo"; sort: SortState; onSort: (k: "enquiryNo" | "offerNo") => void }) {
  const active = sort?.key === colKey;
  const Icon = !active ? ArrowUpDown : sort!.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th className={th}>
      <button type="button" onClick={() => onSort(colKey)} className={`inline-flex items-center gap-1 uppercase tracking-[0.05em] ${active ? "text-white" : "text-white/85 hover:text-white"}`} title={`Sort by ${label}`}>
        {label} <Icon size={12} strokeWidth={2.6} className={active ? "" : "opacity-60"} />
      </button>
    </th>
  );
}

/** Numeric-aware compare so "9001" sorts before "180001" and "180002 R1" after "180002". */
function numCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

export function QuotationList({ quotes }: { quotes: QuoteSummary[] }) {
  const router = useRouter();
  const [creating, setCreating] = React.useState(false);
  const [sort, setSort] = React.useState<SortState>(null);

  const view = React.useMemo(() => {
    if (!sort) return quotes;
    const s = [...quotes].sort((a, b) => numCompare(String(a[sort.key] ?? ""), String(b[sort.key] ?? "")));
    return sort.dir === "asc" ? s : s.reverse();
  }, [quotes, sort]);

  function toggleSort(key: "enquiryNo" | "offerNo") {
    setSort((s) => (s?.key === key ? (s.dir === "asc" ? { key, dir: "desc" } : null) : { key, dir: "asc" }));
  }

  async function onNew() {
    setCreating(true);
    try {
      const { id } = await createQuotation();
      router.push(`/quotation/${id}` as Route);
    } finally {
      setCreating(false);
    }
  }

  async function onDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    await deleteQuotation(id);
    fireToast({ message: "Quotation deleted", type: "success" });
    router.refresh();
  }

  return (
    <main className="relative mx-auto max-w-[1600px] px-8 pb-16 pt-8 max-md:px-4">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 opacity-[0.5]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(1,128,207,0.07) 1px, transparent 0)", backgroundSize: "26px 26px" }} />

      <PageHero
        eyebrow="Sales"
        title="Working Specification"
        subtitle="Build door specifications from the Product & Hardware masters — printable in your format."
        Icon={Receipt}
        actions={
          <button
            type="button"
            onClick={onNew}
            disabled={creating}
            className="inline-flex h-11 items-center gap-2 rounded-xl px-5 text-[14px] font-extrabold text-white shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #63b81e, #0180cf)", boxShadow: "0 14px 30px -14px rgba(1,128,207,0.6)" }}
          >
            {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={17} strokeWidth={2.8} />} Working Specification
          </button>
        }
      />

      <div className="mt-6">
        <RegisterExcelButtons
          exportName="Working-Specifications"
          templateHeaders={["Enquiry No", "Offer No", "Date", "Customer", "Project", "Subject"]}
          exportData={view.map((q, i) => ({
            "Sr No": i + 1,
            "Enquiry No": q.enquiryNo,
            "Offer No": q.offerNo,
            "Date": q.quoteDate,
            "Customer": q.customer,
            "Project": q.project,
            "Subject": q.subject,
            "Doors": q.doors,
            "Total Qty": q.qty,
            "Door Total": Math.round(q.doorTotal),
            "Hardware Total": Math.round(q.hardwareTotal),
            "Installation": Math.round(q.installTotal),
            "Sub Total": Math.round(q.subtotal),
            "CGST 9%": Math.round(q.cgst),
            "SGST 9%": Math.round(q.sgst),
            "Grand Total": Math.round(q.grandTotal),
          }))}
        />
      </div>

      <div className="mt-3">
        {quotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-white/60 px-6 py-20 text-center backdrop-blur">
            <span className="inline-flex size-14 items-center justify-center rounded-2xl text-white shadow-lg" style={{ background: "linear-gradient(135deg, #0180cf, #63b81e)" }}>
              <Receipt size={26} strokeWidth={2.1} />
            </span>
            <p className="mt-4 text-[16px] font-bold text-slate-700">No working specifications yet</p>
            <p className="mt-1 text-[13.5px] text-slate-500">Click “Working Specification” to build your first one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-hairline bg-surface-card premium-card">
            <table className="w-full min-w-[1500px] text-[12.5px]">
              <thead>
                <tr className="text-left text-[10.5px] font-extrabold uppercase tracking-[0.05em] text-white" style={{ background: "linear-gradient(180deg, #0069b3, #00598f)" }}>
                  <th className={th}>Sr No</th>
                  <SortTh label="Enquiry No" colKey="enquiryNo" sort={sort} onSort={toggleSort} />
                  <SortTh label="Offer No" colKey="offerNo" sort={sort} onSort={toggleSort} />
                  <th className={th}>Date</th>
                  <th className={th}>Customer</th>
                  <th className={th}>Project</th>
                  <th className={th}>Subject</th>
                  <th className={`${th} text-center`}>Doors</th>
                  <th className={`${th} text-center`}>Total Qty</th>
                  <th className={`${th} text-right`}>Door Total</th>
                  <th className={`${th} text-right`}>Hardware Total</th>
                  <th className={`${th} text-right`}>Installation</th>
                  <th className={`${th} text-right`}>Sub Total</th>
                  <th className={`${th} text-right`}>CGST 9%</th>
                  <th className={`${th} text-right`}>SGST 9%</th>
                  <th className={`${th} text-right`}>Grand Total</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {view.map((q, i) => (
                  <tr
                    key={q.id}
                    onClick={() => router.push(`/quotation/${q.id}` as Route)}
                    className={`group cursor-pointer transition-colors hover:bg-[#e4f2fc] ${i % 2 ? "bg-[#f5fafe]" : "bg-white"}`}
                  >
                    <td className={`${td} tabular-nums font-semibold text-slate-500`}>{i + 1}</td>
                    <td className={`${td} font-bold text-slate-700`}>{q.enquiryNo || "—"}</td>
                    <td className={`${td} font-black text-slate-800`}>{q.offerNo || "—"}</td>
                    <td className={`${td} tabular-nums text-slate-600`}>{q.quoteDate || "—"}</td>
                    <td className={`${td} max-w-[180px] truncate text-slate-600`} title={q.customer}>{q.customer || "—"}</td>
                    <td className={`${td} max-w-[160px] truncate text-slate-600`} title={q.project}>{q.project || "—"}</td>
                    <td className={`${td} max-w-[200px] truncate text-slate-500`} title={q.subject}>{q.subject || "—"}</td>
                    <td className={`${td} text-center tabular-nums font-bold text-slate-700`}>{q.doors}</td>
                    <td className={`${td} text-center tabular-nums font-bold text-slate-700`}>{q.qty}</td>
                    <td className={`${td} text-right tabular-nums text-slate-600`}>{inr(q.doorTotal)}</td>
                    <td className={`${td} text-right tabular-nums text-slate-600`}>{inr(q.hardwareTotal)}</td>
                    <td className={`${td} text-right tabular-nums text-slate-600`}>{q.installTotal ? inr(q.installTotal) : "No"}</td>
                    <td className={`${td} text-right tabular-nums font-semibold text-slate-700`}>{inr(q.subtotal)}</td>
                    <td className={`${td} text-right tabular-nums text-slate-500`}>{inr(q.cgst)}</td>
                    <td className={`${td} text-right tabular-nums text-slate-500`}>{inr(q.sgst)}</td>
                    <td className={`${td} text-right tabular-nums font-black text-[#0069b3]`}>{inr(q.grandTotal)}</td>
                    <td className="border-b border-[#e7eff6] px-3 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" onClick={(e) => onDelete(e, q.id)} className="rounded-lg p-1.5 text-slate-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100" title="Delete">
                          <Trash2 size={14} />
                        </button>
                        <FolderOpen size={16} className="text-slate-300 transition-colors group-hover:text-[#0180cf]" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
