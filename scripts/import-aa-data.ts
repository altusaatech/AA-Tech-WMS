/**
 * Import the real Anant Avinya workbook into the sales registers (APPEND).
 * Auto-detects each sheet's header row by matching cell text to the register's
 * column labels, then maps + cleans values into the schema.
 *
 * Dry run (no writes):  pnpm exec tsx --env-file=.env.local scripts/import-aa-data.ts --dry
 * Real append:          pnpm exec tsx --env-file=.env.local scripts/import-aa-data.ts
 */
import * as XLSX from "xlsx";
import { db } from "../lib/db";
import { salesQuotes, salesSo, salesGa, salesBom, salesWo } from "../db/schema";
import { QUOTE_COLUMNS, SO_COLUMNS, GA_COLUMNS, BOM_COLUMNS, WO_COLUMNS, type SalesColDef } from "../lib/sales/columns";

const FILE = "C:/Users/sayye/Downloads/Anant Avinya Technologies System (1).xlsx";
const DRY = process.argv.includes("--dry");
const NUDGE_H = 6; // undo the workbook's ~IST tz offset so calendar dates land right

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PLAN: { key: string; sheet: string; table: any; cols: SalesColDef[]; id: string }[] = [
  { key: "quote", sheet: "Quote Status", table: salesQuotes, cols: QUOTE_COLUMNS, id: "enquiryNo" },
  { key: "so", sheet: "SO Status", table: salesSo, cols: SO_COLUMNS, id: "ourSoNo" },
  { key: "ga", sheet: "GA Approval Status", table: salesGa, cols: GA_COLUMNS, id: "ourSoNo" },
  { key: "bom", sheet: "BOM Status", table: salesBom, cols: BOM_COLUMNS, id: "ourSoNo" },
  { key: "wo", sheet: "Work Order Status", table: salesWo, cols: WO_COLUMNS, id: "ourSoNo" },
];
const SKIP = new Set((process.argv.find((a) => a.startsWith("--skip="))?.split("=")[1] ?? "").split(",").filter(Boolean));
// Columns backed by an integer DB type — must be whole numbers, not "5.5".
const INT_KEYS = new Set(["daysToProduce", "actualNoOfDays", "noOfDaysDelay", "submissionNoOfDays", "approvalNoOfDays", "noOfDays"]);

const norm = (s: unknown) => String(s ?? "").toLowerCase().replace(/\s+/g, " ").trim();
const BAD = new Set(["", "na", "n/a", "#ref!", "-", "null", "none"]);

