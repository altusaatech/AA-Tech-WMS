"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { ArrowLeft, Save, Printer, Plus, Trash2, Loader2, DoorOpen, FileText, ReceiptText } from "lucide-react";
import { fireToast } from "@/lib/toast";
import { saveQuotation } from "@/app/(app)/quotation/actions";
import { DOOR_ORIENTATIONS, DOOR_CONFIGS, DOOR_FINISHES, DOOR_SHADES, DOOR_SHADE_FINISHES, DOOR_WIDTHS, DOOR_HEIGHTS, HARDWARE_UOMS, HARDWARE_MAKES } from "@/lib/sales/columns";
import {
  newDoor,
  newHardware,
  computeDoor,
  computeTotals,
  hardwareQty,
  resolveHwModel,
  kickPlateModel,
  inr,
  inr2,
  type DoorLine,
  type HardwareLine,
  type QuotationData,
  type PiMeta,
} from "@/lib/quotation/types";

interface ProductOption {
  type: string;
  ratePerSqm: number;
  insulation: string;
  uom: string;
}

interface HardwareOption {
  name: string;
  make: string;
  specs: string; // Type / Specs (description) from the hardware master
  model: string; // Size / Model from the hardware master
  uom: string; // UOM from the hardware master
  rate: number;
  profitRate: number; // AA Tech profit rate from the hardware master
  qty: number; // default Units / Door fetched from the hardware master
  kit: boolean; // part of the standard door hardware kit
}

interface DoorOption {
  code: string;
  doorType: string;
  doorConfig: string;
  frameProfile: string;
  frameMaterial: string;
  shutterType: string;
  shutterMaterial: string;
  insulation: string;
  ratePerSqm: number;
  installPerSqm: number;
}

interface InstallationOption {
  scope: string; // building-height scope, e.g. "For Building upto 10 floors"
  rate: number; // flat ₹ / door
}

const inp =
  "h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-800 outline-none transition-all focus:border-[#0180cf] focus:ring-2 focus:ring-[#0180cf]/15";

