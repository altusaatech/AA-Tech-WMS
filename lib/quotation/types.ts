// Quotation domain — types, the fixed hardware slot list, default terms, and
// the pricing math reverse-engineered from the Dorplus quotation sheet.

export interface HardwareLine {
  name: string;
  qty: number;
  rate: number; // ₹ per unit
}

export interface DoorLine {
  id: string;
  doorCode: string;
  doorType: string;
  frameProfile: string;
  frameMaterial: string;
  shutterMaterial: string;
  insulation: string;
  orientation: string;
  finish: string;
  doorConfig: string;
  width: number; // mm
  height: number; // mm
  qty: number;
  ratePerSqm: number; // ₹ / sq.m (door supply)
  installPerSqm: number; // ₹ / sq.m (installation)
  hardware: HardwareLine[];
}

export interface QuotationHeader {
  offerNo: string;
  quoteDate: string;
  project: string;
  customer: string;
  subject: string;
}

export interface QuotationData extends QuotationHeader {
  lines: DoorLine[];
  notes: string[];
}

/** Fixed hardware columns in the door table (mirrors the source sheet). */
export const HARDWARE_SLOTS = [
  "SS Ball Bearing Hinges",
  "Mortise Dead Bolt",
  "Door Closer",
  "SS 'D' Handle",
  "Concealed Tower Bolt",
  "Double Glazed Vision Panel",
  "SS 304 Kick Plate",
  "SS 304 Push Plate",
  "Concealed Drop Seal",
  "EPDM Gasket",
] as const;

export const GST_RATE = 0.18; // 9% CGST + 9% SGST

export const DEFAULT_NOTES: string[] = [
  "Prices are Ex-Works unless stated otherwise.",
  "Delivery: 6–8 weeks from receipt of confirmed order and approved GA drawings.",
  "Payment Terms: 50% advance with PO, balance before dispatch.",
  "GST @ 18% (CGST 9% + SGST 9%) applicable extra as shown.",
  "Validity of offer: 30 days from the date of this quotation.",
  "Installation charges, if applicable, are shown separately.",
];

export const DEFAULT_SUBJECT = "Supply of Clean Room Doors";

let _id = 0;
export function newDoor(): DoorLine {
  _id += 1;
  return {
    id: `d${Date.now()}-${_id}`,
    doorCode: "",
    doorType: "",
    frameProfile: "",
    frameMaterial: "",
    shutterMaterial: "",
    insulation: "",
    orientation: "Push Side",
    finish: "",
    doorConfig: "Single",
    width: 0,
    height: 0,
    qty: 1,
    ratePerSqm: 0,
    installPerSqm: 0,
    hardware: HARDWARE_SLOTS.map((name) => ({ name, qty: 0, rate: 0 })),
  };
}

const n = (v: number) => (Number.isFinite(v) ? v : 0);

export interface DoorCompute {
  area: number;
  basicSupply: number;
  hardwareTotal: number;
  doorHw: number;
  totalSupply: number;
  installTotal: number;
  lineTotal: number;
}

export function computeDoor(d: DoorLine): DoorCompute {
  const area = (n(d.width) / 1000) * (n(d.height) / 1000);
  const basicSupply = area * n(d.ratePerSqm);
  const hardwareTotal = d.hardware.reduce((s, h) => s + n(h.qty) * n(h.rate), 0);
  const doorHw = basicSupply + hardwareTotal;
  const qty = n(d.qty) || 0;
  const totalSupply = doorHw * qty;
  const installTotal = area * n(d.installPerSqm) * qty;
  return { area, basicSupply, hardwareTotal, doorHw, totalSupply, installTotal, lineTotal: totalSupply + installTotal };
}

export interface QuoteTotals {
  subtotalSupply: number;
  subtotalInstall: number;
  subtotal: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
}

export function computeTotals(lines: DoorLine[]): QuoteTotals {
  let subtotalSupply = 0;
  let subtotalInstall = 0;
  for (const d of lines) {
    const c = computeDoor(d);
    subtotalSupply += c.totalSupply;
    subtotalInstall += c.installTotal;
  }
  const subtotal = subtotalSupply + subtotalInstall;
  const cgst = subtotal * (GST_RATE / 2);
  const sgst = subtotal * (GST_RATE / 2);
  return { subtotalSupply, subtotalInstall, subtotal, cgst, sgst, grandTotal: subtotal + cgst + sgst };
}

export const inr = (v: number) =>
  "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(Number.isFinite(v) ? v : 0));

export const inr2 = (v: number) =>
  "₹" + new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number.isFinite(v) ? v : 0);
