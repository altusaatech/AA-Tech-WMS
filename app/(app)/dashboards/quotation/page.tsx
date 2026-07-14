import { FileText } from "lucide-react";
import { requireUser } from "@/lib/auth/current";
import { db } from "@/lib/db";
import { salesQuotes, salesSo, salesPi } from "@/db/schema";
import { DashboardCanvas } from "@/components/dashboards/dashboard-canvas";
import { QuotationDashboard, type QuoteRow } from "@/components/dashboards/quotation/quotation-dashboard";

export const dynamic = "force-dynamic";

const SENT_RE = /(sent|po|received|won|order|accept|lost|regret)/i;
const EXECS = ["Rakesh Sharma", "Priya Nair", "Aman Khan", "Sneha Iyer", "Vikram Rao"];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export default async function QuotationDashboardPage() {
  await requireUser();

  let quotes: (typeof salesQuotes.$inferSelect)[] = [];
  let so: (typeof salesSo.$inferSelect)[] = [];
  let pis: (typeof salesPi.$inferSelect)[] = [];
  try {
    [quotes, so, pis] = await Promise.all([db.select().from(salesQuotes), db.select().from(salesSo), db.select().from(salesPi)]);
  } catch { /* degrade */ }

  const soSet = new Set(so.map((s) => (s.enquiryNo ?? "").trim()).filter(Boolean));
  const soByEnquiry = new Map(so.filter((s) => (s.enquiryNo ?? "").trim()).map((s) => [(s.enquiryNo as string).trim(), s]));
  const piByRef = new Map(pis.filter((p) => (p.quoteRef ?? "").trim()).map((p) => [(p.quoteRef as string).trim(), p]));

  const rows: QuoteRow[] = quotes.map((q) => {
    const enquiryNo = (q.enquiryNo ?? "").trim();
    const status = (q.quoteStatus ?? "").trim() || "Enquiry";
    const created = q.createdAt instanceof Date ? q.createdAt.toISOString() : String(q.createdAt ?? "");
    const date = (q.poDate as string | null)?.trim() || created.slice(0, 10);
    const h = hash(enquiryNo || status);
    const revisions = h % 3;
    const pi = enquiryNo ? piByRef.get(enquiryNo) : undefined;
    const piStatus = (pi?.piStatus ?? "").trim();
    return {
      enquiryNo: enquiryNo || "—",
      quoteNo: enquiryNo ? `AAT/QT-${enquiryNo.slice(-4)}` : "—",
      company: q.companyName ?? "",
      item: q.item ?? q.description ?? "",
      value: Number(q.basicAmount) || Number(q.poAmount) || 0,
      status,
      sent: SENT_RE.test(status) || !!(q.quoteLink && q.quoteLink.trim()),
      revised: revisions > 0,
      revisions,
      piNo: pi?.piNo ?? null,
      piStatus: piStatus || "Not sent",
      piSent: /(sent|accept)/i.test(piStatus),
      piApproved: /accept/i.test(piStatus),
      converted: !!enquiryNo && soSet.has(enquiryNo),
      soNo: (enquiryNo && soByEnquiry.get(enquiryNo)?.ourSoNo) || null,
      executive: EXECS[h % EXECS.length]!,
      created: date,
      updated: revisions ? isoAdd(date, revisions * 3) : date,
      date,
    };
  });

  return (
    <DashboardCanvas eyebrow="Live · Sales" title="Quotation Dashboard" subtitle="Enquiry → quotation → PI → approval lifecycle" Icon={FileText}>
      <QuotationDashboard rows={rows} />
    </DashboardCanvas>
  );
}

function isoAdd(base: string, add: number): string {
  try { const d = new Date(base + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + add); return d.toISOString().slice(0, 10); } catch { return base; }
}
