/**
 * Replace the Hardware master with the "HARDWARE KIT" sheet from
 * PARAMETER DOORS.xlsx.
 *
 * Run:
 *   pnpm exec tsx --env-file=.env.local scripts/seed-hardware.ts
 */
import * as XLSX from "xlsx";
import { db } from "../lib/db";
import { masterHardware } from "../db/schema";

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
  const wb = XLSX.readFile(FILE);
  const ws = wb.Sheets["HARDWARE KIT"];
  if (!ws) throw new Error("No 'HARDWARE KIT' sheet");
  const arr = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "" });

  const rows: (typeof masterHardware.$inferInsert)[] = [];
  // Row 0/1 = blank, row 2 = headers, 3+ = data.
  for (let i = 3; i < arr.length; i++) {
    const r = arr[i];
    if (!r) continue;
    const type = str(r[0]);
    if (!type) continue;
    // "Custom Hardware" is a section divider, not an item.
    if (type.toLowerCase() === "custom hardware") continue;
    rows.push({
      hardwareType: type,
      make: str(r[1]),
      model: str(r[2]),
      description: str(r[3]),
      uom: str(r[4]),
      buyingRate: num(r[5]),
      sellingRate: num(r[6]),
      image: str(r[7]),
    });
  }

  const before = await db.select().from(masterHardware);
  console.log(`Existing hardware rows: ${before.length}`);
  console.log(`Parsed ${rows.length} hardware items from the sheet:`);
  for (const r of rows) console.log(`  ${r.hardwareType} · ${r.make ?? "—"} · ${r.model ?? "—"}`);

  await db.delete(masterHardware);
  if (rows.length) await db.insert(masterHardware).values(rows);
  console.log(`\nReplaced hardware master — now ${rows.length} item(s).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
