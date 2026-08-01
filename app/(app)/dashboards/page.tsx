import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// The dashboards are listed in the left panel; land straight on Quote Status
// (the spec-built register dashboards, not the retired dashboard-N pages).
export default function DashboardsIndex() {
  redirect("/dashboards/quotation");
}