function fmtDate(v: unknown): string | null {
  if (v == null || v === "") return null;
  if (v instanceof Date) return new Date(v.getTime() + NUDGE_H * 3600_000).toISOString().slice(0, 10);
  const s = String(v).trim();
  if (BAD.has(s.toLowerCase())) return null;
  // Excel serial
  if (/^\d{5}(\.\d+)?$/.test(s)) {
    const d = new Date(Date.UTC(1899, 11, 30) + Number(s) * 86400_000 + NUDGE_H * 3600_000);
    return d.toISOString().slice(0, 10);
  }
  // M/D/Y or M-D-Y
  let m = s.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})$/);
  if (m) {
    const yr = m[3]!.length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    return `${yr}-${String(m[1]).padStart(2, "0")}-${String(m[2]).padStart(2, "0")}`;
  }
  // Y-M-D…
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function clean(col: SalesColDef, raw: unknown): string | boolean | null {
  if (col.type === "date") return fmtDate(raw);
  const s = String(raw ?? "").trim();
  if (col.type === "bool") {
    const l = s.toLowerCase();
    if (["yes", "true", "1", "y"].includes(l)) return true;
    if (["no", "false", "0", "n"].includes(l)) return false;
    return null;
  }
  if (BAD.has(s.toLowerCase())) return null;
  if (col.type === "number") {
    const n = Number(s.replace(/[,\s₹]/g, ""));
    if (!Number.isFinite(n)) return null;
    return INT_KEYS.has(col.key) ? String(Math.round(n)) : String(n);
  }
  return s;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function insertBatches(table: any, rows: Record<string, unknown>[]) {
  // Try the fast bulk insert; if any row is malformed the batch fails, so fall
  // back to row-by-row, logging the first few causes and skipping bad rows.
  try {
    await db.insert(table).values(rows);
    return { ok: rows.length, bad: 0 };
  } catch {
    let ok = 0, bad = 0, shown = 0;
    for (const r of rows) {
      try {
        await db.insert(table).values(r);
        ok++;
      } catch (e) {
        bad++;
        if (shown < 3) {
          const msg = (e as { cause?: { message?: string } })?.cause?.message ?? (e as Error).message;
          console.log(`      ✗ row skipped: ${msg?.slice(0, 140)} · ${JSON.stringify(Object.fromEntries(Object.entries(r).filter(([kk]) => kk !== "updatedAt").slice(0, 5)))}`);
          shown++;
        }
      }
    }
    return { ok, bad };
  }
}

async function main() {
  const wb = XLSX.readFile(FILE, { cellDates: true });
  console.log(`\n=== AA data import ${DRY ? "(DRY RUN — no writes)" : "(APPEND to DB)"} ===`);

  for (const p of PLAN) {
    if (SKIP.has(p.key)) { console.log(`\n### ${p.sheet}  → skipped (--skip=${p.key})`); continue; }
    const ws = wb.Sheets[p.sheet];
    if (!ws) { console.log(`\n! "${p.sheet}" not found`); continue; }
    const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "", raw: true, blankrows: false });

    const writable = p.cols.filter((c) => !c.readOnly && c.key !== "srNo");
    const labelMap = new Map(writable.map((c) => [norm(c.label), c]));

    // detect header row = row maximising label matches (search first 12 rows)
    let headerIdx = 0, best = 0;
    for (let i = 0; i < Math.min(12, aoa.length); i++) {
      const hits = (aoa[i] as unknown[]).reduce((n: number, cell) => n + (labelMap.has(norm(cell)) ? 1 : 0), 0);
      if (hits > best) { best = hits; headerIdx = i; }
    }
    const header = aoa[headerIdx] as unknown[];
    const idxToCol = new Map<number, SalesColDef>();
    header.forEach((cell, ci) => { const c = labelMap.get(norm(cell)); if (c && !Array.from(idxToCol.values()).includes(c)) idxToCol.set(ci, c); });

    const records: Record<string, unknown>[] = [];
    let skipped = 0;
    for (let r = headerIdx + 1; r < aoa.length; r++) {
      const rowArr = aoa[r] as unknown[];
      const rec: Record<string, unknown> = {};
      let nonEmpty = 0;
      for (const [ci, col] of idxToCol) {
        const val = clean(col, rowArr[ci]);
        if (val !== null && val !== "") { rec[col.key] = val; nonEmpty++; }
      }
      const hasId = rec[p.id] != null && String(rec[p.id]).trim() !== "";
      if (nonEmpty >= 2 && (hasId || nonEmpty >= 4)) { rec.updatedAt = new Date(); records.push(rec); }
      else skipped++;
    }

    console.log(`\n### ${p.sheet}  → header@row${headerIdx} · ${best} label matches`);
    console.log(`    matched cols: ${Array.from(idxToCol.values()).map((c) => c.label).join(", ")}`);
    console.log(`    → ${records.length} rows to import, ${skipped} skipped`);
    if (records.length) {
      const sample = records[0]!;
      console.log(`    sample: ${JSON.stringify(Object.fromEntries(Object.entries(sample).filter(([kk]) => kk !== "updatedAt").slice(0, 8)))}`);
    }

    if (!DRY && records.length) {
      const res = await insertBatches(p.table, records);
      console.log(`    ✔ inserted ${res.ok}${res.bad ? ` · ${res.bad} skipped (bad values)` : ""}`);
    }
  }
  console.log(`\n${DRY ? "Dry run complete — rerun without --dry to append." : "Import complete."}`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
