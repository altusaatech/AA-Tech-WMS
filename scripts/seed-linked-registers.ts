/**
 * Seed 15 LINKED demo rows across the five production registers so the pipeline
 * reads end-to-end, mirroring the "Anant Avinya Technologies System" sheet:
 *
 *   Enquiry No ─▶ PO No ─▶ Our SO No ─▶ GA No / BOM No ─▶ Work Order No
 *
 * Quote Status keeps its existing rows (adds 15). SO / GA / BOM / WO are wiped
 * (near-empty) and reseeded with the matching 15. Working Spec & PI untouched.
 *
 * Run: pnpm exec tsx --env-file=.env.local scripts/seed-linked-registers.ts
 */
import { db } from "../lib/db";
import { salesQuotes, salesSo, salesGa, salesBom, salesWo } from "../db/schema";

const pad2 = (n: number) => String(n).padStart(2, "0");
const iso = (base: string, addDays: number) => {
  const d = new Date(base + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + addDays);
  return d.toISOString().slice(0, 10);
};

const COMPANIES = [
  "Nimbus Clean Systems", "Vertex Pharma Labs", "Meridian Biotech", "Sterling Cleanrooms",
  "Orion Life Sciences", "Apex Formulations", "Zenith Healthcare", "Quanta Devices",
  "Halcyon Labs", "Crest Biopharma", "Lumen Diagnostics", "Pinnacle Pharma",
  "Solaris Sciences", "Everest Biologics", "Aurora Medtech",
];
const PEOPLE = [
  "Rahul Menon", "Sneha Iyer", "Arjun Rao", "Kavya Nair", "Vikram Shah",
  "Priya Desai", "Aditya Kulkarni", "Neha Joshi", "Rohan Gupta", "Meera Pillai",
  "Sanjay Verma", "Divya Reddy", "Karan Malhotra", "Anjali Sharma", "Nikhil Bose",
];
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

const nz = (s: string) => (s.trim() === "" ? null : s);

async function main() {
  const N = 15;
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
    const qty = 2 + (i % 8); // 2..9
    const rate = 22000 + i * 900; // per door
    const amount = qty * rate;

    // ── shared linkage keys ──
    const enquiryNo = `1805${pad2(i)}`;            // Quote key
    const poNo = `AAT/PO-${pad2(i)}-2026-27`;      // PO
    const ourSoNo = `2627${pad2(50 + i)}-01`;      // SO key
    const soDrawingNo = `DRG-26${pad2(i)}`;
    const gaNo = `AAT-GA-26${pad2(i)}`;
    const bomNo = `SPC-26${pad2(i)} - DOOR BOM`;
    const workOrderNo = `AAT-WO-26${pad2(i)}`;

    // ── staggered dates ──
    const base = "2026-03-02";
    const poDate = iso(base, i);
    const soDate = iso(poDate, 3);
    const gaSubTarget = iso(soDate, 5);
    const gaSubDate = iso(soDate, 6);
    const gaAppTarget = iso(soDate, 12);
    const gaAppDate = iso(soDate, 13);
    const bomTarget = iso(soDate, 7);
    const bomActual = iso(soDate, 8);
    const woDate = iso(soDate, 10);
    const dispatchTarget = iso(soDate, 30);
    const dispatchActual = iso(soDate, 32);
    const cell = `98${(2000000000 + i * 111111).toString().slice(0, 8)}`;
    const email = `${person.split(" ")[0]!.toLowerCase()}@${company.split(" ")[0]!.toLowerCase()}.example`;

    quotes.push({
      enquiryNo, scope: "Manufacturing",
      enquirySource: ["Past Customer", "Website", "Referral", "Exhibition"][i % 4],
      introducerName: person, companyName: company, personName: person, cellNo: cell, email,
      product: "Clean Room Door", description: door.desc, item, qty: String(qty),
      unitOfMeasurement: "Nos", rate: String(rate), basicAmount: String(amount),
      quoteStatus: "PO Received", poNo, poAmount: String(amount), poDate,
      updatedAt: new Date(),
    });

    sos.push({
      enquiryNo, poNo, poDate, companyName: company, personName: person, cellNo: cell, email,
      description: door.desc, itemNameCode: item, unitOfMeasure: "Nos", qty: String(qty),
      rate: String(rate), amountWoGst: String(amount), scope: "Manufacturing",
      ourSoNo, soDate, soDrawingNo, soAmendmentNeeded: false, soAmendmentReasons: "NA",
      amendmentRelatedNotes: "NA", targetDispatchDate: dispatchTarget, actualDispatchDate: dispatchActual,
      daysToProduce: 30, actualNoOfDays: 32, noOfDaysDelay: 2, gaApprovalNeeded: true,
      updatedAt: new Date(),
    });

    gas.push({
      ourSoNo, soDate, poNo, companyName: company, soDrawingNo, description: door.desc, itemNameCode: item,
      gaStatus: "Approved", gaStatusNotes: nz(""), submissionNoOfDays: 5,
      gaSubmissionTargetDate: gaSubTarget, gaSubmissionDate: gaSubDate,
      targetGaApprovalDate: gaAppTarget, actualGaApprovalDate: gaAppDate,
      approvalNoOfDays: 7, noOfDaysDelay: 1, gaNo,
      updatedAt: new Date(),
    });

    boms.push({
      ourSoNo, soDate, poNo, companyName: company, soDrawingNo, description: door.desc, itemNameCode: item,
      bomStatus: "Completed", reasonsForDelay: "NA", bomAmendmentNeeded: false, bomAmendmentReasons: "NA",
      amendmentRelatedNotes: "NA", noOfDays: 4, bomTargetDate: bomTarget, bomActualDate: bomActual, bomNo,
      updatedAt: new Date(),
    });

    wos.push({
      ourSoNo, bomNo, bomDate: bomActual, soDrawingNo, preProductionChecklist: "Done",
      preProductionPlan: "Ready", workOrderNo, workOrderDate: woDate, noOfDays: 6,
      targetDate: iso(woDate, 20), actualDate: iso(woDate, 22),
      workOrderPendingWhere: "NA", boStatus: "Released",
      updatedAt: new Date(),
    });
  }

  console.log("Seeding 15 linked rows (Enquiry → PO → SO → GA/BOM → WO)…");
  // Quote: keep existing rows, just add the 15.
  await db.insert(salesQuotes).values(quotes);
  // SO/GA/BOM/WO: near-empty → wipe & reseed exactly 15.
  await db.delete(salesSo); await db.insert(salesSo).values(sos);
  await db.delete(salesGa); await db.insert(salesGa).values(gas);
  await db.delete(salesBom); await db.insert(salesBom).values(boms);
  await db.delete(salesWo); await db.insert(salesWo).values(wos);

  console.log("Done. Sample linkage for row 1:");
  console.log(`  Enquiry ${quotes[0]!.enquiryNo} · PO ${quotes[0]!.poNo} · SO ${sos[0]!.ourSoNo} · GA ${gas[0]!.gaNo} · BOM ${boms[0]!.bomNo} · WO ${wos[0]!.workOrderNo}`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
