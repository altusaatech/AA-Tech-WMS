import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/current";
import { db } from "@/lib/db";
import { quotations, salesKyc, salesQuotes } from "@/db/schema";
import { QuotationPi, type PiDetail } from "@/components/quotation/quotation-pi";
import { DEFAULT_NOTES, DEFAULT_SUBJECT, DEFAULT_PI_META, type DoorLine, type PiMeta } from "@/lib/quotation/types";

export const dynamic = "force-dynamic";

const clean = (v: unknown) => (v == null ? "" : String(v).trim());

export default async function QuotationPiPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;

  const [q] = await db.select().from(quotations).where(eq(quotations.id, id));
  if (!q) notFound();

  // Customer details for EVERY enquiry — from the Quote Status register, then
  // backfilled by Customer KYC (KYC wins). Used both to auto-fill this PI and,
  // client-side, to re-fill when the Offer Ref (= Enquiry No) is changed.
  const [allKyc, allQuotes] = await Promise.all([db.select().from(salesKyc), db.select().from(salesQuotes)]);
  const detailsByEnquiry: Record<string, PiDetail> = {};
  for (const r of allQuotes) {
    const k = clean(r.enquiryNo).toLowerCase(); if (!k) continue;
    const e: PiDetail = detailsByEnquiry[k] ?? {};
    e.customer = e.customer || clean(r.companyName);
    e.project = e.project || clean(r.product);
    if (clean(r.enquirySource)) e.enquirySource = clean(r.enquirySource);
    if (clean(r.personName)) e.customerContactPerson = clean(r.personName);
    if (clean(r.cellNo)) e.customerMobile = clean(r.cellNo);
    if (clean(r.email)) e.customerEmail = clean(r.email);
    detailsByEnquiry[k] = e;
  }
  for (const k of allKyc) {
    const key = clean(k.enquiryNo).toLowerCase(); if (!key) continue;
    const e: PiDetail = detailsByEnquiry[key] ?? {};
    if (clean(k.companyName)) e.customer = clean(k.companyName);
    if (clean(k.companyAddress)) e.customerAddress = clean(k.companyAddress);
    if (clean(k.billingAddress)) e.billingAddress = clean(k.billingAddress);
    if (clean(k.deliveryAddress)) e.deliveryAddress = clean(k.deliveryAddress);
    if (clean(k.gstNo)) e.customerGst = clean(k.gstNo);
    if (clean(k.contactPerson)) e.customerContactPerson = clean(k.contactPerson);
    if (clean(k.mobileNo)) e.customerMobile = clean(k.mobileNo);
    if (clean(k.email)) e.customerEmail = clean(k.email);
    if (clean(k.enquirySource)) e.enquirySource = clean(k.enquirySource);
    detailsByEnquiry[key] = e;
  }
  for (const e of Object.values(detailsByEnquiry)) {
    e.customerContact = [e.customerContactPerson, e.customerMobile].filter(Boolean).join(" - ");
  }
  // Alias each entry under its bare enquiry number too, so an Offer Ref with a
  // suffix ("180015 R1") still fetches the "180015" enquiry's details.
  for (const [k, e] of Object.entries(detailsByEnquiry)) {
    const nk = k.match(/\d{4,}/)?.[0];
    if (nk && !detailsByEnquiry[nk]) detailsByEnquiry[nk] = e;
  }

  const curKey = (q.enquiryNo ?? "").trim().toLowerCase() || (q.offerNo ?? "").trim().toLowerCase();
  const current = detailsByEnquiry[curKey] ?? detailsByEnquiry[curKey.match(/\d{4,}/)?.[0] ?? ""] ?? {};
  const { customer: curCompany, project: _curProject, ...curMeta } = current;

  // Drop empty keys so a blank field never wipes a saved PI value.
  const nonEmpty = (o: Partial<PiMeta>) => Object.fromEntries(Object.entries(o).filter(([, v]) => v != null && String(v).trim() !== ""));
  const saved = (q.piMeta ?? {}) as Partial<PiMeta>;

  return (
    <QuotationPi
      id={id}
      detailsByEnquiry={detailsByEnquiry}
      initial={{
        enquiryNo: q.enquiryNo ?? "",
        offerNo: q.offerNo ?? "",
        quoteDate: q.quoteDate ?? "",
        project: q.project ?? "",
        customer: clean(q.customer) || curCompany || "",
        subject: q.subject ?? DEFAULT_SUBJECT,
        lines: (q.lines ?? []) as DoorLine[],
        notes: q.notes && q.notes.length ? q.notes : DEFAULT_NOTES,
      }}
      // Precedence: defaults → Quote Status + KYC → saved PI values.
      initialPiMeta={{ ...DEFAULT_PI_META, ...nonEmpty(curMeta as Partial<PiMeta>), ...nonEmpty(saved) }}
    />
  );
}
