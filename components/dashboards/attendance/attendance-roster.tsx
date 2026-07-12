"use client";

import * as React from "react";
import { X, Building2, CalendarCheck, CalendarX, Clock, UserCheck } from "lucide-react";
import { EmployeeAvatar } from "@/components/ui/employee-avatar";

export interface RosterMember {
  name: string;
  dept: string;
  workingDays: number;
  present: number;
  leave: number;
  late: number;
  absent: number;
  punctualityPct: number;
  attendancePct: number;
  status: "Present" | "On Leave" | "Absent";
}

const STATUS_TINT: Record<RosterMember["status"], { bg: string; fg: string; dot: string }> = {
  Present: { bg: "rgba(99,184,30,0.14)", fg: "#3f7a14", dot: "#63b81e" },
  "On Leave": { bg: "rgba(124,58,237,0.12)", fg: "#6d28d9", dot: "#a855f7" },
  Absent: { bg: "rgba(245,158,11,0.14)", fg: "#b45309", dot: "#f59e0b" },
};

export function AttendanceRoster({ rows }: { rows: RosterMember[] }) {
  const [open, setOpen] = React.useState<RosterMember | null>(null);

  return (
    <div className="relative overflow-hidden rounded-[22px] border border-hairline bg-surface-card p-5 shadow-sm">
      <span aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.5]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(124,58,237,0.05) 1px, transparent 0)", backgroundSize: "22px 22px" }} />
      <div className="relative mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-black text-ink-strong" style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}>Team Roster</h2>
        <span className="text-[11.5px] font-semibold text-ink-subtle">click a member for details</span>
      </div>

      <div className="relative max-h-[360px] overflow-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead className="sticky top-0 bg-surface-card">
            <tr className="text-left text-[11px] font-bold uppercase tracking-[0.05em] text-ink-subtle">
              <th className="px-2 py-1.5">Member</th>
              <th className="px-2 py-1.5">Dept</th>
              <th className="px-2 py-1.5 text-right">Present</th>
              <th className="px-2 py-1.5 text-right">Punctuality</th>
              <th className="px-2 py-1.5">Today</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => {
              const t = STATUS_TINT[m.status];
              return (
                <tr key={m.name} onClick={() => setOpen(m)} className="cursor-pointer border-t border-hairline transition-colors hover:bg-[#7c3aed]/6">
                  <td className="px-2 py-2">
                    <span className="flex items-center gap-2">
                      <EmployeeAvatar name={m.name} size="sm" />
                      <span className="font-bold text-ink-strong">{m.name}</span>
                    </span>
                  </td>
                  <td className="px-2 py-2 text-ink-soft">{m.dept}</td>
                  <td className="px-2 py-2 text-right tabular-nums font-semibold text-ink-soft">{m.present}/{m.workingDays}</td>
                  <td className="px-2 py-2 text-right tabular-nums font-semibold" style={{ color: m.punctualityPct >= 90 ? "#3f7a14" : m.punctualityPct >= 75 ? "#b45309" : "#be123c" }}>{m.punctualityPct}%</td>
                  <td className="px-2 py-2"><span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-bold" style={{ background: t.bg, color: t.fg }}><span className="size-1.5 rounded-full" style={{ background: t.dot }} />{m.status}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={() => setOpen(null)}>
          <div className="w-[min(520px,94vw)] overflow-hidden rounded-2xl border border-white/70 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <header className="relative overflow-hidden px-5 py-4 text-white" style={{ background: "linear-gradient(120deg, #6d28d9, #7c3aed 55%, #a855f7)" }}>
              <span aria-hidden className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.25) 1px, transparent 0)", backgroundSize: "18px 18px" }} />
              <div className="relative flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <EmployeeAvatar name={open.name} size="lg" />
                  <div>
                    <div className="text-[19px] font-black tracking-[-0.01em]">{open.name}</div>
                    <div className="text-[12.5px] text-white/85">{open.dept}</div>
                  </div>
                </div>
                <button type="button" onClick={() => setOpen(null)} className="rounded-lg p-1.5 text-white/85 hover:bg-white/20"><X size={18} /></button>
              </div>
            </header>
            <div className="px-5 py-5">
              <div className="grid grid-cols-4 gap-2.5">
                <Stat icon={CalendarCheck} label="Present" value={`${open.present}`} tint="#3f7a14" />
                <Stat icon={CalendarX} label="Leave" value={`${open.leave}`} tint="#6d28d9" />
                <Stat icon={Clock} label="Late" value={`${open.late}`} tint="#b45309" />
                <Stat icon={UserCheck} label="Attend." value={`${open.attendancePct}%`} tint="#0069b3" />
              </div>
              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-[12px] font-semibold text-slate-500">
                  <span className="inline-flex items-center gap-1.5"><Building2 size={13} className="text-[#7c3aed]" /> Punctuality this month</span>
                  <span className="tabular-nums font-black text-slate-800">{open.punctualityPct}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full" style={{ width: `${open.punctualityPct}%`, background: "linear-gradient(90deg, #7c3aed, #a855f7)" }} />
                </div>
                <p className="mt-3 text-[12.5px] text-slate-500">
                  Out of <b className="text-slate-700">{open.workingDays}</b> working days: <b className="text-slate-700">{open.present}</b> present, <b className="text-slate-700">{open.leave}</b> on leave, <b className="text-slate-700">{open.absent}</b> absent, <b className="text-slate-700">{open.late}</b> late arrivals. <span className="text-slate-400">(sample data)</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, tint }: { icon: typeof CalendarCheck; label: string; value: string; tint: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-2.5 py-2 text-center">
      <Icon size={15} strokeWidth={2.3} className="mx-auto" style={{ color: tint }} />
      <div className="mt-1 text-[18px] font-black tabular-nums text-slate-900" style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}>{value}</div>
      <div className="text-[10.5px] font-bold uppercase tracking-[0.04em] text-slate-400">{label}</div>
    </div>
  );
}
