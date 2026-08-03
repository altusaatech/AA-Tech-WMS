"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Download, Upload, FileSpreadsheet, Loader2, X } from "lucide-react";
import { importQuotationRows, type QuotationImportRow } from "@/app/(app)/quotation/actions";

/* Excel header label (lower-cased) → quotation header field. */
const HEADER_FIELDS: Record<string, "enquiryNo" | "offerNo" | "quoteDate" | "project" | "customer" | "subject"> = {
  "enquiry no": "enquiryNo",
  "offer no": "offerNo",
  "offer ref": "offerNo",
  "date": "quoteDate",
  "customer": "customer",
  "project": "project",
  "subject": "subject",
};

/* Excel header label (lower-cased) → PiMeta field (PI register only). */
const PI_FIELDS: Record<string, string> = {
  "enquiry source": "enquirySource",
  "company address": "customerAddress",
  "billing address": "billingAddress",
  "delivery address": "deliveryAddress",
  "gst no": "customerGst",
  "contact person": "customerContactPerson",
  "mobile": "customerMobile",
  "email": "customerEmail",
  "customer ref date": "customerRefDate",
  "hsn code": "hsnCode",
  "terms of delivery": "termsDelivery",
  "mode of shipping": "modeShipping",
  "terms of payment": "termsPayment",
};

/**
 * Template / Bulk Upload / Export toolbar for the Working Spec & PI registers —
 * same pattern as the sales registers. Imported rows are keyed by Offer No
 * (match → update, no match → new quotation with empty doors).
 */
export function RegisterExcelButtons({
  exportName,
  exportData,
  templateHeaders,
  withPiFields = false,
}: {
  exportName: string;
  exportData: Record<string, string | number>[];
  templateHeaders: string[];
  withPiFields?: boolean;
}) {
  const router = useRouter();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);
  const [banner, setBanner] = React.useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(exportData);
    const headers = Object.keys(exportData[0] ?? {});
    ws["!cols"] = headers.map((h) => ({ wch: Math.min(40, Math.max(10, h.length + 4)) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, exportName.slice(0, 28));
    XLSX.writeFile(wb, `${exportName}-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  async function downloadTemplate() {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.aoa_to_sheet([templateHeaders]);
    ws["!cols"] = templateHeaders.map((h) => ({ wch: Math.min(40, Math.max(12, h.length + 4)) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `${exportName}-template.xlsx`);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = "";
    if (!file) return;
    setBusy(true);
    setBanner(null);
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: false });
      const first = wb.SheetNames[0];
      if (!first) throw new Error("empty workbook");
      const objs = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[first]!, { defval: "", raw: false });
      const rows: QuotationImportRow[] = [];
      for (const o of objs) {
        const r: QuotationImportRow = {};
        const pi: Record<string, string> = {};
        for (const [label, val] of Object.entries(o)) {
          const key = label.trim().toLowerCase();
          const v = String(val ?? "").trim();
          if (!v) continue;
          const hf = HEADER_FIELDS[key];
          if (hf) {
            r[hf] = v;
            continue;
          }
          if (withPiFields) {
            const pf = PI_FIELDS[key];
            if (pf) pi[pf] = v;
          }
        }
        if (Object.keys(pi).length) r.pi = pi;
        if (Object.keys(r).length) rows.push(r);
      }
      if (!rows.length) {
        setBanner({ kind: "err", text: "No matching columns found — use the Template headers (first sheet is read)." });
        return;
      }
      const res = await importQuotationRows(rows);
      setBanner({
        kind: "ok",
        text: `Imported ${res.inserted} new · updated ${res.updated} existing${res.skipped ? ` · ${res.skipped} empty skipped` : ""}.`,
      });
      router.refresh();
    } catch {
      setBanner({ kind: "err", text: "Could not read the file. Make sure it's a valid Excel/CSV file." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-end gap-2">
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={onFile} className="hidden" />
        <button
          type="button"
          onClick={downloadTemplate}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-[13px] font-bold text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-50"
          title="Download a blank Excel template with the correct columns"
        >
          <FileSpreadsheet size={15} /> Template
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#0180cf]/40 bg-[#0180cf]/10 px-3.5 text-[13px] font-bold text-[#0069b3] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#0180cf]/15 disabled:opacity-50 disabled:hover:translate-y-0"
          title="Bulk upload — import rows from an Excel/CSV file"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} Bulk Upload
        </button>
        <button
          type="button"
          onClick={exportExcel}
          disabled={exportData.length === 0}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#63b81e]/40 bg-[#63b81e]/10 px-3.5 text-[13px] font-bold text-[#3f7a14] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#63b81e]/15 disabled:opacity-50 disabled:hover:translate-y-0"
          title="Export to Excel"
        >
          <Download size={15} /> Export
        </button>
      </div>
      {banner && (
        <div
          className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-[13px] font-semibold ${
            banner.kind === "ok" ? "border-[#63b81e]/30 bg-[#63b81e]/10 text-[#3f7a14]" : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <span>{banner.text}</span>
          <button type="button" onClick={() => setBanner(null)} className="shrink-0 opacity-60 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
