/**
 * Seed a realistic 15-record pipeline across the five registers so the
 * dashboards (incl. the advanced funnel / forecast / readiness sections) show
 * genuine movement rather than everything at 100%.
 *
 *   15 enquiries → 13 quoted → 8 converted to SO
 *   of the 8 SOs: 5 need GA (3 approved, 1 submitted, 1 pending),
 *   6 reached BOM (4 completed, 2 in progress), 4 have a Work Order.
 *
 * Run: pnpm exec tsx --env-file=.env.local scripts/seed-linked-registers.ts
 */
import { db } from "../lib/db";
import { salesQuotes, salesSo, salesGa, salesBom, salesWo } from "../db/schema";

const pad2 = (n: number) => String(n).padStart(2, "0");
const iso = (base: string, add: number) => { const d = new Date(base + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + add); return d.toISOString().slice(0, 10); };

const COMPANIES = ["Nimbus Clean Systems", "Vertex Pharma Labs", "Meridian Biotech", "Sterling Cleanrooms", "Orion Life Sciences", "Apex Formulations", "Zenith Healthcare", "Quanta Devices", "Halcyon Labs", "Crest Biopharma", "Lumen Diagnostics", "Pinnacle Pharma", "Solaris Sciences", "Everest Biologics", "Aurora Medtech"];
const PEOPLE = ["Rahul Menon", "Sneha Iyer", "Arjun Rao", "Kavya Nair", "Vikram Shah", "Priya Desai", "Aditya Kulkarni", "Neha Joshi", "Rohan Gupta", "Meera Pillai", "Sanjay Verma", "Divya Reddy", "Karan Malhotra", "Anjali Sharma", "Nikhil Bose"];
const DOORS = [
  { code: "CD-1-SG", desc: "GI Single Clean Room Door with Hardware", size: "950 x 2200" },
  { code: "CD-2-DO", desc: "GI Double Clean Room Door with Hardware", size: "1200 x 2400" },
  { code: "CD-3-TR", desc: "GI Triple Clean Room Door with Hardware", size: "1800 x 2400" },
  { code: "FD1-SG", desc: "Fire Rated Door 60 min (Single) with Hardware", size: "1050 x 2400" },
  { code: "FD2-SG", desc: "Fire Rated Door 120 min (Double) with Hardware", size: "1500 x 2400" },
  { code: "LD-1-SG", desc: "Louvered Duct Door (Single)", size: "600 x 600" },
  { code: "LD-2-DO", desc: "Louvered Duct Door (Double)", size: "900 x 900" },
  { code: "DD-1-SG", desc: "Duct Door Single Skin (Single)", size: "800 x 800" },
  { code: "DD-2-SG", desc: "Duct Door Single Skin (Double)", size: "1000 x 1000" },
  { code: "FD1 - DO", desc: "Fire Rated Door 60 min (Double) with Hardware", size: "1400 x 2400" },
  { code: "FD2 - DO", desc: "Fire Rated Door 120 min (Double) with Hardware", size: "1600 x 2400" },
];

