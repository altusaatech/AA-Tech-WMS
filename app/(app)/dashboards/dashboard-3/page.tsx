import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Retired — replaced by the spec-built GA Approval Status dashboard.
export default function LegacyDashboard3() {
  redirect("/dashboards/ga");
}
