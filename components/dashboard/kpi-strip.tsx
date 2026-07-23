"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import { Plus, Minus, ArrowUpRight } from "lucide-react";
import type { NeonKey } from "./kpi-card";
import { KpiDetailPanel } from "./kpi-detail-panel";
import { Counter } from "./count-up";
import type { KpiSet, WmsSummary } from "@/lib/types";

interface Entry {
  key: keyof KpiSet;
  label: string;
  sublabel: string;
  neonKey: NeonKey;
  href: Route;
}

// One compact card per KPI, in a single row. The first (Total) reads as the
// anchor; the rest follow in the operational reading order.
const ITEMS: Entry[] = [
  { key: "total", label: "Total", sublabel: "All Tasks", neonKey: "total", href: "/tasks" },
  { key: "needHelp", label: "Need Info", sublabel: "Awaiting info", neonKey: "need-help", href: "/tasks?status=need_info" },
  { key: "notApproved", label: "Not Approved", sublabel: "Sent Back", neonKey: "not-approved", href: "/tasks?status=not_approved" },
  { key: "done", label: "Done", sublabel: "Done + Approved", neonKey: "done", href: "/tasks?status=done,approved" },
  { key: "pending", label: "Pending", sublabel: "In Progress", neonKey: "pending", href: "/tasks?status=initiated,follow_up" },
  { key: "notStarted", label: "Not Started", sublabel: "Awaiting Pickup", neonKey: "not-started", href: "/tasks?status=not_started" },
];

export function KpiStrip({ kpis, summary }: { kpis: KpiSet; summary: WmsSummary }) {
  const [expanded, setExpanded] = React.useState<keyof KpiSet | null>(null);
  const active = expanded ? ITEMS.find((i) => i.key === expanded) ?? null : null;

  return (
    <section className="mt-8 mx-auto max-w-[1600px] px-12 max-md:px-4" aria-label="Task summary">
      <div
        className="grid auto-rows-fr grid-cols-6 gap-3 max-md:grid-cols-3 max-sm:grid-cols-2"
        role="list"
      >
        {ITEMS.map((item) => {
          const kpi = kpis[item.key];
          const delta = kpi.current - kpi.previous;
          const up = delta > 0;
          const flat = delta === 0;
          const arrow = up ? "▲" : flat ? "→" : "▼";
          const isOpen = expanded === item.key;

          return (
            <div role="listitem" key={item.key} className="h-full">
              <div
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: "linear-gradient(135deg, #63b81e, #0180cf)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  boxShadow: isOpen
                    ? "0 0 0 2px rgba(255,255,255,0.75), 0 16px 34px -16px rgba(1,128,207,0.6)"
                    : "0 12px 26px -16px rgba(1,128,207,0.5)",
                }}
              >
                {/* top sheen so the gradient reads as a glossy button */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0) 46%)" }}
                />
                {/* shine sweep on hover */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-0 w-1/2 -translate-x-[200%] -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[260%]"
                />
                <div className="relative flex items-start justify-between gap-2 px-3.5 pt-3 pb-3">
                  <Link
                    href={item.href}
                    className="group/link min-w-0 flex-1 outline-none"
                    aria-label={`${item.label} — view tasks`}
                  >
                    <span
                      className="flex items-center gap-1 uppercase font-black tracking-[0.07em] leading-none text-white"
                      style={{ fontSize: 12.5 }}
                    >
                      {item.label}
                      <ArrowUpRight
                        size={13}
                        strokeWidth={3}
                        className="opacity-0 -translate-x-0.5 transition-all group-hover/link:opacity-100 group-hover/link:translate-x-0"
                      />
                    </span>
                    <Counter
                      value={kpi.current}
                      className="block tabular-nums leading-none mt-1.5 text-white"
                      style={{
                        fontFamily: "var(--font-display), system-ui, sans-serif",
                        fontWeight: 900,
                        fontSize: 29,
                        letterSpacing: "-0.02em",
                      }}
                    />
                    <span
                      className="mt-1.5 inline-flex items-center gap-1 tabular-nums font-extrabold text-white/90"
                      style={{ fontSize: 12 }}
                    >
                      {arrow} {Math.abs(delta)}
                      <span className="font-semibold text-white/60">vs last</span>
                    </span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setExpanded((cur) => (cur === item.key ? null : item.key))}
                    aria-expanded={isOpen}
                    aria-label={isOpen ? `Collapse ${item.label} details` : `Expand ${item.label} details`}
                    className="inline-flex size-6 shrink-0 items-center justify-center rounded-full transition-colors"
                    style={{
                      color: isOpen ? "#0069b3" : "#fff",
                      background: isOpen ? "#fff" : "rgba(255,255,255,0.22)",
                    }}
                  >
                    {isOpen ? <Minus size={16} strokeWidth={3} /> : <Plus size={16} strokeWidth={3} />}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Single per-card detail panel — animates open via the 0fr→1fr grid trick. */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: active ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          {active && (
            <div className="pt-4">
              <KpiDetailPanel
                label={active.label}
                sublabel={active.sublabel}
                value={kpis[active.key].current}
                kpi={kpis[active.key]}
                summary={summary}
                neon={`var(--kpi-neon-${active.neonKey})`}
                neonDeep={`var(--kpi-neon-${active.neonKey}-deep)`}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
