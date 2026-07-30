import { ClipboardList } from "lucide-react";
import { requireUser } from "@/lib/auth/current";
import { db } from "@/lib/db";
import { salesBom, salesSo } from "@/db/schema";
import { DashboardCanvas } from "@/components/dashboards/dashboard-canvas";
import { BomStatusDashboard, type BomRow } from "@/components/dashboards/bom/bom-status-dashboard";

export const dynamic = "force-dynamic";

const str = (v: unknown) => (v == null ? "" : String(v)).trim();
const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) && str(v) !== "" ? n : null; };
const has = (s: string, ...kw: string[]) => { const v = s.toLowerCase(); return kw.some((k) => v.includes(k)); };
function daysBetween(a: string, b: string): number { try { return Math.round((new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime()) / 86400000); } catch { return 0; } }
function daysSince(d: string): number | null { if (!d) return null; const t = new Date(d + "T00:00:00Z").getTime(); return Number.isNaN(t) ? null : Math.max(0, Math.round((Date.now() - t) / 86400000)); }

export default async function BomDashboardPage() {
  await requireUser();

  let bom: (typeof salesBom.$inferSelect)[] = [];
  let so: (typeof salesSo.$inferSelect)[] = [];
  try {
    [bom, so] = await Promise.all([db.select().from(salesBom), db.select().from(salesSo)]);
  } catch { /* degrade */ }

  const soByNo = new Map(so.filter((s) => str(s.ourSoNo)).map((s) => [str(s.ourSoNo), s]));

  const rows: BomRow[] = bom.map((b) => {
    const soNo = str(b.ourSoNo);
    const soRow = soByNo.get(soNo);
    const status = str(b.bomStatus) || "Not started";
    const completed = has(status, "complet", "releas", "done");
    const target = str(b.bomTargetDate);
    const actual = str(b.bomActualDate);
    const soDate = str(b.soDate) || str(soRow?.soDate);
    const delay = completed && target && actual ? Math.max(0, daysBetween(target, actual)) : 0;
    const onTime: boolean | null = completed ? (target && actual ? daysBetween(target, actual) <= 0 : true) : null;
    return {
      ourSoNo: soNo || "—",
      company: str(b.companyName) || str(soRow?.companyName),
      item: str(b.itemNameCode) || str(b.description),
      value: Number(soRow?.amountWoGst) || 0,
      bomNo: str(b.bomNo) || "—",
      bomStatus: status,
      completed,
      amended: !!b.bomAmendmentNeeded,
      noOfDays: num(b.noOfDays),
      targetDate: target || "—",
      actualDate: actual || "—",
      onTime,
      delay,
      aging: !completed ? daysSince(target || soDate) : null,
      reason: str(b.reasonsForDelay),
      date: actual || target || soDate,
    };
  });

  return (
    <DashboardCanvas eyebrow="Live · Production" title="BOM Status" subtitle="BOM release · status, target vs actual, aging & bottlenecks" Icon={ClipboardList}>
      <BomStatusDashboard rows={rows} />
    </DashboardCanvas>
  );
}
