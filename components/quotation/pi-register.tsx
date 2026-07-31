"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { ReceiptText, FilePlus2, ArrowRight, FolderOpen } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { inr } from "@/lib/quotation/types";

export interface PiSummary {
  id: string;
  offerNo: string;
  project: string;
  customer: string;
  quoteDate: string;
  qty: number;
  grandTotal: number;
}

/** Register of Proforma Invoices — one row per quotation, opening its PI. */
export function PiRegister({ pis }: { pis: PiSummary[] }) {
  const router = useRouter();

  return (
    <main className="relative mx-auto max-w-[1600px] px-8 pb-16 pt-8 max-md:px-4">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 opacity-[0.5]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(1,128,207,0.07) 1px, transparent 0)", backgroundSize: "26px 26px" }} />

      <PageHero
        eyebrow="Sales"
        title="Proforma Invoice"
        subtitle="Every Proforma Invoice — made from its working specification. Open one to fill & print."
        Icon={ReceiptText}
        actions={
          <Link
            href={"/quotation/pi" as Route}
            className="inline-flex h-11 items-center gap-2 rounded-xl px-5 text-[14px] font-extrabold text-white shadow-lg transition-all hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, #63b81e, #0180cf)", boxShadow: "0 14px 30px -14px rgba(1,128,207,0.6)" }}
          >
            <FilePlus2 size={17} strokeWidth={2.8} /> New PI
          </Link>
        }
      />

      <div className="mt-6">
        {pis.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-white/60 px-6 py-20 text-center backdrop-blur">
            <span className="inline-flex size-14 items-center justify-center rounded-2xl text-white shadow-lg" style={{ background: "linear-gradient(135deg, #0180cf, #63b81e)" }}>
              <ReceiptText size={26} strokeWidth={2.1} />
            </span>
            <p className="mt-4 text-[16px] font-bold text-slate-700">No proforma invoices yet</p>
            <p className="mt-1 text-[13.5px] text-slate-500">Build a working specification first, then open its PI.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-hairline bg-surface-card premium-card">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="text-left text-[11px] font-extrabold uppercase tracking-[0.05em] text-white" style={{ background: "linear-gradient(180deg, #0069b3, #00598f)" }}>
                  <th className="px-5 py-3">Offer No</th>
                  <th className="px-5 py-3">Project</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3 text-center">Qty</th>
                  <th className="px-5 py-3 text-right">Grand Total</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {pis.map((p, i) => (
                  <tr
                    key={p.id}
                    onClick={() => router.push(`/quotation/${p.id}/pi` as Route)}
                    className={`group cursor-pointer transition-colors hover:bg-[#e4f2fc] ${i % 2 ? "bg-[#f5fafe]" : "bg-white"}`}
                  >
                    <td className="border-b border-[#e7eff6] px-5 py-3 font-black text-slate-800">{p.offerNo || "—"}</td>
                    <td className="border-b border-[#e7eff6] px-5 py-3 text-slate-600">{p.project || "—"}</td>
                    <td className="border-b border-[#e7eff6] px-5 py-3 text-slate-600">{p.customer || "—"}</td>
                    <td className="border-b border-[#e7eff6] px-5 py-3 tabular-nums text-slate-600">{p.quoteDate || "—"}</td>
                    <td className="border-b border-[#e7eff6] px-5 py-3 text-center tabular-nums font-bold text-slate-700">{p.qty}</td>
                    <td className="border-b border-[#e7eff6] px-5 py-3 text-right tabular-nums font-black text-[#0069b3]">{inr(p.grandTotal)}</td>
                    <td className="border-b border-[#e7eff6] px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <ArrowRight size={14} className="text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-[#0180cf]" />
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
