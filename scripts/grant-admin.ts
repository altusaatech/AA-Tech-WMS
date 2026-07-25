/**
 * Look up (and optionally promote) an employee to admin by name/email.
 * List:    pnpm exec tsx --env-file=.env.local scripts/grant-admin.ts pankaj
 * Promote: pnpm exec tsx --env-file=.env.local scripts/grant-admin.ts pankaj --grant
 */
import { ilike, or } from "drizzle-orm";
import { db } from "../lib/db";
import { employees } from "../db/schema";

const q = process.argv[2] ?? "";
const GRANT = process.argv.includes("--grant");

async function main() {
  if (!q) { console.log("usage: grant-admin <name-or-email> [--grant]"); return; }
  const rows = await db
    .select({ id: employees.id, name: employees.name, email: employees.email, role: employees.role, isAdmin: employees.isAdmin, isActive: employees.isActive })
    .from(employees)
    .where(or(ilike(employees.name, `%${q}%`), ilike(employees.email, `%${q}%`)));

  console.log(`\nMatches for "${q}": ${rows.length}`);
  for (const r of rows) console.log(`  ${r.isAdmin ? "★ADMIN" : "      "}  ${r.name}  <${r.email}>  role=${r.role} active=${r.isActive}  id=${r.id}`);

  if (!GRANT) { console.log(`\n(read-only — pass --grant to promote a single unique match)`); return; }
  if (rows.length !== 1) { console.log(`\n✗ Not promoting: need exactly 1 match, found ${rows.length}. Narrow the query.`); return; }
  const target = rows[0]!;
  if (target.isAdmin) { console.log(`\n✓ ${target.name} is already an admin — no change.`); return; }
  await db.update(employees).set({ isAdmin: true }).where(ilike(employees.email, target.email));
  console.log(`\n✔ Granted admin to ${target.name} <${target.email}>.`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
