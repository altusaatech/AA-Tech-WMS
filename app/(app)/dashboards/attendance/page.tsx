import Link from "next/link";
import type { Route } from "next";
import { ArrowLeft, CalendarCheck, Users, UserCheck, CalendarX, Clock, Percent, TrendingUp, Lightbulb, Building2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { requireUser } from "@/lib/auth/current";
import { db } from "@/lib/db";
import { employees } from "@/db/schema";
import { AttendanceRoster, type RosterMember } from "@/components/dashboards/attendance/attendance-roster";

export const dynamic = "force-dynamic";

const WORKING_DAYS = 22;
const DEPTS = ["Production", "Design", "Sales", "Stores", "QC", "Admin"];

// Deterministic hash so the dummy figures are stable between renders.
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export default async function AttendanceDashboardPage() {
  await requireUser();

  let team: { name: string; department: string | null }[] = [];
  let partialError = false;
  try {
    team = await db.select({ name: employees.name, department: employees.department }).from(employees);
  } catch {
    partialError = true;
  }

  // Build sample attendance metrics per real team member (values are dummy).
  const members: RosterMember[] = team
    .map((e) => {
      const h = hash(e.name);
      const leave = h % 3;
      const late = (h >> 3) % 4;
      const absent = (h >> 6) % 6 === 0 ? 1 : 0;
      const present = WORKING_DAYS - leave - absent;
      const roll = h % 10;
      const status: RosterMember["status"] = roll < 7 ? "Present" : roll < 9 ? "On Leave" : "Absent";
      return {
        name: e.name,
        dept: (e.department ?? "").trim() || DEPTS[h % DEPTS.length]!,
        workingDays: WORKING_DAYS,
        present,
        leave,
        late,
        absent,
        punctualityPct: Math.round(((present - late) / present) * 100),
        attendancePct: Math.round((present / WORKING_DAYS) * 100),
        status,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const headcount = members.length;
  const presentToday = members.filter((m) => m.status === "Present").length;
  const onLeaveToday = members.filter((m) => m.status === "On Leave").length;
  const absentToday = members.filter((m) => m.status === "Absent").length;
  const avg = (fn: (m: RosterMember) => number) => (headcount ? Math.round(members.reduce((s, m) => s + fn(m), 0) / headcount) : 0);
  const avgAttendance = avg((m) => m.attendancePct);
  const avgPunctuality = avg((m) => m.punctualityPct);

  // Department breakdown.
  const deptMap = new Map<string, number>();
  for (const m of members) deptMap.set(m.dept, (deptMap.get(m.dept) ?? 0) + 1);
  const depts = Array.from(deptMap.entries()).sort(([, a], [, b]) => b - a);
  const deptMax = Math.max(1, ...depts.map(([, v]) => v));

  // Last 7 working-days present trend (sample, derived from the roster).
  const base = Math.round((headcount * avgAttendance) / 100);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Mon"];
  const trend = days.map((d, i) => ({ day: d, present: Math.max(0, Math.min(headcount, base - (i % 3) + ((i + 1) % 2))) }));
  const trendMax = Math.max(1, headcount);

  const insights: string[] = [];
  if (headcount) {
    insights.push(`${presentToday} of ${headcount} present today (${Math.round((presentToday / headcount) * 100)}%).`);
    if (onLeaveToday) insights.push(`${onLeaveToday} on leave, ${absentToday} unplanned absent today.`);
    insights.push(`Average attendance ${avgAttendance}% and punctuality ${avgPunctuality}% this month.`);
    if (depts[0]) insights.push(`${depts[0][0]} is the largest department (${depts[0][1]} members).`);
    const late = members.filter((m) => m.late >= 3).length;
    if (late) insights.push(`${late} member${late === 1 ? "" : "s"} had 3+ late arrivals — worth a check-in.`);
  } else {
    insights.push("No team members found to build attendance from.");
  }

  return (
    <main className="mx-auto max-w-[1600px] px-8 pb-16 pt-8 max-md:px-4">
      <header
        className="relative overflow-hidden rounded-[28px] border border-white/80 px-9 py-7 max-md:px-5 max-md:py-6"
        style={{ background: "linear-gradient(120deg, #f3eefc 0%, #ffffff 48%, #f0f7ff 100%)", boxShadow: "0 28px 64px -38px rgba(60,20,110,0.30), inset 0 1px 0 rgba(255,255,255,0.9)" }}
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.6]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(124,58,237,0.06) 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <CalendarCheck aria-hidden className="pointer-events-none absolute -right-6 -top-8 text-[#7c3aed]" size={180} strokeWidth={1.2} style={{ opacity: 0.06 }} />
        <div className="relative">
          <Link href={"/dashboards" as Route} className="mb-2 inline-flex h-8 items-center gap-1.5 rounded-lg border border-hairline bg-white px-2.5 text-[12.5px] font-bold text-ink-soft shadow-sm transition-colors hover:bg-surface-soft">
            <ArrowLeft size={14} strokeWidth={2.6} /> Dashboards
          </Link>
          <div className="flex items-center gap-3">
            <span className="inline-flex size-12 items-center justify-center rounded-2xl text-white shadow-lg" style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", boxShadow: "0 14px 30px -14px #6d28d9" }}>
              <CalendarCheck size={24} strokeWidth={2.3} />
            </span>
            <div>
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                <span className="relative flex size-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#a855f7] opacity-75" /><span className="relative inline-flex size-1.5 rounded-full bg-[#a855f7]" /></span>
                Sample data · Workforce
              </div>
              <h1 className="mt-0.5 text-[26px] font-black tracking-[-0.03em] text-ink-strong" style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}>Attendance &amp; Workforce</h1>
              <p className="text-[13px] font-medium text-ink-subtle">Presence, punctuality, leave &amp; department breakdown</p>
            </div>
          </div>
        </div>
      </header>

      {partialError && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-[13px] font-semibold text-amber-800">The team roster was slow to load — refresh to retry.</div>
      )}

      <div className="mt-6 grid grid-cols-5 gap-4 max-xl:grid-cols-3 max-sm:grid-cols-2">
        <Kpi label="Headcount" value={headcount} Icon={Users} from="#7c3aed" to="#6d28d9" />
        <Kpi label="Present Today" value={presentToday} Icon={UserCheck} from="#63b81e" to="#3f7a14" />
        <Kpi label="On Leave" value={onLeaveToday} Icon={CalendarX} from="#a855f7" to="#7c3aed" />
        <Kpi label="Avg Attendance" value={avgAttendance} suffix="%" Icon={Percent} from="#0180cf" to="#0069b3" />
        <Kpi label="Avg Punctuality" value={avgPunctuality} suffix="%" Icon={Clock} from="#0a7d8a" to="#0069b3" />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-5 max-lg:grid-cols-1">
        <section className="relative overflow-hidden rounded-[22px] border border-hairline bg-surface-card p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-[15px] font-black text-ink-strong" style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}><Building2 size={16} className="text-[#7c3aed]" /> Department Breakdown</h2>
          <div className="space-y-3">
            {depts.map(([name, v]) => (
              <div key={name}>
                <div className="mb-1 flex items-center justify-between text-[12.5px] font-semibold text-ink-soft">
                  <span>{name}</span>
                  <span className="tabular-nums font-black text-ink-strong">{v}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full" style={{ width: `${Math.max(4, (v / deptMax) * 100)}%`, background: "linear-gradient(90deg, #7c3aed, #a855f7)" }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[22px] border border-hairline bg-surface-card p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-[15px] font-black text-ink-strong" style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}><TrendingUp size={16} className="text-[#0069b3]" /> Present · Last 7 Days</h2>
          <div className="flex h-40 items-end gap-3">
            {trend.map((t, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-[12px] font-black tabular-nums text-ink-strong">{t.present}</span>
                <div className="w-full rounded-t-lg" style={{ height: `${(t.present / trendMax) * 100}%`, minHeight: 6, background: "linear-gradient(180deg, #a855f7, #0180cf)" }} />
                <span className="text-[10.5px] font-semibold text-ink-subtle">{t.day}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-5 max-lg:grid-cols-1">
        <section className="relative overflow-hidden rounded-[22px] border border-hairline p-5 shadow-sm" style={{ background: "linear-gradient(135deg, #f3eefc, #faf7ff)" }}>
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.5]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(124,58,237,0.08) 1px, transparent 0)", backgroundSize: "20px 20px" }} />
          <h2 className="relative mb-3 flex items-center gap-2 text-[15px] font-black text-ink-strong" style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}><Lightbulb size={16} className="text-[#7c3aed]" /> Insights</h2>
          <ul className="relative space-y-2.5">
            {insights.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-[13px] font-medium text-slate-700"><span className="mt-1.5 inline-block size-1.5 shrink-0 rounded-full bg-[#a855f7]" /> {t}</li>
            ))}
          </ul>
        </section>
        <div className="col-span-2 max-lg:col-span-1">
          <AttendanceRoster rows={members} />
        </div>
      </div>
    </main>
  );
}

function Kpi({ label, value, suffix, Icon, from, to }: { label: string; value: number; suffix?: string; Icon: LucideIcon; from: string; to: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span aria-hidden className="absolute inset-x-0 top-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${from}, ${to})` }} />
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-slate-400">{label}</span>
        <span className="inline-flex size-7 items-center justify-center rounded-lg text-white shadow" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}><Icon size={15} strokeWidth={2.4} /></span>
      </div>
      <span className="mt-2 block tabular-nums text-slate-900" style={{ fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 900, fontSize: "clamp(24px, 2.4vw, 34px)", letterSpacing: "-0.025em", lineHeight: 1 }}>{value}{suffix}</span>
    </div>
  );
}
