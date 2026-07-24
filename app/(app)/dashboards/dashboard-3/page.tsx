import { BadgeCheck } from "lucide-react";
import { requireUser } from "@/lib/auth/current";
import { db } from "@/lib/db";
import { salesGa } from "@/db/schema";
import { GA_COLUMNS } from "@/lib/sales/columns";
import { DashboardCanvas } from "@/components/dashboards/dashboard-canvas";
import { RegisterStatusDashboard, type DashRow, type HygieneRow } from "@/components/dashboards/status/register-status-dashboard";

export const dynamic = "force-dynamic";

const day = (v: unknown) => (v ? (v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10)) : "");
const daysSince = (d: string) => { if (!d) return 0; const t = new Date(d + "T00:00:00Z").getTime(); return Number.isNaN(t) ? 0 : Math.max(0, Math.round((Date.now() - t) / 86_400_000)); };

export default async function GaStatusDashboardPage() {
  await requireUser();
  let ga: (typeof salesGa.$inferSelect)[] = [];
  try { ga = await db.select().from(salesGa); } catch { /* degrade */ }
  const today = new Date().toISOString().slice(0, 10);

  const rows: DashRow[] = ga.map((g, idx) => {
    const status = (g.gaStatus ?? "").trim() || "Pending";
    const date = day(g.gaSubmissionDate) || day(g.soDate);
    const target = day(g.targetGaApprovalDate);
    const actual = day(g.actualGaApprovalDate);
    const approved = Boolean(actual) || /approv/i.test(status);
    const rejected = /reject|decline|regret/i.test(status);
    const open = !approved && !rejected;
    const company = (g.companyName ?? "").trim();
    const item = (g.itemNameCode ?? g.description ?? "").trim();
    const no = (g.gaNo ?? "").trim();
    const soNo = (g.ourSoNo ?? "").trim();
    return {
      key: `${no || soNo}-${idx}`, no, soNo, company, item, status, date, value: 0,
      days: Number(g.approvalNoOfDays) || 0,
      ageDays: open ? daysSince(date) : 0,
      open, overdue: open && Boolean(target) && target < today,
      approved, rejected, completed: approved, revised: false, ready: false,
      onTime: approved && Boolean(actual) && Boolean(target) && actual <= target,
      search: [no, soNo, company, item, status].join(" ").toLowerCase(),
    };
  });

  const total = ga.length;
  const isBlank = (v: unknown) => v == null || (typeof v === "string" && v.trim() === "");
  const hygiene: HygieneRow[] = GA_COLUMNS.filter((c) => c.key !== "srNo").map((c) => {
    const blanks = ga.filter((g) => isBlank((g as Record<string, unknown>)[c.key])).length;
    return { field: c.label, blanks, fillPct: total ? Math.round(((total - blanks) / total) * 100) : 0 };
  });

  return (
    <DashboardCanvas eyebrow="Live · Production" title="Dashboard 3" subtitle="GA Approval Status — submission, approvals, aging & data hygiene" Icon={BadgeCheck}>
      <RegisterStatusDashboard kind="ga" rows={rows} hygiene={hygiene} />
    </DashboardCanvas>
  );
}
