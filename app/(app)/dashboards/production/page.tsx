import { Factory } from "lucide-react";
import { requireUser } from "@/lib/auth/current";
import { db } from "@/lib/db";
import { salesSo, salesGa, salesBom, salesWo } from "@/db/schema";
import { DashboardCanvas } from "@/components/dashboards/dashboard-canvas";
import { ProductionDashboard, type ProdRow } from "@/components/dashboards/production/production-dashboard";

export const dynamic = "force-dynamic";

const has = (s: string | null | undefined, ...kw: string[]) => {
  const v = (s ?? "").toLowerCase();
  return kw.some((k) => v.includes(k));
};
const str = (v: unknown) => (v == null ? "" : String(v)).trim();
const numOr = (v: unknown, fallback = 0) => (v == null || v === "" || Number.isNaN(Number(v)) ? fallback : Number(v));
function daysBetween(a: string, b: string): number | null {
  if (!a || !b) return null;
  try {
    const t1 = new Date(a + "T00:00:00Z").getTime();
    const t2 = new Date(b + "T00:00:00Z").getTime();
    if (Number.isNaN(t1) || Number.isNaN(t2)) return null;
    return Math.round((t2 - t1) / 86400000);
  } catch {
    return null;
  }
}

export default async function ProductionDashboardPage() {
  await requireUser();

  let so: (typeof salesSo.$inferSelect)[] = [];
  let ga: (typeof salesGa.$inferSelect)[] = [];
  let bom: (typeof salesBom.$inferSelect)[] = [];
  let wo: (typeof salesWo.$inferSelect)[] = [];
  try {
    [so, ga, bom, wo] = await Promise.all([
      db.select().from(salesSo),
      db.select().from(salesGa),
      db.select().from(salesBom),
      db.select().from(salesWo),
    ]);
  } catch {
    /* degrade to empty */
  }

  const gaBySo = new Map(ga.filter((g) => str(g.ourSoNo)).map((g) => [str(g.ourSoNo), g]));
  const bomBySo = new Map(bom.filter((b) => str(b.ourSoNo)).map((b) => [str(b.ourSoNo), b]));
  const woBySo = new Map(wo.filter((w) => str(w.ourSoNo)).map((w) => [str(w.ourSoNo), w]));

  const rows: ProdRow[] = so.map((s) => {
    const soNo = str(s.ourSoNo);
    const gaRow = gaBySo.get(soNo);
    const bomRow = bomBySo.get(soNo);
    const woRow = woBySo.get(soNo);

    // GA approval
    const gaRequired = !!s.gaApprovalNeeded || !!gaRow;
    const gaApproved = !!gaRow && has(gaRow.gaStatus, "approv", "complet", "done");
    const gaDelay = numOr(gaRow?.noOfDaysDelay, 0) || (daysBetween(str(gaRow?.targetGaApprovalDate), str(gaRow?.actualGaApprovalDate)) ?? 0);

    // BOM
    const bomReleased = !!bomRow && (has(bomRow.bomStatus, "complet", "releas", "done") || !!str(bomRow.bomNo));
    const bomDelay = daysBetween(str(bomRow?.bomTargetDate), str(bomRow?.bomActualDate)) ?? 0;

    // Work order
    const woIssued = !!woRow && !!str(woRow.workOrderNo);
    const woPendingWhere = str(woRow?.workOrderPendingWhere);

    // Dispatch — the delivery milestone
    const dispatchTarget = str(s.targetDispatchDate);
    const dispatchActual = str(s.actualDispatchDate);
    const dispatched = !!dispatchActual;
    const explicitDelay = numOr(s.noOfDaysDelay, NaN);
    const delay = Number.isNaN(explicitDelay) ? daysBetween(dispatchTarget, dispatchActual) ?? 0 : explicitDelay;
    const onTime: boolean | null = dispatched ? delay <= 0 : null;

    const stage = dispatched
      ? "Dispatched"
      : woIssued
      ? "Work Order"
      : bomReleased
      ? "BOM Released"
      : gaApproved
      ? "GA Approved"
      : gaRequired
      ? "GA Pending"
      : "Order Confirmed";

    const delayReason = str(bomRow?.reasonsForDelay) || str(s.soAmendmentReasons) || woPendingWhere || "";

    return {
      ourSoNo: soNo || "—",
      company: str(s.companyName),
      item: str(s.itemNameCode) || str(s.description),
      value: numOr(s.amountWoGst, 0) || numOr(s.qty, 0) * numOr(s.rate, 0),
      scope: str(s.scope) || "Unspecified",
      soDate: str(s.soDate),
      gaRequired,
      gaApproved,
      gaDelay: Math.max(0, gaDelay),
      bomReleased,
      bomDelay: Math.max(0, bomDelay),
      woIssued,
      woPendingWhere,
      dispatched,
      dispatchTarget: dispatchTarget || "—",
      dispatchActual: dispatchActual || "—",
      dispatchDelay: Math.max(0, delay),
      onTime,
      stage,
      delayReason,
      date: dispatchActual || dispatchTarget || str(s.soDate),
    };
  });

  return (
    <DashboardCanvas
      eyebrow="Live · Production & Delivery"
      title="Production Dashboard"
      subtitle="GA approval → BOM → Work Order → Dispatch · on-time performance & bottlenecks"
      Icon={Factory}
    >
      <ProductionDashboard rows={rows} />
    </DashboardCanvas>
  );
}
