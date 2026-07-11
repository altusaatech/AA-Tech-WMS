import Link from "next/link";
import type { Route } from "next";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { requireUser } from "@/lib/auth/current";
import { loadSalesDashboard, defaultSalesRange, type SalesDashboardFilters } from "@/lib/queries/sales-dashboard";
import { SalesFilters } from "@/components/dashboards/sales/sales-filters";
import { SalesKpis } from "@/components/dashboards/sales/sales-kpis";
import { RevenueTrend } from "@/components/dashboards/sales/revenue-trend";
import { QuoteStatusDonut } from "@/components/dashboards/sales/quote-status-donut";
import { PipelineFunnel } from "@/components/dashboards/sales/pipeline-funnel";
import { TopCompanies } from "@/components/dashboards/sales/top-companies";
import { DispatchPerformance } from "@/components/dashboards/sales/dispatch-performance";
import { RecentQuotesTable } from "@/components/dashboards/sales/recent-quotes-table";

export const dynamic = "force-dynamic";

function pickStr(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : undefined;
}

export default async function SalesDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireUser();
  const sp = await searchParams;

  const def = defaultSalesRange();
  const filters: SalesDashboardFilters = {
    start: pickStr(sp.start) ?? def.start,
    end: pickStr(sp.end) ?? def.end,
  };

  const data = await loadSalesDashboard(filters);

  return (
    <main className="mx-auto max-w-[1600px] px-8 pb-16 pt-8 max-md:px-4">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href={"/dashboards" as Route}
            className="mb-2 inline-flex h-8 items-center gap-1.5 rounded-lg border border-hairline bg-surface-card px-2.5 text-[12.5px] font-bold text-ink-soft shadow-sm transition-colors hover:bg-surface-soft"
          >
            <ArrowLeft size={14} strokeWidth={2.6} /> Dashboards
          </Link>
          <div className="flex items-center gap-3">
            <span
              className="inline-flex size-11 items-center justify-center rounded-2xl text-white shadow"
              style={{ background: "linear-gradient(135deg, #0180cf, #63b81e)", boxShadow: "0 12px 26px -12px #0069b3" }}
            >
              <TrendingUp size={22} strokeWidth={2.3} />
            </span>
            <div>
              <h1
                className="text-[24px] font-black tracking-[-0.02em] text-ink-strong"
                style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}
              >
                Sales &amp; Quotation Pipeline
              </h1>
              <p className="text-[13px] font-medium text-ink-subtle">
                Enquiry → quote → order → production → invoice
              </p>
            </div>
          </div>
        </div>
        <SalesFilters start={filters.start} end={filters.end} />
      </div>

      {/* KPI row */}
      <div className="mt-6">
        <SalesKpis kpis={data.kpis} />
      </div>

      {/* trend + status */}
      <div className="mt-5 grid grid-cols-3 gap-5 max-lg:grid-cols-1">
        <div className="col-span-2 max-lg:col-span-1">
          <RevenueTrend data={data.trend} />
        </div>
        <QuoteStatusDonut data={data.statusDist} />
      </div>

      {/* funnel + top customers */}
      <div className="mt-5 grid grid-cols-2 gap-5 max-lg:grid-cols-1">
        <PipelineFunnel funnel={data.funnel} />
        <TopCompanies rows={data.topCompanies} />
      </div>

      {/* dispatch + recent quotes */}
      <div className="mt-5 grid grid-cols-3 gap-5 max-lg:grid-cols-1">
        <DispatchPerformance dispatch={data.dispatch} />
        <div className="col-span-2 max-lg:col-span-1">
          <RecentQuotesTable rows={data.recent} />
        </div>
      </div>
    </main>
  );
}
