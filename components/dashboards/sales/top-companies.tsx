import * as React from "react";
import { SectionCard } from "@/components/dashboards/section-card";
import { inrCompact } from "@/components/dashboards/format";
import type { CompanyRow } from "@/lib/queries/sales-dashboard";

export function TopCompanies({ rows }: { rows: CompanyRow[] }) {
  const top = Math.max(1, rows[0]?.poValue ?? 1);

  return (
    <SectionCard title="Top Customers" subtitle="By order (PO) value in the selected period">
      {rows.length === 0 ? (
        <EmptyRow />
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((r, i) => {
            const widthPct = Math.max(3, Math.round((r.poValue / top) * 100));
            return (
              <div key={r.company + i} className="flex items-center gap-3">
                <div className="w-[150px] shrink-0 truncate text-[12.5px] font-bold text-ink-soft" title={r.company}>
                  {r.company}
                </div>
                <div className="relative h-6 flex-1 overflow-hidden rounded-bar bg-surface-track">
                  <div
                    className="h-full rounded-bar"
                    style={{
                      width: `${widthPct}%`,
                      background: "linear-gradient(90deg, #0180cf, #63b81e)",
                      animation: `barGrow 700ms ease-out ${i * 60}ms both`,
                      transformOrigin: "left",
                    }}
                  />
                </div>
                <div className="w-[84px] shrink-0 text-right text-[12px] font-black tabular-nums text-ink-strong">
                  {inrCompact(r.poValue)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

function EmptyRow() {
  return <div className="py-8 text-center text-[13px] font-medium text-ink-subtle">No orders in this period.</div>;
}
