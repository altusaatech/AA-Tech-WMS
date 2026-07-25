/**
 * Delete fully-blank rows from the Quote Status register (salesQuotes) — the
 * empty rows a bad bulk-upload created. Only rows where EVERY data field is
 * null/empty are removed; rows with any real value are kept.
 *
 * Run:
 *   pnpm exec tsx --env-file=.env.local scripts/delete-empty-quotes.ts
 */

import { inArray } from "drizzle-orm";
import { db } from "../lib/db";
import { salesQuotes } from "../db/schema";

// Treat these as non-data: id/timestamps/srNo, plus quoteStatus (the bad
// import dumped company names here while every displayed column stayed blank).
const IGNORE = new Set(["id", "createdAt", "updatedAt", "created_at", "updated_at", "srNo", "sr_no", "quoteStatus", "quote_status"]);

async function main() {
  const rows = await db.select().from(salesQuotes);
  console.log(`Total quote rows: ${rows.length}`);

  const emptyIds: string[] = [];
  for (const r of rows) {
    const dataVals = Object.entries(r as Record<string, unknown>)
      .filter(([k]) => !IGNORE.has(k))
      .map(([, v]) => v);
    const allEmpty = dataVals.every((v) => v === null || v === undefined || String(v).trim() === "");
    if (allEmpty) emptyIds.push((r as { id: string }).id);
  }

  console.log(`Blank rows to delete: ${emptyIds.length}`);
  for (let i = 0; i < emptyIds.length; i += 200) {
    await db.delete(salesQuotes).where(inArray(salesQuotes.id, emptyIds.slice(i, i + 200)));
  }
  console.log(`Done. Deleted ${emptyIds.length} blank rows; ${rows.length - emptyIds.length} remain.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
