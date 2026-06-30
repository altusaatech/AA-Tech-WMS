"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { ArrowLeft, Save, Printer, Plus, Trash2, Loader2, DoorOpen, FileText, ReceiptText } from "lucide-react";
import { fireToast } from "@/lib/toast";
import { saveQuotation } from "@/app/(app)/quotation/actions";
import {
  newDoor,
  computeDoor,
  computeTotals,
  computePiLine,
  computePiTotals,
  inr,
  inr2,
  inrWords,
  COMPANY,
  HARDWARE_SLOTS,
  type DoorLine,
  type QuotationData,
  type PiMeta,
} from "@/lib/quotation/types";

interface ProductOption {
  type: string;
  ratePerSqm: number;
  insulation: string;
  uom: string;
}

const HW_ABBR: Record<string, string> = {
  "SS Ball Bearing Hinges": "Hinges",
  "Mortise Dead Bolt": "Dead Bolt",
  "Door Closer": "Closer",
  "SS 'D' Handle": "D-Handle",
  "Concealed Tower Bolt": "Tower Bolt",
  "Double Glazed Vision Panel": "Vision Panel",
  "SS 304 Kick Plate": "Kick Plate",
  "SS 304 Push Plate": "Push Plate",
  "Concealed Drop Seal": "Drop Seal",
  "EPDM Gasket": "Gasket",
};

const inp =
  "h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-800 outline-none transition-all focus:border-[#0180cf] focus:ring-2 focus:ring-[#0180cf]/15";

