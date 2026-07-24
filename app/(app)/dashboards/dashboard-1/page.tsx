import { LayoutDashboard } from "lucide-react";
import { requireUser } from "@/lib/auth/current";
import { db } from "@/lib/db";
import { salesQuotes, salesSo } from "@/db/schema";
import { QUOTE_COLUMNS } from "@/lib/sales/columns";
import { DashboardCanvas } from "@/components/dashboards/dashboard-canvas";
import { QuoteStatusDashboard, type QsRow, type HygieneRow } from "@/components/dashboards/dashboard1/quote-status-dashboard";

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

  // Data hygiene — % of quote-register rows with each field filled.
  const total = quotes.length;
  const isBlank = (v: unknown) => v == null || (typeof v === "string" && v.trim() === "");
  const hygiene: HygieneRow[] = QUOTE_COLUMNS.filter((c) => c.key !== "srNo").map((c) => {
    const blanks = quotes.filter((qt) => isBlank((qt as Record<string, unknown>)[c.key])).length;
    return { field: c.label, blanks, fillPct: total ? Math.round(((total - blanks) / total) * 100) : 0 };
  });

  return (
    <DashboardCanvas eyebrow="Live · Sales" title="New Dashboard" subtitle="Quote Status — enquiries, conversion, pending quotes & data hygiene" Icon={LayoutDashboard}>
      <QuoteStatusDashboard rows={rows} hygiene={hygiene} />
    </DashboardCanvas>
  );
}
