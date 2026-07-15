"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { Inbox, FileText, FileCheck2, Factory, HeartPulse, LayoutGrid, type LucideIcon } from "lucide-react";

interface Item {
  href: string;
  label: string;
  Icon: LucideIcon;
}

const ITEMS: Item[] = [
  { href: "/dashboards/enquiry", label: "Enquiry Dashboard", Icon: Inbox },
  { href: "/dashboards/quotation", label: "Quotation Dashboard", Icon: FileText },
  { href: "/dashboards/sales-order", label: "Sales Order Dashboard", Icon: FileCheck2 },
  { href: "/dashboards/production", label: "Production Dashboard", Icon: Factory },
  { href: "/dashboards/hygiene", label: "Hygiene Dashboard", Icon: HeartPulse },
];

// Exact header nav gradient — the green→blue mix used across the app.
const GRAD = "linear-gradient(135deg, #63b81e, #0180cf)";

export function DashboardsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[264px] shrink-0 max-md:w-full">
      <div className="sticky top-[84px] rounded-[24px] border border-slate-200 bg-white/80 p-3.5 shadow-sm backdrop-blur max-md:static">
        <div className="mb-3 flex items-center gap-2.5 px-1.5 pt-0.5">
          <span className="inline-flex size-9 items-center justify-center rounded-xl text-white shadow" style={{ background: GRAD }}>
            <LayoutGrid size={17} strokeWidth={2.3} />
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
                {/* sheen sweep on the active button */}
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
      </div>
    </aside>
  );
}
