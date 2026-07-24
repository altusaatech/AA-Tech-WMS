"use client";

import * as React from "react";
import { ClipboardList, Activity, CheckCircle2, XCircle, Clock3, Target, IndianRupee, RefreshCcw, Search, Filter, X, Users, Trophy, Hourglass, type LucideIcon } from "lucide-react";
import { Section, compactInr, ExportButtons } from "@/components/dashboards/shared/kit";

export interface SoRow {
  soNo: string;
  enquiryNo: string;
  poNo: string;
  company: string;
  item: string;
  value: number;
  salesperson: string;
  soDate: string;
  targetDate: string;
  actualDate: string;
  dispatched: boolean;
  overdue: boolean;
  delayDays: number;
  amended: boolean;
  ageDays: number; // days since SO date (for undispatched)
}

export function SalesOrderStatusDashboard({ rows }: { rows: SoRow[] }) {
  const [q, setQ] = React.useState("");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [customer, setCustomer] = React.useState("");
  const [stat, setStat] = React.useState("");

  const customers = React.useMemo(() => Array.from(new Set(rows.map((r) => r.company).filter(Boolean))).sort(), [rows]);

  const f = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (from && r.soDate < from) return false;
      if (to && r.soDate > to) return false;
      if (customer && r.company !== customer) return false;
      if (stat === "active" && (r.dispatched || !r.soNo)) return false;
      if (stat === "completed" && !r.dispatched) return false;
      if (stat === "pending" && !(!r.dispatched && r.overdue)) return false;
      if (needle && ![r.soNo, r.enquiryNo, r.poNo, r.company, r.item, r.salesperson].some((v) => v.toLowerCase().includes(needle))) return false;
      return true;
    });
  }, [rows, q, from, to, customer, stat]);

  const total = f.length;
  const completed = f.filter((r) => r.dispatched).length;
  const active = f.filter((r) => !r.dispatched && !!r.soNo).length;
  const pending = f.filter((r) => !r.dispatched && r.overdue).length;
  const cancelled = 0; // no cancel field in the SO register yet
  const conversion = total ? Math.round((completed / total) * 100) : 0;
  const soValue = f.reduce((a, r) => a + (r.value || 0), 0);
  const amendments = f.filter((r) => r.amended).length;

  const tiles: { label: string; value: string; sub?: string; from: string; to: string; Icon: LucideIcon }[] = [
    { label: "Total SO", value: String(total), sub: "Nos", from: "#2a78d6", to: "#185fa5", Icon: ClipboardList },
    { label: "Active SO", value: String(active), sub: "Nos", from: "#0180cf", to: "#0069b3", Icon: Activity },
    { label: "Completed SO", value: String(completed), sub: "Nos", from: "#63b81e", to: "#4a9616", Icon: CheckCircle2 },
    { label: "Cancelled SO", value: String(cancelled), sub: "Nos", from: "#ef4444", to: "#b91c1c", Icon: XCircle },
    { label: "Pending SO", value: String(pending), sub: "Nos", from: "#f59e0b", to: "#d97706", Icon: Clock3 },
    { label: "Conversion", value: conversion + "%", from: "#7c3aed", to: "#6d28d9", Icon: Target },
    { label: "SO Value", value: compactInr(soValue), from: "#0a7d8a", to: "#0069b3", Icon: IndianRupee },
    { label: "Amendments", value: String(amendments), sub: "orders", from: "#b45309", to: "#92400e", Icon: RefreshCcw },
  ];

  // Top customers by SO value
  const topCustomers = React.useMemo(() => {
    const m = new Map<string, { value: number; count: number }>();
    for (const r of f) {
      const c = r.company || "—";
      const ex = m.get(c) ?? { value: 0, count: 0 };
      ex.value += r.value || 0;
      ex.count += 1;
      m.set(c, ex);
    }
    return Array.from(m.entries()).map(([company, v]) => ({ company, ...v })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [f]);

  // Salesperson leaderboard by no. of orders
  const leaderboard = React.useMemo(() => {
    const m = new Map<string, { count: number; value: number }>();
    for (const r of f) {
      const s = r.salesperson || "—";
      const ex = m.get(s) ?? { count: 0, value: 0 };
      ex.count += 1;
      ex.value += r.value || 0;
      m.set(s, ex);
    }
    return Array.from(m.entries()).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [f]);

  // Aging buckets (undispatched SOs by days since SO date)
  const aging = React.useMemo(() => {
    const b = [
      { label: "0–7 days", count: 0 },
      { label: "8–15 days", count: 0 },
      { label: "16–30 days", count: 0 },
      { label: "30+ days", count: 0 },
    ];
    for (const r of f) {
      if (r.dispatched) continue;
      const d = r.ageDays;
      if (d <= 7) b[0]!.count++;
      else if (d <= 15) b[1]!.count++;
      else if (d <= 30) b[2]!.count++;
      else b[3]!.count++;
    }
    return b;
  }, [f]);
  const agingMax = Math.max(1, ...aging.map((a) => a.count));

  const reset = () => { setQ(""); setFrom(""); setTo(""); setCustomer(""); setStat(""); };
  const anyFilter = q || from || to || customer || stat;

  return (
    <div className="mt-6 space-y-5">
      {/* filter bar */}
      <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search SO / PO / customer…" className="h-9 w-[240px] max-w-[52vw] rounded-lg border border-slate-200 bg-white pl-8 pr-2.5 text-[13px] outline-none focus:border-[#0180cf]" />
        </div>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} title="Start date" className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-[12.5px] outline-none focus:border-[#0180cf]" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} title="End date" className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-[12.5px] outline-none focus:border-[#0180cf]" />
        <select value={stat} onChange={(e) => setStat(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-[12.5px] font-semibold text-slate-600 outline-none focus:border-[#0180cf]"><option value="">All statuses</option><option value="active">Active</option><option value="completed">Completed</option><option value="pending">Pending (overdue)</option></select>
        <select value={customer} onChange={(e) => setCustomer(e.target.value)} className="h-9 max-w-[180px] rounded-lg border border-slate-200 bg-white px-2 text-[12.5px] font-semibold text-slate-600 outline-none focus:border-[#0180cf]"><option value="">All customers</option>{customers.map((c) => <option key={c} value={c}>{c}</option>)}</select>
        {anyFilter && <button type="button" onClick={reset} className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-[12.5px] font-bold text-slate-500 hover:text-[#0069b3]"><X size={13} /> Clear</button>}
        <span className="ml-auto flex items-center gap-2 text-[12px] font-semibold text-slate-400"><Filter size={13} /> {f.length} of {rows.length}
          <ExportButtons filename="so-status" headers={["SO No", "Enquiry No", "PO No", "Customer", "Item", "Value", "Salesperson", "SO Date", "Dispatched", "Delay Days"]} rows={f.map((r) => [r.soNo, r.enquiryNo, r.poNo, r.company, r.item, r.value, r.salesperson, r.soDate, r.dispatched ? "Yes" : "No", r.delayDays])} />
        </span>
      </div>

      {/* KPI grid */}
      <Section title="Sales Order Status — Overview" Icon={Target}>
        <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-3 max-sm:grid-cols-2">
          {tiles.map((t) => (
            <div key={t.label} className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-[#f6fafd] p-3.5 shadow-[0_10px_26px_-20px_rgba(1,128,207,0.4)]">
              <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${t.from}, ${t.to})` }} />
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10.5px] font-black uppercase tracking-[0.05em] text-slate-400">{t.label}</div>
                <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-white shadow-sm" style={{ background: `linear-gradient(140deg, ${t.from}, ${t.to})` }}><t.Icon size={13} strokeWidth={2.4} /></span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="tabular-nums text-slate-900" style={{ fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 900, fontSize: 22, letterSpacing: "-0.02em", lineHeight: 1 }}>{t.value}</span>
                {t.sub && <span className="text-[10.5px] font-bold text-slate-400">{t.sub}</span>}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Top customers + Leaderboard + Aging */}
      <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-1">
        <Section title="Top Customers" Icon={Users}>
          {topCustomers.length === 0 ? <p className="py-6 text-center text-[13px] text-slate-400">No data.</p> : (
            <ol className="space-y-2">
              {topCustomers.map((c, i) => (
                <li key={c.company} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2">
                  <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-black text-white" style={{ background: "linear-gradient(135deg, #63b81e, #0180cf)" }}>{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-slate-700" title={c.company}>{c.company}</span>
                  <span className="shrink-0 text-right"><span className="block text-[13px] font-black tabular-nums text-[#0069b3]">{compactInr(c.value)}</span><span className="text-[10.5px] font-semibold text-slate-400">{c.count} order{c.count === 1 ? "" : "s"}</span></span>
                </li>
              ))}
            </ol>
          )}
        </Section>

        <Section title="Salesperson Leaderboard" Icon={Trophy}>
          {leaderboard.length === 0 ? <p className="py-6 text-center text-[13px] text-slate-400">No data.</p> : (
            <ol className="space-y-2">
              {leaderboard.map((s, i) => (
                <li key={s.name} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2">
                  <span className={`inline-flex size-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-black ${i === 0 ? "text-white" : "text-slate-600 bg-slate-100"}`} style={i === 0 ? { background: "linear-gradient(135deg, #f59e0b, #d97706)" } : undefined}>{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-slate-700" title={s.name}>{s.name}</span>
                  <span className="shrink-0 text-right"><span className="block text-[14px] font-black tabular-nums text-slate-800">{s.count}</span><span className="text-[10.5px] font-semibold text-slate-400">{compactInr(s.value)}</span></span>
                </li>
              ))}
            </ol>
          )}
        </Section>

        <Section title="Order Aging (undispatched)" Icon={Hourglass}>
          <div className="space-y-3.5 pt-1">
            {aging.map((a) => (
              <div key={a.label}>
                <div className="mb-1 flex items-center justify-between text-[12.5px] font-bold text-slate-600"><span>{a.label}</span><span className="tabular-nums font-black text-slate-800">{a.count}</span></div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100" style={{ boxShadow: "inset 0 1px 2px rgba(15,23,42,0.09)" }}>
                  <div className="relative h-full rounded-full transition-[width] duration-700" style={{ width: `${Math.max(4, (a.count / agingMax) * 100)}%`, background: "linear-gradient(90deg, #f59e0b, #ef4444)", boxShadow: "0 1px 6px -1px rgba(239,68,68,0.5)" }}><span aria-hidden className="absolute inset-x-0 top-0 h-1/2 rounded-full bg-white/30" /></div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
