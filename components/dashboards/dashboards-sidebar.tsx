"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { LayoutGrid, LayoutDashboard, Gauge, BadgeCheck, ClipboardList, HeartPulse, type LucideIcon } from "lucide-react";

interface Item {
  href: string;
  label: string;
  Icon: LucideIcon;
}

// Only the dashboards created for this build remain.
const ITEMS: Item[] = [
  { href: "/dashboards/quotation", label: "Quote Status", Icon: LayoutDashboard },
  { href: "/dashboards/dashboard-2", label: "Sales Order Status", Icon: Gauge },
  { href: "/dashboards/dashboard-3", label: "GA Approval Status", Icon: BadgeCheck },
  { href: "/dashboards/dashboard-4", label: "BOM Status", Icon: ClipboardList },
  { href: "/dashboards/hygiene", label: "Hygiene", Icon: HeartPulse },
];

// Exact header nav gradient — the green→blue mix used across the app.
const GRAD = "linear-gradient(135deg, #63b81e, #0180cf)";

export function DashboardsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-[84px] w-[264px] shrink-0 self-start max-md:static max-md:w-full">
      <div className="no-scrollbar flex max-h-[calc(100dvh-104px)] flex-col gap-3.5 overflow-y-auto rounded-[24px] border border-slate-200 bg-white/85 p-3.5 shadow-[0_20px_50px_-30px_rgba(1,128,207,0.4)] backdrop-blur max-md:max-h-none max-md:overflow-visible">
        <div className="mb-1 flex items-center gap-2.5 px-1.5 pt-0.5">
          <span className="relative inline-flex size-9 items-center justify-center overflow-hidden rounded-xl text-white shadow" style={{ background: GRAD }}>
            <span aria-hidden className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent" />
            <LayoutGrid size={17} strokeWidth={2.3} className="relative" />
          </span>
          <span className="text-[13px] font-black uppercase tracking-[0.1em] text-slate-500">Dashboards</span>
        </div>

        <nav className="flex flex-col gap-2 max-md:flex-row max-md:flex-wrap">
          {ITEMS.map((it) => {
            const active = pathname.startsWith(it.href);
            const Icon = it.Icon;
            return (
              <Link
                key={it.href}
                href={it.href as Route}
                aria-current={active ? "page" : undefined}
                className={`group relative inline-flex h-12 items-center gap-2.5 overflow-hidden rounded-2xl px-4 text-[14px] font-extrabold transition-all max-md:flex-1 ${
                  active ? "text-white" : "text-slate-600 hover:-translate-y-0.5 hover:bg-slate-100/80"
                }`}
                style={active ? { background: GRAD, boxShadow: "0 14px 30px -12px rgba(1,128,207,0.6)" } : undefined}
              >
                {active && (
                  <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1/2 -translate-x-[180%] -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[240%]" />
                )}
                <span
                  className="relative inline-flex size-7 shrink-0 items-center justify-center rounded-lg"
                  style={active ? { background: "rgba(255,255,255,0.22)" } : { background: "rgba(1,128,207,0.10)" }}
                >
                  <Icon size={16} strokeWidth={2.5} className={active ? "text-white" : "text-[#0069b3]"} />
                </span>
                <span className="relative truncate">{it.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Powered by Altus — moved up directly under the nav */}
        <div className="mt-1 flex flex-col items-center gap-1 border-t border-slate-100 pt-3 max-md:hidden">
          <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">Powered By</span>
          <img src="/altus-corp-logo.png?v=2" alt="Altus Corp" className="h-8 w-auto opacity-90" />
        </div>
      </div>
    </aside>
  );
}
