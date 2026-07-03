"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Floating browser-style back / forward navigation, available on every screen.
 * Fixed bottom-left and layered above page content and popups so it stays
 * reachable even while a dialog is open. Mirrors the browser history.
 */
export function NavArrows() {
  const router = useRouter();
  return (
    <div className="fixed bottom-5 left-5 z-[130] flex items-center gap-1 rounded-full border border-slate-200 bg-white/95 p-1 shadow-xl backdrop-blur max-md:bottom-4 max-md:left-4 print:hidden">
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Go back"
        title="Back"
        className="inline-flex size-9 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 hover:text-[#0069b3]"
      >
        <ChevronLeft size={20} strokeWidth={2.5} />
      </button>
      <span className="h-5 w-px bg-slate-200" aria-hidden />
      <button
        type="button"
        onClick={() => router.forward()}
        aria-label="Go forward"
        title="Forward"
        className="inline-flex size-9 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 hover:text-[#0069b3]"
      >
        <ChevronRight size={20} strokeWidth={2.5} />
      </button>
    </div>
  );
}
