"use client";

import * as React from "react";
import { Database } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

export function MastersHub() {
  return (
    <main className="relative mx-auto max-w-[1600px] px-8 pb-16 pt-8 max-md:px-4">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.5]"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(1,128,207,0.07) 1px, transparent 0)", backgroundSize: "26px 26px" }}
      />

      <PageHero eyebrow="Master Data" title="Masters" Icon={Database} />

      <div className="mt-6 flex flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-white/60 px-6 py-20 text-center backdrop-blur">
        <span
          className="inline-flex size-14 items-center justify-center rounded-2xl text-white shadow-lg"
          style={{ background: "linear-gradient(135deg, #0180cf, #63b81e)" }}
        >
          <Database size={26} strokeWidth={2.1} />
        </span>
        <p className="mt-4 text-[16px] font-bold text-slate-700">Masters is ready for setup</p>
        <p className="mt-1 max-w-md text-[13.5px] text-slate-500">
          This section has been cleared. Tell me what you&apos;d like here and I&apos;ll build it.
        </p>
      </div>
    </main>
  );
}
