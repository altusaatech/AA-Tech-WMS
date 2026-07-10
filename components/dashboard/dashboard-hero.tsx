"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  ArrowRight,
  Plus,
  CalendarClock,
  AlertTriangle,
} from "lucide-react";

export function DashboardHero({
  firstName,
  total,
  done,
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
  const [now, setNow] = React.useState<Date | null>(null);
  React.useEffect(() => {
    setNow(new Date());
  }, []);

  const hour = now?.getHours() ?? 9;
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const completion = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <section className="mx-auto max-w-[1600px] px-12 max-md:px-4 mt-6">
      <div
        className="relative overflow-hidden rounded-[26px] border border-white/80 px-8 py-6 max-md:px-5 max-md:py-6"
        style={{
          background: "linear-gradient(120deg, #e9f3fd 0%, #ffffff 46%, #edf7e3 100%)",
          boxShadow: "0 30px 70px -38px rgba(15,60,100,0.30), inset 0 1px 0 rgba(255,255,255,0.9)",
        }}
      >
        {/* ambient layers */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.6]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(1,128,207,0.06) 1px, transparent 0)", backgroundSize: "28px 28px" }} />
          <div className="hero-anim absolute -left-28 -top-32 h-[420px] w-[420px] rounded-full" style={{ background: "radial-gradient(circle, rgba(1,128,207,0.16), transparent 66%)", filter: "blur(30px)", animation: "heroFloat1 16s ease-in-out infinite" }} />
          <div className="hero-anim absolute right-[-7rem] top-[18%] h-[440px] w-[440px] rounded-full" style={{ background: "radial-gradient(circle, rgba(99,184,30,0.15), transparent 66%)", filter: "blur(34px)", animation: "heroFloat2 20s ease-in-out infinite" }} />
          <img src="/logo-mark.png" alt="" className="absolute -right-6 -top-10 h-[240px] w-auto opacity-[0.05] max-md:hidden" />
        </div>

        {/* top row: greeting + actions */}
        <div className="relative flex items-start justify-between gap-6 flex-wrap">
          <div className="min-w-0">
            <h1
              className="text-slate-900"
              style={{ fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 900, fontSize: "clamp(28px, 3.4vw, 42px)", lineHeight: 1.02, letterSpacing: "-0.035em" }}
            >
              {greeting}, {firstName}.
            </h1>
            <p className="mt-2 text-[14px] text-slate-500 max-w-xl">
              {overdue > 0 ? (
                <>You have <b className="text-slate-800">{overdue}</b> overdue and <b className="text-slate-800">{dueToday}</b> due today. Let&apos;s clear them.</>
              ) : dueToday > 0 ? (
                <>You have <b className="text-slate-800">{dueToday}</b> task{dueToday === 1 ? "" : "s"} due today. You&apos;re on top of it.</>
              ) : (
                <>Nothing overdue — a clean board. Here&apos;s the operation at a glance.</>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href={"/tasks/agenda" as Route}
              className="group inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[13.5px] font-bold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-50"
            >
              Open My Day
              <ArrowRight size={15} strokeWidth={2.6} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href={"/tasks/new" as Route}
              className="group inline-flex h-11 items-center gap-2 rounded-xl px-4 text-[13.5px] font-extrabold text-white shadow-lg transition-all hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg, #63b81e, #0180cf)", boxShadow: "0 14px 30px -14px rgba(1,128,207,0.6)" }}
            >
              <Plus size={16} strokeWidth={2.8} /> New task
            </Link>
          </div>
        </div>

        {/* completion bar */}
        <div className="relative mt-5">
          <div className="flex items-center justify-between text-[12px] font-semibold text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              {overdue > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600 ring-1 ring-red-200">
                  <AlertTriangle size={11} /> {overdue} overdue
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200">
                <CalendarClock size={11} /> {dueToday} due today
              </span>
            </span>
            <span className="tabular-nums text-slate-600">{completion}% complete</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
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
