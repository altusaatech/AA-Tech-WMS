import { Inbox } from "lucide-react";
import { requireUser } from "@/lib/auth/current";
import { db } from "@/lib/db";
import { salesQuotes, salesSo } from "@/db/schema";
import { DashboardCanvas } from "@/components/dashboards/dashboard-canvas";
import { EnquiryDashboard, type EnquiryRow } from "@/components/dashboards/enquiry/enquiry-dashboard";

export const dynamic = "force-dynamic";

const SENT_RE = /(sent|po|received|won|order|accept|lost|regret)/i;

export default async function EnquiryDashboardPage() {
  await requireUser();

  let quotes: (typeof salesQuotes.$inferSelect)[] = [];
  let so: (typeof salesSo.$inferSelect)[] = [];
  try {
    [quotes, so] = await Promise.all([db.select().from(salesQuotes), db.select().from(salesSo)]);
  } catch {
    /* degrade to empty */
  }

  const soByEnquiry = new Map(so.filter((s) => (s.enquiryNo ?? "").trim()).map((s) => [(s.enquiryNo as string).trim(), s]));

  const rows: EnquiryRow[] = quotes.map((q) => {
    const enquiryNo = (q.enquiryNo ?? "").trim();
    const status = (q.quoteStatus ?? "").trim();
    const soRow = enquiryNo ? soByEnquiry.get(enquiryNo) : undefined;
    const quoteSent = (!!status && SENT_RE.test(status)) || !!(q.quoteLink && q.quoteLink.trim());
    const created = q.createdAt instanceof Date ? q.createdAt.toISOString() : String(q.createdAt ?? "");
    const date = (q.poDate as string | null)?.trim() || created.slice(0, 10);
    return {
      enquiryNo: enquiryNo || "—",
      company: q.companyName ?? "",
      person: q.personName ?? "",
      item: q.item ?? q.description ?? "",
      amount: Number(q.basicAmount) || Number(q.poAmount) || 0,
      quoteStatus: status || "Enquiry",
      quoteSent,
      soCreated: !!soRow,
      soNo: soRow?.ourSoNo ?? null,
      source: q.enquirySource ?? "—",
      date,
      createdAt: created,
    };
  });

  const enquiries = rows.length;
  const quotationsSent = rows.filter((r) => r.quoteSent).length;
  const soCreated = rows.filter((r) => r.soCreated).length;
  const followUp = rows.filter((r) => r.quoteSent && !r.soCreated).length;

  // Calendar opens on the month with the most recent enquiry activity.
  const dated = rows.map((r) => r.date).filter(Boolean).sort();
  const latest = dated[dated.length - 1] ?? "";
  const initialYear = latest ? Number(latest.slice(0, 4)) : new Date().getFullYear();
  const initialMonth = latest ? Number(latest.slice(5, 7)) - 1 : new Date().getMonth();

  return (
    <DashboardCanvas eyebrow="Live · Sales" title="Enquiry Dashboard" subtitle="Incoming enquiries — quotations, conversion and activity" Icon={Inbox}>
      <EnquiryDashboard
        rows={rows}
        kpis={{ enquiries, quotationsSent, soCreated }}
        timeline={[
          { label: "Enquiry Received", count: enquiries },
          { label: "Quote Created", count: enquiries },
          { label: "Quote Sent", count: quotationsSent },
          { label: "Customer Follow-up", count: followUp },
          { label: "Sales Order Created", count: soCreated },
        ]}
        initialYear={initialYear}
        initialMonth={initialMonth}
      />
    </DashboardCanvas>
  );
}
