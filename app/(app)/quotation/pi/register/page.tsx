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
    const m = (r.piMeta ?? {}) as Record<string, string>;
    const s = (k: string) => (typeof m[k] === "string" ? m[k] : "");
    return {
      id: r.id,
      enquiryNo: r.enquiryNo ?? "",
      offerNo: r.offerNo ?? "",
      project: r.project ?? "",
      customer: r.customer ?? "",
      quoteDate: r.quoteDate ?? "",
      enquirySource: s("enquirySource"),
      customerAddress: s("customerAddress"),
      billingAddress: s("billingAddress"),
      deliveryAddress: s("deliveryAddress"),
      customerGst: s("customerGst"),
      contactPerson: s("customerContactPerson"),
      mobile: s("customerMobile"),
      email: s("customerEmail"),
      customerRefDate: s("customerRefDate"),
      hsnCode: s("hsnCode"),
      termsDelivery: s("termsDelivery"),
      modeShipping: s("modeShipping"),
      termsPayment: s("termsPayment"),
      qty: t.totalQty,
      subtotal: t.subtotal,
      cgst: t.cgst,
      sgst: t.sgst,
      grandTotal: t.grandTotal,
    };
  });
  return <PiRegister pis={pis} />;
}
