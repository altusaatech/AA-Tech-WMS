/**
 * One-time cleanup: delete every row from the quotations table.
 *
 * Run:
 *   pnpm exec tsx --env-file=.env.local scripts/delete-all-quotations.ts
 */

import { db } from "../lib/db";
import { quotations } from "../db/schema";

async function main() {
  const before = await db.select({ id: quotations.id }).from(quotations);
  console.log(`quotations before: ${before.length}`);
  await db.delete(quotations);
  const after = await db.select({ id: quotations.id }).from(quotations);
  console.log(`deleted ${before.length - after.length}; quotations now: ${after.length}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