export function QuotationBuilder({
  id,
  initial,
  initialPiMeta,
  productOptions,
  hardwareOptions,
  doorOptions,
  installationOptions,
  kycOptions = [],
}: {
  id: string;
  initial: QuotationData;
  initialPiMeta: PiMeta;
  productOptions: ProductOption[];
  hardwareOptions: HardwareOption[];
  doorOptions: DoorOption[];
  installationOptions: InstallationOption[];
  /** Customer KYC records — the Enquiry No box fetches Company Name from here. */
  kycOptions?: { enquiryNo: string; companyName: string }[];
}) {
  const router = useRouter();
  const [enquiryNo, setEnquiryNo] = React.useState(initial.enquiryNo);
  const [offerNo, setOfferNo] = React.useState(initial.offerNo);
  const [quoteDate, setQuoteDate] = React.useState(initial.quoteDate);
  const [project, setProject] = React.useState(initial.project);
  const [customer, setCustomer] = React.useState(initial.customer);
  const [subject, setSubject] = React.useState(initial.subject);
  const [lines, setLines] = React.useState<DoorLine[]>(initial.lines);
  const [notes, setNotes] = React.useState<string[]>(initial.notes);
  // piMeta is edited on the dedicated PI page; kept here only so a quotation
  // save doesn't wipe it.
  const [piMeta] = React.useState<PiMeta>(initialPiMeta);
  const [saving, setSaving] = React.useState(false);
  // Customer KYC → Company Name lookup, keyed by trimmed/lower-cased Enquiry No.
  const kycByEnquiry = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const k of kycOptions) if (k.enquiryNo) m.set(k.enquiryNo.trim().toLowerCase(), k.companyName);
    return m;
  }, [kycOptions]);
  // Typing/picking an Enquiry No that exists in KYC auto-fills the Customer.
  function onEnquiryChange(v: string) {
    setEnquiryNo(v);
    const company = kycByEnquiry.get(v.trim().toLowerCase());
    if (company) setCustomer(company);
  }

  const totals = computeTotals(lines);

  function addDoor() {
    // A new door starts with 8 blank hardware slots (see newDoor); more can be
    // added from the hardware master via "Add Item".
    setLines((p) => [...p, newDoor()]);
  }
  function patchDoor(doorId: string, patch: Partial<DoorLine>) {
    setLines((p) =>
      p.map((d) => {
        if (d.id !== doorId) return d;
        const next = { ...d, ...patch };
        // When the door width changes, re-resolve any Kick Plate Size/Model from
        // the master template so it always reflects the current door width.
        if (patch.width !== undefined) {
          const tmpl = hardwareOptions.find((o) => /kick\s*plate/i.test(o.name))?.model ?? `"width of door" x 250mm`;
          next.hardware = next.hardware.map((h) =>
            /kick\s*plate/i.test(h.name) ? { ...h, model: kickPlateModel(tmpl, Number(next.width) || 0) } : h,
          );
        }
        return next;
      }),
    );
  }
  function patchHw(doorId: string, idx: number, patch: Partial<HardwareLine>) {
    setLines((p) =>
      p.map((d) =>
        d.id === doorId ? { ...d, hardware: d.hardware.map((h, i) => (i === idx ? { ...h, ...patch } : h)) } : d,
      ),
    );
  }
  function addHw(doorId: string) {
    setLines((p) => p.map((d) => (d.id === doorId ? { ...d, hardware: [...d.hardware, newHardware()] } : d)));
  }
  // "Add Kit" — append every hardware master item flagged as a standard kit
  // item, pre-filled with its make, specs, model, units/door and rate.
  function addKit(doorId: string) {
    const kitLines: HardwareLine[] = hardwareOptions
      .filter((o) => o.kit)
      .map((o) => ({ name: o.name, make: o.make, specs: o.specs, model: o.model, uom: o.uom, qty: o.qty, rate: o.rate, profitRate: o.profitRate, kit: true }));
    if (!kitLines.length) {
      fireToast({ message: "No kit items found in the hardware master.", type: "error" });
      return;
    }
    setLines((p) => p.map((d) => (d.id === doorId ? { ...d, hardware: [...d.hardware, ...kitLines] } : d)));
  }
  // "Remove Kit" — drop every hardware line that was added via "Add Kit".
  function removeKit(doorId: string) {
    setLines((p) =>
      p.map((d) => (d.id === doorId ? { ...d, hardware: d.hardware.filter((h) => !h.kit) } : d)),
    );
  }
  function removeHw(doorId: string, idx: number) {
    setLines((p) => p.map((d) => (d.id === doorId ? { ...d, hardware: d.hardware.filter((_, i) => i !== idx) } : d)));
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
  // Typing/selecting a door code auto-fills every parameter from the door master.
  function setDoorCode(doorId: string, code: string) {
    const m = doorOptions.find((o) => o.code.toLowerCase() === code.trim().toLowerCase());
    if (!m) {
      patchDoor(doorId, { doorCode: code });
      return;
    }
    patchDoor(doorId, {
      doorCode: m.code,
      doorType: m.doorType,
      doorConfig: m.doorConfig || "Single",
      frameProfile: m.frameProfile,
      frameMaterial: m.frameMaterial,
      shutterType: m.shutterType,
      shutterMaterial: m.shutterMaterial,
      insulation: m.insulation,
      ratePerSqm: m.ratePerSqm,
      installPerSqm: m.installPerSqm,
    });
    fireToast({ message: `Loaded "${m.code}" from door master`, type: "success" });
  }

  async function save() {
    setSaving(true);
    try {
      await saveQuotation(id, { enquiryNo, offerNo, quoteDate, project, customer, subject }, lines, notes, piMeta);
      fireToast({ message: "Quotation saved", type: "success" });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  // Persist the current form BEFORE navigating so the PI page fetches exactly
  // what's on screen (it reads the saved quotation from the DB).
  async function goToPi() {
    setSaving(true);
    try {
      await saveQuotation(id, { enquiryNo, offerNo, quoteDate, project, customer, subject }, lines, notes, piMeta);
      router.push(`/quotation/${id}/pi` as Route);
    } finally {
      setSaving(false);
    }
  }

  // Print modes: full quotation (with totals) vs client quotation (totals
  // hidden). We flip the flag then print on the next tick so the print DOM
  // reflects it.
  const [hideTotals, setHideTotals] = React.useState(false);
  const [pendingPrint, setPendingPrint] = React.useState(false);
  React.useEffect(() => {
    if (!pendingPrint) return;
    const t = window.setTimeout(() => {
      window.print();
      setPendingPrint(false);
    }, 60);
    return () => window.clearTimeout(t);
  }, [pendingPrint]);
  function printFull() {
    setHideTotals(false);
    setPendingPrint(true);
  }
  function printClient() {
    setHideTotals(true);
    setPendingPrint(true);
  }

  return (
    <>
      {/* ───────────── EDITOR (screen only) ───────────── */}
      <main className="relative mx-auto max-w-[1700px] px-8 pb-16 pt-8 max-md:px-4 print:hidden">
        {/* action bar */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => router.push("/quotation" as Route)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-bold text-slate-600 shadow-sm transition-colors hover:bg-slate-50">
            <ArrowLeft size={15} strokeWidth={2.6} /> All specifications
          </button>
          <div className="flex items-center gap-2.5">
            <button type="button" onClick={printFull} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[13.5px] font-bold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5">
              <Printer size={16} /> Print Quotation
            </button>
            <button type="button" onClick={printClient} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[13.5px] font-bold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5" title="Client quotation (without totals)">
              <FileText size={16} /> Client Quotation
            </button>
            <button type="button" onClick={goToPi} disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#0180cf]/40 bg-[#0180cf]/8 px-4 text-[13.5px] font-bold text-[#0069b3] shadow-sm transition-all hover:-translate-y-0.5 disabled:opacity-60" title="Save & go to Proforma Invoice">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <ReceiptText size={16} />} Go to PI
            </button>
            <button type="button" onClick={save} disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-xl px-5 text-[14px] font-extrabold text-white shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-60" style={{ background: "linear-gradient(135deg, #63b81e, #0180cf)", boxShadow: "0 12px 26px -10px rgba(1,128,207,0.6)" }}>
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} strokeWidth={2.4} />} Save
            </button>
          </div>
        </div>

        {/* header card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-6 gap-3 max-lg:grid-cols-2 max-md:grid-cols-1">
            <L label="Enquiry No">
              <input className={inp} list="kyc-enquiry-list" value={enquiryNo} onChange={(e) => onEnquiryChange(e.target.value)} placeholder="ENQ-2025-001" title="Pick a KYC enquiry to auto-fill Customer" />
              {kycOptions.length > 0 && (
                <datalist id="kyc-enquiry-list">
                  {kycOptions.map((k) => (
                    <option key={k.enquiryNo} value={k.enquiryNo}>{k.companyName}</option>
                  ))}
                </datalist>
              )}
            </L>
            <L label="Offer No"><input className={inp} value={offerNo} onChange={(e) => setOfferNo(e.target.value)} placeholder="170051" /></L>
            <L label="Date"><input type="date" className={inp} value={quoteDate} onChange={(e) => setQuoteDate(e.target.value)} /></L>
            <L label="Project"><input className={inp} value={project} onChange={(e) => setProject(e.target.value)} placeholder="Project name" /></L>
            <L label="Customer"><input className={inp} value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Customer name" /></L>
            <L label="Subject"><input className={inp} value={subject} onChange={(e) => setSubject(e.target.value)} /></L>
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
              hardwareOptions={hardwareOptions}
              doorOptions={doorOptions}
              installationOptions={installationOptions}
              onPickProduct={(t) => pickProduct(d.id, t)}
              onSetCode={(code) => setDoorCode(d.id, code)}
              onPatch={(p) => patchDoor(d.id, p)}
              onPatchHw={(idx, p) => patchHw(d.id, idx, p)}
              onAddHw={() => addHw(d.id)}
              onAddKit={() => addKit(d.id)}
              onRemoveKit={() => removeKit(d.id)}
              onRemoveHw={(idx) => removeHw(d.id, idx)}
              onRemove={() => removeDoor(d.id)}
            />
          ))}
        </div>

        <button type="button" onClick={addDoor} className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl border-2 border-dashed border-[#0180cf]/40 px-5 text-[14px] font-extrabold text-[#0069b3] transition-colors hover:bg-[#0180cf]/5">
          <Plus size={17} strokeWidth={2.8} /> Add Door
        </button>

        {/* totals */}
        <div className="mt-6 flex justify-end">
          <div className="w-[360px] max-lg:w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-fit">
            <h3 className="mb-3 text-[12px] font-black uppercase tracking-[0.1em] text-slate-400">Grand Total</h3>
            <Row label="Door Total (Qty × Unit Price)" value={inr(totals.doorSupply)} />
            <Row label="Hardware Total" value={inr(totals.hardwareSupply)} />
            <Row label="Installation Total" value={inr(totals.subtotalInstall)} />
            <div className="my-2.5 h-px bg-slate-100" />
            <Row label="Sub Total" value={inr(totals.subtotal)} />
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

      {/* ───────────── PRINT LAYOUT ───────────── */}
      <QuotationPrint
        active
        header={{ enquiryNo, offerNo, quoteDate, project, customer, subject }}
        lines={lines}
        notes={notes}
        totals={totals}
        hideTotals={hideTotals}
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
  hardwareOptions,
  doorOptions,
  installationOptions,
  onPickProduct,
  onSetCode,
  onPatch,
  onPatchHw,
  onAddHw,
  onAddKit,
  onRemoveKit,
  onRemoveHw,
  onRemove,
}: {
  door: DoorLine;
  index: number;
  productOptions: ProductOption[];
  hardwareOptions: HardwareOption[];
  doorOptions: DoorOption[];
  installationOptions: InstallationOption[];
  onPickProduct: (type: string) => void;
  onSetCode: (code: string) => void;
  onPatch: (p: Partial<DoorLine>) => void;
  onPatchHw: (idx: number, p: Partial<HardwareLine>) => void;
  onAddHw: () => void;
  onAddKit: () => void;
  onRemoveKit: () => void;
  onRemoveHw: (idx: number) => void;
  onRemove: () => void;
}) {
  const c = computeDoor(door);
  // Hardware names for the dropdown come straight from the hardware master —
  // distinct names, with the makes available for each name kept separately so
  // the Make dropdown can cascade off the chosen name.
  const hwNames = React.useMemo(
    () => Array.from(new Set(hardwareOptions.map((o) => o.name))).sort((a, b) => a.localeCompare(b)),
    [hardwareOptions],
  );
  const makesByName = React.useMemo(() => {
    const m = new Map<string, string[]>();
    for (const o of hardwareOptions) {
      if (!o.make) continue;
      const arr = m.get(o.name) ?? [];
      if (!arr.includes(o.make)) arr.push(o.make);
      m.set(o.name, arr);
    }
    for (const arr of m.values()) arr.sort((a, b) => a.localeCompare(b));
    return m;
  }, [hardwareOptions]);
  // Every make available anywhere — the standard make list plus any make present
  // in the hardware master — so the Make dropdown can offer all of them, not just
  // the ones tied to the selected hardware type.
  const allMakes = React.useMemo(() => {
    const s = new Set<string>(HARDWARE_MAKES);
    for (const o of hardwareOptions) if (o.make) s.add(o.make);
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [hardwareOptions]);
  // Every distinct Type/Specs and Size/Model in the master — so those dropdowns
  // can offer all values, not just the ones for the selected hardware.
  const allSpecs = React.useMemo(
    () => Array.from(new Set(hardwareOptions.map((o) => o.specs).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [hardwareOptions],
  );
  const allModels = React.useMemo(
    () => Array.from(new Set(hardwareOptions.map((o) => o.model).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [hardwareOptions],
  );
  const resolveHw = React.useCallback(
    (name: string, make: string) =>
      hardwareOptions.find((o) => o.name === name && (make ? o.make === make : true)),
    [hardwareOptions],
  );
  // Distinct suggestion values for the free-text spec fields (Type/Specs and
  // Size/Model). Filtered to the chosen hardware (and make, when picked) so the
  // dropdown shows the relevant master values; falls back to every distinct
  // value when nothing is selected yet.
  const fieldOptions = React.useCallback(
    (field: "specs" | "model", name: string, make: string) => {
      const set = new Set<string>();
      for (const o of hardwareOptions) {
        if (name && o.name !== name) continue;
        if (make && o.make !== make) continue;
        const v = o[field];
        if (v) set.add(v);
      }
      return Array.from(set).sort((a, b) => a.localeCompare(b));
    },
    [hardwareOptions],
  );
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
          <L label="Door Code (auto-fills all)">
            <DoorCodePicker value={door.doorCode} options={doorOptions} onSet={onSetCode} />
          </L>
          <L label="Door Type (Product)">
            <select className={`${inp} cursor-pointer`} value={door.doorType} onChange={(e) => onPickProduct(e.target.value)}>
              <option value="">Select product…</option>
              {!productOptions.some((p) => p.type === door.doorType) && door.doorType && (
                <option value={door.doorType}>{door.doorType}</option>
              )}
              {productOptions.map((p) => <option key={p.type} value={p.type}>{p.type}</option>)}
            </select>
          </L>
          <L label="Door Config">
            <select className={`${inp} cursor-pointer`} value={door.doorConfig} onChange={(e) => onPatch({ doorConfig: e.target.value })}>
              <option value="">Select…</option>
              {!DOOR_CONFIGS.includes(door.doorConfig) && door.doorConfig && <option value={door.doorConfig}>{door.doorConfig}</option>}
              {DOOR_CONFIGS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </L>
          <L label="Frame Profile"><input className={inp} value={door.frameProfile} onChange={(e) => onPatch({ frameProfile: e.target.value })} placeholder="100 x 50 SR" /></L>
          <L label="Frame Material"><input className={inp} value={door.frameMaterial} onChange={(e) => onPatch({ frameMaterial: e.target.value })} placeholder="GI 1.2mm" /></L>
          <L label="Shutter Type"><input className={inp} value={door.shutterType || ""} onChange={(e) => onPatch({ shutterType: e.target.value })} placeholder="45 mm thick Flush" /></L>
          <L label="Shutter Material"><input className={inp} value={door.shutterMaterial} onChange={(e) => onPatch({ shutterMaterial: e.target.value })} placeholder="GI 0.8mm" /></L>
          <L label="Insulation"><input className={inp} value={door.insulation} onChange={(e) => onPatch({ insulation: e.target.value })} placeholder="Honeycomb" /></L>
          <L label="Orientation">
            <select className={`${inp} cursor-pointer`} value={door.orientation} onChange={(e) => onPatch({ orientation: e.target.value })}>
              <option value="">Select…</option>
              {!DOOR_ORIENTATIONS.includes(door.orientation) && door.orientation && <option value={door.orientation}>{door.orientation}</option>}
              {DOOR_ORIENTATIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </L>
          <L label="Finish">
            <select className={`${inp} cursor-pointer`} value={door.finish} onChange={(e) => onPatch({ finish: e.target.value })}>
              <option value="">Select…</option>
              {!DOOR_FINISHES.includes(door.finish) && door.finish && <option value={door.finish}>{door.finish}</option>}
              {DOOR_FINISHES.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </L>
          <L label="Shade">
            <select className={`${inp} cursor-pointer`} value={door.shade || ""} onChange={(e) => onPatch({ shade: e.target.value })}>
              <option value="">Select…</option>
              {!DOOR_SHADES.includes(door.shade || "") && door.shade && <option value={door.shade}>{door.shade}</option>}
              {DOOR_SHADES.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </L>
          <L label="Shade Finish">
            <select className={`${inp} cursor-pointer`} value={door.shadeFinish || ""} onChange={(e) => onPatch({ shadeFinish: e.target.value })}>
              <option value="">Select…</option>
              {!DOOR_SHADE_FINISHES.includes(door.shadeFinish || "") && door.shadeFinish && <option value={door.shadeFinish}>{door.shadeFinish}</option>}
              {DOOR_SHADE_FINISHES.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </L>
          <L label="Width (mm)">
            <input type="number" list={`w-${door.id}`} className={`${inp} text-right`} value={door.width || ""} onChange={(e) => onPatch({ width: Number(e.target.value) })} />
            <datalist id={`w-${door.id}`}>{DOOR_WIDTHS.map((w) => <option key={w} value={w} />)}</datalist>
          </L>
          <L label="Height (mm)">
            <input type="number" list={`h-${door.id}`} className={`${inp} text-right`} value={door.height || ""} onChange={(e) => onPatch({ height: Number(e.target.value) })} />
            <datalist id={`h-${door.id}`}>{DOOR_HEIGHTS.map((h) => <option key={h} value={h} />)}</datalist>
          </L>
          <L label="Qty"><input type="number" className={`${inp} text-right`} value={door.qty || ""} onChange={(e) => onPatch({ qty: Number(e.target.value) })} /></L>
          <L label="Rate ₹/sq.m"><input type="number" className={`${inp} text-right`} value={door.ratePerSqm || ""} onChange={(e) => onPatch({ ratePerSqm: Number(e.target.value) })} /></L>
          <L label="Installation (Building Height)">
            <select
              className={`${inp} cursor-pointer`}
              value={door.installScope ?? ""}
              onChange={(e) => {
                const scope = e.target.value;
                const opt = installationOptions.find((o) => o.scope === scope);
                onPatch({ installScope: scope, installRate: opt ? opt.rate : 0 });
              }}
            >
              <option value="">Select…</option>
              {door.installScope && !installationOptions.some((o) => o.scope === door.installScope) && (
                <option value={door.installScope}>{door.installScope}</option>
              )}
              {installationOptions.map((o) => (
                <option key={o.scope} value={o.scope}>{o.scope} — {inr(o.rate)}</option>
              ))}
            </select>
          </L>
        </div>

        {/* computed strip */}
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip label="Area" value={`${c.area.toFixed(3)} m²`} />
          <Chip label="Frame Perimeter" value={`${c.perimeter.toFixed(2)} RMT`} />
          <Chip label="Basic Supply" value={inr(c.basicSupply)} />
          <Chip label="Hardware" value={inr(c.hardwareTotal)} />
          <Chip label="Door + HW" value={inr(c.doorHw)} />
          <Chip label="Total Supply" value={inr(c.totalSupply)} strong />
        </div>

        {/* hardware grid */}
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <div className="text-[11px] font-black uppercase tracking-[0.08em] text-slate-400">Hardware (type × make × qty × rate)</div>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={onAddKit} className="inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-[12px] font-bold text-white shadow-sm transition-opacity hover:opacity-90" style={{ background: "linear-gradient(135deg, #63b81e, #0180cf)" }} title="Add the standard door hardware kit">
                <Plus size={13} strokeWidth={2.8} /> Add Kit
              </button>
              {door.hardware.some((h) => h.kit) && (
                <button type="button" onClick={onRemoveKit} className="inline-flex h-7 items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 text-[12px] font-bold text-red-600 transition-colors hover:bg-red-100" title="Remove the standard door hardware kit">
                  <Trash2 size={13} strokeWidth={2.6} /> Remove Kit
                </button>
              )}
              <button type="button" onClick={onAddHw} className="inline-flex h-7 items-center gap-1 rounded-lg border border-[#0180cf]/40 bg-[#0180cf]/5 px-2.5 text-[12px] font-bold text-[#0069b3] transition-colors hover:bg-[#0180cf]/10">
                <Plus size={13} strokeWidth={2.8} /> Add Item
              </button>
            </div>
          </div>
          {door.hardware.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-[12.5px] text-slate-400">No hardware yet — click <b>Add Item</b> or <b>Add Kit</b> to add one.</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <div className="min-w-[960px]">
                {/* column headers */}
                <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-2 py-1.5 text-[10px] font-black uppercase tracking-[0.04em] text-slate-400">
                  <span className="min-w-0 flex-[1.4]">Hardware</span>
                  <span className="w-[90px] shrink-0">Make</span>
                  <span className="min-w-0 flex-1">Type / Specs</span>
                  <span className="w-[104px] shrink-0">Size / Model</span>
                  <span className="w-[64px] shrink-0 text-center">Units/Door</span>
                  <span className="w-[74px] shrink-0">UOM</span>
                  <span className="w-[72px] shrink-0 text-right">Rate</span>
                  <span className="w-[84px] shrink-0 text-right">Profit Rate</span>
                  <span className="w-[74px] shrink-0 text-right">Amount</span>
                  <span className="w-[22px] shrink-0" />
                </div>
                {door.hardware.map((h, idx) => {
                  // Gasket/Intumescent Tape (= frame perimeter) and Drop Seal/Kick
                  // Plate (= width/1000) auto-compute their Units/Door from the
                  // door dimensions; everything else uses the entered quantity.
                  const autoQty = /gasket|intumescent|drop\s*seal|kick\s*plate/i.test(h.name);
                  const qty = hardwareQty(h, door);
                  const amt = qty * (Number(h.rate) || 0);
                  // Human-readable formula for the auto-calculated Units/Door — shown
                  // to the client so the derived quantity is transparent.
                  const dcfg = (door.doorConfig || "").toLowerCase();
                  const hMult = dcfg.includes("triple") ? 4 : dcfg.includes("double") ? 3 : 2;
                  const leaves = dcfg.includes("triple") ? "Triple" : dcfg.includes("double") ? "Double" : "Single";
                  const isPerimeter = /gasket|intumescent/i.test(h.name);
                  const autoFormula = !autoQty
                    ? ""
                    : isPerimeter
                      ? `${leaves} door — (Height/1000 × ${hMult}) + (Width/1000) = (${Number(door.height) || 0}/1000 × ${hMult}) + ${Number(door.width) || 0}/1000 = ${qty.toFixed(2)}`
                      : `Width/1000 = ${Number(door.width) || 0}/1000 = ${qty.toFixed(2)}`;
                  const known = hwNames.includes(h.name);
                  const makes = makesByName.get(h.name) ?? [];
                  const makeKnown = !h.make || makes.includes(h.make);
                  const uomKnown = !h.uom || HARDWARE_UOMS.includes(h.uom);
                  // Relevant values (for the selected hardware/make) first, then
                  // every other value in the master so any option can be picked.
                  const relSpecs = fieldOptions("specs", h.name, h.make ?? "");
                  const relModels = fieldOptions("model", h.name, h.make ?? "");
                  const specsOpts = [...relSpecs, ...allSpecs.filter((s) => !relSpecs.includes(s))];
                  const modelOpts = [...relModels, ...allModels.filter((m) => !relModels.includes(m))];
                  return (
                    <div key={idx} className="flex items-center gap-1.5 border-b border-slate-100 bg-white px-2 py-1.5 last:border-0">
                      {/* Hardware */}
                      <select
                        className="h-8 min-w-0 flex-[1.4] cursor-pointer rounded-md border border-slate-200 bg-white px-1.5 text-[12px] font-semibold text-slate-700 outline-none focus:border-[#0180cf]"
                        value={h.name}
                        title={h.name}
                        onChange={(e) => {
                          const name = e.target.value;
                          const nextMakes = makesByName.get(name) ?? [];
                          // Pick the make when the type has exactly one (or none); with
                          // several makes, clear it so the user chooses in the Make box.
                          const make = nextMakes.length === 1 ? (nextMakes[0] ?? "") : "";
                          // Always fetch every field from the master as soon as a
                          // hardware type is picked — resolveHw(name, "") resolves the
                          // first matching row. Choosing a make below refines it.
                          const opt = resolveHw(name, make);
                          onPatchHw(idx, {
                            name,
                            make,
                            specs: opt?.specs ?? "",
                            // Kick Plate → substitute the door width into the master template.
                            model: resolveHwModel(name, opt?.model ?? "", Number(door.width) || 0),
                            uom: opt?.uom ?? "",
                            profitRate: opt?.profitRate ?? 0,
                            ...(opt && opt.rate ? { rate: opt.rate } : {}),
                            ...(opt && opt.qty ? { qty: opt.qty } : {}),
                          });
                        }}
                      >
                        <option value="">Select hardware…</option>
                        {!known && h.name && <option value={h.name}>{h.name}</option>}
                        {hwNames.map((nm) => (
                          <option key={nm} value={nm}>{nm}</option>
                        ))}
                      </select>
                      {/* Make */}
                      <select
                        className="h-8 w-[90px] shrink-0 cursor-pointer rounded-md border border-slate-200 bg-white px-1 text-[12px] font-semibold text-slate-700 outline-none focus:border-[#0180cf] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300"
                        value={h.make ?? ""}
                        title={h.make ?? ""}
                        disabled={!h.name}
                        onChange={(e) => {
                          const make = e.target.value;
                          const opt = resolveHw(h.name, make);
                          // A make from the master (matches this hardware) auto-fills the
                          // rest of the row. A make picked from "All makes" that the master
                          // doesn't have for this item only sets the make — the existing
                          // specs / model / rate are left intact rather than wiped.
                          onPatchHw(
                            idx,
                            opt
                              ? {
                                  make,
                                  specs: opt.specs ?? "",
                                  // Kick Plate → substitute the door width into the master template.
                                  model: resolveHwModel(h.name, opt.model ?? "", Number(door.width) || 0),
                                  uom: opt.uom ?? "",
                                  profitRate: opt.profitRate ?? 0,
                                  ...(opt.rate ? { rate: opt.rate } : {}),
                                  ...(opt.qty ? { qty: opt.qty } : {}),
                                }
                              : { make },
                          );
                        }}
                      >
                        <option value="">Make…</option>
                        {!makeKnown && h.make && <option value={h.make}>{h.make}</option>}
                        {makes.length > 0 && (
                          <optgroup label="For this hardware">
                            {makes.map((mk) => (
                              <option key={mk} value={mk}>{mk}</option>
                            ))}
                          </optgroup>
                        )}
                        {allMakes.filter((mk) => !makes.includes(mk)).length > 0 && (
                          <optgroup label="All makes">
                            {allMakes
                              .filter((mk) => !makes.includes(mk))
                              .map((mk) => (
                                <option key={mk} value={mk}>{mk}</option>
                              ))}
                          </optgroup>
                        )}
                      </select>
                      {/* Type / Specs — free text with master values as dropdown suggestions */}
                      <input
                        list={`specs-${door.id}-${idx}`}
                        className="h-8 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-1.5 text-[12px] text-slate-700 outline-none focus:border-[#0180cf]"
                        value={h.specs ?? ""}
                        title={h.specs ?? ""}
                        placeholder="Type / Specs"
                        onChange={(e) => onPatchHw(idx, { specs: e.target.value })}
                      />
                      {specsOpts.length > 0 && (
                        <datalist id={`specs-${door.id}-${idx}`}>
                          {specsOpts.map((s) => (
                            <option key={s} value={s} />
                          ))}
                        </datalist>
                      )}
                      {/* Size / Model — free text with master values as dropdown suggestions */}
                      <input
                        list={`model-${door.id}-${idx}`}
                        className="h-8 w-[104px] shrink-0 rounded-md border border-slate-200 bg-white px-1.5 text-[12px] text-slate-700 outline-none focus:border-[#0180cf]"
                        value={h.model ?? ""}
                        title={h.model ?? ""}
                        placeholder="Size / Model"
                        onChange={(e) => onPatchHw(idx, { model: e.target.value })}
                      />
                      {modelOpts.length > 0 && (
                        <datalist id={`model-${door.id}-${idx}`}>
                          {modelOpts.map((m) => (
                            <option key={m} value={m} />
                          ))}
                        </datalist>
                      )}
                      {/* Units / Door — auto (read-only) once the driving dimension
                          is entered; otherwise a manual dropdown so it never locks. */}
                      {autoQty && qty > 0 ? (
                        <span
                          className="inline-flex h-8 w-[64px] shrink-0 items-center justify-end rounded-md border border-[#0180cf]/25 bg-[#0180cf]/[0.06] px-1.5 text-right text-[12px] font-black tabular-nums text-[#0069b3]"
                          title={autoFormula || "Auto-calculated from the door dimensions"}
                        >
                          {qty.toFixed(2)}
                        </span>
                      ) : (
                        <select
                          className="h-8 w-[64px] shrink-0 cursor-pointer rounded-md border border-slate-200 bg-white px-1 text-right text-[12px] font-semibold text-slate-700 outline-none focus:border-[#0180cf]"
                          value={qty || ""}
                          onChange={(e) => onPatchHw(idx, { qty: Number(e.target.value) })}
                        >
                          <option value="">qty</option>
                          {qty > 50 && <option value={qty}>{qty}</option>}
                          {Array.from({ length: 50 }, (_, i) => i + 1).map((n) => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      )}
                      {/* UOM */}
                      <select
                        className="h-8 w-[74px] shrink-0 cursor-pointer rounded-md border border-slate-200 bg-white px-1 text-[12px] font-semibold text-slate-700 outline-none focus:border-[#0180cf]"
                        value={h.uom ?? ""}
                        onChange={(e) => onPatchHw(idx, { uom: e.target.value })}
                      >
                        <option value="">—</option>
                        {!uomKnown && h.uom && <option value={h.uom}>{h.uom}</option>}
                        {HARDWARE_UOMS.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                      {/* Rate */}
                      <input type="number" className="h-8 w-[72px] shrink-0 rounded-md border border-slate-200 bg-white px-1.5 text-right text-[12px] outline-none focus:border-[#0180cf]" value={h.rate || ""} onChange={(e) => onPatchHw(idx, { rate: Number(e.target.value) })} placeholder="rate" />
                      {/* AA Tech Profit Rate */}
                      <input type="number" className="h-8 w-[84px] shrink-0 rounded-md border border-slate-200 bg-white px-1.5 text-right text-[12px] outline-none focus:border-[#0180cf]" value={h.profitRate || ""} onChange={(e) => onPatchHw(idx, { profitRate: Number(e.target.value) })} placeholder="—" />
                      {/* Amount */}
                      <span className="w-[74px] shrink-0 text-right text-[12px] font-black tabular-nums text-slate-700">{inr(amt)}</span>
                      <button type="button" onClick={() => onRemoveHw(idx)} className="w-[22px] shrink-0 rounded-md p-1 text-slate-300 hover:bg-red-50 hover:text-red-600" title="Remove item"><Trash2 size={13} /></button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Formula legend — surfaced so the client can see how the auto
              quantities (highlighted Units/Door) are derived. */}
          {door.hardware.some((h) => /gasket|intumescent|drop\s*seal|kick\s*plate/i.test(h.name)) && (
            <div className="mt-2 rounded-lg border border-[#0180cf]/20 bg-[#0180cf]/[0.04] px-3 py-2 text-[11.5px] leading-relaxed text-slate-500">
              <span className="font-black uppercase tracking-[0.06em] text-[#0069b3]">Quantity basis (RMT)</span>
              <div className="mt-1 flex flex-wrap gap-x-6 gap-y-0.5">
                <span><b className="text-slate-600">Gasket / Intumescent Tape</b> — Single: (Height/1000 × 2) + (Width/1000) · Double: (Height/1000 × 3) + (Width/1000)</span>
                <span><b className="text-slate-600">Drop Seal / Kick Plate</b> — (Width/1000)</span>
              </div>
            </div>
          )}
        </div>

        {/* Per-door price summary (working specification) */}
        <div className="mt-4 overflow-hidden rounded-xl border border-[#0180cf]/25 bg-gradient-to-br from-[#f3f9fe] to-white">
          <div className="divide-y divide-slate-100">
            <SummaryRow label="Total Hardware Cost" value={inr(c.hardwareTotal)} />
            <SummaryRow label="Total Doorset Price" value={inr(c.doorHw)} />
            <SummaryRow label={`Installation${door.installScope ? ` — ${door.installScope}` : ""}`} value={inr(c.installPerDoor)} />
            <SummaryRow label="Total Door Price with Installation" value={inr(c.doorHw + c.installPerDoor)} strong />
          </div>
        </div>
      </div>
    </div>
  );
}

/** One line in the per-door price summary footer. */
function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 px-4 ${strong ? "bg-[#0180cf]/[0.06] py-2.5" : "py-2"}`}>
      <span className={`text-[13px] ${strong ? "font-black text-slate-800" : "font-semibold text-slate-500"}`}>{label}</span>
      <span className={`tabular-nums ${strong ? "text-[15px] font-black text-[#0069b3]" : "text-[13.5px] font-bold text-slate-700"}`}>{value}</span>
    </div>
  );
}

/** Door-code combobox: pick a code from the master (fills the whole door) or
 *  type a custom one. Selecting an option always fires the auto-fill. */
function DoorCodePicker({
  value,
  options,
  onSet,
}: {
  value: string;
  options: DoorOption[];
  onSet: (code: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const q = value.trim().toLowerCase();
  const filtered = q
    ? options.filter((o) => o.code.toLowerCase().includes(q) || o.doorType.toLowerCase().includes(q))
    : options;

  return (
    <div className="relative" ref={ref}>
      <input
        className={inp}
        value={value}
        onChange={(e) => {
          onSet(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="CD-1-SG"
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div className="absolute left-0 top-full z-30 mt-1 max-h-56 w-[220px] max-w-[90vw] overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-[0_20px_50px_-20px_rgba(0,40,80,0.4)]">
          {filtered.map((o) => (
            <button
              key={o.code}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onSet(o.code);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-[#0180cf]/8"
            >
              <span className="text-[12.5px] font-black text-slate-700">{o.code}</span>
              <span className="truncate text-[11px] font-semibold text-slate-400">{o.doorType}</span>
            </button>
          ))}
        </div>
      )}
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
  hideTotals,
}: {
  active: boolean;
  header: { enquiryNo: string; offerNo: string; quoteDate: string; project: string; customer: string; subject: string };
  lines: DoorLine[];
  notes: string[];
  totals: ReturnType<typeof computeTotals>;
  /** Client quotation — hide the totals / grand-total footer. */
  hideTotals?: boolean;
}) {
  const th = "border border-[#0a5a93] px-0.5 py-1 text-center font-bold text-white";
  const td = "border border-slate-300 px-0.5 py-0.5 text-center align-middle break-words";
  const tc = "border border-slate-400 px-2 py-1";
  // Hardware columns — one per used (name + make) pair, since the same name can
  // come in several makes. Only items actually used (qty > 0 in some door).
  const hwKey = (name: string, make: string) => `${name}|${make}`;
  const hwMap = new Map<string, { name: string; make: string; rate: number; used: boolean }>();
  for (const d of lines) {
    for (const h of d.hardware) {
      const nm = (h.name || "").trim();
      if (!nm) continue;
      const mk = (h.make || "").trim();
      const key = hwKey(nm, mk);
      const q = Number(h.qty) || 0;
      const r = Number(h.rate) || 0;
      const ex = hwMap.get(key);
      if (!ex) hwMap.set(key, { name: nm, make: mk, rate: r, used: q > 0 });
      else {
        if (q > 0) ex.used = true;
        if (!ex.rate && r) ex.rate = r;
      }
    }
  }
  const hwCols = Array.from(hwMap.values()).filter((v) => v.used);
  const hwQty = (d: DoorLine, name: string, make: string): number => {
    const h = d.hardware.find((x) => (x.name || "").trim() === name && (x.make || "").trim() === make);
    return h ? Number(h.qty) || 0 : 0;
  };
  const totalQty = lines.reduce((s, d) => s + (Number(d.qty) || 0), 0);
  type Cmp = ReturnType<typeof computeDoor>;
  // Spec columns — drop any that are blank across every door (keep computed ones).
  const SPEC_ALL: { label: string; get: (d: DoorLine, c: Cmp, i: number) => React.ReactNode; left?: boolean; always?: boolean; has?: (d: DoorLine) => boolean }[] = [
    { label: "Sl. No", get: (_d, _c, i) => i + 1, always: true },
    { label: "Door Code", get: (d) => d.doorCode, has: (d) => !!(d.doorCode || "").trim() },
    { label: "Type of Door", get: (d) => d.doorType, left: true, has: (d) => !!(d.doorType || "").trim() },
    { label: "Frame Profile", get: (d) => d.frameProfile, has: (d) => !!(d.frameProfile || "").trim() },
    { label: "Frame Material", get: (d) => d.frameMaterial, has: (d) => !!(d.frameMaterial || "").trim() },
    { label: "Shutter Type", get: (d) => d.shutterType, has: (d) => !!(d.shutterType || "").trim() },
    { label: "Shutter Material", get: (d) => d.shutterMaterial, has: (d) => !!(d.shutterMaterial || "").trim() },
    { label: "Insulation", get: (d) => d.insulation, has: (d) => !!(d.insulation || "").trim() },
    { label: "Orientation", get: (d) => d.orientation, has: (d) => !!(d.orientation || "").trim() },
    { label: "Finish", get: (d) => d.finish, has: (d) => !!(d.finish || "").trim() },
    { label: "Shade", get: (d) => d.shade, has: (d) => !!(d.shade || "").trim() },
    { label: "Shade Finish", get: (d) => d.shadeFinish, has: (d) => !!(d.shadeFinish || "").trim() },
    { label: "Type", get: (d) => d.doorConfig, has: (d) => !!(d.doorConfig || "").trim() },
    { label: "Frame Width", get: (d) => d.width || "", has: (d) => !!d.width },
    { label: "Frame Height", get: (d) => d.height || "", has: (d) => !!d.height },
    { label: "Area sq.mtr", get: (_d, c) => (c.area ? c.area.toFixed(2) : ""), always: true },
    { label: "Total Area", get: (d, c) => { const t = c.area * (Number(d.qty) || 0); return t ? t.toFixed(2) : ""; }, always: true },
    { label: "Total Qty", get: (d) => d.qty || "", always: true },
  ];
  const specCols = SPEC_ALL.filter((s) => s.always || (s.has ? lines.some((d) => s.has!(d)) : true));
  const RIGHT_ALL: { label: string; get: (d: DoorLine, c: Cmp) => React.ReactNode }[] = [
    { label: "Basic Rate of Hardware", get: (_d, c) => inr(c.hardwareTotal) },
    { label: "Rate p/sq.mtr", get: (d) => inr(d.ratePerSqm) },
    { label: "Basic Supply price", get: (_d, c) => inr(c.basicSupply) },
    { label: "Door price + Hardware price", get: (_d, c) => inr(c.doorHw) },
    { label: "Total amount of supply", get: (_d, c) => inr(c.totalSupply) },
  ];
  return (
    <div className={`${active ? "q-print q-print-landscape print:block" : ""} hidden bg-white text-slate-900`} style={{ fontSize: 8 }}>
      {/* ── AA Tech branded header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "3px solid #0180cf", paddingBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/logo-mark.png?v=3" alt="" style={{ height: 44, width: "auto" }} />
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em", color: "#0a0a0a" }}>Anant Avinya Technologies</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "0.04em", color: "#0069b3" }}>QUOTATION</div>
          <div style={{ fontSize: 8.5, color: "#475569", fontWeight: 600 }}>{header.subject || "Supply of Clean Room Doors"}</div>
        </div>
      </div>

      {/* meta band */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, background: "linear-gradient(90deg, #eef6fc, #eef7e6)", border: "1px solid #d7e7f3", borderRadius: 4, padding: "4px 10px", marginTop: 6, fontSize: 9 }}>
        {header.enquiryNo ? <span><b style={{ color: "#0069b3" }}>Enquiry No:</b> {header.enquiryNo}</span> : null}
        <span><b style={{ color: "#0069b3" }}>Offer No:</b> {header.offerNo || "—"}</span>
        <span><b style={{ color: "#0069b3" }}>Date:</b> {header.quoteDate || "—"}</span>
        <span><b style={{ color: "#0069b3" }}>Customer:</b> {header.customer || "—"}</span>
        <span><b style={{ color: "#0069b3" }}>Project:</b> {header.project || "—"}</span>
      </div>

      {/* door table — a column per used hardware, vertical headers, no empties */}
      <table className="mt-2 w-full border-collapse" style={{ fontSize: 6 }}>
        <thead>
          <tr style={{ background: "linear-gradient(180deg, #0180cf, #0069b3)" }}>
            {specCols.map((s) => (
              <th key={s.label} className={`${th} th-vert`}>{s.label}</th>
            ))}
            {hwCols.map((h, i) => (
              <th key={i} className={`${th} th-vert`} style={{ minWidth: 14 }}>{h.make ? `${h.name} (${h.make})` : h.name}</th>
            ))}
            {RIGHT_ALL.map((r) => (
              <th key={r.label} className={`${th} th-vert`}>{r.label}</th>
            ))}
          </tr>
          {/* per-hardware rate row */}
          <tr style={{ background: "#eef6fc" }}>
            <td className={td} colSpan={specCols.length} style={{ textAlign: "right", fontWeight: 700 }}>Rate ₹ (Each) →</td>
            {hwCols.map((h, i) => (
              <td key={i} className={td} style={{ fontWeight: 700, whiteSpace: "nowrap" }}>{h.rate ? inr(h.rate) : ""}</td>
            ))}
            <td className={td} colSpan={RIGHT_ALL.length} />
          </tr>
        </thead>
        <tbody>
          {lines.map((d, i) => {
            const c = computeDoor(d);
            return (
              <tr key={d.id}>
                {specCols.map((s) => (
                  <td key={s.label} className={td} style={s.left ? { textAlign: "left" } : undefined}>{s.get(d, c, i)}</td>
                ))}
                {hwCols.map((h, hi) => {
                  const q = hwQty(d, h.name, h.make);
                  return <td key={hi} className={td}>{q || ""}</td>;
                })}
                {RIGHT_ALL.map((r) => (
                  <td key={r.label} className={td} style={{ whiteSpace: "nowrap" }}>{r.get(d, c)}</td>
                ))}
              </tr>
            );
          })}
          {/* total qty row */}
          <tr style={{ background: "#f6faf0", fontWeight: 700 }}>
            <td className={td} colSpan={specCols.length - 1} style={{ textAlign: "right" }}>TOTAL</td>
            <td className={td}>{totalQty}</td>
            {hwCols.map((_, i) => <td key={i} className={td} />)}
            <td className={td} colSpan={RIGHT_ALL.length - 1} />
            <td className={td} style={{ whiteSpace: "nowrap" }}>{inr(totals.subtotalSupply)}</td>
          </tr>
        </tbody>
      </table>

      {/* totals block (right) */}
      {!hideTotals && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <table style={{ borderCollapse: "collapse", fontSize: 9 }}>
            <tbody>
              <tr style={{ background: "#fff2b3" }}>
                <td className={tc} style={{ fontWeight: 700 }}>Sub Total</td>
                <td className={tc} style={{ textAlign: "right", fontWeight: 700, whiteSpace: "nowrap", minWidth: 90 }}>{inr(totals.subtotal)}</td>
              </tr>
              <tr>
                <td className={tc}>CGST @ 9.00%</td>
                <td className={tc} style={{ textAlign: "right", whiteSpace: "nowrap" }}>{inr(totals.cgst)}</td>
              </tr>
              <tr>
                <td className={tc}>SGST @ 9.00%</td>
                <td className={tc} style={{ textAlign: "right", whiteSpace: "nowrap" }}>{inr(totals.sgst)}</td>
              </tr>
              <tr style={{ background: "#dff5c8" }}>
                <td className={tc} style={{ fontWeight: 700 }}>Total</td>
                <td className={tc} style={{ textAlign: "right", fontWeight: 700, whiteSpace: "nowrap" }}>{inr(totals.grandTotal)}</td>
              </tr>
              <tr style={{ background: "linear-gradient(90deg,#0069b3,#63b81e)" }}>
                <td className={tc} style={{ fontWeight: 800, color: "#fff" }}>TOTAL PROJECT COST</td>
                <td className={tc} style={{ textAlign: "right", fontWeight: 800, whiteSpace: "nowrap", color: "#fff" }}>{inr(totals.grandTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

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
