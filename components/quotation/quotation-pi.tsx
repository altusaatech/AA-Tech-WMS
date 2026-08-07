"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { ArrowLeft, Save, Printer, Loader2, ReceiptText, Pencil } from "lucide-react";
import { fireToast } from "@/lib/toast";
import { saveQuotation } from "@/app/(app)/quotation/actions";
import {
  computeDoor,
  computePiLine,
  computePiTotals,
  inr,
  inrWords,
  COMPANY,
  type DoorLine,
  type QuotationData,
  type PiMeta,
} from "@/lib/quotation/types";

const inp =
  "h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-800 outline-none transition-all focus:border-[#0180cf] focus:ring-2 focus:ring-[#0180cf]/15";

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}

const DELIVERY_TERMS = ["1 month", "2 months", "3-4 months", "4-5 months", "5-6 months"];
const PAYMENT_TERMS = [
  "100% Advance against Purchase Order.",
  "60% Advance against Purchase Order, 40% against prior to dispatch.",
  "50% Advance against Purchase Order, 50% against prior to dispatch.",
  "30% Advance against Purchase Order, 70% against prior to dispatch.",
];

/** Preset dropdown with a "write manually" free-text mode (delivery/payment terms). */
function PresetTermsField({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  // A saved value outside the presets (older PIs, custom terms) opens in manual mode.
  const [manual, setManual] = React.useState(() => !!value && !options.includes(value));
  if (manual) {
    return (
      <div className="flex items-center gap-1.5">
        <input className={inp} value={value} onChange={(e) => onChange(e.target.value)} placeholder="Type delivery terms…" />
        <button
          type="button"
          onClick={() => { setManual(false); onChange(""); }}
          title="Choose from the list instead"
          className="h-9 shrink-0 rounded-lg border border-slate-200 bg-white px-2 text-[11.5px] font-bold text-slate-500 transition-colors hover:border-[#0180cf] hover:text-[#0069b3]"
        >
          List
        </button>
      </div>
    );
  }
  return (
    <select
      className={`${inp} truncate pr-7`}
      title={value || undefined}
      value={value}
      onChange={(e) => {
        if (e.target.value === "__manual__") { onChange(""); setManual(true); }
        else onChange(e.target.value);
      }}
    >
      <option value="">Select…</option>
      {options.map((t) => <option key={t} value={t}>{t}</option>)}
      <option value="__manual__">Write manually…</option>
    </select>
  );
}

export type PiDetail = Partial<PiMeta> & { customer?: string; project?: string };

export function QuotationPi({
  id,
  initial,
  initialPiMeta,
  detailsByEnquiry = {},
}: {
  id: string;
  initial: QuotationData;
  initialPiMeta: PiMeta;
  /** Enquiry No (lower-cased) → customer details from Quote Status + KYC.
   *  Changing the Offer Ref (= Enquiry No) re-fills the invoice from here. */
  detailsByEnquiry?: Record<string, PiDetail>;
}) {
  const router = useRouter();
  // Offer Ref IS the Enquiry No in the working spec — changing it refetches.
  const [enquiryNo, setEnquiryNo] = React.useState(initial.enquiryNo);
  const [offerNo, setOfferNo] = React.useState(initial.offerNo);
  const [quoteDate, setQuoteDate] = React.useState(initial.quoteDate);
  const [project, setProject] = React.useState(initial.project);
  const [customer, setCustomer] = React.useState(initial.customer);
  const [subject, setSubject] = React.useState(initial.subject);
  // The PI installation always mirrors the quotation's flat per-door
  // installation (from the Installation master) — the quote is the single
  // source of truth. When a door carries an installation on the quote we
  // overwrite piInstall with it (even if the PI was saved earlier); only doors
  // with no quote installation keep any manual PI value.
  const [lines, setLines] = React.useState<DoorLine[]>(() =>
    initial.lines.map((d) => {
      const { installPerDoor } = computeDoor(d);
      if (installPerDoor > 0) return { ...d, piInstall: Math.round(installPerDoor) };
      return { ...d, piInstall: d.piInstall ?? 0 };
    }),
  );
  const [piMeta, setPiMeta] = React.useState<PiMeta>(initialPiMeta);
  const [saving, setSaving] = React.useState(false);

  // Print settings — text size + bold, remembered on this computer.
  const [printCfg, setPrintCfg] = React.useState<{ size: number; bold: boolean }>({ size: 13, bold: true });
  React.useEffect(() => {
    try {
      const s = localStorage.getItem("pi-print-settings");
      if (s) {
        const p = JSON.parse(s) as { size?: number; bold?: boolean };
        // Coerce sizes saved before the scale was raised (≤10) up to the new default.
        const size = Number(p.size) || 13;
        setPrintCfg({ size: size >= 11.5 ? size : 13, bold: p.bold !== false });
      }
    } catch { /* defaults stay */ }
  }, []);
  function patchPrintCfg(patch: Partial<{ size: number; bold: boolean }>) {
    setPrintCfg((c) => {
      const next = { ...c, ...patch };
      try { localStorage.setItem("pi-print-settings", JSON.stringify(next)); } catch { /* non-fatal */ }
      return next;
    });
  }

  const totals = computePiTotals(lines);

  function setPi<K extends keyof PiMeta>(key: K, value: PiMeta[K]) {
    setPiMeta((m) => ({ ...m, [key]: value }));
  }
  // Offer Ref = Enquiry No: changing it re-fills the Enquiry No, customer and
  // every KYC/Quote-sourced field from the linked enquiry's details.
  function onOfferChange(v: string) {
    setOfferNo(v);
    setEnquiryNo(v);
    // Exact enquiry match first; else the bare number inside the ref, so
    // "180015 R1" still fetches enquiry 180015's details.
    const key = v.trim().toLowerCase();
    const d = detailsByEnquiry[key] ?? detailsByEnquiry[key.match(/\d{4,}/)?.[0] ?? ""];
    if (!d) return;
    if (d.customer) setCustomer(d.customer);
    if (d.project) setProject(d.project);
    setPiMeta((m) => ({
      ...m,
      customerAddress: d.customerAddress ?? m.customerAddress,
      billingAddress: d.billingAddress ?? m.billingAddress,
      deliveryAddress: d.deliveryAddress ?? m.deliveryAddress,
      customerGst: d.customerGst ?? m.customerGst,
      customerContactPerson: d.customerContactPerson ?? m.customerContactPerson,
      customerMobile: d.customerMobile ?? m.customerMobile,
      customerEmail: d.customerEmail ?? m.customerEmail,
      enquirySource: d.enquirySource ?? m.enquirySource,
      customerContact: d.customerContact ?? m.customerContact,
    }));
  }
  function patchDoor(doorId: string, patch: Partial<DoorLine>) {
    setLines((p) => p.map((d) => (d.id === doorId ? { ...d, ...patch } : d)));
  }

  async function save() {
    setSaving(true);
    try {
      await saveQuotation(id, { enquiryNo, offerNo, quoteDate, project, customer, subject }, lines, initial.notes, piMeta);
      fireToast({ message: "Proforma Invoice saved", type: "success" });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* ── editor (screen only) ── */}
      <main className="relative mx-auto max-w-[1500px] px-8 pb-16 pt-8 max-md:px-4 print:hidden">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => router.push(`/quotation/${id}` as Route)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-bold text-slate-600 shadow-sm transition-colors hover:bg-slate-50">
            <ArrowLeft size={15} strokeWidth={2.6} /> Back to Quotation
          </button>
          <div className="flex items-center gap-2.5">
            {/* print settings — text size + bold for readable hard copies */}
            <div className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm" title="Print settings">
              <span className="text-[11px] font-black uppercase tracking-[0.05em] text-slate-400">Print text</span>
              <select
                value={printCfg.size}
                onChange={(e) => patchPrintCfg({ size: Number(e.target.value) })}
                className="h-7 rounded-lg border border-slate-200 bg-white px-1.5 text-[12.5px] font-semibold text-slate-600 outline-none focus:border-[#0180cf]"
              >
                <option value={11.5}>Normal</option>
                <option value={13}>Large</option>
                <option value={15}>Extra large</option>
              </select>
              <label className="flex cursor-pointer items-center gap-1.5 text-[12.5px] font-bold text-slate-600">
                <input type="checkbox" checked={printCfg.bold} onChange={(e) => patchPrintCfg({ bold: e.target.checked })} className="size-3.5 accent-[#0069b3]" /> Bold
              </label>
            </div>
            <button type="button" onClick={() => window.print()} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#0180cf]/40 bg-[#0180cf]/8 px-4 text-[13.5px] font-bold text-[#0069b3] shadow-sm transition-all hover:-translate-y-0.5">
              <Printer size={16} /> Print PI
            </button>
            <button type="button" onClick={save} disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-xl px-5 text-[14px] font-extrabold text-white shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-60" style={{ background: "linear-gradient(135deg, #63b81e, #0180cf)", boxShadow: "0 12px 26px -10px rgba(1,128,207,0.6)" }}>
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} strokeWidth={2.4} />} Save
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="inline-flex size-10 items-center justify-center rounded-xl text-white shadow" style={{ background: "linear-gradient(135deg, #0069b3, #0180cf)" }}><ReceiptText size={20} /></span>
          <div>
            <h1 className="text-[20px] font-black text-slate-800">Proforma Invoice</h1>
            <p className="text-[12.5px] text-slate-500">Autofilled from the quotation — fill the invoice details, then Print PI.</p>
          </div>
        </div>

        {/* details */}
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2 max-md:grid-cols-1">
            <L label="Offer Ref"><input className={inp} value={offerNo} onChange={(e) => onOfferChange(e.target.value)} placeholder="180015 R1" /></L>
            <L label="Date"><input type="date" className={inp} value={quoteDate} onChange={(e) => setQuoteDate(e.target.value)} /></L>
            <L label="Project"><input className={inp} value={project} onChange={(e) => setProject(e.target.value)} placeholder="Project" /></L>
            <L label="Customer (To)"><input className={inp} value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Customer name" /></L>
            <L label="Enquiry No (from KYC)"><input className={`${inp} bg-slate-50`} value={enquiryNo} readOnly title="Fetched from the linked enquiry / Customer KYC" placeholder="—" /></L>
            <L label="Enquiry Source"><input className={inp} value={piMeta.enquirySource} onChange={(e) => setPi("enquirySource", e.target.value)} placeholder="Email / Reference…" /></L>
            <L label="Company Address"><textarea rows={2} className={`${inp} h-auto resize-y py-1.5`} value={piMeta.customerAddress} onChange={(e) => setPi("customerAddress", e.target.value)} placeholder="Plot, area, city - PIN" /></L>
            <L label="Billing Address"><textarea rows={2} className={`${inp} h-auto resize-y py-1.5`} value={piMeta.billingAddress} onChange={(e) => setPi("billingAddress", e.target.value)} placeholder="Billing address" /></L>
            <L label="Delivery Address"><textarea rows={2} className={`${inp} h-auto resize-y py-1.5`} value={piMeta.deliveryAddress} onChange={(e) => setPi("deliveryAddress", e.target.value)} placeholder="Delivery address" /></L>
            <L label="GST Number"><input className={inp} value={piMeta.customerGst} onChange={(e) => setPi("customerGst", e.target.value)} placeholder="27ABCDE1234F1Z5" /></L>
            <L label="Contact Person"><input className={inp} value={piMeta.customerContactPerson} onChange={(e) => setPi("customerContactPerson", e.target.value)} placeholder="Mr. Name" /></L>
            <L label="Mobile Number"><input className={inp} value={piMeta.customerMobile} onChange={(e) => setPi("customerMobile", e.target.value)} placeholder="90000 00000" /></L>
            <L label="Email ID"><input className={inp} value={piMeta.customerEmail} onChange={(e) => setPi("customerEmail", e.target.value)} placeholder="name@company.com" /></L>
            <L label="Customer Ref Date"><input type="date" className={inp} value={piMeta.customerRefDate} onChange={(e) => setPi("customerRefDate", e.target.value)} /></L>
            <L label="HSN Code"><input className={inp} value={piMeta.hsnCode} onChange={(e) => setPi("hsnCode", e.target.value)} placeholder="73083000" /></L>
            <L label="Terms of Delivery"><PresetTermsField options={DELIVERY_TERMS} value={piMeta.termsDelivery} onChange={(v) => setPi("termsDelivery", v)} /></L>
            <L label="Mode of Shipping"><input className={inp} value={piMeta.modeShipping} onChange={(e) => setPi("modeShipping", e.target.value)} /></L>
            <L label="Terms of Payment"><PresetTermsField options={PAYMENT_TERMS} value={piMeta.termsPayment} onChange={(v) => setPi("termsPayment", v)} /></L>
          </div>
        </div>

        {/* line items */}
        <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[900px] text-[13px]">
            <thead>
              <tr className="text-left text-[11px] font-extrabold uppercase tracking-[0.04em] text-white" style={{ background: "linear-gradient(180deg, #0069b3, #00598f)" }}>
                <th className="px-3 py-2.5">#</th>
                <th className="px-3 py-2.5">Door Code</th>
                <th className="px-3 py-2.5 text-right">Width (mm)</th>
                <th className="px-3 py-2.5 text-right">Height (mm)</th>
                <th className="px-3 py-2.5">Description</th>
                <th className="px-3 py-2.5 text-right">Qty</th>
                <th className="px-3 py-2.5 text-right">Rate ₹</th>
                <th className="px-3 py-2.5 text-right">Installation ₹</th>
                <th className="px-3 py-2.5 text-right">Amount ₹</th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-[13.5px] text-slate-400">
                    No doors in this quotation. Add doors in the quotation first.
                  </td>
                </tr>
              ) : (
                lines.map((d, i) => {
                  const p = computePiLine(d);
                  return (
                    <tr key={d.id} className={i % 2 ? "bg-[#f5fafe]" : "bg-white"}>
                      <td className="border-b border-[#e7eff6] px-3 py-1.5 text-center font-bold text-slate-400">{i + 1}</td>
                      <td className="border-b border-[#e7eff6] px-2 py-1.5"><input className={`${inp} h-8 w-24`} value={d.doorCode} onChange={(e) => patchDoor(d.id, { doorCode: e.target.value })} /></td>
                      <td className="border-b border-[#e7eff6] px-3 py-1.5 text-right tabular-nums text-slate-700">{d.width || "—"}</td>
                      <td className="border-b border-[#e7eff6] px-3 py-1.5 text-right tabular-nums text-slate-700">{d.height || "—"}</td>
                      <td className="border-b border-[#e7eff6] px-2 py-1.5">
                        <div className="relative min-w-[220px]">
                          <Pencil size={12} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            className={`${inp} h-8 pl-7`}
                            value={d.piDesc ?? d.doorType ?? ""}
                            onChange={(e) => patchDoor(d.id, { piDesc: e.target.value })}
                            placeholder="Description"
                            title="Printed on the PI — edit freely (defaults to the door type)"
                          />
                        </div>
                      </td>
                      <td className="border-b border-[#e7eff6] px-2 py-1.5"><input type="number" className={`${inp} h-8 w-16 text-right`} value={d.qty || ""} onChange={(e) => patchDoor(d.id, { qty: Number(e.target.value) })} /></td>
                      <td className="border-b border-[#e7eff6] px-3 py-1.5 text-right font-semibold tabular-nums text-slate-700">{inr(p.rate)}</td>
                      <td className="border-b border-[#e7eff6] px-3 py-1.5 text-right">
                        {computeDoor(d).installPerDoor > 0 ? (
                          <span className="font-semibold tabular-nums text-slate-600" title="Fetched from the quotation's installation">{inr(d.piInstall || 0)}</span>
                        ) : (
                          <input type="number" className={`${inp} ml-auto h-8 w-24 text-right`} value={d.piInstall || ""} onChange={(e) => patchDoor(d.id, { piInstall: Number(e.target.value) })} placeholder="0" />
                        )}
                      </td>
                      <td className="border-b border-[#e7eff6] px-3 py-1.5 text-right font-black tabular-nums text-[#0069b3]">{inr(p.amount)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* totals */}
        <div className="mt-5 flex justify-end">
          <div className="w-[360px] rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between py-0.5"><span className="text-[13px] font-semibold text-slate-500">Subtotal</span><span className="tabular-nums text-[15px] font-black text-slate-800">{inr(totals.subtotal)}</span></div>
            <div className="flex items-center justify-between py-0.5"><span className="text-[13px] font-semibold text-slate-500">CGST @ 9%</span><span className="tabular-nums text-[12.5px] text-slate-500">{inr(totals.cgst)}</span></div>
            <div className="flex items-center justify-between py-0.5"><span className="text-[13px] font-semibold text-slate-500">SGST @ 9%</span><span className="tabular-nums text-[12.5px] text-slate-500">{inr(totals.sgst)}</span></div>
            <div className="my-3 h-px bg-slate-100" />
            <div className="flex items-center justify-between rounded-xl px-3 py-2.5 text-white" style={{ background: "linear-gradient(120deg, #0069b3, #63b81e)" }}>
              <span className="text-[12px] font-bold uppercase tracking-[0.06em]">Grand Total</span>
              <span className="tabular-nums text-[20px] font-black">{inr(totals.grandTotal)}</span>
            </div>
            <p className="mt-2 text-[11.5px] font-semibold text-slate-500">{inrWords(totals.grandTotal)}</p>
          </div>
        </div>
      </main>

      {/* ── print ── */}
      <PiPrint header={{ enquiryNo, offerNo, quoteDate, project, customer, subject }} piMeta={piMeta} lines={lines} totals={totals} printCfg={printCfg} />
    </>
  );
}

/* ── Proforma Invoice print (matches the Supply & Installation format) ── */
function PiPrint({
  header,
  piMeta,
  lines,
  totals,
  printCfg,
}: {
  header: { enquiryNo: string; offerNo: string; quoteDate: string; project: string; customer: string; subject: string };
  piMeta: PiMeta;
  lines: DoorLine[];
  totals: ReturnType<typeof computePiTotals>;
  printCfg: { size: number; bold: boolean };
}) {
  const num = (v: number) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(Number.isFinite(v) ? v : 0));
  const c = "border border-slate-500 px-1 py-1 align-top break-words";
  // Fixed-size blocks scale with the chosen print size (tuned at base 10pt).
  const fs = (v: number) => Math.round(v * (printCfg.size / 10) * 10) / 10;
  // Supply-only PIs (no installation on any door) print in the "Supply" format:
  // no Installation column, "Supply" title/band — matching the paper original.
  const hasInstall = lines.some((d) => computePiLine(d).install > 0);
  return (
    <div className="q-print hidden bg-white text-slate-900 print:block" style={{ fontSize: printCfg.size, fontWeight: printCfg.bold ? 600 : 400, maxWidth: "100%", margin: "0 auto" }}>
      {/* company header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src="/logo-mark.png?v=3" alt="" style={{ height: 50, width: "auto" }} />
          <div style={{ fontSize: fs(20), fontWeight: 800, lineHeight: 1.06, color: "#0a0a0a" }}>
            Anant Avinya<br />Technologies LLP
          </div>
        </div>
        {/* Company address intentionally not printed on the PI. */}
        <div style={{ textAlign: "right", fontSize: fs(10), color: "#334155", lineHeight: 1.45 }}>
          <div>E-mail: {COMPANY.email}</div>
          <div>Web: {COMPANY.web}</div>
        </div>
      </div>

      {/* title */}
      <div style={{ border: "1.5px solid #0069b3", background: "#eef6fc", textAlign: "center", fontWeight: 800, fontSize: fs(16), padding: 5, color: "#0069b3" }}>
        PROFORMA INVOICE — Supply{hasInstall ? " & Installation" : ""}
      </div>

      {/* To + reference */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td className={c} style={{ width: "52%" }}>
              <div style={{ fontSize: fs(10), color: "#64748b" }}>To,</div>
              <div style={{ fontWeight: 700 }}>{header.customer || "—"}</div>
              {piMeta.customerAddress && <div style={{ whiteSpace: "pre-line" }}>{piMeta.customerAddress}</div>}
              {(() => {
                // Print each distinct address once — a billing/delivery line that
                // repeats the company (or each other's) address is dropped.
                const norm = (s: string) => (s || "").replace(/\s+/g, " ").trim().toLowerCase();
                const company = norm(piMeta.customerAddress);
                const billing = norm(piMeta.billingAddress);
                const delivery = norm(piMeta.deliveryAddress);
                const showBilling = !!piMeta.billingAddress && billing !== company;
                const showDelivery = !!piMeta.deliveryAddress && delivery !== company && (!showBilling || delivery !== billing);
                return (
                  <>
                    {showBilling && <div><b>Billing:</b> {piMeta.billingAddress}</div>}
                    {showDelivery && <div><b>Delivery:</b> {piMeta.deliveryAddress}</div>}
                  </>
                );
              })()}
              {piMeta.customerGst && <div><b>GST:</b> {piMeta.customerGst}</div>}
              {(piMeta.customerContactPerson || piMeta.customerMobile) && (
                <div><b>Contact:</b> {[piMeta.customerContactPerson, piMeta.customerMobile].filter((v) => v && v.trim()).join(" - ")}</div>
              )}
              {piMeta.customerEmail && <div><b>Email:</b> {piMeta.customerEmail}</div>}
            </td>
            <td className={c} style={{ padding: 0 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr><td className={c}>Offer Ref:</td><td className={c}><b>{header.offerNo || "—"}</b></td><td className={c}>Date:</td><td className={c}>{header.quoteDate || "—"}</td></tr>
                  <tr><td className={c}>Customer Reference:</td><td className={c}>{piMeta.enquirySource || "—"}</td><td className={c}>Date:</td><td className={c}>{piMeta.customerRefDate || "—"}</td></tr>
                  <tr><td className={c}>Other Reference:</td><td className={c} colSpan={3}>—</td></tr>
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td className={c}><b>Terms of Delivery</b><br />{piMeta.termsDelivery}</td>
            <td className={c} style={{ padding: 0 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", height: "100%" }}>
                <tbody>
                  <tr>
                    <td className={c} style={{ textAlign: "center", width: "40%" }}><b>MODE OF SHIPPING</b><br />{piMeta.modeShipping}</td>
                    <td className={c}><b>Terms of payment</b><br />{piMeta.termsPayment}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* line items */}
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <colgroup>
          {(hasInstall
            ? ["4%", "9%", "7%", "7%", "24%", "9%", "6%", "7%", "9%", "9%", "9%"]
            : ["4%", "9%", "7%", "7%", "33%", "9%", "6%", "7%", "9%", "9%"]
          ).map((w, i) => (
            <col key={i} style={{ width: w }} />
          ))}
        </colgroup>
        <thead>
          <tr style={{ background: "linear-gradient(180deg,#0180cf,#0069b3)", color: "#fff" }}>
            {["Sr. No.", "Door Code No.", "Door Width", "Door Height", "Description", "HSN Code", "UOM", "Qty in Nos.", "Rate in Rs.", ...(hasInstall ? ["Installation in Rs."] : []), "Amount in Rs."].map((h) => (
              <th key={h} className={c} style={{ textAlign: "center", fontWeight: 700, wordBreak: "break-word" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lines.map((d, i) => {
            const p = computePiLine(d);
            return (
              <tr key={d.id}>
                <td className={c} style={{ textAlign: "center" }}>{i + 1}</td>
                <td className={c}>{d.doorCode}</td>
                <td className={c} style={{ textAlign: "center" }}>{d.width || ""}</td>
                <td className={c} style={{ textAlign: "center" }}>{d.height || ""}</td>
                <td className={c}>{(d.piDesc ?? "").trim() || d.doorType}</td>
                <td className={c} style={{ textAlign: "center" }}>{piMeta.hsnCode}</td>
                <td className={c} style={{ textAlign: "center" }}>Nos</td>
                <td className={c} style={{ textAlign: "center" }}>{d.qty || ""}</td>
                <td className={c} style={{ textAlign: "right" }}>{num(p.rate)}</td>
                {hasInstall && <td className={c} style={{ textAlign: "right" }}>{p.install ? num(p.install) : ""}</td>}
                <td className={c} style={{ textAlign: "right", fontWeight: 700 }}>{num(p.amount)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* bottom: bank/declaration + totals */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td className={c} style={{ width: "55%" }}>
              <div><b>GST No.</b> {COMPANY.gstNo}</div>
              <div><b>PAN No:</b> {COMPANY.panNo}</div>
              <div style={{ marginTop: 4 }}><b>Amount in words:</b> {inrWords(totals.grandTotal)}</div>
              <div style={{ marginTop: 4, fontSize: fs(9.5) }}><b>RTGS Details:</b> {COMPANY.bank.name}; A/c No. {COMPANY.bank.acNo}; IFSC {COMPANY.bank.ifsc}; MICR {COMPANY.bank.micr}</div>
              <div style={{ marginTop: 4, fontSize: fs(9), color: "#475569" }}>Declaration: We declare that this Invoice shows the actual price of the goods described and that all particulars are true and correct.</div>
            </td>
            <td className={c} style={{ padding: 0 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr><td className={c}><b>Total</b></td><td className={c} style={{ textAlign: "center" }}>{totals.totalQty}</td><td className={c} style={{ textAlign: "right", fontWeight: 700 }}>{num(totals.subtotal)}</td></tr>
                  <tr><td className={c} colSpan={2}><b>Subtotal</b></td><td className={c} style={{ textAlign: "right", fontWeight: 700 }}>{num(totals.subtotal)}</td></tr>
                  <tr><td className={c} colSpan={2}>CGST @ 9.00%</td><td className={c} style={{ textAlign: "right" }}>{num(totals.cgst)}</td></tr>
                  <tr><td className={c} colSpan={2}>SGST @ 9.00%</td><td className={c} style={{ textAlign: "right" }}>{num(totals.sgst)}</td></tr>
                  {piMeta.freightNote && <tr><td className={c} colSpan={2}>Freight</td><td className={c} style={{ textAlign: "right", fontSize: fs(9) }}>{piMeta.freightNote}</td></tr>}
                  <tr style={{ background: "linear-gradient(90deg,#0069b3,#63b81e)" }}><td className={c} colSpan={2} style={{ color: "#fff", fontWeight: 800 }}>Grand Total</td><td className={c} style={{ textAlign: "right", color: "#fff", fontWeight: 800 }}>{num(totals.grandTotal)}</td></tr>
                </tbody>
              </table>
              <div style={{ padding: "26px 8px 8px", textAlign: "right", fontSize: fs(10.5) }}>
                <div>For {COMPANY.name}</div>
                <div style={{ marginTop: 20 }}>Signature &amp; Date</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
