"use client";

import * as React from "react";

/**
 * Compact live system-status + clock for the command-center header band.
 * Renders nothing until mounted (so SSR/client clocks never mismatch), then
 * ticks every 30s. Pure presentation — a premium "control tower" touch.
 */
export function HeaderClock() {
  const [now, setNow] = React.useState<Date | null>(null);
  React.useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const date = now ? now.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }) : "";
  const time = now ? now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 ring-1 ring-white/15 backdrop-blur">
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#63b81e] opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-[#63b81e]" />
        </span>
        <span className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-white/80">Operational</span>
      </span>
      <span className="flex flex-col leading-none text-white/70 max-md:hidden" suppressHydrationWarning>
        <span className="text-[12px] font-bold tabular-nums text-white/90">{time || "—"}</span>
        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/45">{date || ""}</span>
      </span>
    </div>
  );
}
