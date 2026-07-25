import { db } from "../lib/db";
import { salesQuotes } from "../db/schema";

async function main() {
  const rows = await db.select().from(salesQuotes);
  console.log(`Total: ${rows.length}\n`);
  // Show the non-empty fields of the last 5 rows (the recently imported ones).
  for (const r of rows.slice(-5)) {
    const nonEmpty = Object.entries(r as Record<string, unknown>)
      .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== "")
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`);
    console.log("ROW:", nonEmpty.join(" | "));
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
