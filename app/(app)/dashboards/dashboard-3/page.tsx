import { BadgeCheck } from "lucide-react";
import { requireUser } from "@/lib/auth/current";
import { db } from "@/lib/db";
import { salesGa } from "@/db/schema";
import { DashboardCanvas } from "@/components/dashboards/dashboard-canvas";
import { GaStatusDashboard, type GaRow } from "@/components/dashboards/dashboard3/ga-status-dashboard";

export const dynamic = "force-dynamic";

const day = (v: unknown) => (v ? (v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10)) : "");
const daysSince = (d: string) => { if (!d) return 0; const t = new Date(d + "T00:00:00Z").getTime(); return Number.isNaN(t) ? 0 : Math.max(0, Math.round((Date.now() - t) / 86_400_000)); };

export default async function GaStatusDashboardPage() {
  await requireUser();
  let ga: (typeof salesGa.$inferSelect)[] = [];
  try { ga = await db.select().from(salesGa); } catch { /* degrade */ }
  const today = new Date().toISOString().slice(0, 10);

  const rows: GaRow[] = ga.map((g) => {
    const status = (g.gaStatus ?? "").trim() || "Pending";
    const soDate = day(g.soDate);
    const submissionTargetDate = day(g.gaSubmissionTargetDate);
    const submissionDate = day(g.gaSubmissionDate);
    const targetApprovalDate = day(g.targetGaApprovalDate);
    const actualApprovalDate = day(g.actualGaApprovalDate);
    const approved = Boolean(actualApprovalDate) || /approv/i.test(status);
    const rejected = /reject|regret|decline/i.test(status);
    const open = !approved && !rejected;
    return {
      gaNo: (g.gaNo ?? "").trim(),
      soNo: (g.ourSoNo ?? "").trim(),
      poNo: (g.poNo ?? "").trim(),
      company: (g.companyName ?? "").trim(),
      item: (g.itemNameCode ?? g.description ?? "").trim(),
      status,
      soDate,
      submissionTargetDate,
      submissionDate,
      targetApprovalDate,
      actualApprovalDate,
      submissionDays: Number(g.submissionNoOfDays) || 0,
      approvalDays: Number(g.approvalNoOfDays) || 0,
      delayDays: Number(g.noOfDaysDelay) || 0,
      approved,
      rejected,
      open,
      overdue: open && Boolean(targetApprovalDate) && targetApprovalDate < today,
      onTime: approved && Boolean(actualApprovalDate) && Boolean(targetApprovalDate) && actualApprovalDate <= targetApprovalDate,
      ageDays: open ? daysSince(submissionDate || soDate) : 0,
    };
  });

  return (
    <DashboardCanvas eyebrow="Live · Production" title="GA Approval Status" subtitle="Submission, approvals, target vs actual & aging" Icon={BadgeCheck}>
      <GaStatusDashboard rows={rows} />
    </DashboardCanvas>
  );
}
