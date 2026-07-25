import type { ReactNode } from "react";

// The DashboardCanvas now owns the shell: a full-width header on top, with the
// left panel and body below it. The layout is just a centered container.
export default function DashboardsLayout({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-[1600px] px-6 pb-8 pt-3 max-md:px-4">{children}</div>;
}