export function QuotationBuilder({
  id,
  initial,
  initialPiMeta,
  productOptions,
  hardwareDefaults,
}: {
  id: string;
  initial: QuotationData;
  initialPiMeta: PiMeta;
  productOptions: ProductOption[];
  hardwareDefaults: Record<string, number>;
}) {
  const router = useRouter();
  const [offerNo, setOfferNo] = React.useState(initial.offerNo);
  const [quoteDate, setQuoteDate] = React.useState(initial.quoteDate);
  const [project, setProject] = React.useState(initial.project);
  const [customer, setCustomer] = React.useState(initial.customer);
  const [subject, setSubject] = React.useState(initial.subject);
  const [lines, setLines] = React.useState<DoorLine[]>(initial.lines);
  const [notes, setNotes] = React.useState<string[]>(initial.notes);
  const [piMeta, setPiMeta] = React.useState<PiMeta>(initialPiMeta);
  const [printMode, setPrintMode] = React.useState<"quotation" | "pi">("quotation");
  const [saving, setSaving] = React.useState(false);

  const totals = computeTotals(lines);
  const piTotals = computePiTotals(lines);

  function setPi<K extends keyof PiMeta>(key: K, value: PiMeta[K]) {
    setPiMeta((m) => ({ ...m, [key]: value }));
  }
  function printDoc(mode: "quotation" | "pi") {
    setPrintMode(mode);
    requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
  }

  function addDoor() {
    const d = newDoor();
    d.hardware = HARDWARE_SLOTS.map((name) => ({ name, qty: 0, rate: hardwareDefaults[name] ?? 0 }));
    setLines((p) => [...p, d]);
  }
  function patchDoor(doorId: string, patch: Partial<DoorLine>) {
    setLines((p) => p.map((d) => (d.id === doorId ? { ...d, ...patch } : d)));
  }
  function patchHw(doorId: string, idx: number, patch: { qty?: number; rate?: number }) {
    setLines((p) =>
      p.map((d) =>
        d.id === doorId ? { ...d, hardware: d.hardware.map((h, i) => (i === idx ? { ...h, ...patch } : h)) } : d,
      ),
    );
  }
  function removeDoor(doorId: string) {
    setLines((p) => p.filter((d) => d.id !== doorId));
  }
  function pickProduct(doorId: string, type: string) {
    const prod = productOptions.find((p) => p.type === type);
    patchDoor(doorId, {
      doorType: type,
      ...(prod ? { ratePerSqm: prod.ratePerSqm || 0, insulation: prod.insulation || "" } : {}),
    });
  }

  async function save() {
    setSaving(true);
    try {
      await saveQuotation(id, { offerNo, quoteDate, project, customer, subject }, lines, notes, piMeta);
      fireToast({ message: "Quotation saved", type: "success" });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* ───────────── EDITOR (screen only) ───────────── */}
      <main className="relative mx-auto max-w-[1700px] px-8 pb-16 pt-8 max-md:px-4 print:hidden">
        {/* action bar */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => router.push("/quotation" as Route)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-bold text-slate-600 shadow-sm transition-colors hover:bg-slate-50">
            <ArrowLeft size={15} strokeWidth={2.6} /> All quotations
          </button>
          <div className="flex items-center gap-2.5">
            <button type="button" onClick={() => printDoc("quotation")} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[13.5px] font-bold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5">
              <Printer size={16} /> Print Quotation
            </button>
            <button type="button" onClick={() => printDoc("pi")} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#0180cf]/40 bg-[#0180cf]/8 px-4 text-[13.5px] font-bold text-[#0069b3] shadow-sm transition-all hover:-translate-y-0.5" title="Print Proforma Invoice">
              <ReceiptText size={16} /> Print PI
            </button>
            <button type="button" onClick={save} disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-xl px-5 text-[14px] font-extrabold text-white shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-60" style={{ background: "linear-gradient(135deg, #63b81e, #0180cf)", boxShadow: "0 12px 26px -10px rgba(1,128,207,0.6)" }}>
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} strokeWidth={2.4} />} Save
            </button>
          </div>
        </div>

        {/* header card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-5 gap-3 max-lg:grid-cols-2 max-md:grid-cols-1">
            <L label="Offer No"><input className={inp} value={offerNo} onChange={(e) => setOfferNo(e.target.value)} placeholder="170051" /></L>
            <L label="Date"><input type="date" className={inp} value={quoteDate} onChange={(e) => setQuoteDate(e.target.value)} /></L>
            <L label="Project"><input className={inp} value={project} onChange={(e) => setProject(e.target.value)} placeholder="Project name" /></L>
            <L label="Customer"><input className={inp} value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Customer name" /></L>
            <L label="Subject"><input className={inp} value={subject} onChange={(e) => setSubject(e.target.value)} /></L>
          </div>

          {/* Proforma Invoice details (used on the PI print) */}
          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.08em] text-[#0069b3]">
              <ReceiptText size={13} /> Proforma Invoice details
            </div>
            <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2 max-md:grid-cols-1">
              <L label="Customer Address"><textarea rows={2} className={`${inp} h-auto resize-y py-1.5`} value={piMeta.customerAddress} onChange={(e) => setPi("customerAddress", e.target.value)} placeholder="Plot, area, city - PIN" /></L>
              <L label="Customer Contact"><input className={inp} value={piMeta.customerContact} onChange={(e) => setPi("customerContact", e.target.value)} placeholder="Mr. Name - 90000 00000" /></L>
              <L label="Customer Ref Date"><input type="date" className={inp} value={piMeta.customerRefDate} onChange={(e) => setPi("customerRefDate", e.target.value)} /></L>
              <L label="HSN Code"><input className={inp} value={piMeta.hsnCode} onChange={(e) => setPi("hsnCode", e.target.value)} placeholder="73083000" /></L>
              <L label="Terms of Delivery"><input className={inp} value={piMeta.termsDelivery} onChange={(e) => setPi("termsDelivery", e.target.value)} /></L>
              <L label="Mode of Shipping"><input className={inp} value={piMeta.modeShipping} onChange={(e) => setPi("modeShipping", e.target.value)} /></L>
              <L label="Terms of Payment"><input className={inp} value={piMeta.termsPayment} onChange={(e) => setPi("termsPayment", e.target.value)} /></L>
              <L label="Freight"><input className={inp} value={piMeta.freightNote} onChange={(e) => setPi("freightNote", e.target.value)} placeholder="Extra to your a/c" /></L>
            </div>
          </div>
        </div>

        {/* door cards */}
        <div className="mt-5 space-y-4">
          {lines.map((d, i) => (
            <DoorCard
              key={d.id}
              door={d}
              index={i}
              productOptions={productOptions}
              onPickProduct={(t) => pickProduct(d.id, t)}
              onPatch={(p) => patchDoor(d.id, p)}
              onPatchHw={(idx, p) => patchHw(d.id, idx, p)}
              onRemove={() => removeDoor(d.id)}
            />
          ))}
        </div>

        <button type="button" onClick={addDoor} className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl border-2 border-dashed border-[#0180cf]/40 px-5 text-[14px] font-extrabold text-[#0069b3] transition-colors hover:bg-[#0180cf]/5">
          <Plus size={17} strokeWidth={2.8} /> Add Door
        </button>

        {/* totals + notes */}
        <div className="mt-6 grid grid-cols-[1fr_360px] gap-5 max-lg:grid-cols-1">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-[12px] font-black uppercase tracking-[0.1em] text-slate-400">Notes &amp; Terms</h3>
            <div className="space-y-2">
              {notes.map((nt, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="mt-2 text-[12px] font-bold text-slate-400">{i + 1}.</span>
                  <textarea rows={1} className="min-h-9 flex-1 resize-y rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[13px] text-slate-700 outline-none focus:border-[#0180cf]" value={nt} onChange={(e) => setNotes((p) => p.map((x, j) => (j === i ? e.target.value : x)))} />
                  <button type="button" onClick={() => setNotes((p) => p.filter((_, j) => j !== i))} className="mt-1 rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
              ))}
              <button type="button" onClick={() => setNotes((p) => [...p, ""])} className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-[12.5px] font-bold text-slate-500 hover:bg-slate-50"><Plus size={13} /> Add term</button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-fit">
            <h3 className="mb-3 text-[12px] font-black uppercase tracking-[0.1em] text-slate-400">Totals</h3>
            <Row label="Sub Total (Supply)" value={inr(totals.subtotalSupply)} />
            {totals.subtotalInstall > 0 && <Row label="Sub Total (Install)" value={inr(totals.subtotalInstall)} />}
            <Row label="CGST @ 9%" value={inr2(totals.cgst)} muted />
            <Row label="SGST @ 9%" value={inr2(totals.sgst)} muted />
            <div className="my-3 h-px bg-slate-100" />
            <div className="flex items-center justify-between rounded-xl px-3 py-2.5 text-white" style={{ background: "linear-gradient(120deg, #0069b3, #63b81e)" }}>
              <span className="text-[12px] font-bold uppercase tracking-[0.06em]">Grand Total</span>
              <span className="tabular-nums text-[20px] font-black">{inr2(totals.grandTotal)}</span>
            </div>
          </div>
        </div>
      </main>

      {/* ───────────── PRINT LAYOUTS ───────────── */}
      <QuotationPrint
        active={printMode === "quotation"}
        header={{ offerNo, quoteDate, project, customer, subject }}
        lines={lines}
        notes={notes}
        totals={totals}
      />
      <PiPrint
        active={printMode === "pi"}
        header={{ offerNo, quoteDate, project, customer, subject }}
        piMeta={piMeta}
        lines={lines}
        totals={piTotals}
      />
    </>
  );
}

/* ── editor sub-components ── */

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[13px] font-semibold text-slate-500">{label}</span>
      <span className={`tabular-nums ${muted ? "text-[12.5px] text-slate-500" : "text-[15px] font-black text-slate-800"}`}>{value}</span>
    </div>
  );
}

