import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Retired — replaced by the spec-built Sales Order Status dashboard.
export default function LegacyDashboard2() {
  redirect("/dashboards/sales-order");
}
