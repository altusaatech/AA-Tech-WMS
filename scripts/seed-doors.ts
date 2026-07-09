/**
 * Seed the Door Kit master from PARAMETER DOORS.xlsx (the "Doors" sheet).
 * Clears master_door then inserts one row per door code.
 *
 * Run:
 *   pnpm exec tsx --env-file=.env.local scripts/seed-doors.ts
 */

import * as XLSX from "xlsx";
import { db } from "../lib/db";
import { masterDoor } from "../db/schema";

const FILE = "C:/Users/sayye/Downloads/PARAMETER DOORS.xlsx";

const str = (v: unknown): string | null => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};
const num = (v: unknown): string | null => {
  const s = String(v ?? "").trim();
  if (s === "") return null;
  const n = Number(s.replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? String(n) : null;
};

async function main() {
  const wb = XLSX.readFile(FILE, { cellDates: true });
  const ws = wb.Sheets["Doors"];
  if (!ws) throw new Error("No 'Doors' sheet");
  // Read as positional arrays. Row 0 = entry-method, row 1 = headers, 2+ = data.
  const arr = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "" });

  const rows: (typeof masterDoor.$inferInsert)[] = [];
  const seen = new Set<string>();
  // Row 0 = title, row 1 = entry-method, row 2 = headers, 3+ = data.
  for (let i = 3; i < arr.length; i++) {
    const r = arr[i];
    if (!r) continue;
    const code = str(r[1]); // "PRODUCT CODE" column holds the door code
    if (!code || code.toLowerCase() === "product code") continue;
    // First occurrence of a code wins (skip duplicate rows).
    if (seen.has(code.toLowerCase())) continue;
    seen.add(code.toLowerCase());
    // Only the green "code → spec" columns belong to the door master. The
    // yellow columns (orientation/finish/shade/shade-finish/width/height/qty)
    // are option lists chosen per door at quotation time, not master data.
    rows.push({
      doorCode: code,
      doorType: str(r[2]),
      doorConfig: str(r[3]),
      frameProfile: str(r[4]),
      frameMaterial: str(r[5]),
      shutterType: str(r[6]),
      shutterMaterial: str(r[7]),
      insulation: str(r[8]),
      ratePerSqm: num(r[9]),
      installPerSqm: num(r[10]),
    });
  }

  console.log(`Parsed ${rows.length} doors:`);
  for (const r of rows) console.log(`  ${r.doorCode} · ${r.doorType} · ${r.doorConfig}`);

  await db.delete(masterDoor);
  if (rows.length) await db.insert(masterDoor).values(rows);
  console.log(`\nSeeded ${rows.length} door(s).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
