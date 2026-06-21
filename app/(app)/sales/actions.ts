"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { salesQuotes, salesBom } from "@/db/schema";
import { requireUser } from "@/lib/auth/current";
import { QUOTE_KEYS, BOM_KEYS } from "@/lib/sales/columns";

export type SaleKind = "quote" | "bom";

export type SalesRow = Record<string, string | number | boolean | null> & { id: string };

function pick(row: Record<string, unknown>, keys: string[]): SalesRow {
  const out: SalesRow = { id: String(row.id) };
  for (const k of keys) {
    const v = row[k];
    out[k] = v === undefined ? null : (v as string | number | boolean | null);
  }
  return out;
}

/** Append a blank row and return it (with its new id / sr_no). */
export async function addSalesRow(kind: SaleKind): Promise<SalesRow> {
  await requireUser();
  if (kind === "quote") {
    const [row] = await db.insert(salesQuotes).values({ updatedAt: new Date() }).returning();
    return pick(row as Record<string, unknown>, QUOTE_KEYS);
  }
  const [row] = await db.insert(salesBom).values({ updatedAt: new Date() }).returning();
  return pick(row as Record<string, unknown>, BOM_KEYS);
}

/** Update a single cell. `field` is validated against the column allow-list. */
export async function updateSalesCell(
  kind: SaleKind,
  id: string,
  field: string,
  value: string | boolean | null,
): Promise<{ ok: boolean }> {
  await requireUser();
  const allowed = kind === "quote" ? QUOTE_KEYS : BOM_KEYS;
  if (!allowed.includes(field) || field === "srNo") return { ok: false };

  const clean = typeof value === "string" && value.trim() === "" ? null : value;
  const patch = { [field]: clean, updatedAt: new Date() } as Record<string, unknown>;

  if (kind === "quote") {
    await db.update(salesQuotes).set(patch).where(eq(salesQuotes.id, id));
  } else {
    await db.update(salesBom).set(patch).where(eq(salesBom.id, id));
  }
  return { ok: true };
}

export async function deleteSalesRow(kind: SaleKind, id: string): Promise<{ ok: boolean }> {
  await requireUser();
  if (kind === "quote") {
    await db.delete(salesQuotes).where(eq(salesQuotes.id, id));
  } else {
    await db.delete(salesBom).where(eq(salesBom.id, id));
  }
  return { ok: true };
}

/**
 * Create (id === null) or update a whole row from the modal form in one call.
 * Same DB/validation rules as updateSalesCell — just batched.
 */
export async function saveSalesRow(
  kind: SaleKind,
  id: string | null,
  values: Record<string, string | boolean | null>,
): Promise<SalesRow> {
  await requireUser();
  const allowed = kind === "quote" ? QUOTE_KEYS : BOM_KEYS;
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  for (const [k, v] of Object.entries(values)) {
    if (!allowed.includes(k) || k === "srNo") continue;
    patch[k] = typeof v === "string" && v.trim() === "" ? null : v;
  }

  if (kind === "quote") {
    if (id) {
      const [row] = await db.update(salesQuotes).set(patch).where(eq(salesQuotes.id, id)).returning();
      return pick(row as Record<string, unknown>, QUOTE_KEYS);
    }
    const [row] = await db.insert(salesQuotes).values(patch as typeof salesQuotes.$inferInsert).returning();
    return pick(row as Record<string, unknown>, QUOTE_KEYS);
  }
  if (id) {
    const [row] = await db.update(salesBom).set(patch).where(eq(salesBom.id, id)).returning();
    return pick(row as Record<string, unknown>, BOM_KEYS);
  }
  const [row] = await db.insert(salesBom).values(patch as typeof salesBom.$inferInsert).returning();
  return pick(row as Record<string, unknown>, BOM_KEYS);
}
