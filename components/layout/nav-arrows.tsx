"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";

/**
 * Floating navigation aid — pinned bottom-left (clear of the header logo) and
 * layered above content so it stays reachable everywhere. A branded "Hub"
 * button plus evenly-aligned back / forward controls that mirror router history.
 */
export function NavArrows() {
  const router = useRouter();
  // Match the Hub button — same gradient, white icon, same rounded/weight/hover.
  const iconBtn =
    "group inline-flex size-7 items-center justify-center rounded-lg text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-90";
  const iconBtnStyle = {
    background: "linear-gradient(135deg, #63b81e, #0180cf)",
    boxShadow: "0 8px 18px -10px rgba(1,128,207,0.6)",
  } as const;
  return (
    <div className="fixed left-4 bottom-4 z-[130] flex items-center gap-1 rounded-xl border border-white/80 bg-white/90 p-1 shadow-[0_12px_28px_-12px_rgba(15,40,80,0.42),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl print:hidden max-md:left-3 max-md:bottom-3">
      {/* Hub — styled like the app's primary gradient buttons */}
      <Link
        href={"/portal" as Route}
        aria-label="Back to Hub"
        title="Back to Hub"
        className="group inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-[12px] font-extrabold text-white transition-all hover:-translate-y-0.5"
        style={{ background: "linear-gradient(135deg, #63b81e, #0180cf)", boxShadow: "0 8px 18px -10px rgba(1,128,207,0.6)" }}
      >
        <LayoutGrid size={13} strokeWidth={2.6} className="transition-transform group-hover:scale-110" /> Hub
      </Link>

      <span className="mx-0.5 h-4 w-px rounded-full bg-slate-200" aria-hidden />

      <button type="button" onClick={() => router.back()} aria-label="Go back" title="Back" className={iconBtn} style={iconBtnStyle}>
        <ChevronLeft size={15} strokeWidth={2.8} className="transition-transform group-hover:-translate-x-0.5" />
      </button>
      <button type="button" onClick={() => router.forward()} aria-label="Go forward" title="Forward" className={iconBtn} style={iconBtnStyle}>
        <ChevronRight size={15} strokeWidth={2.8} className="transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  );
}
