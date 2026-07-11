import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface HubCardProps {
  title: string;
  desc: string;
  Icon: LucideIcon;
  from: string;
  to: string;
  soft: string;
  ring: string;
  count?: number;
  sub?: string;
  cta: string;
  href?: Route;
  disabled?: boolean;
}

/** A pastel hub navigation block (Masters-hub style), rendered as a link. When
 *  `disabled` it becomes a muted, non-interactive "coming soon" tile. */
export function HubCard(props: HubCardProps) {
  const { title, desc, Icon, from, to, soft, ring, count, sub, cta, href, disabled } = props;

  const inner = (
    <>
      <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: `linear-gradient(90deg, ${from}, ${to})` }} />
      {!disabled && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-2/3 -translate-x-[180%] -skew-x-12 bg-gradient-to-r from-transparent via-white/55 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[280%]"
        />
      )}
      <Icon className="pointer-events-none absolute -bottom-7 -right-7" size={150} strokeWidth={1.3} style={{ color: to, opacity: 0.08 }} />

      <div className="relative flex items-start gap-4">
        <span
          className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg transition-transform duration-300 group-hover:scale-105"
          style={{ background: `linear-gradient(135deg, ${from}, ${to})`, boxShadow: `0 12px 26px -12px ${to}` }}
        >
          <Icon size={28} strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[20px] font-black tracking-[-0.01em] text-slate-800" style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}>
            {title}
          </h3>
          <p className="mt-1 text-[13px] font-medium text-slate-500">{desc}</p>
        </div>
      </div>

      <div className="relative mt-5 flex items-center justify-between">
        <span className="inline-flex items-baseline gap-1.5">
          {count != null && <span className="text-[26px] font-black tabular-nums" style={{ color: to }}>{count}</span>}
          {sub && <span className="text-[12.5px] font-semibold text-slate-400">{sub}</span>}
        </span>
        <span className="inline-flex items-center gap-1 text-[13.5px] font-extrabold" style={{ color: disabled ? "#94a3b8" : to }}>
          {cta} {!disabled && <ArrowRight size={15} strokeWidth={2.6} className="transition-transform group-hover:translate-x-0.5" />}
        </span>
      </div>
    </>
  );

  const className =
    "group relative overflow-hidden rounded-[26px] border p-6 text-left transition-all duration-300";
  const style: React.CSSProperties = {
    background: soft,
    borderColor: ring,
    boxShadow: "0 16px 40px -22px rgba(15,40,80,0.28), 0 1px 3px rgba(15,23,42,0.04)",
  };

  if (disabled || !href) {
    return (
      <div className={`${className} cursor-default opacity-70`} style={style} aria-disabled>
        {inner}
      </div>
    );
  }
  return (
    <Link href={href} className={`${className} hover:-translate-y-1.5`} style={style}>
      {inner}
    </Link>
  );
}
