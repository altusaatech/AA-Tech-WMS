import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Retired — replaced by the spec-built BOM Status dashboard.
export default function LegacyDashboard4() {
  redirect("/dashboards/bom");
}
