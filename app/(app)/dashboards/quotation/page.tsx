import { FileText } from "lucide-react";
import { requireUser } from "@/lib/auth/current";
import { db } from "@/lib/db";
import { salesQuotes, salesSo } from "@/db/schema";
import { DashboardCanvas } from "@/components/dashboards/dashboard-canvas";
import { QuotationDashboard, type QuoteRow } from "@/components/dashboards/quotation/quotation-dashboard";

export const dynamic = "force-dynamic";

const SENT_RE = /(sent|po|received|won|order|accept|lost|regret)/i;
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default async function QuotationDashboardPage() {
  await requireUser();

  let quotes: (typeof salesQuotes.$inferSelect)[] = [];
  let so: (typeof salesSo.$inferSelect)[] = [];
  try {
    [quotes, so] = await Promise.all([db.select().from(salesQuotes), db.select().from(salesSo)]);
  } catch { /* degrade */ }

  const soSet = new Set(so.map((s) => (s.enquiryNo ?? "").trim()).filter(Boolean));
  const soByEnquiry = new Map(so.filter((s) => (s.enquiryNo ?? "").trim()).map((s) => [(s.enquiryNo as string).trim(), s]));

  const rows: QuoteRow[] = quotes.map((q) => {
    const enquiryNo = (q.enquiryNo ?? "").trim();
    const status = (q.quoteStatus ?? "").trim() || "Enquiry";
    const created = q.createdAt instanceof Date ? q.createdAt.toISOString() : String(q.createdAt ?? "");
    return {
      enquiryNo: enquiryNo || "—",
      company: q.companyName ?? "",
      item: q.item ?? q.description ?? "",
      value: Number(q.basicAmount) || Number(q.poAmount) || 0,
      status,
      sent: SENT_RE.test(status) || !!(q.quoteLink && q.quoteLink.trim()),
      converted: !!enquiryNo && soSet.has(enquiryNo),
      soNo: (enquiryNo && soByEnquiry.get(enquiryNo)?.ourSoNo) || null,
      date: (q.poDate as string | null)?.trim() || created.slice(0, 10),
    };
  });

  const sent = rows.filter((r) => r.sent).length;
  const value = rows.reduce((s, r) => s + r.value, 0);
  const converted = rows.filter((r) => r.converted).length;
  const winRate = sent ? Math.round((converted / sent) * 100) : 0;

  // value by month
  const byMonth = new Map<string, number>();
  for (const r of rows) {
    if (!r.date) continue;
    const k = r.date.slice(0, 7);
    byMonth.set(k, (byMonth.get(k) ?? 0) + r.value);
  }
  const trend = Array.from(byMonth.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-8)
    .map(([k, v]) => ({ label: `${MON[Number(k.slice(5, 7)) - 1]}`, value: v }));

  // status distribution
  const byStatus = new Map<string, number>();
  for (const r of rows) byStatus.set(r.status, (byStatus.get(r.status) ?? 0) + 1);
  const statusDist = Array.from(byStatus.entries()).sort(([, a], [, b]) => b - a).map(([label, v]) => ({ label, value: v }));

  return (
    <DashboardCanvas eyebrow="Live · Sales" title="Quotation Dashboard" subtitle="Quotes raised, value, win-rate and status mix" Icon={FileText}>
      <QuotationDashboard rows={rows} kpis={{ sent, value, converted, winRate }} trend={trend} statusDist={statusDist} />
    </DashboardCanvas>
  );
}
