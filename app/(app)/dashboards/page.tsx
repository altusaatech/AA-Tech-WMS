import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// The five dashboards are already listed in the left panel, so a card hub here
// only duplicated them and wasted space. Land straight on the first dashboard.
export default function DashboardsIndex() {
  redirect("/dashboards/dashboard-1");
}
