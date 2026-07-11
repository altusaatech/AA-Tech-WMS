"use client";

import * as React from "react";
import { Donut } from "@/components/charts/donut";
import { SectionCard } from "@/components/dashboards/section-card";
import { formatCount } from "@/lib/format";
import type { StatusSlice } from "@/lib/queries/sales-dashboard";

const PALETTE = ["#0180cf", "#63b81e", "#f59e0b", "#a855f7", "#14b8a6", "#ef4444", "#6366f1", "#f97316", "#64748b"];

export function QuoteStatusDonut({ data }: { data: StatusSlice[] }) {
  const total = data.reduce((a, s) => a + s.count, 0);
  const slices = data.map((s, i) => ({ label: s.label, value: s.count, color: PALETTE[i % PALETTE.length] ?? "#64748b" }));

  return (
    <SectionCard title="Quote Status" subtitle="Distribution of quotes in the selected period">
      {total === 0 ? (
        <div className="py-10 text-center text-[13px] font-medium text-ink-subtle">No quotes in this period.</div>
      ) : (
        <div className="flex flex-col items-center gap-5 sm:flex-row">
          <div className="shrink-0">
            <Donut data={slices} size={176} centerValue={formatCount(total)} centerLabel="Quotes" />
          </div>
          <div className="grid w-full grid-cols-1 gap-1.5">
            {data.map((s, i) => (
              <div key={s.label} className="flex items-center justify-between gap-2 rounded-chip bg-surface-soft px-3 py-1.5">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: PALETTE[i % PALETTE.length] ?? "#64748b" }} />
                  <span className="truncate text-[12.5px] font-semibold text-ink-soft">{s.label}</span>
                </span>
                <span className="shrink-0 text-[12px] font-black tabular-nums text-ink-strong">{formatCount(s.count)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
}
