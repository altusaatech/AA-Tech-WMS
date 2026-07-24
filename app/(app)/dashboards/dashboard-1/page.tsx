import { FileText } from "lucide-react";
import { requireUser } from "@/lib/auth/current";
import { db } from "@/lib/db";
import { salesQuotes, salesSo } from "@/db/schema";
import { DashboardCanvas } from "@/components/dashboards/dashboard-canvas";
import { QuoteStatusDashboard, type QsRow } from "@/components/dashboards/dashboard1/quote-status-dashboard";

export const dynamic = "force-dynamic";

const WON_RE = /(won|order|po received|accepted?|approved)/i;
const LOST_RE = /(lost|regret|cancel|reject|drop|dead)/i;
const SENT_RE = /(sent|quote|po|received|won|order|accept|lost|regret)/i;

export default async function QuoteStatusDashboardPage() {
  await requireUser();

  let quotes: (typeof salesQuotes.$inferSelect)[] = [];
  let so: (typeof salesSo.$inferSelect)[] = [];
  try {
    [quotes, so] = await Promise.all([db.select().from(salesQuotes), db.select().from(salesSo)]);
  } catch {
    /* degrade to empty */
  }
  const soSet = new Set(so.map((s) => (s.enquiryNo ?? "").trim()).filter(Boolean));

  const rows: QsRow[] = quotes.map((qt) => {
    const enquiryNo = (qt.enquiryNo ?? "").trim();
    const status = (qt.quoteStatus ?? "").trim() || "Enquiry";
    const created = qt.createdAt instanceof Date ? qt.createdAt.toISOString() : String(qt.createdAt ?? "");
    const date = (qt.poDate as string | null)?.trim() || created.slice(0, 10);
    const hasPo = Boolean((qt.poNo ?? "").trim()) || Number(qt.poAmount) > 0;
    const won = hasPo || WON_RE.test(status) || (!!enquiryNo && soSet.has(enquiryNo));
    const lost = LOST_RE.test(status);
    return {
      quoteNo: enquiryNo ? `AAT/QT-${enquiryNo.slice(-4)}` : "—",
      enquiryNo: enquiryNo || "—",
      company: (qt.companyName ?? "").trim(),
      product: (qt.product ?? qt.description ?? "").trim(),
      value: Number(qt.basicAmount) || Number(qt.poAmount) || 0,
      status,
      sent: SENT_RE.test(status) || Boolean((qt.quoteLink ?? "").trim()),
      won,
      lost,
      source: (qt.enquirySource ?? "").trim(),
      salesperson: (qt.introducerName ?? qt.personName ?? "").trim(),
      date,
    };
  });

  return (
    <DashboardCanvas eyebrow="Live · Sales" title="Dashboard 1 — Quote Status" subtitle="Enquiry → quotation → PO conversion, pending & values" Icon={FileText}>
      <QuoteStatusDashboard rows={rows} />
    </DashboardCanvas>
  );
}
