import { BadgeCheck } from "lucide-react";
import { requireUser } from "@/lib/auth/current";
import { db } from "@/lib/db";
import { salesGa, salesSo } from "@/db/schema";
import { DashboardCanvas } from "@/components/dashboards/dashboard-canvas";
import { GaStatusDashboard, type GaRow } from "@/components/dashboards/ga/ga-status-dashboard";

export const dynamic = "force-dynamic";

const str = (v: unknown) => (v == null ? "" : String(v)).trim();
const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) && str(v) !== "" ? n : null; };
const has = (s: string, ...kw: string[]) => { const v = s.toLowerCase(); return kw.some((k) => v.includes(k)); };
function daysSince(d: string): number | null { if (!d) return null; const t = new Date(d + "T00:00:00Z").getTime(); return Number.isNaN(t) ? null : Math.max(0, Math.round((Date.now() - t) / 86400000)); }

export default async function GaDashboardPage() {
  await requireUser();

  let ga: (typeof salesGa.$inferSelect)[] = [];
  let so: (typeof salesSo.$inferSelect)[] = [];
  try {
    [ga, so] = await Promise.all([db.select().from(salesGa), db.select().from(salesSo)]);
  } catch { /* degrade */ }

  const soByNo = new Map(so.filter((s) => str(s.ourSoNo)).map((s) => [str(s.ourSoNo), s]));

  const rows: GaRow[] = ga.map((g) => {
    const soNo = str(g.ourSoNo);
    const soRow = soByNo.get(soNo);
    const status = str(g.gaStatus) || "Pending";
    const approved = has(status, "approv", "complet", "done");
    const submissionDate = str(g.gaSubmissionDate);
    const approvalDate = str(g.actualGaApprovalDate);
    const soDate = str(g.soDate) || str(soRow?.soDate);
    return {
      ourSoNo: soNo || "—",
      company: str(g.companyName) || str(soRow?.companyName),
      item: str(g.itemNameCode) || str(g.description),
      value: Number(soRow?.amountWoGst) || 0,
      gaNo: str(g.gaNo) || "—",
      gaStatus: status,
      approved,
      submissionDays: num(g.submissionNoOfDays),
      approvalDays: num(g.approvalNoOfDays),
      delay: Math.max(0, num(g.noOfDaysDelay) ?? 0),
      submissionDate: submissionDate || "—",
      approvalDate: approvalDate || "—",
      aging: !approved ? daysSince(submissionDate || soDate) : null,
      date: approvalDate || submissionDate || soDate,
    };
  });

  return (
    <DashboardCanvas eyebrow="Live · Engineering" title="GA Approval Status" subtitle="GA submission → approval · approval days, customers & aging" Icon={BadgeCheck}>
      <GaStatusDashboard rows={rows} />
    </DashboardCanvas>
  );
}
