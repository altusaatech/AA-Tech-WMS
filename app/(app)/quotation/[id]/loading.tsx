import { Receipt } from "lucide-react";

/**
 * Instant loading skeleton for the working-specification builder. The builder
 * page is `force-dynamic` and pulls the Product/Hardware/Door/Installation
 * masters, so without this the "Working Specification" button felt frozen while
 * the server rendered. Next streams this immediately on navigation, then swaps
 * in the real page — so it feels quick.
 */
export default function QuotationBuilderLoading() {
  return (
    <main className="relative mx-auto max-w-[1600px] px-8 pb-16 pt-8 max-md:px-4">
      <div className="animate-pulse">
        {/* header card skeleton */}
        <div className="flex items-center gap-3">
          <span className="inline-flex size-11 items-center justify-center rounded-2xl text-white" style={{ background: "linear-gradient(135deg, #63b81e, #0180cf)" }}>
            <Receipt size={20} strokeWidth={2.3} />
          </span>
          <div className="space-y-2">
            <div className="h-4 w-40 rounded bg-slate-200" />
            <div className="h-3 w-64 rounded bg-slate-100" />
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-6 gap-3 max-lg:grid-cols-2 max-md:grid-cols-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-2.5 w-16 rounded bg-slate-100" />
                <div className="h-9 rounded-lg bg-slate-100" />
              </div>
            ))}
          </div>
        </div>

        {/* door card skeletons */}
        <div className="mt-5 space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="h-4 w-48 rounded bg-slate-200" />
              <div className="mt-4 grid grid-cols-4 gap-3 max-md:grid-cols-2">
                {Array.from({ length: 8 }).map((_, j) => (
                  <div key={j} className="h-9 rounded-lg bg-slate-100" />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-2 text-[13px] font-semibold text-slate-400">
          <span className="inline-block size-2 animate-ping rounded-full bg-[#0180cf]" />
          Loading working specification…
        </div>
      </div>
    </main>
  );
}
