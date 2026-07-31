import { desc } from "drizzle-orm";
import { requireUser } from "@/lib/auth/current";
import { db } from "@/lib/db";
import { quotations } from "@/db/schema";
import { computePiTotals, type DoorLine } from "@/lib/quotation/types";
import { PiRegister, type PiSummary } from "@/components/quotation/pi-register";

export const dynamic = "force-dynamic";

export default async function PiRegisterPage() {
  await requireUser();
  const rows = await db.select().from(quotations).orderBy(desc(quotations.createdAt));
  const pis: PiSummary[] = rows.map((r) => {
    const lines = (r.lines ?? []) as DoorLine[];
    const t = computePiTotals(lines);
    return {
      id: r.id,
      offerNo: r.offerNo ?? "",
      project: r.project ?? "",
      customer: r.customer ?? "",
      quoteDate: r.quoteDate ?? "",
      qty: t.totalQty,
      grandTotal: t.grandTotal,
    };
  });
  return <PiRegister pis={pis} />;
}
