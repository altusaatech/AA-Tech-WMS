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
        className="relative overflow-hidden rounded-[30px] px-11 py-10 max-md:px-5 max-md:py-7"
        style={{
          background: "linear-gradient(125deg, #04203a 0%, #061a30 44%, #06352b 100%)",
          boxShadow:
            "0 40px 90px -38px rgba(3,30,55,0.85), 0 0 0 1px rgba(255,255,255,0.05) inset, 0 1px 0 rgba(255,255,255,0.08) inset",
        }}
      >
        {/* ambient + motion layers */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* rotating aurora wash */}
          <div
            className="hero-anim absolute left-1/2 top-1/2 h-[180%] w-[180%] -translate-x-1/2 -translate-y-1/2 opacity-[0.55]"
            style={{
              background:
                "conic-gradient(from 0deg at 50% 50%, rgba(1,128,207,0.30), rgba(99,184,30,0.22), rgba(0,105,179,0.30), rgba(20,184,166,0.20), rgba(1,128,207,0.30))",
              filter: "blur(60px)",
              mixBlendMode: "screen",
              animation: "heroAurora 42s linear infinite",
            }}
          />
          {/* drifting glow blobs */}
          <div
            className="hero-anim absolute -left-28 -top-32 h-[420px] w-[420px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(1,128,207,0.55), transparent 66%)", filter: "blur(26px)", animation: "heroFloat1 16s ease-in-out infinite" }}
          />
          <div
            className="hero-anim absolute right-[-7rem] top-[18%] h-[440px] w-[440px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(99,184,30,0.42), transparent 66%)", filter: "blur(32px)", animation: "heroFloat2 20s ease-in-out infinite" }}
          />
          {/* dotted grid */}
          <div
            className="absolute inset-0 opacity-[0.5]"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.07) 1px, transparent 0)", backgroundSize: "30px 30px" }}
          />
          {/* periodic shimmer sweep */}
          <div
            className="hero-anim absolute inset-y-0 left-0 w-1/3"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent)", animation: "heroShimmer 9s ease-in-out infinite" }}
          />
          {/* giant faint brand mark */}
          <img
            src="/logo-mark.png"
            alt=""
            className="absolute -right-6 -top-10 h-[260px] w-auto opacity-[0.06] max-md:hidden"
            style={{ filter: "brightness(0) invert(1)" }}
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
              style={{ fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 900, fontSize: "clamp(28px, 3.4vw, 42px)", lineHeight: 1.02, letterSpacing: "-0.035em" }}
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
        className="relative mt-2.5 block tabular-nums text-white"
        style={{ fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 900, fontSize: "clamp(28px, 2.8vw, 38px)", letterSpacing: "-0.025em", lineHeight: 1 }}
      />
    </div>
  );
}
