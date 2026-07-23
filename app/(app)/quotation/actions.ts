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
