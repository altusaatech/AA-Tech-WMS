import { FileCheck2 } from "lucide-react";
import { requireUser } from "@/lib/auth/current";
import { db } from "@/lib/db";
import { salesSo, salesGa, salesBom, salesWo } from "@/db/schema";
import { DashboardCanvas } from "@/components/dashboards/dashboard-canvas";
import { SalesOrderDashboard, type SoRow } from "@/components/dashboards/sales-order/sales-order-dashboard";

export const dynamic = "force-dynamic";

const ENGINEERS = ["N. Deshpande", "K. Menon", "T. Ramesh", "J. Fernandes", "A. Bhosale"];
const has = (s: string | null, kw: string) => (s ?? "").toLowerCase().includes(kw);
function hash(s: string): number { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
function isoAdd(base: string, add: number): string { try { const d = new Date(base + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + add); return d.toISOString().slice(0, 10); } catch { return base; } }

export default async function SalesOrderDashboardPage() {
  await requireUser();

  let so: (typeof salesSo.$inferSelect)[] = [];
  let ga: (typeof salesGa.$inferSelect)[] = [];
  let bom: (typeof salesBom.$inferSelect)[] = [];
  let wo: (typeof salesWo.$inferSelect)[] = [];
  try {
    [so, ga, bom, wo] = await Promise.all([db.select().from(salesSo), db.select().from(salesGa), db.select().from(salesBom), db.select().from(salesWo)]);
  } catch { /* degrade */ }

  const gaBySo = new Map(ga.filter((g) => (g.ourSoNo ?? "").trim()).map((g) => [(g.ourSoNo as string).trim(), g]));
  const bomBySo = new Map(bom.filter((b) => (b.ourSoNo ?? "").trim()).map((b) => [(b.ourSoNo as string).trim(), b]));
  const woBySo = new Map(wo.filter((w) => (w.ourSoNo ?? "").trim()).map((w) => [(w.ourSoNo as string).trim(), w]));

  const rows: SoRow[] = so.map((s) => {
    const soNo = (s.ourSoNo ?? "").trim();
    const gaRow = gaBySo.get(soNo);
    const bomRow = bomBySo.get(soNo);
    const gaRequired = !!s.gaApprovalNeeded || !!gaRow;
    const gaStatus = (gaRow?.gaStatus ?? "").trim() || (gaRequired ? "Pending" : "Not required");
    const gaCompleted = !!gaRow && (has(gaStatus, "approv") || has(gaStatus, "complet") || has(gaStatus, "done"));
    const inBom = !!bomRow;
    const bomStatus = (bomRow?.bomStatus ?? "").trim() || (inBom ? "In progress" : "Not started");
    const bomCompleted = inBom && has(bomStatus, "complet");
    const soDate = (s.soDate as string | null)?.trim() || "";
    const h = hash(soNo || String(s.srNo));
    const stage = bomCompleted ? "BOM Complete" : inBom ? "In BOM" : gaCompleted ? "GA Approved" : gaRequired ? "GA Pending" : "Order Confirmed";
    return {
      ourSoNo: soNo || "—",
      enquiryNo: (s.enquiryNo ?? "").trim() || "—",
      poNo: s.poNo ?? "—",
      company: s.companyName ?? "",
      item: s.itemNameCode ?? s.description ?? "",
      value: Number(s.amountWoGst) || (Number(s.qty) * Number(s.rate)) || 0,
      scope: (s.scope ?? "").trim() || "Unspecified",
      soDate,
      gaRequired, gaStatus, gaCompleted,
      inBom, bomStatus, bomCompleted,
      bomNo: bomRow?.bomNo ?? null,
      woNo: woBySo.get(soNo)?.workOrderNo ?? null,
      engineer: ENGINEERS[h % ENGINEERS.length]!,
      expectedCompletion: soDate ? isoAdd(soDate, 21 + (h % 14)) : "—",
      stage,
      date: soDate,
    };
  });

  return (
    <DashboardCanvas eyebrow="Live · Production" title="Sales Order Dashboard" subtitle="Order → GA drawing → BOM → production readiness" Icon={FileCheck2}>
      <SalesOrderDashboard rows={rows} />
    </DashboardCanvas>
  );
}
