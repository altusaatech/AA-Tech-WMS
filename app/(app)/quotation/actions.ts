"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { quotations } from "@/db/schema";
import { requireUser } from "@/lib/auth/current";
import type { DoorLine, QuotationHeader, PiMeta } from "@/lib/quotation/types";

export async function createQuotation(seed?: { enquiryNo?: string; customer?: string }): Promise<{ id: string }> {
  await requireUser();
  // Auto-assign the next Offer No (continue the existing numeric sequence, else
  // start at a base) so the Working Specification needs no manual offer entry.
  const rows = await db.select({ offerNo: quotations.offerNo }).from(quotations);
  let max = 0;
  for (const r of rows) {
    const m = String(r.offerNo ?? "").match(/\d+/);
    if (m) max = Math.max(max, parseInt(m[0], 10));
  }
  const offerNo = String(max > 0 ? max + 1 : 1001);
  // Optional seed (e.g. "Create Working Specification" from a Customer KYC) —
  // carries the Enquiry No + Company so the offer opens pre-linked.
  const [row] = await db
    .insert(quotations)
    .values({
      offerNo,
      enquiryNo: seed?.enquiryNo?.trim() || null,
      customer: seed?.customer?.trim() || null,
      updatedAt: new Date(),
    })
    .returning({ id: quotations.id });
  return { id: row!.id };
}

export async function saveQuotation(
  id: string,
  header: QuotationHeader,
  lines: DoorLine[],
  notes: string[],
  piMeta: PiMeta,
): Promise<{ ok: boolean }> {
  await requireUser();
  await db
    .update(quotations)
    .set({
      enquiryNo: header.enquiryNo || null,
      offerNo: header.offerNo || null,
      quoteDate: header.quoteDate || null,
      project: header.project || null,
      customer: header.customer || null,
      subject: header.subject || null,
      lines,
      notes,
      piMeta,
      updatedAt: new Date(),
    })
    .where(eq(quotations.id, id));
  return { ok: true };
}

export async function deleteQuotation(id: string): Promise<{ ok: boolean }> {
  await requireUser();
  await db.delete(quotations).where(eq(quotations.id, id));
  return { ok: true };
}

/* ── Excel bulk import for the Working Spec / PI registers ─────── */

export interface QuotationImportRow {
  enquiryNo?: string;
  offerNo?: string;
  quoteDate?: string;
  project?: string;
  customer?: string;
  subject?: string;
  /** PI-register imports also carry PiMeta string fields (terms, addresses…). */
  pi?: Record<string, string>;
}

/** "2026-08-03" passes through; "03-08-2026" / "03/08/2026" read as D-M-Y. */
function normDate(v: string): string | undefined {
  const s = v.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) return `${m[3]}-${m[2]!.padStart(2, "0")}-${m[1]!.padStart(2, "0")}`;
  return undefined;
}

/**
 * Rows are keyed by Offer No: a match UPDATES that quotation's header/PI fields
 * (non-empty values only — blanks never wipe saved data); no match INSERTS a
 * new quotation with empty doors (filled later in the builder).
 */
export async function importQuotationRows(
  rows: QuotationImportRow[],
): Promise<{ inserted: number; updated: number; skipped: number }> {
  await requireUser();
  const existing = await db
    .select({ id: quotations.id, offerNo: quotations.offerNo, piMeta: quotations.piMeta })
    .from(quotations);
  const byOffer = new Map(
    existing
      .filter((e) => (e.offerNo ?? "").trim())
      .map((e) => [(e.offerNo as string).trim().toLowerCase(), e]),
  );

  const clean = (v?: string) => {
    const s = (v ?? "").trim();
    return s ? s : undefined;
  };

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  for (const r of rows.slice(0, 500)) {
    const offer = clean(r.offerNo);
    const piPatch = Object.fromEntries(
      Object.entries(r.pi ?? {}).filter(([, v]) => String(v ?? "").trim() !== ""),
    );
    const match = offer ? byOffer.get(offer.toLowerCase()) : undefined;
    if (match) {
      const set: Partial<typeof quotations.$inferInsert> = { updatedAt: new Date() };
      if (clean(r.enquiryNo)) set.enquiryNo = clean(r.enquiryNo);
      if (clean(r.quoteDate) && normDate(r.quoteDate!)) set.quoteDate = normDate(r.quoteDate!);
      if (clean(r.project)) set.project = clean(r.project);
      if (clean(r.customer)) set.customer = clean(r.customer);
      if (clean(r.subject)) set.subject = clean(r.subject);
      if (Object.keys(piPatch).length) set.piMeta = { ...(match.piMeta ?? {}), ...piPatch };
      await db.update(quotations).set(set).where(eq(quotations.id, match.id));
      updated++;
    } else if (offer || clean(r.enquiryNo) || clean(r.customer)) {
      await db.insert(quotations).values({
        offerNo: offer ?? null,
        enquiryNo: clean(r.enquiryNo) ?? null,
        quoteDate: (clean(r.quoteDate) && normDate(r.quoteDate!)) || null,
        project: clean(r.project) ?? null,
        customer: clean(r.customer) ?? null,
        subject: clean(r.subject) ?? null,
        piMeta: piPatch,
        updatedAt: new Date(),
      });
      inserted++;
    } else {
      skipped++;
    }
  }
  return { inserted, updated, skipped };
}
