import Link from "next/link";
import type { Route } from "next";
import { LayoutDashboard, Gauge, Inbox, FileText, FileCheck2, Factory, HeartPulse, ArrowRight, type LucideIcon } from "lucide-react";
import { DashboardCanvas } from "@/components/dashboards/dashboard-canvas";

export const dynamic = "force-dynamic";

interface DashCard {
  href: string;
  title: string;
  desc: string;
  Icon: LucideIcon;
  featured?: boolean;
}

// New Dashboard first (featured), then the rest.
const CARDS: DashCard[] = [
  { href: "/dashboards/dashboard-1", title: "New Dashboard", desc: "Quote Status — enquiries, conversion, pending quotes & data hygiene", Icon: LayoutDashboard, featured: true },
  { href: "/dashboards/dashboard-2", title: "Dashboard 2", desc: "Sales Order Status — aging, target vs actual, top customers & leaderboard", Icon: Gauge },
  { href: "/dashboards/enquiry", title: "Enquiry Dashboard", desc: "Enquiry intake, sources & response funnel", Icon: Inbox },
  { href: "/dashboards/quotation", title: "Quotation Dashboard", desc: "Enquiry → quotation → PI → approval lifecycle", Icon: FileText },
  { href: "/dashboards/sales-order", title: "Sales Order Dashboard", desc: "PO → sales order → dispatch pipeline", Icon: FileCheck2 },
  { href: "/dashboards/production", title: "Production Dashboard", desc: "BOM, work orders & production floor", Icon: Factory },
  { href: "/dashboards/hygiene", title: "Hygiene Dashboard", desc: "Register data completeness across the pipeline", Icon: HeartPulse },
];

export default function DashboardsHub() {
  return (
    <DashboardCanvas eyebrow="Live · Analytics" title="Dashboards" subtitle="Pick a dashboard to open" Icon={LayoutDashboard}>
      <div className="mt-6 grid grid-cols-3 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
        {CARDS.map((c) => (
          <Link
            key={c.href}
            href={c.href as Route}
            className={`group relative flex flex-col overflow-hidden rounded-[22px] border border-white/25 p-5 text-white shadow-[0_16px_34px_-18px_rgba(1,128,207,0.55)] transition-all duration-300 hover:-translate-y-1.5 ${c.featured ? "sm:col-span-2 lg:col-span-1 ring-2 ring-white/50" : ""}`}
            style={{ background: "linear-gradient(135deg, #63b81e, #0180cf)" }}
          >
            <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0) 46%)" }} />
            <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1/2 -translate-x-[200%] -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[260%]" />
            <c.Icon aria-hidden className="pointer-events-none absolute -bottom-5 -right-4 text-white" size={104} strokeWidth={1.3} style={{ opacity: 0.1 }} />

            <div className="relative flex items-start gap-3">
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-white ring-1 ring-white/30 transition-transform group-hover:scale-105">
                <c.Icon size={22} strokeWidth={2.2} />
              </span>
              <div className="min-w-0 flex-1">
                {c.featured && <div className="text-[10px] font-black uppercase tracking-[0.14em] text-white/70">Featured</div>}
                <h3 className="text-[16px] font-black leading-tight text-white">{c.title}</h3>
              </div>
            </div>
            <p className="relative mt-2 text-[12.5px] leading-snug text-white/85">{c.desc}</p>
            <span className="relative mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-extrabold text-white">
              Open <ArrowRight size={14} strokeWidth={2.7} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </DashboardCanvas>
  );
}