async function main() {
  const N = 15;
  const CONVERTED = 8; // enquiries 1..8 become sales orders
  const quotes: (typeof salesQuotes.$inferInsert)[] = [];
  const sos: (typeof salesSo.$inferInsert)[] = [];
  const gas: (typeof salesGa.$inferInsert)[] = [];
  const boms: (typeof salesBom.$inferInsert)[] = [];
  const wos: (typeof salesWo.$inferInsert)[] = [];

  for (let i = 1; i <= N; i++) {
    const door = DOORS[(i - 1) % DOORS.length]!;
    const company = COMPANIES[i - 1]!;
    const person = PEOPLE[i - 1]!;
    const item = `${door.code} — ${door.size}`;
    const qty = 2 + (i % 8);
    const rate = 22000 + i * 900;
    const amount = qty * rate;

    const enquiryNo = `1805${pad2(i)}`;
    const poNo = `AAT/PO-${pad2(i)}-2026-27`;
    const ourSoNo = `2627${pad2(50 + i)}-01`;
    const soDrawingNo = `DRG-26${pad2(i)}`;
    const gaNo = `AAT-GA-26${pad2(i)}`;
    const bomNo = `SPC-26${pad2(i)} - DOOR BOM`;
    const workOrderNo = `AAT-WO-26${pad2(i)}`;

    const base = "2026-03-02";
    const poDate = iso(base, i);
    const soDate = iso(poDate, 3);
    const cell = `98${(2000000000 + i * 111111).toString().slice(0, 8)}`;
    const email = `${person.split(" ")[0]!.toLowerCase()}@${company.split(" ")[0]!.toLowerCase()}.example`;

    const converted = i <= CONVERTED;
    const quoteStatus = converted ? "PO Received" : i <= 13 ? (i % 2 ? "Quote Sent" : "Quote Revised") : "Enquiry";

    quotes.push({
      enquiryNo, scope: "Manufacturing",
      enquirySource: ["Past Customer", "Website", "Referral", "Exhibition"][i % 4],
      introducerName: person, companyName: company, personName: person, cellNo: cell, email,
      product: door.desc.includes("Fire") ? "Fire Door" : door.desc.includes("Duct") || door.desc.includes("Louvered") ? "Duct Door" : "Clean Room Door",
      description: door.desc, item, qty: String(qty), unitOfMeasurement: "Nos",
      rate: String(rate), basicAmount: String(amount), quoteStatus,
      ...(converted ? { poNo, poAmount: String(amount), poDate } : {}),
      updatedAt: new Date(),
    });

    if (!converted) continue;

    // ── Sales Order ──
    const gaNeeded = i <= 5;
    const dispatched = i <= 4;
    const dispatchTarget = iso(soDate, 30);
    const dispatchActual = dispatched ? iso(soDate, i === 4 ? 34 : 28) : undefined; // #4 is late
    sos.push({
      enquiryNo, poNo, poDate, companyName: company, personName: person, cellNo: cell, email,
      description: door.desc, itemNameCode: item, unitOfMeasure: "Nos", qty: String(qty),
      rate: String(rate), amountWoGst: String(amount), scope: "Manufacturing",
      ourSoNo, soDate, soDrawingNo, soAmendmentNeeded: false, soAmendmentReasons: "NA",
      amendmentRelatedNotes: "NA", targetDispatchDate: dispatchTarget,
      ...(dispatchActual ? { actualDispatchDate: dispatchActual } : {}),
      daysToProduce: 30, gaApprovalNeeded: gaNeeded,
      updatedAt: new Date(),
    });

    // ── GA (only if required) ──
    if (gaNeeded) {
      const gaStatus = i <= 3 ? "Approved" : i === 4 ? "GA Submitted" : "Pending Approval";
      const approved = gaStatus === "Approved";
      gas.push({
        ourSoNo, soDate, poNo, companyName: company, soDrawingNo, description: door.desc, itemNameCode: item,
        gaStatus, submissionNoOfDays: 5, gaSubmissionTargetDate: iso(soDate, 5), gaSubmissionDate: iso(soDate, 6),
        targetGaApprovalDate: iso(soDate, 12), ...(approved ? { actualGaApprovalDate: iso(soDate, 11) } : {}),
        approvalNoOfDays: 7, gaNo,
        updatedAt: new Date(),
      });
    }

    // ── BOM (first 6 SOs) ──
    if (i <= 6) {
      const bomStatus = i <= 4 ? "Completed" : "In progress";
      boms.push({
        ourSoNo, soDate, poNo, companyName: company, soDrawingNo, description: door.desc, itemNameCode: item,
        bomStatus, reasonsForDelay: "NA", bomAmendmentNeeded: false, bomAmendmentReasons: "NA",
        amendmentRelatedNotes: "NA", noOfDays: 4, bomTargetDate: iso(soDate, 7),
        ...(bomStatus === "Completed" ? { bomActualDate: iso(soDate, 8) } : {}), bomNo,
        updatedAt: new Date(),
      });
    }

    // ── Work Order (BOM-completed SOs) ──
    if (i <= 4) {
      const woDate = iso(soDate, 10);
      wos.push({
        ourSoNo, bomNo, bomDate: iso(soDate, 8), soDrawingNo, preProductionChecklist: "Done",
        preProductionPlan: "Ready", workOrderNo, workOrderDate: woDate, noOfDays: 6,
        targetDate: iso(woDate, 20), actualDate: iso(woDate, 22), workOrderPendingWhere: "NA", boStatus: "Released",
        updatedAt: new Date(),
      });
    }
  }

  console.log(`Quotes: ${quotes.length}, SOs: ${sos.length}, GA: ${gas.length}, BOM: ${boms.length}, WO: ${wos.length}`);
  await db.delete(salesQuotes); await db.insert(salesQuotes).values(quotes);
  await db.delete(salesSo); await db.insert(salesSo).values(sos);
  await db.delete(salesGa); await db.insert(salesGa).values(gas);
  await db.delete(salesBom); await db.insert(salesBom).values(boms);
  await db.delete(salesWo); await db.insert(salesWo).values(wos);
  console.log("Done — realistic pipeline seeded.");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
