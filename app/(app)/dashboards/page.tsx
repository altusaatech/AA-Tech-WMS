import { redirect } from "next/navigation";
import type { Route } from "next";

export const dynamic = "force-dynamic";

// The dashboards section now opens on the Enquiry dashboard (left-nav shell).
export default function DashboardsIndex() {
  redirect("/dashboards/enquiry" as Route);
}
