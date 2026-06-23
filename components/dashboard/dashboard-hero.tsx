"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  ArrowRight,
  Plus,
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
  ListTodo,
  CircleDashed,
  type LucideIcon,
} from "lucide-react";
import { Counter } from "./count-up";

interface Metric {
  label: string;
  value: number;
  icon: LucideIcon;
  from: string;
  to: string;
  emphasis?: boolean;
}

export function DashboardHero({
  firstName,
  total,
  pending,
  done,
  notStarted,
  dueToday,
  overdue,
}: {
  firstName: string;
  total: number;
  pending: number;
  done: number;
  notStarted: number;
  dueToday: number;
  overdue: number;
}) {
  // Compute greeting + date AFTER mount so SSR and client agree (no hydration
  // mismatch from server/local clock differences).
  const [now, setNow] = React.useState<Date | null>(null);
  React.useEffect(() => {
    setNow(new Date());
  }, []);

  const hour = now?.getHours() ?? 9;
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateLabel = now
    ? now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "";

  const completion = total > 0 ? Math.round((done / total) * 100) : 0;

  const metrics: Metric[] = [
    { label: "Total tasks", value: total, icon: ListTodo, from: "#0180cf", to: "#0069b3", emphasis: true },
    { label: "In progress", value: pending, icon: CircleDashed, from: "#f59e0b", to: "#d97706" },
    { label: "Not started", value: notStarted, icon: CalendarClock, from: "#64748b", to: "#475569" },
    { label: "Completed", value: done, icon: CheckCircle2, from: "#63b81e", to: "#3f7a14" },
  ];

  return (
    <section className="mx-auto max-w-[1600px] px-12 max-md:px-4 mt-6">
      <div
        className="relative overflow-hidden rounded-[28px] px-9 py-8 max-md:px-5 max-md:py-6"
        style={{
          background: "linear-gradient(120deg, #06243f 0%, #0a1c33 46%, #07372c 100%)",
          boxShadow: "0 30px 70px -34px rgba(3,30,55,0.75), 0 1px 0 rgba(255,255,255,0.06) inset",
        }}
      >
        {/* ambient glows */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-28 h-[360px] w-[360px] rounded-full" style={{ background: "radial-gradient(circle, rgba(1,128,207,0.42), transparent 68%)", filter: "blur(20px)" }} />
          <div className="absolute -right-20 top-1/4 h-[380px] w-[380px] rounded-full" style={{ background: "radial-gradient(circle, rgba(99,184,30,0.30), transparent 68%)", filter: "blur(26px)" }} />
          <div
            className="absolute inset-0 opacity-[0.5]"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)", backgroundSize: "30px 30px" }}
          />
        </div>

        {/* top row: greeting + actions */}
        <div className="relative flex items-start justify-between gap-6 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">
              <span className="inline-block size-1.5 rounded-full bg-[#63b81e] shadow-[0_0_10px_#63b81e]" />
              {dateLabel || "Your workspace"}
            </div>
            <h1
              className="mt-2 text-white"
              style={{ fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 900, fontSize: 34, lineHeight: 1.04, letterSpacing: "-0.03em" }}
            >
              {greeting}, {firstName}.
            </h1>
            <p className="mt-2 text-[14px] text-white/65 max-w-xl">
              {overdue > 0 ? (
                <>You have <b className="text-white">{overdue}</b> overdue and <b className="text-white">{dueToday}</b> due today. Let&apos;s clear them.</>
              ) : dueToday > 0 ? (
                <>You have <b className="text-white">{dueToday}</b> task{dueToday === 1 ? "" : "s"} due today. You&apos;re on top of it.</>
              ) : (
                <>Nothing overdue — a clean board. Here&apos;s the operation at a glance.</>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href={"/tasks/agenda" as Route}
              className="group inline-flex h-11 items-center gap-2 rounded-xl bg-white/10 px-4 text-[13.5px] font-bold text-white ring-1 ring-white/20 backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white/15"
            >
              Open My Day
              <ArrowRight size={15} strokeWidth={2.6} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href={"/tasks/new" as Route}
              className="group inline-flex h-11 items-center gap-2 rounded-xl px-4 text-[13.5px] font-extrabold text-white shadow-lg transition-all hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg, #63b81e, #0180cf)", boxShadow: "0 14px 30px -12px rgba(1,128,207,0.7)" }}
            >
              <Plus size={16} strokeWidth={2.8} /> New task
            </Link>
          </div>
        </div>

        {/* metric strip */}
        <div className="relative mt-7 grid grid-cols-4 gap-3 max-lg:grid-cols-2">
          {metrics.map((m) => (
            <HeroMetric key={m.label} metric={m} />
          ))}
        </div>

        {/* completion bar */}
        <div className="relative mt-5">
          <div className="flex items-center justify-between text-[12px] font-semibold text-white/60">
            <span className="inline-flex items-center gap-1.5">
              {overdue > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-[11px] font-bold text-red-200 ring-1 ring-red-400/30">
                  <AlertTriangle size={11} /> {overdue} overdue
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold text-white/80 ring-1 ring-white/15">
                <CalendarClock size={11} /> {dueToday} due today
              </span>
            </span>
            <span className="tabular-nums text-white/80">{completion}% complete</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-[width] duration-1000 ease-out"
              style={{ width: `${completion}%`, background: "linear-gradient(90deg, #63b81e, #0180cf)" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroMetric({ metric }: { metric: Metric }) {
  const Icon = metric.icon;
  return (
    <div
      className="group relative overflow-hidden rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/10 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.11]"
    >
      <span aria-hidden className="absolute inset-x-0 top-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${metric.from}, ${metric.to})` }} />
      {/* shine */}
      <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1/2 -translate-x-[200%] -skew-x-12 bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[260%]" />
      <div className="relative flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/55">{metric.label}</span>
        <span className="inline-flex size-7 items-center justify-center rounded-lg text-white shadow" style={{ background: `linear-gradient(135deg, ${metric.from}, ${metric.to})` }}>
          <Icon size={15} strokeWidth={2.4} />
        </span>
      </div>
      <Counter
        value={metric.value}
        className="relative mt-2 block tabular-nums text-white"
        style={{ fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 900, fontSize: 32, letterSpacing: "-0.02em", lineHeight: 1 }}
      />
    </div>
  );
}
