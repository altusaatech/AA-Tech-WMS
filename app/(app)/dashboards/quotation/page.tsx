import { FileText } from "lucide-react";
import { DashboardCanvas } from "@/components/dashboards/dashboard-canvas";

export const dynamic = "force-dynamic";

export default function QuotationDashboardPage() {
  return (
    <DashboardCanvas
      eyebrow="Live · Sales"
      title="Quotation Dashboard"
      subtitle="Quotes raised, value, win-rate and pending decisions"
      Icon={FileText}
    />
  );
}
