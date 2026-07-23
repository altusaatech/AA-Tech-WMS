import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/current";
import { db } from "@/lib/db";
import { quotations, salesKyc } from "@/db/schema";
import { QuotationPi } from "@/components/quotation/quotation-pi";
import { DEFAULT_NOTES, DEFAULT_SUBJECT, DEFAULT_PI_META, type DoorLine, type PiMeta } from "@/lib/quotation/types";

export const dynamic = "force-dynamic";

export default async function QuotationPiPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;

  const [q] = await db.select().from(quotations).where(eq(quotations.id, id));
  if (!q) notFound();

  // Auto-fetch the customer details from the matching Customer KYC record
  // (by the quotation's Enquiry No) so the PI is filled with no manual entry.
  const enquiry = (q.enquiryNo ?? "").trim().toLowerCase();
  let kycMeta: Partial<PiMeta> = {};
  let kycCompany = "";
  if (enquiry) {
    const kycRows = await db.select().from(salesKyc);
    const kyc = kycRows.find((k) => (k.enquiryNo ?? "").trim().toLowerCase() === enquiry);
    if (kyc) {
      kycCompany = (kyc.companyName ?? "").trim();
      const contact = [kyc.contactPerson, kyc.mobileNo].filter((v) => (v ?? "").trim()).join(" - ");
      kycMeta = {
        customerAddress: (kyc.companyAddress ?? "").trim(),
        billingAddress: (kyc.billingAddress ?? "").trim(),
        deliveryAddress: (kyc.deliveryAddress ?? "").trim(),
        customerGst: (kyc.gstNo ?? "").trim(),
        customerContactPerson: (kyc.contactPerson ?? "").trim(),
        customerMobile: (kyc.mobileNo ?? "").trim(),
        customerEmail: (kyc.email ?? "").trim(),
        enquirySource: (kyc.enquirySource ?? "").trim(),
        customerContact: contact,
      };
    }
  }
  // Fill empty fields from KYC; keep any values the PI was saved with.
  const saved = (q.piMeta ?? {}) as Partial<PiMeta>;
  const savedNonEmpty = Object.fromEntries(
    Object.entries(saved).filter(([, v]) => v != null && String(v).trim() !== ""),
  );

  return (
    <QuotationPi
      id={id}
      initial={{
        enquiryNo: q.enquiryNo ?? "",
        offerNo: q.offerNo ?? "",
        quoteDate: q.quoteDate ?? "",
        project: q.project ?? "",
        customer: (q.customer ?? "").trim() || kycCompany,
        subject: q.subject ?? DEFAULT_SUBJECT,
        lines: (q.lines ?? []) as DoorLine[],
        notes: q.notes && q.notes.length ? q.notes : DEFAULT_NOTES,
      }}
      initialPiMeta={{ ...DEFAULT_PI_META, ...kycMeta, ...savedNonEmpty }}
    />
  );
}