function DoorCard({
  door,
  index,
  productOptions,
  onPickProduct,
  onPatch,
  onPatchHw,
  onRemove,
}: {
  door: DoorLine;
  index: number;
  productOptions: ProductOption[];
  onPickProduct: (type: string) => void;
  onPatch: (p: Partial<DoorLine>) => void;
  onPatchHw: (idx: number, p: { qty?: number; rate?: number }) => void;
  onRemove: () => void;
}) {
  const c = computeDoor(door);
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-[#f3f9fe] to-white px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex size-8 items-center justify-center rounded-lg text-white" style={{ background: "linear-gradient(135deg, #0180cf, #0069b3)" }}><DoorOpen size={16} /></span>
          <span className="text-[14px] font-black text-slate-800">Door #{index + 1}</span>
          <span className="text-[12.5px] font-semibold text-slate-400">{door.doorType || "—"}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[12.5px] font-bold text-slate-500">Total: <span className="tabular-nums text-[#0069b3]">{inr(c.totalSupply + c.installTotal)}</span></span>
          <button type="button" onClick={onRemove} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-6 gap-2.5 max-xl:grid-cols-4 max-md:grid-cols-2">
          <L label="Door Code"><input className={inp} value={door.doorCode} onChange={(e) => onPatch({ doorCode: e.target.value })} placeholder="SD1" /></L>
          <L label="Door Type (Product)">
            <select className={`${inp} cursor-pointer`} value={door.doorType} onChange={(e) => onPickProduct(e.target.value)}>
              <option value="">Select product…</option>
              {productOptions.map((p) => <option key={p.type} value={p.type}>{p.type}</option>)}
            </select>
          </L>
          <L label="Door Config"><input className={inp} value={door.doorConfig} onChange={(e) => onPatch({ doorConfig: e.target.value })} placeholder="Single" /></L>
          <L label="Frame Profile"><input className={inp} value={door.frameProfile} onChange={(e) => onPatch({ frameProfile: e.target.value })} placeholder="100 x 50 SR" /></L>
          <L label="Frame Material"><input className={inp} value={door.frameMaterial} onChange={(e) => onPatch({ frameMaterial: e.target.value })} placeholder="GI 1.2mm" /></L>
          <L label="Shutter Material"><input className={inp} value={door.shutterMaterial} onChange={(e) => onPatch({ shutterMaterial: e.target.value })} placeholder="GI 0.8mm" /></L>
          <L label="Insulation"><input className={inp} value={door.insulation} onChange={(e) => onPatch({ insulation: e.target.value })} placeholder="Honeycomb" /></L>
          <L label="Orientation"><input className={inp} value={door.orientation} onChange={(e) => onPatch({ orientation: e.target.value })} /></L>
          <L label="Finish"><input className={inp} value={door.finish} onChange={(e) => onPatch({ finish: e.target.value })} placeholder="RAL 5002" /></L>
          <L label="Width (mm)"><input type="number" className={`${inp} text-right`} value={door.width || ""} onChange={(e) => onPatch({ width: Number(e.target.value) })} /></L>
          <L label="Height (mm)"><input type="number" className={`${inp} text-right`} value={door.height || ""} onChange={(e) => onPatch({ height: Number(e.target.value) })} /></L>
          <L label="Qty"><input type="number" className={`${inp} text-right`} value={door.qty || ""} onChange={(e) => onPatch({ qty: Number(e.target.value) })} /></L>
          <L label="Rate ₹/sq.m"><input type="number" className={`${inp} text-right`} value={door.ratePerSqm || ""} onChange={(e) => onPatch({ ratePerSqm: Number(e.target.value) })} /></L>
          <L label="Install ₹/sq.m"><input type="number" className={`${inp} text-right`} value={door.installPerSqm || ""} onChange={(e) => onPatch({ installPerSqm: Number(e.target.value) })} /></L>
          <L label="Location (PI)"><input className={inp} value={door.location ?? ""} onChange={(e) => onPatch({ location: e.target.value })} placeholder="Production Ground Floor" /></L>
          <L label="PI Installation ₹ / door"><input type="number" className={`${inp} text-right`} value={door.piInstall || ""} onChange={(e) => onPatch({ piInstall: Number(e.target.value) })} placeholder="3500" /></L>
        </div>

        {/* computed strip */}
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip label="Area" value={`${c.area.toFixed(3)} m²`} />
          <Chip label="Basic Supply" value={inr(c.basicSupply)} />
          <Chip label="Hardware" value={inr(c.hardwareTotal)} />
          <Chip label="Door + HW" value={inr(c.doorHw)} />
          <Chip label="Total Supply" value={inr(c.totalSupply)} strong />
        </div>

        {/* hardware grid */}
        <div className="mt-4">
          <div className="mb-1.5 text-[11px] font-black uppercase tracking-[0.08em] text-slate-400">Hardware (qty × rate)</div>
          <div className="grid grid-cols-2 gap-2 max-md:grid-cols-1">
            {door.hardware.map((h, idx) => {
              const amt = (Number(h.qty) || 0) * (Number(h.rate) || 0);
              return (
                <div key={h.name} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-1.5">
                  <span className="flex-1 truncate text-[12.5px] font-semibold text-slate-600" title={h.name}>{HW_ABBR[h.name] ?? h.name}</span>
                  <input type="number" className="h-8 w-16 rounded-md border border-slate-200 bg-white px-2 text-right text-[12.5px] outline-none focus:border-[#0180cf]" value={h.qty || ""} onChange={(e) => onPatchHw(idx, { qty: Number(e.target.value) })} placeholder="qty" />
                  <span className="text-[12px] text-slate-300">×</span>
                  <input type="number" className="h-8 w-20 rounded-md border border-slate-200 bg-white px-2 text-right text-[12.5px] outline-none focus:border-[#0180cf]" value={h.rate || ""} onChange={(e) => onPatchHw(idx, { rate: Number(e.target.value) })} placeholder="rate" />
                  <span className="w-20 shrink-0 text-right text-[12.5px] font-black tabular-nums text-slate-700">{inr(amt)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Chip({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[12px]">
      <span className="font-semibold text-slate-400">{label}</span>
      <span className={`tabular-nums ${strong ? "font-black text-[#0069b3]" : "font-bold text-slate-700"}`}>{value}</span>
    </span>
  );
}

/* ── print layout ── */

function QuotationPrint({
  active,
  header,
  lines,
  notes,
  totals,
}: {
  active: boolean;
  header: { offerNo: string; quoteDate: string; project: string; customer: string; subject: string };
  lines: DoorLine[];
  notes: string[];
  totals: ReturnType<typeof computeTotals>;
}) {
  const th = "border border-[#0a5a93] px-1 py-1 text-center font-bold text-white";
  const td = "border border-slate-300 px-1 py-1 text-center";
  return (
    <div className={`${active ? "q-print print:block" : ""} hidden bg-white text-slate-900`} style={{ fontSize: 8 }}>
      {/* ── AA Tech branded header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "3px solid #0180cf", paddingBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/logo-mark.png?v=3" alt="" style={{ height: 44, width: "auto" }} />
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em", color: "#0a0a0a" }}>Anant Avinya Technologies</div>
            <div style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: "0.22em", color: "#63b81e" }}>SMART WAREHOUSE MANAGEMENT SYSTEM</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "0.04em", color: "#0069b3" }}>QUOTATION</div>
          <div style={{ fontSize: 8.5, color: "#475569", fontWeight: 600 }}>{header.subject || "Supply of Clean Room Doors"}</div>
        </div>
      </div>

      {/* meta band */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, background: "linear-gradient(90deg, #eef6fc, #eef7e6)", border: "1px solid #d7e7f3", borderRadius: 4, padding: "4px 10px", marginTop: 6, fontSize: 9 }}>
        <span><b style={{ color: "#0069b3" }}>Offer No:</b> {header.offerNo || "—"}</span>
        <span><b style={{ color: "#0069b3" }}>Date:</b> {header.quoteDate || "—"}</span>
        <span><b style={{ color: "#0069b3" }}>Customer:</b> {header.customer || "—"}</span>
        <span><b style={{ color: "#0069b3" }}>Project:</b> {header.project || "—"}</span>
      </div>

      {/* door table */}
      <table className="mt-2 w-full border-collapse" style={{ fontSize: 7 }}>
        <thead>
          <tr style={{ background: "linear-gradient(180deg, #0180cf, #0069b3)" }}>
            <th className={th}>SR</th>
            <th className={th}>CODE</th>
            <th className={th}>TYPE</th>
            <th className={th}>FRAME</th>
            <th className={th}>SHUTTER</th>
            <th className={th}>INSUL</th>
            <th className={th}>FINISH</th>
            <th className={th}>CONFIG</th>
            <th className={th}>W</th>
            <th className={th}>H</th>
            <th className={th}>AREA</th>
            <th className={th}>QTY</th>
            {HARDWARE_SLOTS.map((s) => (
              <th key={s} className={th} style={{ width: 34 }}>{HW_ABBR[s] ?? s}</th>
            ))}
            <th className={th}>RATE/m²</th>
            <th className={th}>BASIC ₹</th>
            <th className={th}>HW ₹</th>
            <th className={th}>DOOR+HW</th>
            <th className={th}>TOTAL ₹</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((d, i) => {
            const c = computeDoor(d);
            return (
              <tr key={d.id}>
                <td className={td}>{i + 1}</td>
                <td className={td}>{d.doorCode}</td>
                <td className={td} style={{ textAlign: "left" }}>{d.doorType}</td>
                <td className={td}>{[d.frameProfile, d.frameMaterial].filter(Boolean).join(" / ")}</td>
                <td className={td}>{d.shutterMaterial}</td>
                <td className={td}>{d.insulation}</td>
                <td className={td}>{d.finish}</td>
                <td className={td}>{d.doorConfig}</td>
                <td className={td}>{d.width || ""}</td>
                <td className={td}>{d.height || ""}</td>
                <td className={td}>{c.area ? c.area.toFixed(3) : ""}</td>
                <td className={td}>{d.qty || ""}</td>
                {d.hardware.map((h, hi) => {
                  const amt = (Number(h.qty) || 0) * (Number(h.rate) || 0);
                  return (
                    <td key={hi} className={td}>
                      {amt > 0 ? (
                        <>
                          <div>{h.qty}</div>
                          <div style={{ fontWeight: 700 }}>{inr(amt)}</div>
                        </>
                      ) : (
                        "-"
                      )}
                    </td>
                  );
                })}
                <td className={td}>{inr(d.ratePerSqm)}</td>
                <td className={td}>{inr(c.basicSupply)}</td>
                <td className={td}>{inr(c.hardwareTotal)}</td>
                <td className={td}>{inr(c.doorHw)}</td>
                <td className={td} style={{ fontWeight: 800 }}>{inr(c.totalSupply + c.installTotal)}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr style={{ background: "#eef6fc" }}>
            <td className={td} colSpan={12 + HARDWARE_SLOTS.length + 4} style={{ textAlign: "right", fontWeight: 700 }}>Sub Total (Supply)</td>
            <td className={td} style={{ fontWeight: 800 }}>{inr(totals.subtotal)}</td>
          </tr>
          <tr>
            <td className={td} colSpan={12 + HARDWARE_SLOTS.length + 4} style={{ textAlign: "right" }}>CGST @ 9%</td>
            <td className={td}>{inr2(totals.cgst)}</td>
          </tr>
          <tr>
            <td className={td} colSpan={12 + HARDWARE_SLOTS.length + 4} style={{ textAlign: "right" }}>SGST @ 9%</td>
            <td className={td}>{inr2(totals.sgst)}</td>
          </tr>
          <tr style={{ background: "linear-gradient(90deg, #0069b3, #63b81e)" }}>
            <td className="border border-[#0a5a93] px-1 py-1.5 text-white" colSpan={12 + HARDWARE_SLOTS.length + 4} style={{ textAlign: "right", fontWeight: 800, fontSize: 9.5 }}>GRAND TOTAL (incl GST)</td>
            <td className="border border-[#0a5a93] px-1 py-1.5 text-center text-white" style={{ fontWeight: 800, fontSize: 9.5 }}>{inr2(totals.grandTotal)}</td>
          </tr>
        </tfoot>
      </table>

      {/* notes */}
      <div className="mt-3" style={{ fontSize: 8 }}>
        <div style={{ fontWeight: 800, color: "#0069b3", borderBottom: "1.5px solid #63b81e", display: "inline-block", paddingBottom: 1, marginBottom: 2 }}>NOTES &amp; TERMS</div>
        {notes.filter((n) => n.trim()).map((nt, i) => (
          <div key={i} style={{ lineHeight: 1.5 }}>{i + 1}. {nt}</div>
        ))}
      </div>

      {/* signatures */}
      <div className="mt-8 flex justify-between" style={{ fontSize: 9 }}>
        <span>Prepared by: ________________</span>
        <span>Authorised Signatory: ________________</span>
      </div>

      {/* brand footer */}
      <div style={{ marginTop: 10, borderTop: "2px solid #0180cf", paddingTop: 4, textAlign: "center", fontSize: 7.5, fontWeight: 700, letterSpacing: "0.1em", color: "#0069b3" }}>
        ANANT AVINYA TECHNOLOGIES · POWERED BY ALTUS CORP
      </div>
    </div>
  );
}

/* ── Proforma Invoice print (matches the Supply & Installation format) ── */
function PiPrint({
  active,
  header,
  piMeta,
  lines,
  totals,
}: {
  active: boolean;
  header: { offerNo: string; quoteDate: string; project: string; customer: string; subject: string };
  piMeta: PiMeta;
  lines: DoorLine[];
  totals: ReturnType<typeof computePiTotals>;
}) {
  const num = (v: number) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(Number.isFinite(v) ? v : 0));
  const c = "border border-slate-500 px-1.5 py-1 align-top";
  return (
    <div className={`${active ? "q-print print:block" : ""} hidden bg-white text-slate-900`} style={{ fontSize: 9, maxWidth: "200mm", margin: "0 auto" }}>
      {/* company header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src="/logo-mark.png?v=3" alt="" style={{ height: 50, width: "auto" }} />
          <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.06, color: "#0a0a0a" }}>
            ANANT AVINYA<br />TECHNOLOGIES LLP.
          </div>
        </div>
        <div style={{ textAlign: "right", fontSize: 8, color: "#334155", lineHeight: 1.45 }}>
          <b>Address:</b>
          {COMPANY.address.map((a, i) => (
            <div key={i}>{a}</div>
          ))}
          <div>E-mail: {COMPANY.email} · Web: {COMPANY.web}</div>
        </div>
      </div>

      {/* title */}
      <div style={{ border: "1.5px solid #0069b3", background: "#eef6fc", textAlign: "center", fontWeight: 800, fontSize: 13, padding: 4, color: "#0069b3" }}>
        PROFORMA INVOICE — Supply &amp; Installation
      </div>

      {/* To + reference */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td className={c} style={{ width: "52%" }}>
              <div style={{ fontSize: 8, color: "#64748b" }}>To,</div>
              <div style={{ fontWeight: 700 }}>{header.customer || "—"}</div>
              <div style={{ whiteSpace: "pre-line" }}>{piMeta.customerAddress}</div>
              {piMeta.customerContact && <div>Contact: {piMeta.customerContact}</div>}
            </td>
            <td className={c} style={{ padding: 0 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr><td className={c}>Offer Ref:</td><td className={c}><b>{header.offerNo || "—"}</b></td><td className={c}>Date:</td><td className={c}>{header.quoteDate || "—"}</td></tr>
                  <tr><td className={c}>Customer Reference:</td><td className={c}>Email</td><td className={c}>Date:</td><td className={c}>{piMeta.customerRefDate || "—"}</td></tr>
                  <tr><td className={c} colSpan={4}>Other Reference: -</td></tr>
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
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "linear-gradient(180deg,#0180cf,#0069b3)", color: "#fff" }}>
            {["Sr No", "Door Code", "Location", "Door Width", "Door Height", "Description", "HSN Code", "UOM", "Qty Nos", "Rate ₹", "Install ₹", "Amount ₹"].map((h) => (
              <th key={h} className={c} style={{ textAlign: "center", fontWeight: 700 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr><td className={c} colSpan={12} style={{ fontWeight: 700, textAlign: "center", background: "#f1f7fc" }}>SUPPLY &amp; INSTALLATION OF CLEAN ROOM DOORS WITH HARDWARE</td></tr>
          {lines.map((d, i) => {
            const p = computePiLine(d);
            return (
              <tr key={d.id}>
                <td className={c} style={{ textAlign: "center" }}>{i + 1}</td>
                <td className={c}>{d.doorCode}</td>
                <td className={c}>{d.location || ""}</td>
                <td className={c} style={{ textAlign: "center" }}>{d.width || ""}</td>
                <td className={c} style={{ textAlign: "center" }}>{d.height || ""}</td>
                <td className={c}>{d.doorType}</td>
                <td className={c} style={{ textAlign: "center" }}>{piMeta.hsnCode}</td>
                <td className={c} style={{ textAlign: "center" }}>Nos</td>
                <td className={c} style={{ textAlign: "center" }}>{d.qty || ""}</td>
                <td className={c} style={{ textAlign: "right" }}>{num(p.rate)}</td>
                <td className={c} style={{ textAlign: "right" }}>{p.install ? num(p.install) : ""}</td>
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
              <div style={{ marginTop: 4, fontSize: 8 }}><b>RTGS Details:</b> {COMPANY.bank.name}; A/c No. {COMPANY.bank.acNo}; IFSC {COMPANY.bank.ifsc}; MICR {COMPANY.bank.micr}</div>
              <div style={{ marginTop: 4, fontSize: 7.5, color: "#475569" }}>Declaration: We declare that this Invoice shows the actual price of the goods described and that all particulars are true and correct.</div>
            </td>
            <td className={c} style={{ padding: 0 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr><td className={c}><b>Total</b></td><td className={c} style={{ textAlign: "center" }}>{totals.totalQty}</td><td className={c} style={{ textAlign: "right", fontWeight: 700 }}>{num(totals.subtotal)}</td></tr>
                  <tr><td className={c} colSpan={2}><b>Subtotal</b></td><td className={c} style={{ textAlign: "right", fontWeight: 700 }}>{num(totals.subtotal)}</td></tr>
                  <tr><td className={c} colSpan={2}>CGST @ 9.00%</td><td className={c} style={{ textAlign: "right" }}>{num(totals.cgst)}</td></tr>
                  <tr><td className={c} colSpan={2}>SGST @ 9.00%</td><td className={c} style={{ textAlign: "right" }}>{num(totals.sgst)}</td></tr>
                  <tr><td className={c} colSpan={2}>Freight</td><td className={c} style={{ textAlign: "right", fontSize: 7.5 }}>{piMeta.freightNote}</td></tr>
                  <tr style={{ background: "linear-gradient(90deg,#0069b3,#63b81e)" }}><td className={c} colSpan={2} style={{ color: "#fff", fontWeight: 800 }}>Grand Total</td><td className={c} style={{ textAlign: "right", color: "#fff", fontWeight: 800 }}>{num(totals.grandTotal)}</td></tr>
                </tbody>
              </table>
              <div style={{ padding: "26px 8px 8px", textAlign: "right", fontSize: 8.5 }}>
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
