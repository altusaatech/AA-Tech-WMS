import { Factory } from "lucide-react";
import { requireUser } from "@/lib/auth/current";
import { db } from "@/lib/db";
import { salesWo } from "@/db/schema";
import { WO_COLUMNS } from "@/lib/sales/columns";
import { DashboardCanvas } from "@/components/dashboards/dashboard-canvas";
import { RegisterStatusDashboard, type DashRow, type HygieneRow } from "@/components/dashboards/status/register-status-dashboard";

export const dynamic = "force-dynamic";

const day = (v: unknown) => (v ? (v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10)) : "");
const daysSince = (d: string) => { if (!d) return 0; const t = new Date(d + "T00:00:00Z").getTime(); return Number.isNaN(t) ? 0 : Math.max(0, Math.round((Date.now() - t) / 86_400_000)); };

export default async function WoStatusDashboardPage() {
  await requireUser();
  let wo: (typeof salesWo.$inferSelect)[] = [];
  try { wo = await db.select().from(salesWo); } catch { /* degrade */ }
  const today = new Date().toISOString().slice(0, 10);

  const rows: DashRow[] = wo.map((w, idx) => {
    const status = (w.boStatus ?? "").trim() || "In Progress";
    const date = day(w.workOrderDate) || day(w.bomDate);
    const target = day(w.targetDate);
    const actual = day(w.actualDate);
    const completed = Boolean(actual) || /complet|dispatch|done/i.test(status);
    const ready = /ready/i.test(status);
    const open = !completed;
    const no = (w.workOrderNo ?? "").trim();
    const soNo = (w.ourSoNo ?? "").trim();
    return {
      key: `${no || soNo}-${idx}`, no, soNo, company: "", item: "", status, date, value: 0,
      days: Number(w.noOfDays) || 0,
      ageDays: open ? daysSince(date) : 0,
      open, overdue: open && Boolean(target) && target < today,
      approved: false, rejected: false, completed, revised: false, ready,
      onTime: completed && Boolean(actual) && Boolean(target) && actual <= target,
      search: [no, soNo, status, (w.workOrderPendingWhere ?? "")].join(" ").toLowerCase(),
    };
  });

  const total = wo.length;
  const isBlank = (v: unknown) => v == null || (typeof v === "string" && v.trim() === "");
  const hygiene: HygieneRow[] = WO_COLUMNS.filter((c) => c.key !== "srNo").map((c) => {
    const blanks = wo.filter((w) => isBlank((w as Record<string, unknown>)[c.key])).length;
    return { field: c.label, blanks, fillPct: total ? Math.round(((total - blanks) / total) * 100) : 0 };
  });

  return (
    <DashboardCanvas eyebrow="Live · Production" title="Work Order Status" subtitle="Production, on-time %, ready to dispatch, aging & hygiene" Icon={Factory}>
      <RegisterStatusDashboard kind="wo" rows={rows} hygiene={hygiene} />
    </DashboardCanvas>
  );
}
