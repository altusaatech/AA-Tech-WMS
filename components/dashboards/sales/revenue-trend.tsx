"use client";

import * as React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { SectionCard } from "@/components/dashboards/section-card";
import { inrCompact } from "@/components/dashboards/format";
import { formatInr } from "@/lib/format";
import type { TrendPoint } from "@/lib/queries/sales-dashboard";

const SERIES = [
  { key: "quoteValue", name: "Quoted", color: "#6366f1" },
  { key: "poValue", name: "Won (PO)", color: "#0180cf" },
  { key: "piValue", name: "Billed (PI)", color: "#63b81e" },
] as const;

export function RevenueTrend({ data }: { data: TrendPoint[] }) {
  const hasData = data.some((d) => d.quoteValue || d.poValue || d.piValue);

  return (
    <SectionCard title="Revenue Trend" subtitle="Quoted vs won vs billed value, by month">
      {!hasData ? (
        <div className="py-16 text-center text-[13px] font-medium text-ink-subtle">No revenue in this period.</div>
      ) : (
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
              <defs>
                {SERIES.map((s) => (
                  <linearGradient key={s.key} id={`rt-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={s.color} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "var(--color-ink-subtle)", fontFamily: "var(--font-mono)" }}
                tickLine={false}
                axisLine={{ stroke: "var(--color-hairline-strong)" }}
              />
              <YAxis
                tickFormatter={(v) => inrCompact(Number(v))}
                tick={{ fontSize: 10.5, fill: "var(--color-ink-subtle)", fontFamily: "var(--font-mono)" }}
                tickLine={false}
                axisLine={false}
                width={64}
              />
              <Tooltip
                contentStyle={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 12,
                  borderRadius: 10,
                  border: "1px solid var(--color-hairline)",
                  boxShadow: "0 4px 14px rgba(15,23,42,0.10)",
                }}
                formatter={(value, name) => [formatInr(Number(value)), name as string]}
              />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: 12, fontWeight: 600, paddingTop: 4 }}
              />
              {SERIES.map((s) => (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name}
                  stroke={s.color}
                  strokeWidth={2.4}
                  fill={`url(#rt-${s.key})`}
                  dot={false}
                  activeDot={{ r: 4 }}
                  animationDuration={700}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </SectionCard>
  );
}
