import { redirect } from "next/navigation";
import type { Route } from "next";

export const dynamic = "force-dynamic";

// The dashboards section opens on Dashboard 1 (Quote Status) — the top item.
export default function DashboardsIndex() {
  redirect("/dashboards/dashboard-1" as Route);
}
