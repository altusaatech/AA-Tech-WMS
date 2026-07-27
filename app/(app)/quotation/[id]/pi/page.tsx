import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/current";
import { db } from "@/lib/db";
import { quotations, salesKyc, salesQuotes } from "@/db/schema";
import { QuotationPi } from "@/components/quotation/quotation-pi";
import { DEFAULT_NOTES, DEFAULT_SUBJECT, DEFAULT_PI_META, type DoorLine, type PiMeta } from "@/lib/quotation/types";

export const dynamic = "force-dynamic";

const clean = (v: unknown) => (v == null ? "" : String(v).trim());

export default async function QuotationPiPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;

  const [q] = await db.select().from(quotations).where(eq(quotations.id, id));
  if (!q) notFound();

  // Auto-fetch customer details by the quotation's Enquiry No — from the
  // Quote Status register and the Customer KYC record — so the PI fills with
  // no manual entry. KYC takes priority; Quote Status backfills what KYC lacks.
  const enquiry = (q.enquiryNo ?? "").trim().toLowerCase();
  let kycMeta: Partial<PiMeta> = {};
  let quoteMeta: Partial<PiMeta> = {};
  let kycCompany = "";
  let quoteCompany = "";
  if (enquiry) {
    const [kycRows, quoteRows] = await Promise.all([
      db.select().from(salesKyc),
      db.select().from(salesQuotes),
    ]);
    const kyc = kycRows.find((k) => (k.enquiryNo ?? "").trim().toLowerCase() === enquiry);
    const quote = quoteRows.find((r) => (r.enquiryNo ?? "").trim().toLowerCase() === enquiry);
    if (quote) {
      quoteCompany = clean(quote.companyName);
      quoteMeta = {
        enquirySource: clean(quote.enquirySource),
        customerContactPerson: clean(quote.personName),
        customerMobile: clean(quote.cellNo),
        customerEmail: clean(quote.email),
        customerContact: [clean(quote.personName), clean(quote.cellNo)].filter(Boolean).join(" - "),
      };
    }
    if (kyc) {
      kycCompany = clean(kyc.companyName);
      kycMeta = {
        customerAddress: clean(kyc.companyAddress),
        billingAddress: clean(kyc.billingAddress),
        deliveryAddress: clean(kyc.deliveryAddress),
        customerGst: clean(kyc.gstNo),
        customerContactPerson: clean(kyc.contactPerson),
        customerMobile: clean(kyc.mobileNo),
        customerEmail: clean(kyc.email),
        enquirySource: clean(kyc.enquirySource),
        customerContact: [clean(kyc.contactPerson), clean(kyc.mobileNo)].filter(Boolean).join(" - "),
      };
    }
  }
  // Drop empty keys so a blank KYC field doesn't wipe a Quote-Status value.
  const nonEmpty = (o: Partial<PiMeta>) => Object.fromEntries(Object.entries(o).filter(([, v]) => v != null && String(v).trim() !== ""));
  const saved = (q.piMeta ?? {}) as Partial<PiMeta>;

  return (
    <QuotationPi
      id={id}
      initial={{
        enquiryNo: q.enquiryNo ?? "",
        offerNo: q.offerNo ?? "",
        quoteDate: q.quoteDate ?? "",
        project: q.project ?? "",
        customer: clean(q.customer) || kycCompany || quoteCompany,
        subject: q.subject ?? DEFAULT_SUBJECT,
        lines: (q.lines ?? []) as DoorLine[],
        notes: q.notes && q.notes.length ? q.notes : DEFAULT_NOTES,
      }}
      // Precedence: defaults → Quote Status → Customer KYC → saved PI values.
      initialPiMeta={{ ...DEFAULT_PI_META, ...nonEmpty(quoteMeta), ...nonEmpty(kycMeta), ...nonEmpty(saved) }}
    />
  );
}
