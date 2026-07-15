import { HeartPulse } from "lucide-react";
import { requireUser } from "@/lib/auth/current";
import { db } from "@/lib/db";
import { salesQuotes, salesSo, salesGa, salesBom, salesWo } from "@/db/schema";
import { QUOTE_COLUMNS, SO_COLUMNS, GA_COLUMNS, BOM_COLUMNS, WO_COLUMNS, type SalesColDef } from "@/lib/sales/columns";
import { DashboardCanvas } from "@/components/dashboards/dashboard-canvas";
import { HygieneDashboard, type RegisterHygiene } from "@/components/dashboards/hygiene/hygiene-dashboard";

export const dynamic = "force-dynamic";

const BAD = new Set(["", "#ref!", "na", "n/a", "null"]);
function notBlank(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "boolean") return true;
  const s = String(v).trim();
  return s !== "" && !BAD.has(s.toLowerCase());
}

function hygieneFor(key: string, label: string, cols: SalesColDef[], rows: Record<string, unknown>[]): RegisterHygiene {
  const total = rows.length;
  const fields = cols
    .filter((c) => c.key !== "srNo")
    .map((c) => {
      const filled = rows.reduce((n, r) => n + (notBlank(r[c.key]) ? 1 : 0), 0);
      const fillPct = total ? Math.round((filled / total) * 100) : 0;
      return { label: c.label, key: c.key, fillPct, filled, blanks: total - filled };
    });
  const overallPct = fields.length && total
    ? Math.round((fields.reduce((s, f) => s + f.filled, 0) / (fields.length * total)) * 100)
    : 0;
  return { key, label, total, overallPct, fields };
}

export default async function HygieneDashboardPage() {
  await requireUser();

  let quotes: Record<string, unknown>[] = [];
  let so: Record<string, unknown>[] = [];
  let ga: Record<string, unknown>[] = [];
  let bom: Record<string, unknown>[] = [];
  let wo: Record<string, unknown>[] = [];
  try {
    const res = await Promise.all([
      db.select().from(salesQuotes),
      db.select().from(salesSo),
      db.select().from(salesGa),
      db.select().from(salesBom),
      db.select().from(salesWo),
    ]);
    quotes = res[0] as Record<string, unknown>[];
    so = res[1] as Record<string, unknown>[];
    ga = res[2] as Record<string, unknown>[];
    bom = res[3] as Record<string, unknown>[];
    wo = res[4] as Record<string, unknown>[];
  } catch {
    /* degrade */
  }

  const registers: RegisterHygiene[] = [
    hygieneFor("quote", "Quote Status", QUOTE_COLUMNS, quotes),
    hygieneFor("so", "SO Status", SO_COLUMNS, so),
    hygieneFor("ga", "GA Approval", GA_COLUMNS, ga),
    hygieneFor("bom", "BOM Status", BOM_COLUMNS, bom),
    hygieneFor("wo", "Work Order", WO_COLUMNS, wo),
  ];

  return (
    <DashboardCanvas
      eyebrow="Live · Data Hygiene"
      title="Hygiene Dashboard"
      subtitle="Field completeness across every register — spot missing data at a glance"
      Icon={HeartPulse}
    >
      <HygieneDashboard registers={registers} />
    </DashboardCanvas>
  );
}
