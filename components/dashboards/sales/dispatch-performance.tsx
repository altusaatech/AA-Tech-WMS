import * as React from "react";
import { CheckCircle2, Clock, Truck } from "lucide-react";
import { SectionCard } from "@/components/dashboards/section-card";
import { formatCount } from "@/lib/format";

export function DispatchPerformance({ dispatch }: { dispatch: { onTime: number; delayed: number; pending: number } }) {
  const { onTime, delayed, pending } = dispatch;
  const total = onTime + delayed + pending;
  const pct = (n: number) => (total ? (n / total) * 100 : 0);
  const onTimeRate = onTime + delayed ? Math.round((onTime / (onTime + delayed)) * 100) : 0;

  const segs = [
    { key: "onTime", label: "On-time", value: onTime, color: "#63b81e", deep: "#3f7a14", Icon: CheckCircle2 },
    { key: "delayed", label: "Delayed", value: delayed, color: "#ef4444", deep: "#b91c1c", Icon: Clock },
    { key: "pending", label: "In production", value: pending, color: "#f59e0b", deep: "#b45309", Icon: Truck },
  ];

  return (
    <SectionCard title="Dispatch Performance" subtitle="Sales orders — delivery timeliness">
      <div className="flex items-baseline gap-2">
        <span
          className="tabular-nums font-black text-ink-strong"
          style={{ fontFamily: "var(--font-display), system-ui, sans-serif", fontSize: 34, letterSpacing: "-0.02em" }}
        >
          {onTimeRate}%
        </span>
        <span className="text-[12px] font-semibold text-ink-subtle">on-time (of dispatched)</span>
      </div>

      {/* stacked ribbon */}
      <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-surface-track">
        {segs.map((s) =>
          s.value > 0 ? (
            <div key={s.key} style={{ width: `${pct(s.value)}%`, background: `linear-gradient(180deg, ${s.color}, ${s.deep})` }} />
          ) : null,
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2.5">
        {segs.map((s) => (
          <div key={s.key} className="rounded-chip border border-hairline bg-surface-soft p-3">
            <div className="flex items-center gap-1.5" style={{ color: s.deep }}>
              <s.Icon size={14} strokeWidth={2.4} />
              <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-ink-subtle">{s.label}</span>
            </div>
            <div
              className="mt-1 tabular-nums font-black text-ink-strong"
              style={{ fontFamily: "var(--font-display), system-ui, sans-serif", fontSize: 22 }}
            >
              {formatCount(s.value)}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
