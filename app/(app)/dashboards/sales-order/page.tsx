import { FileCheck2 } from "lucide-react";
import { requireUser } from "@/lib/auth/current";
import { db } from "@/lib/db";
import { salesSo, salesWo } from "@/db/schema";
import { DashboardCanvas } from "@/components/dashboards/dashboard-canvas";
import { SalesOrderDashboard, type SoRow } from "@/components/dashboards/sales-order/sales-order-dashboard";

export const dynamic = "force-dynamic";

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default async function SalesOrderDashboardPage() {
  await requireUser();

  let so: (typeof salesSo.$inferSelect)[] = [];
  let wo: (typeof salesWo.$inferSelect)[] = [];
  try {
    [so, wo] = await Promise.all([db.select().from(salesSo), db.select().from(salesWo)]);
  } catch { /* degrade */ }

  const woBySo = new Map(wo.filter((w) => (w.ourSoNo ?? "").trim()).map((w) => [(w.ourSoNo as string).trim(), w]));

  const rows: SoRow[] = so.map((s) => {
    const target = (s.targetDispatchDate as string | null)?.trim() || "";
    const actual = (s.actualDispatchDate as string | null)?.trim() || "";
    return {
      ourSoNo: (s.ourSoNo ?? "").trim() || "—",
      enquiryNo: (s.enquiryNo ?? "").trim() || "—",
      poNo: s.poNo ?? "—",
      company: s.companyName ?? "",
      item: s.itemNameCode ?? s.description ?? "",
      value: Number(s.amountWoGst) || (Number(s.qty) * Number(s.rate)) || 0,
      scope: (s.scope ?? "").trim() || "Unspecified",
      soDate: (s.soDate as string | null)?.trim() || "",
      targetDispatch: target || "—",
      actualDispatch: actual || "—",
      dispatched: !!actual,
      onTime: !!(actual && target && actual <= target),
      woNo: (s.ourSoNo && woBySo.get((s.ourSoNo as string).trim())?.workOrderNo) || null,
    };
  });

  const count = rows.length;
  const value = rows.reduce((s, r) => s + r.value, 0);
  const dispatched = rows.filter((r) => r.dispatched).length;
  const onTime = rows.filter((r) => r.dispatched && r.onTime).length;
  const onTimePct = dispatched ? Math.round((onTime / dispatched) * 100) : 0;

  const byMonth = new Map<string, number>();
  for (const r of rows) {
    if (!r.soDate) continue;
    const k = r.soDate.slice(0, 7);
    byMonth.set(k, (byMonth.get(k) ?? 0) + r.value);
  }
  const trend = Array.from(byMonth.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-8).map(([k, v]) => ({ label: MON[Number(k.slice(5, 7)) - 1] ?? k, value: v }));

  const byScope = new Map<string, number>();
  for (const r of rows) byScope.set(r.scope, (byScope.get(r.scope) ?? 0) + 1);
  const scopeDist = Array.from(byScope.entries()).sort(([, a], [, b]) => b - a).map(([label, v]) => ({ label, value: v }));

  return (
    <DashboardCanvas eyebrow="Live · Sales" title="Sales Order Dashboard" subtitle="Confirmed orders, order book, dispatch & delivery" Icon={FileCheck2}>
      <SalesOrderDashboard rows={rows} kpis={{ count, value, dispatched, onTimePct }} trend={trend} scopeDist={scopeDist} />
    </DashboardCanvas>
  );
}
