import { FileCheck2 } from "lucide-react";
import { DashboardCanvas } from "@/components/dashboards/dashboard-canvas";

export const dynamic = "force-dynamic";

export default function SalesOrderDashboardPage() {
  return (
    <DashboardCanvas
      eyebrow="Live · Sales"
      title="Sales Order Dashboard"
      subtitle="Confirmed orders, order book, dispatch and delivery"
      Icon={FileCheck2}
    />
  );
}
