"use client";

import * as React from "react";
import {
  ClipboardList, Activity, CheckCircle2, XCircle, Clock3, Target, IndianRupee, RefreshCcw, Search, Filter, X,
  Hourglass, BadgeCheck, Rocket, CalendarClock, TrendingUp, PieChart, type LucideIcon,
} from "lucide-react";
import { Section, compactInr, ExportButtons, DetailModal, Gauge, DonutBreakdown, AreaChart, InsightBanner } from "@/components/dashboards/shared/kit";

export type StatusKind = "ga" | "bom" | "wo";

/** One classified register row — the page computes the domain flags; this
 *  component filters, counts KPIs, buckets aging and renders. */
export interface DashRow {
  key: string;
  no: string; // GA/BOM/WO number
  soNo: string;
  company: string;
  item: string;
  status: string;
  date: string; // primary date (yyyy-mm-dd)
  value: number;
  days: number; // production / approval / bom days
  ageDays: number; // age for open items
  open: boolean; // incomplete / unapproved / undispatched
  overdue: boolean;
  approved: boolean;
  rejected: boolean;
  completed: boolean;
  revised: boolean;
  ready: boolean;
  onTime: boolean;
  search: string;
}

export interface HygieneRow {
  field: string;
  blanks: number;
  fillPct: number;
}

interface Tile { label: string; value: string; sub?: string; from: string; to: string; icon: LucideIcon }

const sum = (rows: DashRow[], f: (r: DashRow) => number) => rows.reduce((a, r) => a + f(r), 0);
const avg = (nums: number[]) => (nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0);

function buildTiles(kind: StatusKind, r: DashRow[]): Tile[] {
  const total = r.length;
  const value = sum(r, (x) => x.value);
  if (kind === "ga") {
    const approved = r.filter((x) => x.approved).length;
    const rejected = r.filter((x) => x.rejected).length;
    const pending = r.filter((x) => x.open && !x.rejected).length;
    const overdue = r.filter((x) => x.open && x.overdue).length;
    return [
      { label: "GA Required", value: String(total), sub: "Nos", from: "#2a78d6", to: "#185fa5", icon: ClipboardList },
      { label: "Approved", value: String(approved), sub: "Nos", from: "#63b81e", to: "#4a9616", icon: BadgeCheck },
      { label: "Pending", value: String(pending), sub: "Nos", from: "#f59e0b", to: "#d97706", icon: Clock3 },
      { label: "Rejected", value: String(rejected), sub: "Nos", from: "#ef4444", to: "#b91c1c", icon: XCircle },
      { label: "Overdue GA", value: String(overdue), sub: "Nos", from: "#b45309", to: "#92400e", icon: Hourglass },
      { label: "Approval", value: (total ? Math.round((approved / total) * 100) : 0) + "%", from: "#7c3aed", to: "#6d28d9", icon: Target },
      { label: "Avg Days", value: String(avg(r.filter((x) => x.approved && x.days > 0).map((x) => x.days))), sub: "days", from: "#0a7d8a", to: "#0069b3", icon: CalendarClock },
      { label: "Overdue Rate", value: (total ? Math.round((overdue / total) * 100) : 0) + "%", from: "#0180cf", to: "#63b81e", icon: Activity },
    ];
  }
  if (kind === "bom") {
    const completed = r.filter((x) => x.completed).length;
    const revised = r.filter((x) => x.revised).length;
    const active = r.filter((x) => x.open).length;
    const overdue = r.filter((x) => x.open && x.overdue).length;
    return [
      { label: "BOM Created", value: String(total), sub: "Nos", from: "#2a78d6", to: "#185fa5", icon: ClipboardList },
      { label: "Completed", value: String(completed), sub: "Nos", from: "#63b81e", to: "#4a9616", icon: CheckCircle2 },
      { label: "Revised", value: String(revised), sub: "Nos", from: "#7c3aed", to: "#6d28d9", icon: RefreshCcw },
      { label: "Active BOM", value: String(active), sub: "Nos", from: "#0180cf", to: "#0069b3", icon: Activity },
      { label: "Overdue BOM", value: String(overdue), sub: "Nos", from: "#ef4444", to: "#b91c1c", icon: Hourglass },
      { label: "Avg Days", value: String(avg(r.filter((x) => x.days > 0).map((x) => x.days))), sub: "days", from: "#b45309", to: "#92400e", icon: CalendarClock },
      { label: "BOM Value", value: compactInr(value), from: "#0a7d8a", to: "#0069b3", icon: IndianRupee },
      { label: "Avg BOM", value: compactInr(total ? value / total : 0), from: "#63b81e", to: "#0180cf", icon: IndianRupee },
    ];
  }
  // wo
  const completed = r.filter((x) => x.completed).length;
  const active = r.filter((x) => x.open && x.no).length;
  const delayed = r.filter((x) => x.open && x.overdue).length;
  const pending = r.filter((x) => x.open).length;
  const ready = r.filter((x) => x.ready).length;
  const onTime = r.filter((x) => x.completed && x.onTime).length;
  return [
    { label: "Total WO", value: String(total), sub: "Nos", from: "#2a78d6", to: "#185fa5", icon: ClipboardList },
    { label: "Active WO", value: String(active), sub: "Nos", from: "#0180cf", to: "#0069b3", icon: Activity },
    { label: "Completed WO", value: String(completed), sub: "Nos", from: "#63b81e", to: "#4a9616", icon: CheckCircle2 },
    { label: "Delayed WO", value: String(delayed), sub: "Nos", from: "#ef4444", to: "#b91c1c", icon: Hourglass },
    { label: "Pending WO", value: String(pending), sub: "Nos", from: "#f59e0b", to: "#d97706", icon: Clock3 },
    { label: "On Time", value: (completed ? Math.round((onTime / completed) * 100) : 0) + "%", from: "#7c3aed", to: "#6d28d9", icon: Target },
    { label: "Ready to Dispatch", value: String(ready), sub: "Nos", from: "#0a7d8a", to: "#0069b3", icon: Rocket },
    { label: "Avg Production", value: String(avg(r.filter((x) => x.days > 0).map((x) => x.days))), sub: "days", from: "#63b81e", to: "#0180cf", icon: CalendarClock },
  ];
}

