"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Counter } from "@/components/dashboard/count-up";

export interface HeroStat {
  label: string;
  value: number;
  icon: LucideIcon;
  from: string;
  to: string;
}

/**
 * PageHero — the app's reusable bold "command banner". A deep animated dark
 * gradient with a rotating aurora, drifting glow blobs, a shimmer sweep and a
 * faint brand watermark; carries an eyebrow, gradient title, subtitle, an icon
 * chip, optional animated stat tiles and an actions slot. Used to anchor every
 * major screen with the same premium language as the dashboard hero.
 */
export function PageHero({
  eyebrow,
  title,
  subtitle,
  Icon,
  stats,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  Icon?: LucideIcon;
  stats?: HeroStat[];
  actions?: React.ReactNode;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-[28px] px-9 py-8 max-md:px-5 max-md:py-6"
      style={{
        background: "linear-gradient(125deg, #04203a 0%, #061a30 44%, #06352b 100%)",
        boxShadow: "0 38px 86px -40px rgba(3,30,55,0.82), 0 0 0 1px rgba(255,255,255,0.05) inset, 0 1px 0 rgba(255,255,255,0.08) inset",
      }}
    >
      <HeroBackdrop Icon={Icon} />

      <div className="relative flex items-start justify-between gap-6 flex-wrap">
        <div className="flex items-start gap-4 min-w-0">
          {Icon && (
            <span
              className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg max-md:size-12"
              style={{ background: "linear-gradient(135deg, #0180cf, #63b81e)", boxShadow: "0 14px 30px -12px rgba(1,128,207,0.7)" }}
            >
              <Icon size={26} strokeWidth={2.3} />
            </span>
          )}
          <div className="min-w-0">
            {eyebrow && (
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">
                <span className="inline-block size-1.5 rounded-full bg-[#63b81e] shadow-[0_0_10px_#63b81e]" />
                {eyebrow}
              </div>
            )}
            <h1
              className="mt-1.5 text-white"
              style={{ fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 900, fontSize: "clamp(26px, 3.1vw, 38px)", lineHeight: 1.03, letterSpacing: "-0.035em" }}
            >
              {title}
            </h1>
            {subtitle && <p className="mt-2 text-[14px] text-white/65 max-w-2xl">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="relative flex items-center gap-2.5 shrink-0">{actions}</div>}
      </div>

      {stats && stats.length > 0 && (
        <div
          className="relative mt-7 grid gap-3"
          style={{ gridTemplateColumns: `repeat(${Math.min(stats.length, 4)}, minmax(0, 1fr))` }}
        >
          {stats.map((s) => (
            <HeroStatTile key={s.label} stat={s} />
          ))}
        </div>
      )}
    </div>
  );
}

export function HeroBackdrop({ Icon }: { Icon?: LucideIcon }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="hero-anim absolute left-1/2 top-1/2 h-[180%] w-[180%] -translate-x-1/2 -translate-y-1/2 opacity-[0.5]"
        style={{
          background:
            "conic-gradient(from 0deg at 50% 50%, rgba(1,128,207,0.30), rgba(99,184,30,0.22), rgba(0,105,179,0.30), rgba(20,184,166,0.20), rgba(1,128,207,0.30))",
          filter: "blur(60px)",
          mixBlendMode: "screen",
          animation: "heroAurora 42s linear infinite",
        }}
      />
      <div
        className="hero-anim absolute -left-28 -top-32 h-[420px] w-[420px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(1,128,207,0.50), transparent 66%)", filter: "blur(28px)", animation: "heroFloat1 16s ease-in-out infinite" }}
      />
      <div
        className="hero-anim absolute right-[-7rem] top-[18%] h-[440px] w-[440px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(99,184,30,0.40), transparent 66%)", filter: "blur(34px)", animation: "heroFloat2 20s ease-in-out infinite" }}
      />
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.07) 1px, transparent 0)", backgroundSize: "30px 30px" }}
      />
      <div
        className="hero-anim absolute inset-y-0 left-0 w-1/3"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.09), transparent)", animation: "heroShimmer 9s ease-in-out infinite" }}
      />
      {Icon && (
        <Icon
          className="absolute -right-8 -top-10 text-white opacity-[0.05] max-md:hidden"
          size={260}
          strokeWidth={1.2}
        />
      )}
    </div>
  );
}

function HeroStatTile({ stat }: { stat: HeroStat }) {
  const Icon = stat.icon;
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/10 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.11]">
      <span aria-hidden className="absolute inset-x-0 top-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${stat.from}, ${stat.to})` }} />
      <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1/2 -translate-x-[200%] -skew-x-12 bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[260%]" />
      <div className="relative flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/55">{stat.label}</span>
        <span className="inline-flex size-7 items-center justify-center rounded-lg text-white shadow" style={{ background: `linear-gradient(135deg, ${stat.from}, ${stat.to})` }}>
          <Icon size={15} strokeWidth={2.4} />
        </span>
      </div>
      <Counter
        value={stat.value}
        className="relative mt-2.5 block tabular-nums text-white"
        style={{ fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 900, fontSize: "clamp(26px, 2.6vw, 36px)", letterSpacing: "-0.025em", lineHeight: 1 }}
      />
    </div>
  );
}
