import { ClipboardList } from "lucide-react";
import { requireUser } from "@/lib/auth/current";
import { db } from "@/lib/db";
import { salesBom } from "@/db/schema";
import { BOM_COLUMNS } from "@/lib/sales/columns";
import { DashboardCanvas } from "@/components/dashboards/dashboard-canvas";
import { RegisterStatusDashboard, type DashRow, type HygieneRow } from "@/components/dashboards/status/register-status-dashboard";

export const dynamic = "force-dynamic";

const day = (v: unknown) => (v ? (v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10)) : "");
const daysSince = (d: string) => { if (!d) return 0; const t = new Date(d + "T00:00:00Z").getTime(); return Number.isNaN(t) ? 0 : Math.max(0, Math.round((Date.now() - t) / 86_400_000)); };

export default async function BomStatusDashboardPage() {
  await requireUser();
  let bom: (typeof salesBom.$inferSelect)[] = [];
  try { bom = await db.select().from(salesBom); } catch { /* degrade */ }
  const today = new Date().toISOString().slice(0, 10);

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
    return {
      key: `${no || soNo}-${idx}`, no, soNo, company, item, status, date, value: Number(b.amountWoGst) || 0,
      days: Number(b.noOfDays) || 0,
      ageDays: open ? daysSince(date) : 0,
      open, overdue: open && Boolean(target) && target < today,
      approved: false, rejected: false, completed, revised: Boolean(b.bomAmendmentNeeded), ready: false,
      onTime: completed && Boolean(actual) && Boolean(target) && actual <= target,
      search: [no, soNo, company, item, status].join(" ").toLowerCase(),
    };
  });

  const total = bom.length;
  const isBlank = (v: unknown) => v == null || (typeof v === "string" && v.trim() === "");
  const hygiene: HygieneRow[] = BOM_COLUMNS.filter((c) => c.key !== "srNo").map((c) => {
    const blanks = bom.filter((b) => isBlank((b as Record<string, unknown>)[c.key])).length;
    return { field: c.label, blanks, fillPct: total ? Math.round(((total - blanks) / total) * 100) : 0 };
  });

  return (
    <DashboardCanvas eyebrow="Live · Production" title="BOM Status" subtitle="Created, completed, revised, aging & data hygiene" Icon={ClipboardList}>
      <RegisterStatusDashboard kind="bom" rows={rows} hygiene={hygiene} />
    </DashboardCanvas>
  );
}
