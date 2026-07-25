/**
 * Read-only row counts for every Pre Production table.
 * Run: pnpm exec tsx --env-file=.env.local scripts/count-preprod.ts
 */
import { sql } from "drizzle-orm";
import { db } from "../lib/db";
import {
  salesQuotes, salesBom, salesSo, salesGa, salesWo, salesPi,
  masterProduct, masterHardware, masterDoor, masterInstallation, quotations,
} from "../db/schema";

const TABLES: Record<string, any> = {
  "Enquiry / Quote register (salesQuotes)": salesQuotes,
  "Sales Order register (salesSo)": salesSo,
  "GA Drawing register (salesGa)": salesGa,
  "BOM register (salesBom)": salesBom,
  "Work Order register (salesWo)": salesWo,
  "PI register (salesPi)": salesPi,
  "Quotation builder docs (quotations)": quotations,
  "Master: Product/Door finished goods (masterProduct)": masterProduct,
  "Master: Door (masterDoor)": masterDoor,
  "Master: Hardware Kit (masterHardware)": masterHardware,
  "Master: Installation (masterInstallation)": masterInstallation,
};

async function main() {
  const out: { table: string; rows: number }[] = [];
  for (const [name, table] of Object.entries(TABLES)) {
    const [r] = await db.select({ n: sql<number>`count(*)::int` }).from(table);
    out.push({ table: name, rows: Number(r?.n ?? 0) });
  }
  console.log("\n=== Pre Production row counts ===");
  for (const { table, rows } of out) {
    console.log(`${rows === 0 ? "⚠️  EMPTY" : "   " + String(rows).padStart(4)}  ${table}`);
  }
  const empty = out.filter((o) => o.rows === 0);
  console.log(`\n${empty.length ? "Missing/empty: " + empty.map((e) => e.table).join(", ") : "No empty tables."}`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
