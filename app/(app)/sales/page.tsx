import { asc } from "drizzle-orm";
import { requireUser } from "@/lib/auth/current";
import { db } from "@/lib/db";
import { salesQuotes, salesBom } from "@/db/schema";
import { QUOTE_KEYS, BOM_KEYS } from "@/lib/sales/columns";
import { SalesWorkspace } from "@/components/sales/sales-workspace";
import type { SalesRow } from "./actions";

export const dynamic = "force-dynamic";

function pick(row: Record<string, unknown>, keys: string[]): SalesRow {
  const out: SalesRow = { id: String(row.id) };
  for (const k of keys) out[k] = (row[k] ?? null) as string | number | boolean | null;
  return out;
}

export default async function SalesPage() {
  await requireUser();
  const [quotes, boms] = await Promise.all([
    db.select().from(salesQuotes).orderBy(asc(salesQuotes.createdAt)),
    db.select().from(salesBom).orderBy(asc(salesBom.createdAt)),
  ]);
  const quoteRows = quotes.map((r) => pick(r as Record<string, unknown>, QUOTE_KEYS));
  const bomRows = boms.map((r) => pick(r as Record<string, unknown>, BOM_KEYS));

  return <SalesWorkspace quoteRows={quoteRows} bomRows={bomRows} />;
}
