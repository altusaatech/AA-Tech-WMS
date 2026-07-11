import type { Route } from "next";
import { count } from "drizzle-orm";
import { Compass, TrendingUp, Wallet, CalendarCheck, IndianRupee, FileSpreadsheet } from "lucide-react";
import { requireUser } from "@/lib/auth/current";
import { db } from "@/lib/db";
import { salesQuotes } from "@/db/schema";
import { PageHero } from "@/components/layout/page-hero";
import { HubCard } from "@/components/dashboards/hub-card";

export const dynamic = "force-dynamic";

export default async function DashboardsHubPage() {
  await requireUser();

  let quoteCount = 0;
  try {
    const quoteRows = await db.select({ n: count() }).from(salesQuotes);
    quoteCount = Number(quoteRows[0]?.n ?? 0);
  } catch {
    quoteCount = 0;
  }

  return (
    <main className="mx-auto max-w-[1280px] px-8 pb-16 pt-8 max-md:px-4">
      <PageHero
        eyebrow="Analytics"
        title="Dashboards"
        subtitle="Live operational insight across the business — pipeline, receivables, workforce and payroll."
        Icon={Compass}
        stats={[
          { label: "Quotes", value: quoteCount, icon: FileSpreadsheet, from: "#0180cf", to: "#0069b3" },
          { label: "Dashboards", value: 1, icon: Compass, from: "#63b81e", to: "#3f7a14" },
        ]}
      />

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
          title="Outstanding / Receivables"
          desc="Collections & aging — outstanding value, overdue, upcoming installments."
          Icon={Wallet}
          from="#0069b3"
          to="#0180cf"
          soft="linear-gradient(135deg, #e9f1f9, #f4f9fe)"
          ring="rgba(0,105,179,0.20)"
          cta="Coming soon"
          disabled
        />
        <HubCard
          title="Attendance / Workforce"
          desc="Presence, punctuality, leave and department breakdown across the team."
          Icon={CalendarCheck}
          from="#7c3aed"
          to="#a855f7"
          soft="linear-gradient(135deg, #f3eefc, #faf7ff)"
          ring="rgba(124,58,237,0.18)"
          cta="Coming soon"
          disabled
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
