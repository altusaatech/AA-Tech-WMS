"use client";

import * as React from "react";
import { X, Building2, PackageCheck, CalendarClock, FileText, Boxes, ClipboardCheck } from "lucide-react";

export interface ProductionWo {
  workOrderNo: string;
  ourSoNo: string;
  bomNo: string;
  poNo: string;
  company: string;
  item: string;
  boStatus: string;
  workOrderDate: string;
  targetDate: string;
  actualDate: string;
  onTime: boolean;
}

const STATUS_TINT: Record<string, { bg: string; fg: string }> = {
  Released: { bg: "rgba(99,184,30,0.14)", fg: "#3f7a14" },
  "In Progress": { bg: "rgba(245,158,11,0.14)", fg: "#b45309" },
  Hold: { bg: "rgba(1,128,207,0.12)", fg: "#0069b3" },
};

function tint(status: string) {
  return STATUS_TINT[status] ?? { bg: "rgba(100,116,139,0.12)", fg: "#475569" };
}

export function ProductionRecent({ rows }: { rows: ProductionWo[] }) {
  const [open, setOpen] = React.useState<ProductionWo | null>(null);

  return (
    <div className="relative overflow-hidden rounded-[22px] border border-hairline bg-surface-card p-5 shadow-sm">
      <span aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.5]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(1,128,207,0.05) 1px, transparent 0)", backgroundSize: "22px 22px" }} />
      <div className="relative mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-black text-ink-strong" style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}>Recent Work Orders</h2>
        <span className="text-[11.5px] font-semibold text-ink-subtle">click a row for details</span>
      </div>

      <div className="relative overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="text-left text-[11px] font-bold uppercase tracking-[0.05em] text-ink-subtle">
              <th className="px-2 py-1.5">WO No</th>
              <th className="px-2 py-1.5">Company</th>
              <th className="px-2 py-1.5">Item</th>
              <th className="px-2 py-1.5">Status</th>
              <th className="px-2 py-1.5 text-right">Dispatch</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={5} className="px-2 py-6 text-center text-[13px] text-ink-subtle">No work orders yet.</td></tr>
            ) : rows.map((w) => {
              const t = tint(w.boStatus);
              return (
                <tr key={w.workOrderNo} onClick={() => setOpen(w)} className="cursor-pointer border-t border-hairline transition-colors hover:bg-[#0180cf]/6">
                  <td className="px-2 py-2 font-bold text-ink-strong">{w.workOrderNo}</td>
                  <td className="px-2 py-2 text-ink-soft">{w.company || "—"}</td>
                  <td className="max-w-[180px] truncate px-2 py-2 text-ink-soft" title={w.item}>{w.item || "—"}</td>
                  <td className="px-2 py-2"><span className="inline-flex rounded-full px-2 py-0.5 text-[11.5px] font-bold" style={{ background: t.bg, color: t.fg }}>{w.boStatus || "—"}</span></td>
                  <td className="px-2 py-2 text-right">
                    <span className="inline-flex items-center gap-1 text-[12.5px] font-semibold" style={{ color: w.onTime ? "#3f7a14" : "#b45309" }}>
                      <span className="size-1.5 rounded-full" style={{ background: w.onTime ? "#63b81e" : "#f59e0b" }} />
                      {w.onTime ? "On time" : "Delayed"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* detail popup */}
      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={() => setOpen(null)}>
          <div className="w-[min(520px,94vw)] overflow-hidden rounded-2xl border border-white/70 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <header className="relative overflow-hidden px-5 py-4 text-white" style={{ background: "linear-gradient(120deg, #0069b3, #0180cf 55%, #63b81e)" }}>
              <span aria-hidden className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.25) 1px, transparent 0)", backgroundSize: "18px 18px" }} />
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-white/80">Work Order</div>
                  <div className="mt-0.5 text-[20px] font-black tracking-[-0.01em]">{open.workOrderNo}</div>
                  <div className="mt-0.5 text-[12.5px] text-white/85">{open.company}</div>
                </div>
                <button type="button" onClick={() => setOpen(null)} className="rounded-lg p-1.5 text-white/85 hover:bg-white/20"><X size={18} /></button>
              </div>
            </header>
            <div className="grid grid-cols-2 gap-x-5 gap-y-3.5 px-5 py-5">
              <Detail icon={Boxes} label="Item" value={open.item} span />
              <Detail icon={FileText} label="Sales Order" value={open.ourSoNo} />
              <Detail icon={ClipboardCheck} label="BOM No" value={open.bomNo} />
              <Detail icon={Building2} label="PO No" value={open.poNo} />
              <Detail icon={PackageCheck} label="Status" value={open.boStatus} />
              <Detail icon={CalendarClock} label="WO Date" value={open.workOrderDate} />
              <Detail icon={CalendarClock} label="Target Dispatch" value={open.targetDate} />
              <Detail icon={CalendarClock} label="Actual Dispatch" value={open.actualDate} />
              <div className="col-span-2 mt-1 flex items-center gap-2 rounded-xl px-3 py-2 text-[12.5px] font-bold" style={{ background: open.onTime ? "rgba(99,184,30,0.12)" : "rgba(245,158,11,0.12)", color: open.onTime ? "#3f7a14" : "#b45309" }}>
                <span className="size-2 rounded-full" style={{ background: open.onTime ? "#63b81e" : "#f59e0b" }} />
                {open.onTime ? "Dispatched on or before the target date." : "Dispatched after the target date."}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ icon: Icon, label, value, span }: { icon: typeof Building2; label: string; value: string; span?: boolean }) {
  return (
    <div className={span ? "col-span-2" : ""}>
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.05em] text-slate-400">
        <Icon size={13} strokeWidth={2.3} className="text-[#0069b3]" /> {label}
      </div>
      <div className="mt-0.5 text-[14px] font-semibold text-slate-800 break-words">{value || "—"}</div>
    </div>
  );
}