const NO_LABEL: Record<StatusKind, string> = { ga: "GA No", bom: "BOM No", wo: "WO No" };

export function RegisterStatusDashboard({ kind, rows }: { kind: StatusKind; rows: DashRow[] }) {
  const [q, setQ] = React.useState("");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [customer, setCustomer] = React.useState("");
  const [item, setItem] = React.useState("");
  const [stat, setStat] = React.useState("");
  const [trendYear, setTrendYear] = React.useState("");
  const [agingBucket, setAgingBucket] = React.useState<number | null>(null);

  const trendYears = React.useMemo(() => Array.from(new Set(rows.map((r) => r.date?.slice(0, 4)).filter(Boolean))).sort((a, b) => b!.localeCompare(a!)), [rows]);

  const customers = React.useMemo(() => Array.from(new Set(rows.map((r) => r.company).filter(Boolean))).sort(), [rows]);
  const items = React.useMemo(() => Array.from(new Set(rows.map((r) => r.item).filter(Boolean))).sort(), [rows]);
  const statuses = React.useMemo(() => Array.from(new Set(rows.map((r) => r.status).filter(Boolean))).sort(), [rows]);

  const f = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (from && r.date < from) return false;
      if (to && r.date > to) return false;
      if (customer && r.company !== customer) return false;
      if (item && r.item !== item) return false;
      if (stat && r.status !== stat) return false;
      if (needle && !r.search.includes(needle)) return false;
      return true;
    });
  }, [rows, q, from, to, customer, item, stat]);

  const tiles = React.useMemo(() => buildTiles(kind, f), [kind, f]);

  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const primary = React.useMemo(() => {
    const total = f.length;
    if (kind === "ga") return { pct: total ? Math.round((f.filter((x) => x.approved).length / total) * 100) : 0, label: "Approval Rate", sub: `${f.filter((x) => x.approved).length}/${total} approved` };
    if (kind === "bom") return { pct: total ? Math.round((f.filter((x) => x.completed).length / total) * 100) : 0, label: "Completion", sub: `${f.filter((x) => x.completed).length}/${total} completed` };
    const done = f.filter((x) => x.completed).length;
    const ot = f.filter((x) => x.completed && x.onTime).length;
    return { pct: done ? Math.round((ot / done) * 100) : 0, label: "On-time Rate", sub: `${ot}/${done} on time` };
  }, [kind, f]);

  const statusDist = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const r of f) m.set(r.status || "—", (m.get(r.status || "—") ?? 0) + 1);
    return Array.from(m.entries()).map(([label, value]) => ({ label, value }));
  }, [f]);

  const trend = React.useMemo(() => {
    if (trendYear) {
      const counts = new Array(12).fill(0);
      for (const r of f) if (r.date && r.date.slice(0, 4) === trendYear) { const mo = Number(r.date.slice(5, 7)) - 1; if (mo >= 0 && mo < 12) counts[mo]++; }
      return MON.map((label, i) => ({ label, value: counts[i] }));
    }
    const m = new Map<string, number>();
    for (const r of f) if (r.date) m.set(r.date.slice(0, 7), (m.get(r.date.slice(0, 7)) ?? 0) + 1);
    return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-8).map(([key, v]) => ({ label: MON[Number(key.slice(5, 7)) - 1] ?? key, value: v }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f, trendYear]);

  const openCount = f.filter((x) => x.open).length;
  const overdueCount = f.filter((x) => x.open && x.overdue).length;

  const aging = React.useMemo(() => {
    const b: { label: string; rows: DashRow[] }[] = [
      { label: "0–7 days", rows: [] },
      { label: "8–15 days", rows: [] },
      { label: "16–30 days", rows: [] },
      { label: "30+ days", rows: [] },
    ];
    for (const r of f) {
      if (!r.open) continue;
      const d = r.ageDays;
      const i = d <= 7 ? 0 : d <= 15 ? 1 : d <= 30 ? 2 : 3;
      b[i]!.rows.push(r);
    }
    return b;
  }, [f]);
  const agingMax = Math.max(1, ...aging.map((a) => a.rows.length));

  const reset = () => { setQ(""); setFrom(""); setTo(""); setCustomer(""); setItem(""); setStat(""); };
  const anyFilter = q || from || to || customer || item || stat;
  const statusLabel = kind === "bom" ? "BOM statuses" : kind === "ga" ? "GA statuses" : kind === "wo" ? "WO statuses" : "statuses";
  const searchPlaceholder = kind === "bom" ? "Search SO No / BOM No…" : kind === "wo" ? "Search WO No / SO No…" : "Search…";

  return (
    <div className="mt-4 space-y-4">
      {/* filter bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={searchPlaceholder} className="h-9 w-[220px] max-w-[52vw] rounded-lg border border-slate-200 bg-white pl-8 pr-2.5 text-[13px] outline-none focus:border-[#0180cf]" />
        </div>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} title="Start date" className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-[12.5px] outline-none focus:border-[#0180cf]" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} title="End date" className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-[12.5px] outline-none focus:border-[#0180cf]" />
        {statuses.length > 0 && <select value={stat} onChange={(e) => setStat(e.target.value)} className="h-9 max-w-[170px] rounded-lg border border-slate-200 bg-white px-2 text-[12.5px] font-semibold text-slate-600 outline-none focus:border-[#0180cf]"><option value="">All {statusLabel}</option>{statuses.map((s) => <option key={s} value={s}>{s}</option>)}</select>}
        {customers.length > 0 && <select value={customer} onChange={(e) => setCustomer(e.target.value)} className="h-9 max-w-[180px] rounded-lg border border-slate-200 bg-white px-2 text-[12.5px] font-semibold text-slate-600 outline-none focus:border-[#0180cf]"><option value="">All customers</option>{customers.map((c) => <option key={c} value={c}>{c}</option>)}</select>}
        {items.length > 0 && <select value={item} onChange={(e) => setItem(e.target.value)} className="h-9 max-w-[170px] rounded-lg border border-slate-200 bg-white px-2 text-[12.5px] font-semibold text-slate-600 outline-none focus:border-[#0180cf]"><option value="">All items</option>{items.map((it) => <option key={it} value={it}>{it}</option>)}</select>}
        {anyFilter && <button type="button" onClick={reset} className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-[12.5px] font-bold text-slate-500 hover:text-[#0069b3]"><X size={13} /> Clear</button>}
        <span className="ml-auto flex items-center gap-2 text-[12px] font-semibold text-slate-400"><Filter size={13} /> {f.length} of {rows.length}
          <ExportButtons filename={`${kind}-status`} headers={[NO_LABEL[kind], "SO No", "Customer", "Item", "Status", "Date", "Days", "Value"]} rows={f.map((r) => [r.no, r.soNo, r.company, r.item, r.status, r.date, r.days, r.value])} />
        </span>
      </div>

      {/* headline insight */}
      <InsightBanner right={`${primary.pct}% ${primary.label}`}>
        {f.length} record{f.length === 1 ? "" : "s"} in view · <b>{openCount}</b> open{overdueCount > 0 ? <> · <b className="text-[#b45309]">{overdueCount} overdue</b></> : null}
      </InsightBanner>

      {/* KPI grid */}
      <Section title="Overview" Icon={Target}>
        <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-3 max-sm:grid-cols-2">
          {tiles.map((t) => (
            <div key={t.label} className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-[#f6fafd] p-3.5 shadow-[0_10px_26px_-20px_rgba(1,128,207,0.4)]">
              <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${t.from}, ${t.to})` }} />
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10.5px] font-black uppercase tracking-[0.05em] text-slate-400">{t.label}</div>
                <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-white shadow-sm" style={{ background: `linear-gradient(140deg, ${t.from}, ${t.to})` }}><t.icon size={13} strokeWidth={2.4} /></span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="tabular-nums text-slate-900" style={{ fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 900, fontSize: 22, letterSpacing: "-0.02em", lineHeight: 1 }}>{t.value}</span>
                {t.sub && <span className="text-[10.5px] font-bold text-slate-400">{t.sub}</span>}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* advanced charts row */}
      <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-1">
        <Section title={primary.label} Icon={Target}>
          <div className="flex flex-col items-center py-2">
            <Gauge pct={primary.pct} label={primary.label} sub={primary.sub} />
          </div>
        </Section>
        <Section title="Status Distribution" Icon={PieChart}>
          <DonutBreakdown data={statusDist} centerLabel="Total" />
        </Section>
        <Section title="Monthly Trend" Icon={TrendingUp}>
          <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-slate-500">
            <span>Year</span>
            <select value={trendYear} onChange={(e) => setTrendYear(e.target.value)} className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[12px] font-semibold text-slate-600 outline-none focus:border-[#0180cf]">
              <option value="">Recent (last 8 mo)</option>
              {trendYears.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <AreaChart data={trend} />
        </Section>
      </div>

      {/* Aging (open items) */}
      <Section title="Aging (open items)" Icon={Hourglass}>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3.5 pt-1 max-md:grid-cols-1">
          {aging.map((a, i) => (
            <button key={a.label} type="button" onClick={() => a.rows.length && setAgingBucket(i)} disabled={a.rows.length === 0} className="w-full text-left transition-transform hover:-translate-y-0.5 disabled:cursor-default">
              <div className="mb-1 flex items-center justify-between text-[12.5px] font-bold text-slate-600"><span>{a.label}</span><span className="tabular-nums font-black text-slate-800">{a.rows.length}</span></div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100" style={{ boxShadow: "inset 0 1px 2px rgba(15,23,42,0.09)" }}>
                <div className="relative h-full rounded-full transition-[width] duration-700" style={{ width: `${Math.max(4, (a.rows.length / agingMax) * 100)}%`, background: "linear-gradient(90deg, #f59e0b, #ef4444)" }}><span aria-hidden className="absolute inset-x-0 top-0 h-1/2 rounded-full bg-white/30" /></div>
              </div>
            </button>
          ))}
        </div>
        <p className="pt-3 text-[10.5px] font-semibold text-slate-400">Click a bar for the items in that aging bucket.</p>
      </Section>

      {/* Aging popup */}
      {agingBucket != null && aging[agingBucket] && (
        <DetailModal title={`Open items aging ${aging[agingBucket]!.label}`} subtitle={`${aging[agingBucket]!.rows.length} item${aging[agingBucket]!.rows.length === 1 ? "" : "s"}`} Icon={Hourglass} from="#f59e0b" to="#d97706" onClose={() => setAgingBucket(null)}>
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="text-left text-[10.5px] font-extrabold uppercase tracking-[0.04em] text-slate-400">
                <th className="px-2 py-1.5">{NO_LABEL[kind]}</th><th className="px-2 py-1.5">SO No</th><th className="px-2 py-1.5">Customer</th><th className="px-2 py-1.5 text-center">Age</th><th className="px-2 py-1.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {aging[agingBucket]!.rows.slice().sort((a, b) => b.ageDays - a.ageDays).map((r, i) => (
                <tr key={r.key + i} className="border-t border-slate-100">
                  <td className="px-2 py-1.5 font-bold text-slate-700">{r.no || "—"}</td>
                  <td className="px-2 py-1.5 text-slate-600">{r.soNo || "—"}</td>
                  <td className="px-2 py-1.5 text-slate-600">{r.company || "—"}</td>
                  <td className="px-2 py-1.5 text-center tabular-nums font-black text-[#b45309]">{r.ageDays}d</td>
                  <td className="px-2 py-1.5 text-slate-600">{r.status || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DetailModal>
      )}
    </div>
  );
}
