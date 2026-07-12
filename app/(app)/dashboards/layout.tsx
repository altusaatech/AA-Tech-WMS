import type { ReactNode } from "react";
import { DashboardsSidebar } from "@/components/dashboards/dashboards-sidebar";

export default function DashboardsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-[1600px] items-start gap-6 px-6 pb-16 pt-8 max-md:flex-col max-md:px-4">
      <DashboardsSidebar />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
