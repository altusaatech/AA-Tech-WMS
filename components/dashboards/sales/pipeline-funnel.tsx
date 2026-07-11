import * as React from "react";
import { SectionCard } from "@/components/dashboards/section-card";
import { inrCompact } from "@/components/dashboards/format";
import { formatCount } from "@/lib/format";
import type { FunnelStage } from "@/lib/queries/sales-dashboard";

// Brand-to-green ramp across the six pipeline stages.
const STAGE_COLORS: { from: string; to: string }[] = [
  { from: "#0180cf", to: "#0069b3" },
  { from: "#1f92c9", to: "#0e77b0" },
  { from: "#2f9fa6", to: "#158a8a" },
  { from: "#49aa72", to: "#2f8f56" },
  { from: "#5cb43a", to: "#43871f" },
  { from: "#63b81e", to: "#3f7a14" },
];

export function PipelineFunnel({ funnel }: { funnel: FunnelStage[] }) {
  const top = Math.max(1, funnel[0]?.count ?? 1);

  return (
    <SectionCard title="Pipeline Funnel" subtitle="Quote → order → production → invoice, for the selected period">
      <div className="flex flex-col gap-2.5">
        {funnel.map((stage, i) => {
          const c = STAGE_COLORS[i] ?? STAGE_COLORS[STAGE_COLORS.length - 1]!;
          const widthPct = Math.max(6, Math.round((stage.count / top) * 100));
          const conv = i === 0 ? 100 : Math.round((stage.count / top) * 100);
          return (
            <div key={stage.key} className="flex items-center gap-3">
              <div className="w-[132px] shrink-0 text-right">
                <div className="text-[12.5px] font-bold text-ink-soft">{stage.label}</div>
                {stage.value > 0 && <div className="text-[11px] font-semibold tabular-nums text-ink-subtle">{inrCompact(stage.value)}</div>}
              </div>
              <div className="relative h-9 flex-1 overflow-hidden rounded-bar bg-surface-track">
                <div
                  className="flex h-full items-center rounded-bar px-3 text-white"
                  style={{
                    width: `${widthPct}%`,
                    background: `linear-gradient(90deg, ${c.from}, ${c.to})`,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.25), 0 8px 18px -12px ${c.to}`,
                    animation: `barGrow 700ms ease-out ${i * 80}ms both`,
                    transformOrigin: "left",
                  }}
                >
                  <span
                    className="tabular-nums font-black"
                    style={{ fontFamily: "var(--font-display), system-ui, sans-serif", fontSize: 15 }}
                  >
                    {formatCount(stage.count)}
                  </span>
                </div>
              </div>
              <div className="w-[46px] shrink-0 text-right text-[11.5px] font-black tabular-nums text-ink-subtle">{conv}%</div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
