"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { ReceiptText, FilePlus2, ArrowRight, FolderOpen } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { RegisterExcelButtons } from "@/components/quotation/register-excel";
import { inr } from "@/lib/quotation/types";

export interface PiSummary {
  id: string;
  enquiryNo: string;
  offerNo: string;
  project: string;
  customer: string;
  quoteDate: string;
  enquirySource: string;
  customerAddress: string;
  billingAddress: string;
  deliveryAddress: string;
  customerGst: string;
  contactPerson: string;
  mobile: string;
  email: string;
  customerRefDate: string;
  hsnCode: string;
  termsDelivery: string;
  modeShipping: string;
  termsPayment: string;
  qty: number;
  subtotal: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
}

const th = "whitespace-nowrap px-3 py-3";
const td = "whitespace-nowrap border-b border-[#e7eff6] px-3 py-2.5";

/** Register of Proforma Invoices — every PI field, one row per quotation. */
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
        <RegisterExcelButtons
          exportName="PI-Register"
          withPiFields
          templateHeaders={[
            "Enquiry No", "Offer No", "Date", "Customer", "Project",
            "Enquiry Source", "Company Address", "Billing Address", "Delivery Address",
            "GST No", "Contact Person", "Mobile", "Email", "Customer Ref Date",
            "HSN Code", "Terms of Delivery", "Mode of Shipping", "Terms of Payment",
          ]}
          exportData={pis.map((p, i) => ({
            "Sr No": i + 1,
            "Enquiry No": p.enquiryNo,
            "Offer No": p.offerNo,
            "Date": p.quoteDate,
            "Customer": p.customer,
            "Project": p.project,
            "Enquiry Source": p.enquirySource,
            "Company Address": p.customerAddress,
            "Billing Address": p.billingAddress,
            "Delivery Address": p.deliveryAddress,
            "GST No": p.customerGst,
            "Contact Person": p.contactPerson,
            "Mobile": p.mobile,
            "Email": p.email,
            "Customer Ref Date": p.customerRefDate,
            "HSN Code": p.hsnCode,
            "Terms of Delivery": p.termsDelivery,
            "Mode of Shipping": p.modeShipping,
            "Terms of Payment": p.termsPayment,
            "Qty": p.qty,
            "Subtotal": Math.round(p.subtotal),
            "CGST 9%": Math.round(p.cgst),
            "SGST 9%": Math.round(p.sgst),
            "Grand Total": Math.round(p.grandTotal),
          }))}
        />
      </div>

      <div className="mt-3">
        {pis.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-white/60 px-6 py-20 text-center backdrop-blur">
            <span className="inline-flex size-14 items-center justify-center rounded-2xl text-white shadow-lg" style={{ background: "linear-gradient(135deg, #0180cf, #63b81e)" }}>
              <ReceiptText size={26} strokeWidth={2.1} />
            </span>
            <p className="mt-4 text-[16px] font-bold text-slate-700">No proforma invoices yet</p>
            <p className="mt-1 text-[13.5px] text-slate-500">Build a working specification first, then open its PI.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-hairline bg-surface-card premium-card">
            <table className="w-full min-w-[2300px] text-[12.5px]">
              <thead>
                <tr className="text-left text-[10.5px] font-extrabold uppercase tracking-[0.05em] text-white" style={{ background: "linear-gradient(180deg, #0069b3, #00598f)" }}>
                  <th className={th}>Sr No</th>
                  <th className={th}>Enquiry No</th>
                  <th className={th}>Offer Ref</th>
                  <th className={th}>Date</th>
                  <th className={th}>Customer</th>
                  <th className={th}>Project</th>
                  <th className={th}>Enquiry Source</th>
                  <th className={th}>Company Address</th>
                  <th className={th}>Billing Address</th>
                  <th className={th}>Delivery Address</th>
                  <th className={th}>GST No</th>
                  <th className={th}>Contact Person</th>
                  <th className={th}>Mobile</th>
                  <th className={th}>Email</th>
                  <th className={th}>Customer Ref Date</th>
                  <th className={th}>HSN Code</th>
                  <th className={th}>Terms of Delivery</th>
                  <th className={th}>Mode of Shipping</th>
                  <th className={th}>Terms of Payment</th>
                  <th className={`${th} text-center`}>Qty</th>
                  <th className={`${th} text-right`}>Subtotal</th>
                  <th className={`${th} text-right`}>CGST 9%</th>
                  <th className={`${th} text-right`}>SGST 9%</th>
                  <th className={`${th} text-right`}>Grand Total</th>
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
                    <td className={`${td} tabular-nums font-semibold text-slate-500`}>{i + 1}</td>
                    <td className={`${td} font-bold text-slate-700`}>{p.enquiryNo || "—"}</td>
                    <td className={`${td} font-black text-slate-800`}>{p.offerNo || "—"}</td>
                    <td className={`${td} tabular-nums text-slate-600`}>{p.quoteDate || "—"}</td>
                    <td className={`${td} max-w-[170px] truncate text-slate-600`} title={p.customer}>{p.customer || "—"}</td>
                    <td className={`${td} max-w-[150px] truncate text-slate-600`} title={p.project}>{p.project || "—"}</td>
                    <td className={`${td} max-w-[120px] truncate text-slate-500`} title={p.enquirySource}>{p.enquirySource || "—"}</td>
                    <td className={`${td} max-w-[200px] truncate text-slate-500`} title={p.customerAddress}>{p.customerAddress || "—"}</td>
                    <td className={`${td} max-w-[200px] truncate text-slate-500`} title={p.billingAddress}>{p.billingAddress || "—"}</td>
                    <td className={`${td} max-w-[200px] truncate text-slate-500`} title={p.deliveryAddress}>{p.deliveryAddress || "—"}</td>
                    <td className={`${td} tabular-nums text-slate-600`}>{p.customerGst || "—"}</td>
                    <td className={`${td} max-w-[140px] truncate text-slate-600`} title={p.contactPerson}>{p.contactPerson || "—"}</td>
                    <td className={`${td} tabular-nums text-slate-600`}>{p.mobile || "—"}</td>
                    <td className={`${td} max-w-[180px] truncate text-slate-500`} title={p.email}>{p.email || "—"}</td>
                    <td className={`${td} tabular-nums text-slate-600`}>{p.customerRefDate || "—"}</td>
                    <td className={`${td} tabular-nums text-slate-600`}>{p.hsnCode || "—"}</td>
                    <td className={`${td} max-w-[170px] truncate text-slate-500`} title={p.termsDelivery}>{p.termsDelivery || "—"}</td>
                    <td className={`${td} max-w-[120px] truncate text-slate-500`} title={p.modeShipping}>{p.modeShipping || "—"}</td>
                    <td className={`${td} max-w-[200px] truncate text-slate-500`} title={p.termsPayment}>{p.termsPayment || "—"}</td>
                    <td className={`${td} text-center tabular-nums font-bold text-slate-700`}>{p.qty}</td>
                    <td className={`${td} text-right tabular-nums font-semibold text-slate-700`}>{inr(p.subtotal)}</td>
                    <td className={`${td} text-right tabular-nums text-slate-500`}>{inr(p.cgst)}</td>
                    <td className={`${td} text-right tabular-nums text-slate-500`}>{inr(p.sgst)}</td>
                    <td className={`${td} text-right tabular-nums font-black text-[#0069b3]`}>{inr(p.grandTotal)}</td>
                    <td className="border-b border-[#e7eff6] px-3 py-2.5">
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
