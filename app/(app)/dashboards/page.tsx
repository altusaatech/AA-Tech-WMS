import type { Route } from "next";
import { count } from "drizzle-orm";
import { Compass, TrendingUp, Factory, CalendarCheck, IndianRupee, FileSpreadsheet } from "lucide-react";
import { requireUser } from "@/lib/auth/current";
import { db } from "@/lib/db";
import { salesQuotes, salesWo, employees } from "@/db/schema";
import type { LucideIcon } from "lucide-react";
import { HubCard } from "@/components/dashboards/hub-card";

export const dynamic = "force-dynamic";

export default async function DashboardsHubPage() {
  await requireUser();

  let quoteCount = 0;
  let woCount = 0;
  let headcount = 0;
  try {
    const [quoteRows, woRows, empRows] = await Promise.all([
      db.select({ n: count() }).from(salesQuotes),
      db.select({ n: count() }).from(salesWo),
      db.select({ n: count() }).from(employees),
    ]);
    quoteCount = Number(quoteRows[0]?.n ?? 0);
    woCount = Number(woRows[0]?.n ?? 0);
    headcount = Number(empRows[0]?.n ?? 0);
  } catch {
    quoteCount = 0;
    woCount = 0;
    headcount = 0;
  }

  return (
    <main className="mx-auto max-w-[1280px] px-8 pb-16 pt-8 max-md:px-4">
      {/* Header — rendered inline (server-side). PageHero is a Client Component,
          so passing it lucide icon *functions* as props across the RSC boundary
          would throw; here we render the icons directly instead. */}
      <header
        className="relative overflow-hidden rounded-[28px] border border-white/80 px-9 py-8 max-md:px-5 max-md:py-6"
        style={{
          background: "linear-gradient(120deg, #e9f3fd 0%, #ffffff 46%, #edf7e3 100%)",
          boxShadow: "0 28px 64px -38px rgba(15,60,100,0.30), inset 0 1px 0 rgba(255,255,255,0.9)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.6]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(1,128,207,0.06) 1px, transparent 0)", backgroundSize: "28px 28px" }}
        />
        <div className="relative flex items-start gap-4">
          <span
            className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg max-md:size-12"
            style={{ background: "linear-gradient(135deg, #0180cf, #63b81e)", boxShadow: "0 14px 30px -14px rgba(1,128,207,0.55)" }}
          >
            <Compass size={26} strokeWidth={2.3} />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
              <span className="inline-block size-1.5 rounded-full bg-[#63b81e]" /> Analytics
            </div>
            <h1
              className="mt-1.5"
              style={{
                fontFamily: "var(--font-display), system-ui, sans-serif",
                fontWeight: 900,
                fontSize: "clamp(26px, 3.1vw, 38px)",
                letterSpacing: "-0.035em",
                lineHeight: 1.03,
                width: "fit-content",
                background: "linear-gradient(95deg, #0069b3 0%, #0180cf 42%, #4e9e2e 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                WebkitTextFillColor: "transparent",
              }}
            >
              Dashboards
            </h1>
            <p className="mt-2 max-w-2xl text-[14px] text-slate-500">
              Live operational insight across the business — pipeline, receivables, workforce and payroll.
            </p>
          </div>
        </div>
        <div className="relative mt-7 grid gap-3" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
          <HubStat label="Quotes" value={quoteCount} Icon={FileSpreadsheet} from="#0180cf" to="#0069b3" />
          <HubStat label="Dashboards" value={3} Icon={Compass} from="#63b81e" to="#3f7a14" />
        </div>
      </header>

      <div className="mt-8 grid grid-cols-2 gap-6 max-md:grid-cols-1">
        <HubCard
          title="Sales & Quotation Pipeline"
          desc="Enquiry → quote → order → production → invoice. Win rate, order book, trends."
          Icon={TrendingUp}
          from="#0180cf"
          to="#63b81e"
          soft="linear-gradient(135deg, #eef6ec, #f4fbf6)"
          ring="rgba(1,128,207,0.24)"
          count={quoteCount}
          sub={quoteCount === 1 ? "quote" : "quotes"}
          cta="Open dashboard"
          href={"/dashboards/sales" as Route}
        />
        <HubCard
          title="Production & Delivery"
          desc="SO → GA → BOM → Work Order → dispatch. Order book, on-time delivery & throughput."
          Icon={Factory}
          from="#0069b3"
          to="#0180cf"
          soft="linear-gradient(135deg, #e9f1f9, #f4f9fe)"
          ring="rgba(0,105,179,0.20)"
          count={woCount}
          sub={woCount === 1 ? "work order" : "work orders"}
          cta="Open dashboard"
          href={"/dashboards/production" as Route}
        />
        <HubCard
          title="Attendance / Workforce"
          desc="Presence, punctuality, leave and department breakdown across the team."
          Icon={CalendarCheck}
          from="#7c3aed"
          to="#a855f7"
          soft="linear-gradient(135deg, #f3eefc, #faf7ff)"
          ring="rgba(124,58,237,0.18)"
          count={headcount}
          sub={headcount === 1 ? "team member" : "team members"}
          cta="Open dashboard"
          href={"/dashboards/attendance" as Route}
        />
        <HubCard
          title="Salary & Incentives"
          desc="Payroll trend, advances outstanding and incentive payouts by project."
          Icon={IndianRupee}
          from="#0f766e"
          to="#14b8a6"
          soft="linear-gradient(135deg, #e8f6f3, #f2fbf9)"
          ring="rgba(15,118,110,0.18)"
          cta="Coming soon"
          disabled
        />
      </div>
    </main>
  );
}

/** Server-rendered stat tile for the hub header (icon rendered directly, never
 *  passed across a Server→Client boundary). */
function HubStat({ label, value, Icon, from, to }: { label: string; value: number; Icon: LucideIcon; from: string; to: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span aria-hidden className="absolute inset-x-0 top-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${from}, ${to})` }} />
      <div className="relative flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">{label}</span>
        <span className="inline-flex size-7 items-center justify-center rounded-lg text-white shadow" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
          <Icon size={15} strokeWidth={2.4} />
        </span>
      </div>
      <span
        className="relative mt-2.5 block tabular-nums text-slate-900"
        style={{ fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 900, fontSize: "clamp(26px, 2.6vw, 36px)", letterSpacing: "-0.025em", lineHeight: 1 }}
      >
        {value}
      </span>
    </div>
  );
}
