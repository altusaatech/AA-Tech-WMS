"use client";
import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import { PieChart, LayoutGrid } from "lucide-react";
import { PENDING_STATUSES, isDeprecatedStatus } from "@/db/enums";
import type { StatusDistributionPayload } from "@/lib/types";
import type { TaskStatus, StatusColorToken } from "@/db/enums";
import {
  STATUS_LABELS_FALLBACK,
  STATUS_TONES_FALLBACK,
} from "@/lib/format";

type Tone = StatusColorToken;

export function StatusDistributionChart({
  data,
  labels,
  tones,
  isAdmin,
}: {
  data: StatusDistributionPayload;
  labels?: Record<TaskStatus, string>;
  tones?: Record<TaskStatus, Tone>;
  isAdmin: boolean;
}) {
  const resolvedLabels = labels ?? STATUS_LABELS_FALLBACK;
  const resolvedTones = (tones ?? STATUS_TONES_FALLBACK) as Record<
    TaskStatus,
    Tone
  >;
  // Drop retired statuses (transferred / cancelled / follow_up_1-3) — those
  // tasks are migrated/archived now and shouldn't get their own tiles.
  const rows = [...data.rows]
    .filter((r) => !isDeprecatedStatus(r.status))
    .sort((a, b) => b.count - a.count);
  const totalCount = rows.reduce((s, r) => s + r.count, 0);
  const denom = data.denominator;
  // Defensive: Next's Data Cache can serve a payload cached before `summary`
  // existed (up to the 60s revalidate window right after a deploy). Fall back
  // to zeros so the card renders instead of throwing on `summary.pending`.
  const summary = data.summary ?? { pending: 0, notApproved: 0, archived: 0 };

  if (rows.length === 0) {
    return (
      <section
        className="rounded-section bg-surface-card border border-hairline p-6"
        style={{ boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)" }}
      >
        <Header isAdmin={isAdmin} />
        <div className="mt-4 flex flex-col items-center justify-center py-8 text-center">
          <span
            aria-hidden
            className="inline-flex size-11 items-center justify-center rounded-full"
            style={{ background: "rgba(15, 23, 42, 0.05)", color: "var(--color-ink-muted)" }}
          >
            <PieChart size={22} strokeWidth={2} />
          </span>
          <p className="mt-3 font-bold" style={{ fontSize: 15, color: "var(--color-ink-strong)" }}>
            No tasks in this range
          </p>
          <p className="mt-1" style={{ fontSize: 13, color: "var(--color-ink-muted)" }}>
            Widen the date range or clear filters to see the status breakdown.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="premium-card rounded-section bg-surface-card border border-hairline p-5 max-md:p-4"
      style={{
        opacity: 0,
        animation: "fadeUp 500ms ease-out 500ms forwards",
      }}
    >
      <Header isAdmin={isAdmin} />

      {/* Slim proportional ribbon — visual overview only; each segment shows a
          tooltip with its exact status / count / %. The rows below are the
          click-to-filter targets. */}
      <div
        className="mt-4 flex w-full overflow-hidden"
        style={{
          height: 22,
          borderRadius: 8,
          background: "var(--color-surface-track)",
          boxShadow: "inset 0 1px 2px rgba(15,23,42,0.06)",
        }}
        role="img"
        aria-label={`Tasks by status: ${rows
          .map((r) => `${resolvedLabels[r.status]} ${r.count}`)
          .join(", ")}`}
      >
        {rows.map((r, i) => {
          const tone = resolvedTones[r.status];
          const widthPct = totalCount > 0 ? (r.count / totalCount) * 100 : 0;
          if (widthPct === 0) return null;
          const pct = denom > 0 ? (r.count / denom) * 100 : widthPct;
          return (
            <div
              key={r.status}
              title={`${resolvedLabels[r.status]} — ${r.count} (${pct.toFixed(1)}%)`}
              className="dist-segment h-full"
              style={{
                width: `${widthPct}%`,
                minWidth: 5,
                background: `linear-gradient(180deg, var(--color-${tone}), var(--color-${tone}-deep))`,
                boxShadow:
                  i < rows.length - 1
                    ? "inset -2px 0 0 rgba(255,255,255,0.75)"
                    : "none",
              }}
            />
          );
        })}
      </div>

      {/* Compact legend — one line per status: dot · label · count · %.
          Click a row to open the filtered task list. */}
      <ul className="mt-4 grid grid-cols-3 gap-2 max-lg:grid-cols-2 max-sm:grid-cols-1">
        {rows.map((r) => (
          <CompactRow
            key={r.status}
            label={resolvedLabels[r.status]}
            tone={resolvedTones[r.status]}
            value={r.count}
            denom={denom}
            href={`/tasks?status=${r.status}` as Route}
          />
        ))}
        <CompactRow
          label="Pending"
          value={summary.pending}
          tone="amber"
          denom={denom}
          href={`/tasks?status=${PENDING_STATUSES.join(",")}` as Route}
        />
        <CompactRow
          label="Not approved"
          value={summary.notApproved}
          tone="rose"
          denom={denom}
          href={"/tasks?status=not_approved" as Route}
        />
        {/* Archived view is admin-only — hide the jump-to-archive tile from doers. */}
        {isAdmin && (
          <CompactRow
            label="Archived"
            value={summary.archived}
            tone="slate"
            denom={denom}
            href={"/archived" as Route}
          />
        )}
      </ul>
    </section>
  );
}

/** One-line status row: dot · label · count · share %. */
function CompactRow({
  label,
  value,
  tone,
  denom,
  href,
}: {
  label: string;
  value: number;
  tone: Tone;
  denom: number;
  href: Route;
}) {
  const pct = denom > 0 ? (value / denom) * 100 : 0;
  return (
    <li>
      <Link
        href={href}
        className="dist-tile group flex items-center gap-2 rounded-lg bg-surface-soft px-2.5 py-1.5 transition-all hover:-translate-y-0.5"
        style={{ border: "1px solid var(--color-hairline)" }}
      >
        <span
          aria-hidden
          className="size-2 shrink-0 rounded-full"
          style={{ background: `var(--color-${tone})` }}
        />
        <span
          className="min-w-0 flex-1 truncate font-bold uppercase tracking-[0.04em] text-ink-soft"
          style={{ fontSize: 10.5 }}
        >
          {label}
        </span>
        <span
          className="tabular-nums font-black leading-none text-ink-strong"
          style={{ fontFamily: "var(--font-display), system-ui, sans-serif", fontSize: 15 }}
        >
          {value}
        </span>
        <span className="w-10 shrink-0 text-right tabular-nums font-semibold text-ink-subtle" style={{ fontSize: 10.5 }}>
          {denom > 0 ? `${pct.toFixed(1)}%` : "—"}
        </span>
      </Link>
    </li>
  );
}

function Header({ isAdmin }: { isAdmin: boolean }) {
  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          aria-hidden
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: "rgba(15, 23, 42, 0.05)",
            color: "var(--color-ink-strong)",
          }}
        >
          <PieChart size={18} strokeWidth={2.2} />
        </span>
        <div className="min-w-0">
          <h2 className="text-[17px] font-black tracking-[-0.01em] text-ink-strong">Status Distribution</h2>
          <p className="truncate text-[12px] text-ink-subtle">Click a status to filter the task list</p>
        </div>
      </div>
      {/* Kanban is admin-only — doers don't see the jump-to-board link. */}
      {isAdmin && (
        <Link
          href={"/tasks/kanban" as Route}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold text-white transition-all hover:-translate-y-0.5"
          style={{
            background: "linear-gradient(135deg, var(--color-brand-blue), var(--color-brand-blue-deep))",
            boxShadow: "0 4px 12px rgba(1, 128, 207, 0.25)",
          }}
        >
          <LayoutGrid size={13} strokeWidth={2.4} />
          Kanban
        </Link>
      )}
    </header>
  );
}
