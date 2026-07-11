"use client";

import * as React from "react";
import { TrendingUp, TrendingDown, Wallet, FileText, Trophy, ReceiptIndianRupee, Inbox, Timer } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCountUp } from "@/lib/use-count-up";
import { inrCompact, pctDelta } from "@/components/dashboards/format";
import type { SalesDashboardData } from "@/lib/queries/sales-dashboard";

interface Tile {
  label: string;
  sublabel: string;
  value: number;
  display: (n: number) => string;
  accent: string; // base hex
  deep: string; // deep hex
  Icon: LucideIcon;
  deltaPct: number | null;
  /** For deltas where a decrease is the good outcome (e.g. cycle time). */
  invertDelta?: boolean;
}

export function SalesKpis({ kpis }: { kpis: SalesDashboardData["kpis"] }) {
  const tiles: Tile[] = [
    {
      label: "Order Book",
      sublabel: "PO value won",
      value: kpis.orderBook.value,
      display: inrCompact,
      accent: "#0180cf",
      deep: "#0069b3",
      Icon: Wallet,
      deltaPct: pctDelta(kpis.orderBook.value, kpis.orderBook.previous),
    },
    {
      label: "Quote Value",
      sublabel: "pipeline quoted",
      value: kpis.quoteValue.value,
      display: inrCompact,
      accent: "#6366f1",
      deep: "#4338ca",
      Icon: FileText,
      deltaPct: pctDelta(kpis.quoteValue.value, kpis.quoteValue.previous),
    },
    {
      label: "Win Rate",
      sublabel: `${kpis.wonCount}/${kpis.quoteCount} quotes won`,
      value: kpis.winRate,
      display: (n) => `${Math.round(n)}%`,
      accent: "#63b81e",
      deep: "#3f7a14",
      Icon: Trophy,
      deltaPct: null,
    },
    {
      label: "PI Billed",
      sublabel: "proforma invoiced",
      value: kpis.piBilled.value,
      display: inrCompact,
      accent: "#14b8a6",
      deep: "#0f766e",
      Icon: ReceiptIndianRupee,
      deltaPct: pctDelta(kpis.piBilled.value, kpis.piBilled.previous),
    },
    {
      label: "Active Enquiries",
      sublabel: "open, not yet won",
      value: kpis.activeEnquiries,
      display: (n) => `${Math.round(n)}`,
      accent: "#f59e0b",
      deep: "#b45309",
      Icon: Inbox,
      deltaPct: null,
    },
    {
      label: "Avg Days to PO",
      sublabel: "quote → order",
      value: kpis.avgDaysToPo ?? 0,
      display: (n) => (kpis.avgDaysToPo == null ? "—" : `${Math.round(n)}d`),
      accent: "#a855f7",
      deep: "#7c3aed",
      Icon: Timer,
      deltaPct: null,
      invertDelta: true,
    },
  ];

  return (
    <div className="grid grid-cols-6 gap-3 max-lg:grid-cols-3 max-sm:grid-cols-2">
      {tiles.map((t, i) => (
        <KpiTile key={t.label} tile={t} index={i} />
      ))}
    </div>
  );
}

function KpiTile({ tile, index }: { tile: Tile; index: number }) {
  const animated = useCountUp(tile.value);
  const { deltaPct, invertDelta } = tile;
  const positive = deltaPct != null && (invertDelta ? deltaPct < 0 : deltaPct > 0);
  const negative = deltaPct != null && (invertDelta ? deltaPct > 0 : deltaPct < 0);
  const DeltaIcon = deltaPct != null && deltaPct >= 0 ? TrendingUp : TrendingDown;

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-hairline bg-surface-card p-4 opacity-0"
      style={{
        boxShadow: "0 14px 38px -24px rgba(15,40,80,0.26), 0 1px 3px rgba(15,23,42,0.04)",
        animation: `fadeUp 500ms ease-out ${index * 70}ms forwards`,
      }}
    >
      {/* top accent rail */}
      <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${tile.accent}, ${tile.deep})` }} />
      {/* shine sweep */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-2/3 -translate-x-[180%] -skew-x-12 bg-gradient-to-r from-transparent via-white/55 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[280%]"
      />

      <div className="relative flex items-center justify-between">
        <span className="text-[10.5px] font-black uppercase tracking-[0.12em] text-ink-subtle">{tile.label}</span>
        <span
          className="inline-flex size-7 items-center justify-center rounded-lg text-white"
          style={{ background: `linear-gradient(135deg, ${tile.accent}, ${tile.deep})`, boxShadow: `0 8px 18px -10px ${tile.deep}` }}
        >
          <tile.Icon size={15} strokeWidth={2.3} />
        </span>
      </div>

      <div
        className="relative mt-2 tabular-nums text-ink-strong"
        style={{ fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 900, fontSize: "clamp(22px, 2.1vw, 30px)", letterSpacing: "-0.02em", lineHeight: 1.05 }}
      >
        {tile.display(animated)}
      </div>

      <div className="relative mt-1 flex items-center justify-between gap-2">
        <span className="truncate text-[11.5px] font-semibold text-ink-subtle">{tile.sublabel}</span>
        {deltaPct != null && (
          <span
            className="inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-black tabular-nums"
            style={{
              color: positive ? "#3f7a14" : negative ? "#b91c1c" : "#64748b",
              background: positive ? "rgba(99,184,30,0.12)" : negative ? "rgba(239,68,68,0.10)" : "#f1f5f9",
            }}
          >
            <DeltaIcon size={11} strokeWidth={2.6} />
            {Math.abs(deltaPct)}%
          </span>
        )}
      </div>
    </div>
  );
}
