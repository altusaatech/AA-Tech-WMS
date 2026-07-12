import { Inbox } from "lucide-react";
import { DashboardCanvas } from "@/components/dashboards/dashboard-canvas";

export const dynamic = "force-dynamic";

export default function EnquiryDashboardPage() {
  return (
    <DashboardCanvas
      eyebrow="Live · Sales"
      title="Enquiry Dashboard"
      subtitle="Incoming enquiries — sources, conversion and follow-ups"
      Icon={Inbox}
    />
  );
}
