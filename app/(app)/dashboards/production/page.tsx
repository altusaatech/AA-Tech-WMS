import Link from "next/link";
import type { Route } from "next";
import { ArrowLeft, Factory, FileText, BadgeCheck, ClipboardCheck, PackageCheck, Timer, TrendingUp, Lightbulb } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { requireUser } from "@/lib/auth/current";
import { db } from "@/lib/db";
import { salesSo, salesGa, salesBom, salesWo } from "@/db/schema";
import { ProductionRecent, type ProductionWo } from "@/components/dashboards/production/production-recent";

export const dynamic = "force-dynamic";

const has = (s: string | null, kw: string) => (s ?? "").toLowerCase().includes(kw);
const monthKey = (d: string | null) => (d ? d.slice(0, 7) : "");

export default async function ProductionDashboardPage() {
  await requireUser();

  let so: (typeof salesSo.$inferSelect)[] = [];
  let ga: (typeof salesGa.$inferSelect)[] = [];
  let bom: (typeof salesBom.$inferSelect)[] = [];
  let wo: (typeof salesWo.$inferSelect)[] = [];
  let partialError = false;
  try {
    [so, ga, bom, wo] = await Promise.all([
      db.select().from(salesSo),
      db.select().from(salesGa),
      db.select().from(salesBom),
      db.select().from(salesWo),
    ]);
  } catch {
    partialError = true;
  }

  const soByNo = new Map(so.map((s) => [s.ourSoNo ?? "", s]));

  // ── KPIs ──
  const gaApproved = ga.filter((g) => has(g.gaStatus, "approv")).length;
  const bomDone = bom.filter((b) => has(b.bomStatus, "complet")).length;
  const dispatched = so.filter((s) => s.actualDispatchDate && s.targetDispatchDate);
  const onTime = dispatched.filter((s) => (s.actualDispatchDate as string) <= (s.targetDispatchDate as string)).length;
  const onTimePct = dispatched.length ? Math.round((onTime / dispatched.length) * 100) : 0;

  // ── funnel ──
  const funnel = [
    { label: "Sales Orders", value: so.length, from: "#0180cf", to: "#0069b3" },
    { label: "GA Approved", value: gaApproved, from: "#0a7d8a", to: "#0069b3" },
    { label: "BOMs Completed", value: bomDone, from: "#4a9616", to: "#3f7a14" },
    { label: "Work Orders", value: wo.length, from: "#63b81e", to: "#4a9616" },
  ];
  const funnelMax = Math.max(1, ...funnel.map((f) => f.value));

  // ── trend: work orders per month ──
  const byMonth = new Map<string, number>();
  for (const w of wo) {
    const k = monthKey(w.workOrderDate);
    if (k) byMonth.set(k, (byMonth.get(k) ?? 0) + 1);
  }
  const trend = Array.from(byMonth.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-8);
  const trendMax = Math.max(1, ...trend.map(([, v]) => v));

  // ── recent work orders (for the interactive table) ──
  const recent: ProductionWo[] = [...wo]
    .sort((a, b) => (b.workOrderDate ?? "").localeCompare(a.workOrderDate ?? ""))
    .slice(0, 8)
    .map((w) => {
      const s = soByNo.get(w.ourSoNo ?? "");
      const onT = !!(w.actualDate && w.targetDate && (w.actualDate as string) <= (w.targetDate as string));
      return {
        workOrderNo: w.workOrderNo ?? "—",
        ourSoNo: w.ourSoNo ?? "—",
        bomNo: w.bomNo ?? "—",
        poNo: s?.poNo ?? "—",
        company: s?.companyName ?? "",
        item: s?.itemNameCode ?? s?.description ?? "",
        boStatus: w.boStatus ?? "—",
        workOrderDate: w.workOrderDate ?? "—",
        targetDate: w.targetDate ?? "—",
        actualDate: w.actualDate ?? "—",
        onTime: onT,
      };
    });

  // ── insights ──
  const insights: string[] = [];
  if (wo.length) insights.push(`${wo.length} work order${wo.length === 1 ? "" : "s"} in the current book.`);
  if (dispatched.length) insights.push(`${onTime} of ${dispatched.length} orders dispatched on time (${onTimePct}%).`);
  if (so.length && gaApproved) insights.push(`${gaApproved} of ${so.length} sales orders cleared GA approval.`);
  if (bomDone) insights.push(`${bomDone} BOM${bomDone === 1 ? "" : "s"} completed and released to production.`);
  if (so.length - wo.length > 0) insights.push(`${so.length - wo.length} order${so.length - wo.length === 1 ? "" : "s"} yet to reach a work order.`);
  if (insights.length === 0) insights.push("No production activity in range yet — seed or add work orders to see insights.");

  return (
    <main className="mx-auto max-w-[1600px] px-8 pb-16 pt-8 max-md:px-4">
      {/* themed header with pattern */}
      <header
        className="relative overflow-hidden rounded-[28px] border border-white/80 px-9 py-7 max-md:px-5 max-md:py-6"
        style={{ background: "linear-gradient(120deg, #e9f3fd 0%, #ffffff 46%, #edf7e3 100%)", boxShadow: "0 28px 64px -38px rgba(15,60,100,0.30), inset 0 1px 0 rgba(255,255,255,0.9)" }}
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.6]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(1,128,207,0.06) 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <Factory aria-hidden className="pointer-events-none absolute -right-6 -top-8 text-[#0180cf]" size={180} strokeWidth={1.2} style={{ opacity: 0.06 }} />
        <div className="relative">
          <Link href={"/dashboards" as Route} className="mb-2 inline-flex h-8 items-center gap-1.5 rounded-lg border border-hairline bg-white px-2.5 text-[12.5px] font-bold text-ink-soft shadow-sm transition-colors hover:bg-surface-soft">
            <ArrowLeft size={14} strokeWidth={2.6} /> Dashboards
          </Link>
          <div className="flex items-center gap-3">
            <span className="inline-flex size-12 items-center justify-center rounded-2xl text-white shadow-lg" style={{ background: "linear-gradient(135deg, #0180cf, #63b81e)", boxShadow: "0 14px 30px -14px #0069b3" }}>
              <Factory size={24} strokeWidth={2.3} />
            </span>
            <div>
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                <span className="relative flex size-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#63b81e] opacity-75" /><span className="relative inline-flex size-1.5 rounded-full bg-[#63b81e]" /></span>
                Live · Production
              </div>
              <h1 className="mt-0.5 text-[26px] font-black tracking-[-0.03em] text-ink-strong" style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}>Production &amp; Delivery</h1>
              <p className="text-[13px] font-medium text-ink-subtle">SO → GA → BOM → Work Order → dispatch</p>
            </div>
          </div>
        </div>
      </header>

      {partialError && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-[13px] font-semibold text-amber-800">Some production data was slow to load — refresh to retry.</div>
      )}

      {/* KPI tiles */}
      <div className="mt-6 grid grid-cols-5 gap-4 max-xl:grid-cols-3 max-sm:grid-cols-2">
        <Kpi label="Sales Orders" value={so.length} Icon={FileText} from="#0180cf" to="#0069b3" />
        <Kpi label="GA Approved" value={gaApproved} Icon={BadgeCheck} from="#0a7d8a" to="#0069b3" />
        <Kpi label="BOMs Completed" value={bomDone} Icon={ClipboardCheck} from="#4a9616" to="#3f7a14" />
        <Kpi label="Work Orders" value={wo.length} Icon={PackageCheck} from="#63b81e" to="#4a9616" />
        <Kpi label="On-time Dispatch" value={onTimePct} suffix="%" Icon={Timer} from="#0069b3" to="#0180cf" />
      </div>

      {/* funnel + trend */}
      <div className="mt-5 grid grid-cols-2 gap-5 max-lg:grid-cols-1">
        <section className="relative overflow-hidden rounded-[22px] border border-hairline bg-surface-card p-5 shadow-sm">
          <h2 className="mb-4 text-[15px] font-black text-ink-strong" style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}>Production Pipeline</h2>
          <div className="space-y-3">
            {funnel.map((f) => (
              <div key={f.label}>
                <div className="mb-1 flex items-center justify-between text-[12.5px] font-semibold text-ink-soft">
                  <span>{f.label}</span>
                  <span className="tabular-nums font-black text-ink-strong">{f.value}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full transition-[width] duration-1000" style={{ width: `${Math.max(4, (f.value / funnelMax) * 100)}%`, background: `linear-gradient(90deg, ${f.from}, ${f.to})` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[22px] border border-hairline bg-surface-card p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-[15px] font-black text-ink-strong" style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}>
            <TrendingUp size={16} className="text-[#0069b3]" /> Work Orders by Month
          </h2>
          {trend.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-ink-subtle">No work-order dates yet.</p>
          ) : (
            <div className="flex h-40 items-end gap-3">
              {trend.map(([m, v]) => (
                <div key={m} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="text-[12px] font-black tabular-nums text-ink-strong">{v}</span>
                  <div className="w-full rounded-t-lg transition-all" style={{ height: `${(v / trendMax) * 100}%`, minHeight: 6, background: "linear-gradient(180deg, #63b81e, #0180cf)" }} />
                  <span className="text-[10.5px] font-semibold text-ink-subtle">{m.slice(5)}/{m.slice(2, 4)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* insights + recent (interactive) */}
      <div className="mt-5 grid grid-cols-3 gap-5 max-lg:grid-cols-1">
        <section className="relative overflow-hidden rounded-[22px] border border-hairline p-5 shadow-sm" style={{ background: "linear-gradient(135deg, #eef6ec, #f4fbf6)" }}>
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.5]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(99,184,30,0.08) 1px, transparent 0)", backgroundSize: "20px 20px" }} />
          <h2 className="relative mb-3 flex items-center gap-2 text-[15px] font-black text-ink-strong" style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}>
            <Lightbulb size={16} className="text-[#3f7a14]" /> Insights
          </h2>
          <ul className="relative space-y-2.5">
            {insights.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-[13px] font-medium text-slate-700">
                <span className="mt-1.5 inline-block size-1.5 shrink-0 rounded-full bg-[#63b81e]" /> {t}
              </li>
            ))}
          </ul>
        </section>
        <div className="col-span-2 max-lg:col-span-1">
          <ProductionRecent rows={recent} />
        </div>
      </div>
    </main>
  );
}

function Kpi({ label, value, suffix, Icon, from, to }: { label: string; value: number; suffix?: string; Icon: LucideIcon; from: string; to: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span aria-hidden className="absolute inset-x-0 top-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${from}, ${to})` }} />
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-slate-400">{label}</span>
        <span className="inline-flex size-7 items-center justify-center rounded-lg text-white shadow" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
          <Icon size={15} strokeWidth={2.4} />
        </span>
      </div>
      <span className="mt-2 block tabular-nums text-slate-900" style={{ fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 900, fontSize: "clamp(24px, 2.4vw, 34px)", letterSpacing: "-0.025em", lineHeight: 1 }}>
        {value}{suffix}
      </span>
    </div>
  );
}
