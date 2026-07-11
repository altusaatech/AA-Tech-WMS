"use client";

import * as React from "react";
import type { Route } from "next";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Calendar } from "lucide-react";

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function presetRange(kind: "3m" | "6m" | "12m" | "ytd"): { start: string; end: string } {
  const today = new Date();
  const end = ymd(today);
  if (kind === "ytd") return { start: ymd(new Date(Date.UTC(today.getUTCFullYear(), 0, 1))), end };
  const months = kind === "3m" ? 3 : kind === "6m" ? 6 : 12;
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - (months - 1), 1));
  return { start: ymd(start), end };
}

const PRESETS: { key: "3m" | "6m" | "12m" | "ytd"; label: string }[] = [
  { key: "3m", label: "3M" },
  { key: "6m", label: "6M" },
  { key: "12m", label: "12M" },
  { key: "ytd", label: "YTD" },
];

export function SalesFilters({ start, end }: { start: string; end: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const apply = React.useCallback(
    (next: { start: string; end: string }) => {
      const sp = new URLSearchParams(params.toString());
      sp.set("start", next.start);
      sp.set("end", next.end);
      router.replace(`${pathname}?${sp.toString()}` as Route, { scroll: false });
    },
    [params, pathname, router],
  );

  const activePreset = PRESETS.find((p) => {
    const r = presetRange(p.key);
    return r.start === start && r.end === end;
  })?.key;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex items-center gap-1 rounded-xl border border-hairline bg-surface-card p-1 shadow-sm">
        {PRESETS.map((p) => {
          const active = activePreset === p.key;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => apply(presetRange(p.key))}
              className={`h-7 rounded-lg px-2.5 text-[12px] font-bold transition-colors ${
                active ? "text-white" : "text-ink-soft hover:bg-surface-soft"
              }`}
              style={active ? { background: "linear-gradient(135deg, #0180cf, #0069b3)" } : undefined}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="inline-flex items-center gap-1.5 rounded-xl border border-hairline bg-surface-card px-3 py-1.5 shadow-sm">
        <Calendar size={14} className="text-ink-subtle" />
        <input
          type="date"
          value={start}
          max={end}
          onChange={(e) => e.target.value && apply({ start: e.target.value, end })}
          className="bg-transparent text-[12.5px] font-semibold text-ink-soft outline-none"
        />
        <span className="text-ink-subtle">→</span>
        <input
          type="date"
          value={end}
          min={start}
          onChange={(e) => e.target.value && apply({ start, end: e.target.value })}
          className="bg-transparent text-[12.5px] font-semibold text-ink-soft outline-none"
        />
      </div>
    </div>
  );
}
