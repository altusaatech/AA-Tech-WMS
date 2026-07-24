import { FileCheck2 } from "lucide-react";
import { requireUser } from "@/lib/auth/current";
import { db } from "@/lib/db";
import { salesSo } from "@/db/schema";
import { DashboardCanvas } from "@/components/dashboards/dashboard-canvas";
import { SalesOrderStatusDashboard, type SoRow } from "@/components/dashboards/dashboard2/so-status-dashboard";

export const dynamic = "force-dynamic";

const day = (v: unknown): string => {
  if (!v) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v).trim();
  return s.length >= 10 ? s.slice(0, 10) : s;
};
const daysSince = (d: string): number => {
  if (!d) return 0;
  const t = new Date(d + "T00:00:00Z").getTime();
  return Number.isNaN(t) ? 0 : Math.max(0, Math.round((Date.now() - t) / 86_400_000));
};

export default async function SoStatusDashboardPage() {
  await requireUser();

  let so: (typeof salesSo.$inferSelect)[] = [];
  try {
    so = await db.select().from(salesSo);
  } catch {
    /* degrade to empty */
  }
  const todayStr = new Date().toISOString().slice(0, 10);

  const rows: SoRow[] = so.map((s) => {
    const soDate = day(s.soDate);
    const actualDate = day(s.actualDispatchDate);
    const targetDate = day(s.targetDispatchDate);
    const dispatched = Boolean(actualDate);
    const overdue = !dispatched && Boolean(targetDate) && targetDate < todayStr;
    return {
      soNo: (s.ourSoNo ?? "").trim(),
      enquiryNo: (s.enquiryNo ?? "").trim(),
      poNo: (s.poNo ?? "").trim(),
      company: (s.companyName ?? "").trim(),
      item: (s.itemNameCode ?? s.description ?? "").trim(),
      value: Number(s.amountWoGst) || 0,
      salesperson: (s.personName ?? "").trim(),
      soDate,
      targetDate,
      actualDate,
      dispatched,
      overdue,
      delayDays: Number(s.noOfDaysDelay) || 0,
      amended: Boolean(s.soAmendmentNeeded),
      ageDays: dispatched ? 0 : daysSince(soDate),
    };
  });

  return (
    <DashboardCanvas eyebrow="Live · Production" title="Dashboard 2 — Sales Order Status" subtitle="PO → sales order → dispatch, aging, top customers & leaderboard" Icon={FileCheck2}>
      <SalesOrderStatusDashboard rows={rows} />
    </DashboardCanvas>
  );
}
