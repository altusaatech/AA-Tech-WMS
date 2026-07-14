/**
 * Seed sample Proforma Invoices linked to the 15-record pipeline so the
 * Quotation dashboard's PI KPIs (PI Sent / Approved / Pending) are real.
 * 12 of 15 enquiries get a PI: 8 Accepted, 2 Sent, 2 Draft (3 have none).
 *
 * Run: pnpm exec tsx --env-file=.env.local scripts/seed-pi.ts
 */
import { db } from "../lib/db";
import { salesPi } from "../db/schema";

const pad2 = (n: number) => String(n).padStart(2, "0");
const iso = (base: string, add: number) => { const d = new Date(base + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + add); return d.toISOString().slice(0, 10); };
const COMPANIES = ["Nimbus Clean Systems", "Vertex Pharma Labs", "Meridian Biotech", "Sterling Cleanrooms", "Orion Life Sciences", "Apex Formulations", "Zenith Healthcare", "Quanta Devices", "Halcyon Labs", "Crest Biopharma", "Lumen Diagnostics", "Pinnacle Pharma", "Solaris Sciences", "Everest Biologics", "Aurora Medtech"];

async function main() {
  const rows: (typeof salesPi.$inferInsert)[] = [];
  for (let i = 1; i <= 12; i++) {
    const qty = 2 + (i % 8);
    const rate = 22000 + i * 900;
    const basic = qty * rate;
    const gst = Math.round(basic * 0.18);
    const status = i <= 8 ? "Accepted" : i <= 10 ? "Sent" : "Draft";
    rows.push({
      piNo: `AAT/PI-26${pad2(i)}`,
      piDate: iso("2026-04-01", i),
      companyName: COMPANIES[i - 1]!,
      quoteRef: `1805${pad2(i)}`,
      soNo: `2627${pad2(50 + i)}-01`,
      poNo: `AAT/PO-${pad2(i)}-2026-27`,
      description: "Clean Room / Fire / Duct Doors with Hardware",
      itemNameCode: `Door Set ${pad2(i)}`,
      qty: String(qty),
      uom: "Nos",
      rate: String(rate),
      basicAmount: String(basic),
      gstPercent: "18",
      gstAmount: String(gst),
      totalAmount: String(basic + gst),
      piStatus: status,
      remarks: status === "Accepted" ? "Approved by customer" : status === "Sent" ? "Awaiting approval" : "Draft — not yet sent",
      updatedAt: new Date(),
    });
  }
  await db.delete(salesPi);
  await db.insert(salesPi).values(rows);
  console.log(`Seeded ${rows.length} PI rows (Accepted: 8, Sent: 2, Draft: 2).`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
