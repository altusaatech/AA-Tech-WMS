import { ClipboardList } from "lucide-react";
import { requireUser } from "@/lib/auth/current";
import { db } from "@/lib/db";
import { salesBom, salesSo, salesQuotes } from "@/db/schema";
import { DashboardCanvas } from "@/components/dashboards/dashboard-canvas";
import { RegisterStatusDashboard, type DashRow } from "@/components/dashboards/status/register-status-dashboard";

export const dynamic = "force-dynamic";

const day = (v: unknown) => (v ? (v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10)) : "");
const daysSince = (d: string) => { if (!d) return 0; const t = new Date(d + "T00:00:00Z").getTime(); return Number.isNaN(t) ? 0 : Math.max(0, Math.round((Date.now() - t) / 86_400_000)); };

export default async function BomStatusDashboardPage() {
  await requireUser();
  let bom: (typeof salesBom.$inferSelect)[] = [];
  let so: { ourSoNo: string | null; enquiryNo: string | null }[] = [];
  let quotes: { enquiryNo: string | null; scope: string | null }[] = [];
  try {
    [bom, so, quotes] = await Promise.all([
      db.select().from(salesBom),
      db.select({ ourSoNo: salesSo.ourSoNo, enquiryNo: salesSo.enquiryNo }).from(salesSo),
      db.select({ enquiryNo: salesQuotes.enquiryNo, scope: salesQuotes.scope }).from(salesQuotes),
    ]);
  } catch { /* degrade */ }
  const today = new Date().toISOString().slice(0, 10);

  // Enrich BOM rows: BOM → SO (by SO No) gives Enquiry No; Enquiry No → Quote
  // gives Scope. Read-only joins — nothing is written back to any register.
  const enquiryBySo = new Map<string, string>();
  for (const s of so) { const k = (s.ourSoNo ?? "").trim().toLowerCase(); const v = (s.enquiryNo ?? "").trim(); if (k && v) enquiryBySo.set(k, v); }
  const scopeByEnquiry = new Map<string, string>();
  for (const qt of quotes) { const k = (qt.enquiryNo ?? "").trim().toLowerCase(); const v = (qt.scope ?? "").trim(); if (k && v) scopeByEnquiry.set(k, v); }

  const rows: DashRow[] = bom.map((b, idx) => {
    const status = (b.bomStatus ?? "").trim() || "Active";
    const date = day(b.soDate);
    const target = day(b.bomTargetDate);
    const actual = day(b.bomActualDate);
    const completed = Boolean(actual) || /complet|done|ready|dispatch/i.test(status);
    const open = !completed;
    const company = (b.companyName ?? "").trim();
    const item = (b.itemNameCode ?? b.description ?? "").trim();
    const no = (b.bomNo ?? "").trim();
    const soNo = (b.ourSoNo ?? "").trim();
    const enquiryNo = enquiryBySo.get(soNo.toLowerCase()) ?? "";
    const scope = enquiryNo ? scopeByEnquiry.get(enquiryNo.toLowerCase()) ?? "" : "";
    return {
      key: `${no || soNo}-${idx}`, no, soNo, company, item, scope, enquiryNo, status, date, completedDate: actual, value: Number(b.amountWoGst) || 0,
      days: Number(b.noOfDays) || 0,
      ageDays: open ? daysSince(date) : 0,
      open, overdue: open && Boolean(target) && target < today,
      approved: false, rejected: false, completed, revised: Boolean(b.bomAmendmentNeeded), ready: false,
      onTime: completed && Boolean(actual) && Boolean(target) && actual <= target,
      search: [no, soNo, company, item, status, enquiryNo, scope].join(" ").toLowerCase(),
    };
  });

  return (
    <DashboardCanvas eyebrow="Live · Production" title="BOM Status" subtitle="Created, completed, revised & aging" Icon={ClipboardList}>
      <RegisterStatusDashboard kind="bom" rows={rows} />
    </DashboardCanvas>
  );
}
