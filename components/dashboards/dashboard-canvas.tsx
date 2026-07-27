import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { DashboardsSidebar } from "@/components/dashboards/dashboards-sidebar";

/** Themed shell for a single dashboard — green→blue gradient header with the
 *  dotted pattern, matching the app's nav buttons. Body is passed in. */
export function DashboardCanvas({
  title,
  subtitle,
  eyebrow,
  Icon,
  children,
}: {
  title: string;
  subtitle: string;
  eyebrow: string;
  Icon: LucideIcon;
  children?: ReactNode;
}) {
  return (
    <div>
      <header
        className="relative overflow-hidden rounded-[18px] border border-white/80 px-5 py-3 max-md:px-4"
        style={{
          background: "linear-gradient(120deg, #e9f3fd 0%, #ffffff 46%, #edf7e3 100%)",
          boxShadow: "0 26px 60px -38px rgba(15,60,100,0.30), inset 0 1px 0 rgba(255,255,255,0.9)",
        }}
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.6]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(1,128,207,0.06) 1px, transparent 0)", backgroundSize: "26px 26px" }} />
        <Icon aria-hidden className="pointer-events-none absolute -right-5 -top-7 text-[#0180cf]" size={160} strokeWidth={1.2} style={{ opacity: 0.06 }} />
        <div className="relative flex items-center gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-xl text-white shadow-lg" style={{ background: "linear-gradient(135deg, #63b81e, #0180cf)", boxShadow: "0 14px 30px -14px #0069b3" }}>
            <Icon size={20} strokeWidth={2.3} />
          </span>
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              <span className="relative flex size-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#63b81e] opacity-75" /><span className="relative inline-flex size-1.5 rounded-full bg-[#63b81e]" /></span>
              {eyebrow}
            </div>
            <h1 className="text-[20px] font-black leading-tight tracking-[-0.03em] text-slate-800" style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}>{title}</h1>
            {subtitle && <p className="text-[12px] font-medium text-slate-500">{subtitle}</p>}
          </div>
        </div>
      </header>

      {/* Header spans full width above; the left panel + body sit below it. */}
      <div className="mt-1.5 flex items-start gap-5 max-md:flex-col">
        <DashboardsSidebar />
        <main className="min-w-0 flex-1">
          {children ?? (
            <div
              className="relative flex flex-col items-center justify-center overflow-hidden rounded-[24px] border-2 border-dashed border-[#0180cf]/25 px-6 py-16 text-center"
              style={{ background: "linear-gradient(135deg, #eef6ec, #f4fbf6)" }}
            >
              <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.5]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(1,128,207,0.06) 1px, transparent 0)", backgroundSize: "22px 22px" }} />
              <span className="relative inline-flex size-14 items-center justify-center rounded-2xl text-white shadow-lg" style={{ background: "linear-gradient(135deg, #63b81e, #0180cf)" }}>
                <Sparkles size={26} strokeWidth={2.2} />
              </span>
              <p className="relative mt-4 text-[16px] font-black text-slate-700">Ready to build</p>
              <p className="relative mt-1 max-w-md text-[13.5px] text-slate-500">
                Tell me the numbers, charts and lists you want on the {title} — I&apos;ll build it here in this exact theme.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
