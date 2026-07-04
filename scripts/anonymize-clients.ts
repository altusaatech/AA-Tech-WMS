/**
 * Replace every real client name with a fictional company name — in the
 * `clients` roster AND in the task entries that use them (a task's title is
 * the client name in this app). Deterministic mapping; safe to re-run (already
 * fictional names just map to fresh fictional names, which is harmless).
 *
 * Run:
 *   pnpm exec tsx --env-file=.env.local scripts/anonymize-clients.ts
 */

import { asc, eq, sql } from "drizzle-orm";
import { db } from "../lib/db";
import { clients, tasks } from "../db/schema";

const FAKE: string[] = [
  "Acme Corp", "Globex", "Initech", "Umbrella Ltd", "Stark Industries",
  "Wayne Enterprises", "Wonka Industries", "Soylent Corp", "Cyberdyne Systems",
  "Hooli", "Pied Piper", "Massive Dynamic", "Aperture Labs", "Black Mesa",
  "Tyrell Corp", "Nakatomi Trading", "Oscorp", "Gekko & Co", "Vandelay Industries",
  "Bluth Company", "Prestige Worldwide", "Dunder Mifflin", "Sterling Cooper",
  "Los Pollos", "Vehement Capital", "Wernham Hogg", "Monsters Inc",
  "Sirius Cybernetics", "Rich Industries", "Spacely Sprockets", "Cogswell Cogs",
  "Bubba Gump", "Central Perk Co", "Krusty Krab", "Planet Express",
  "Genco Olive Oil", "Zorg Industries", "Weyland Corp", "Rekall Inc", "Buy n Large",
];

function fakeName(i: number): string {
  const base = FAKE[i % FAKE.length] ?? "Client";
  const round = Math.floor(i / FAKE.length);
  return round === 0 ? base : `${base} ${round + 1}`;
}

async function main() {
  const rows = await db
    .select({ id: clients.id, name: clients.name })
    .from(clients)
    .orderBy(asc(clients.name));
  console.log(`Clients to anonymize: ${rows.length}`);

  let taskRows = 0;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (!r) continue;
    const fake = fakeName(i);

    // Retitle every task filed under this (real) client name.
    const updated = await db
      .update(tasks)
      .set({ title: fake })
      .where(sql`lower(${tasks.title}) = lower(${r.name})`)
      .returning({ id: tasks.id });
    taskRows += updated.length;

    // Rename the client in the roster.
    await db.update(clients).set({ name: fake, updatedAt: new Date() }).where(eq(clients.id, r.id));

    console.log(`  ${r.name}  ->  ${fake}   (${updated.length} task${updated.length === 1 ? "" : "s"})`);
  }

  console.log(`\nDone. ${rows.length} clients renamed, ${taskRows} task titles updated.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
