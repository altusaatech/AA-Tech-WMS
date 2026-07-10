"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";

/**
 * Floating navigation aid — pinned bottom-left (clear of the header logo) and
 * layered above content so it stays reachable everywhere. Provides a "Back to
 * Hub" shortcut plus browser-style back / forward that mirror router history.
 */
export function NavArrows() {
  const router = useRouter();
  const btn =
    "group inline-flex size-9 items-center justify-center rounded-full text-slate-500 transition-all duration-200 hover:bg-[#0180cf]/12 hover:text-[#0069b3] active:scale-90";
  const divider = (
    <span className="relative h-4 w-px rounded-full bg-gradient-to-b from-transparent via-slate-300 to-transparent" aria-hidden />
  );
  return (
    <div className="fixed left-4 bottom-4 z-[130] flex items-center gap-0.5 rounded-full border border-white/80 bg-white/85 p-1 shadow-[0_14px_34px_-10px_rgba(15,40,80,0.45),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl print:hidden max-md:left-3 max-md:bottom-3">
      {/* soft brand sheen */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full opacity-60"
        style={{ background: "linear-gradient(120deg, rgba(1,128,207,0.06), rgba(255,255,255,0) 55%, rgba(99,184,30,0.07))" }}
      />
      <Link href={"/portal" as Route} aria-label="Back to Hub" title="Back to Hub" className={btn}>
        <LayoutGrid size={17} strokeWidth={2.5} className="relative transition-transform group-hover:scale-110" />
      </Link>
      {divider}
      <button type="button" onClick={() => router.back()} aria-label="Go back" title="Back" className={btn}>
        <ChevronLeft size={19} strokeWidth={2.7} className="relative transition-transform group-hover:-translate-x-0.5" />
      </button>
      {divider}
      <button type="button" onClick={() => router.forward()} aria-label="Go forward" title="Forward" className={btn}>
        <ChevronRight size={19} strokeWidth={2.7} className="relative transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  );
}
