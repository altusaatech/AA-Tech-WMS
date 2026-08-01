import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Retired — replaced by the spec-built Quote Status dashboard.
export default function LegacyDashboard1() {
  redirect("/dashboards/quotation");
}
