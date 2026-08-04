"use client";

import Link from "next/link";
import type { Route } from "next";
import { Crown, Inbox, Activity, Users, Flame, Gauge } from "lucide-react";
import type { TopPerformer } from "@/lib/types";
import { EmployeeAvatar } from "@/components/ui/employee-avatar";

/* ── main section — compact leaderboard, no spotlight banner ─────────── */

export function TopPerformersSection({ performers }: { performers: TopPerformer[] }) {
  const list = performers.slice(0, 10);
  const maxDone = Math.max(1, ...list.map((p) => p.doneCount));
  const teamTotal = performers.reduce((n, p) => n + p.doneCount, 0);
  const topShare = teamTotal > 0 && list[0] ? Math.round((list[0].doneCount / teamTotal) * 100) : 0;

  return (
    <section
      className="premium-card rounded-section bg-surface-card border border-hairline p-5 max-md:p-4 flex flex-col"
      style={{ opacity: 0, animation: "fadeUp 500ms ease-out 500ms forwards" }}
    >
      <header className="mb-4 flex items-center gap-2.5">
        <span
          aria-hidden
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl text-white shadow"
          style={{ background: "linear-gradient(135deg, #0180cf, #63b81e)" }}
        >
          <Gauge size={18} strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-black tracking-[-0.01em] text-ink-strong">Performance</h2>
          <p className="truncate text-[12px] text-ink-subtle">Tasks completed this period</p>
        </div>
      </header>

      {list.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* one-line team stats */}
          <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 rounded-xl border border-hairline bg-surface-soft px-3.5 py-2">
            <Stat icon={Flame} label="Completed" value={teamTotal} />
            <Stat icon={Users} label="Contributors" value={performers.length} />
            <Stat icon={Activity} label="Top share" value={`${topShare}%`} />
          </div>

          {/* leaderboard — champion is simply row 1 with a crown */}
          <ol className="flex flex-col gap-1">
            {list.map((p, i) => (
              <li key={p.employeeId}>
                <Link
                  href={`/tasks?initiator=${p.employeeId}` as Route}
                  className="leader-row group flex cursor-pointer items-center gap-2.5 rounded-chip border border-transparent px-2.5 py-1.5 transition-all hover:border-hairline"
                  style={{ background: "var(--color-surface-soft)" }}
                >
                  <span
                    className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[10.5px] font-bold tabular-nums text-ink-muted"
                    style={{ background: "var(--color-surface-card)", border: "1px solid var(--color-hairline)" }}
                  >
                    {p.rank}
                  </span>
                  <EmployeeAvatar name={p.employeeName} size="sm" />
                  <span className="w-32 shrink-0 truncate text-[13px] font-bold text-ink-strong max-md:w-24">
                    {p.employeeName}
                  </span>
                  {i === 0 && <Crown size={13} strokeWidth={2.4} className="shrink-0 text-[#F59E0B]" fill="currentColor" />}
                  <span className="relative h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: "var(--color-surface-track)" }}>
                    <span
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{ width: `${Math.max(6, Math.round((p.doneCount / maxDone) * 100))}%`, background: "linear-gradient(90deg, #0180cf, #63b81e)" }}
                    />
                  </span>
                  <span className="w-7 shrink-0 text-right tabular-nums text-[14px] font-black text-ink-strong" style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}>
                    {p.doneCount}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Flame; label: string; value: number | string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-subtle">
      <Icon size={13} strokeWidth={2.4} className="text-[#0069b3]" />
      {label}
      <b className="tabular-nums text-[13px] font-black text-ink-strong">{value}</b>
    </span>
  );
}

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center py-8 text-center"
      style={{ background: "var(--color-surface-soft)", border: "1px dashed var(--color-hairline-strong)", borderRadius: 14 }}
    >
      <span aria-hidden className="inline-flex size-12 items-center justify-center rounded-2xl text-white shadow-lg" style={{ background: "linear-gradient(135deg, #0180cf, #63b81e)" }}>
        <Inbox size={22} strokeWidth={2} />
      </span>
      <p className="mt-3 font-bold" style={{ fontSize: 15, color: "var(--color-ink-strong)" }}>
        No performance data yet
      </p>
      <p className="mt-1" style={{ fontSize: 13, color: "var(--color-ink-muted)" }}>
        Once tasks start hitting Done or Approved, your leaders appear here.
      </p>
    </div>
  );
}
