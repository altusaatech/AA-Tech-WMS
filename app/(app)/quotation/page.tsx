import { desc } from "drizzle-orm";
import { requireUser } from "@/lib/auth/current";
import { db } from "@/lib/db";
import { quotations } from "@/db/schema";
import { computeTotals, type DoorLine } from "@/lib/quotation/types";
import { QuotationList, type QuoteSummary } from "@/components/quotation/quotation-list";

export const dynamic = "force-dynamic";

export default async function QuotationListPage() {
  await requireUser();
  const rows = await db.select().from(quotations).orderBy(desc(quotations.createdAt));
  const quotes: QuoteSummary[] = rows.map((r) => {
    const lines = (r.lines ?? []) as DoorLine[];
    const t = computeTotals(lines);
    return {
      id: r.id,
      enquiryNo: r.enquiryNo ?? "",
      offerNo: r.offerNo ?? "",
      project: r.project ?? "",
      customer: r.customer ?? "",
      subject: r.subject ?? "",
      quoteDate: r.quoteDate ?? "",
      doors: lines.length,
      qty: lines.reduce((s, d) => s + (Number(d.qty) || 0), 0),
      doorTotal: t.doorSupply,
      hardwareTotal: t.hardwareSupply,
      installTotal: t.subtotalInstall,
      subtotal: t.subtotal,
      cgst: t.cgst,
      sgst: t.sgst,
      grandTotal: t.grandTotal,
    };
  });
  return <QuotationList quotes={quotes} />;
}
