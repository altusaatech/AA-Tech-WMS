"use client";

import * as React from "react";
import { Inbox, Send, BadgeCheck, X, Clock3, Target, IndianRupee, Search, Filter, TrendingUp, PieChart, Trophy, BarChart3, type LucideIcon } from "lucide-react";
import { Section, compactInr, ExportButtons, DonutBreakdown, InsightBanner } from "@/components/dashboards/shared/kit";

export interface QsRow {
  quoteNo: string;
  enquiryNo: string;
  company: string;
  product: string;
  scope: string;
  value: number;
  status: string;
  sent: boolean;
  won: boolean;
  lost: boolean;
  source: string;
  salesperson: string;
  date: string; // yyyy-mm-dd
}

function daysBetween(d: string): number {
  if (!d) return 0;
  const t = new Date(d + (d.length <= 10 ? "T00:00:00Z" : "")).getTime();
  return Number.isNaN(t) ? 0 : Math.max(0, Math.round((Date.now() - t) / 86_400_000));
}

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function Legend({ labelA, labelB, colorA, colorB }: { labelA: string; labelB: string; colorA: string; colorB: string }) {
  return (
    <div className="mb-2.5 flex items-center gap-4 text-[11px] font-bold text-slate-500">
      <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: colorA }} />{labelA}</span>
      <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: colorB }} />{labelB}</span>
    </div>
  );
}

/** Two-series bar chart — grouped columns per label (e.g. Enquiry vs Quote). */
function GroupedBars({ data, labelA, labelB, colorA, colorB }: {
  data: { label: string; a: number; b: number }[];
  labelA: string; labelB: string; colorA: string; colorB: string;
}) {
  const max = Math.max(1, ...data.map((d) => Math.max(d.a, d.b)));
  const hasData = data.some((d) => d.a || d.b);
  if (!hasData) return <p className="py-10 text-center text-[13px] text-slate-400">No data in range.</p>;
  return (
    <div>
      <Legend labelA={labelA} labelB={labelB} colorA={colorA} colorB={colorB} />
      <div className="flex h-36 items-end gap-1.5">
        {data.map((d) => {
          const pct = d.a ? Math.round((d.b / d.a) * 100) : 0;
          const tip = `${d.label}\n${labelA}: ${d.a}\n${labelB}: ${d.b}${d.a ? `\n${labelB} vs ${labelA}: ${pct}%` : ""}`;
          return (
            <div key={d.label} title={tip} className="flex flex-1 cursor-help flex-col items-center gap-1 rounded-md hover:bg-slate-50">
              <div className="flex h-28 w-full items-end justify-center gap-[3px]">
                <div className="w-1/2 max-w-[16px] rounded-t transition-[height] duration-700" style={{ height: `${(d.a / max) * 100}%`, minHeight: d.a ? 3 : 0, background: colorA }} />
                <div className="w-1/2 max-w-[16px] rounded-t transition-[height] duration-700" style={{ height: `${(d.b / max) * 100}%`, minHeight: d.b ? 3 : 0, background: colorB }} />
              </div>
              <span className="text-[10px] font-semibold text-slate-400">{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Two-series stacked bar chart — one bar per label, split into A (bottom) + B (top). */
function StackedBars({ data, labelA, labelB, colorA, colorB }: {
  data: { label: string; a: number; b: number }[];
  labelA: string; labelB: string; colorA: string; colorB: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.a + d.b));
  const hasData = data.some((d) => d.a || d.b);
  if (!hasData) return <p className="py-10 text-center text-[13px] text-slate-400">No data in range.</p>;
  return (
    <div>
      <Legend labelA={labelA} labelB={labelB} colorA={colorA} colorB={colorB} />
      <div className="flex h-36 items-end gap-1.5">
        {data.map((d) => {
          const delta = d.b - d.a;
          const tip = `${d.label}\n${labelB}: ${d.b}\n${labelA}: ${d.a}\nChange: ${delta >= 0 ? "+" : ""}${delta} vs ${labelA}\nTotal: ${d.a + d.b}`;
          return (
            <div key={d.label} title={tip} className="flex flex-1 cursor-help flex-col items-center gap-1 rounded-md hover:bg-slate-50">
              <div className="mx-auto flex h-28 w-full max-w-[22px] flex-col justify-end">
                <div className="rounded-t transition-[height] duration-700" style={{ height: `${(d.b / max) * 100}%`, minHeight: d.b ? 3 : 0, background: colorB }} />
                <div className={`transition-[height] duration-700 ${d.b ? "" : "rounded-t"}`} style={{ height: `${(d.a / max) * 100}%`, minHeight: d.a ? 3 : 0, background: colorA }} />
              </div>
              <span className="text-[10px] font-semibold text-slate-400">{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function QuoteStatusDashboard({ rows }: { rows: QsRow[] }) {
  const [q, setQ] = React.useState("");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [source, setSource] = React.useState("");
  const [customer, setCustomer] = React.useState("");
  const [product, setProduct] = React.useState("");
  const [scope, setScope] = React.useState("");

  const statuses = React.useMemo(() => Array.from(new Set(rows.map((r) => r.status).filter(Boolean))).sort(), [rows]);
  const sources = React.useMemo(() => Array.from(new Set(rows.map((r) => r.source).filter(Boolean))).sort(), [rows]);
  const customers = React.useMemo(() => Array.from(new Set(rows.map((r) => r.company).filter(Boolean))).sort(), [rows]);
  const products = React.useMemo(() => Array.from(new Set(rows.map((r) => r.product).filter(Boolean))).sort(), [rows]);
  const scopes = React.useMemo(() => Array.from(new Set(rows.map((r) => r.scope).filter(Boolean))).sort(), [rows]);

  const f = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (from && r.date < from) return false;
      if (to && r.date > to) return false;
      if (status && r.status !== status) return false;
      if (source && r.source !== source) return false;
      if (customer && r.company !== customer) return false;
      if (product && r.product !== product) return false;
      if (scope && r.scope !== scope) return false;
      if (needle && ![r.quoteNo, r.enquiryNo, r.company, r.product, r.salesperson, r.status].some((v) => v.toLowerCase().includes(needle))) return false;
      return true;
    });
  }, [rows, q, from, to, status, source, customer, product, scope]);

  const received = f.length;
  const sent = f.filter((r) => r.sent).length;
  const won = f.filter((r) => r.won).length;
  const lost = f.filter((r) => r.lost).length;
  const pending = Math.max(0, received - won - lost);
  const conversion = received ? Math.round((won / received) * 100) : 0;
  const quoteValue = f.reduce((a, r) => a + (r.value || 0), 0);
  const avgQuote = received ? quoteValue / received : 0;
  const sentValue = f.filter((r) => r.sent).reduce((a, r) => a + (r.value || 0), 0);
  const wonValue = f.filter((r) => r.won).reduce((a, r) => a + (r.value || 0), 0);

  const tiles: { label: string; value: string; sub?: string; from: string; to: string; Icon: LucideIcon }[] = [
    { label: "Enquiry Received", value: String(received), sub: "Nos", from: "#2a78d6", to: "#185fa5", Icon: Inbox },
    { label: "Quotes Sent", value: String(sent), sub: "Nos", from: "#0180cf", to: "#0069b3", Icon: Send },
    { label: "Quotes Won", value: String(won), sub: "Nos", from: "#63b81e", to: "#4a9616", Icon: BadgeCheck },
    { label: "Quotes Lost", value: String(lost), sub: "Nos", from: "#ef4444", to: "#b91c1c", Icon: X },
    { label: "Pending", value: String(pending), sub: "Nos", from: "#f59e0b", to: "#d97706", Icon: Clock3 },
    { label: "Conversion", value: conversion + "%", from: "#7c3aed", to: "#6d28d9", Icon: Target },
    { label: "Quote Value", value: compactInr(quoteValue), from: "#0a7d8a", to: "#0069b3", Icon: IndianRupee },
    { label: "Avg Quote", value: compactInr(avgQuote), from: "#63b81e", to: "#0180cf", Icon: IndianRupee },
    { label: "Won Value", value: compactInr(wonValue), from: "#2a78d6", to: "#0a7d8a", Icon: IndianRupee },
    { label: "Sent Value", value: compactInr(sentValue), from: "#0180cf", to: "#63b81e", Icon: IndianRupee },
  ];

  const statusDist = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const r of f) m.set(r.status || "—", (m.get(r.status || "—") ?? 0) + 1);
    return Array.from(m.entries()).map(([label, value]) => ({ label, value }));
  }, [f]);

  // Monthly trend — this year vs previous year, per calendar month.
  const yoy = React.useMemo(() => {
    const thisYear = new Date().getFullYear();
    const prevYear = thisYear - 1;
    const cur = new Array(12).fill(0);
    const prv = new Array(12).fill(0);
    for (const r of f) {
      if (!r.date || r.date.length < 7) continue;
      const yr = Number(r.date.slice(0, 4));
      const mo = Number(r.date.slice(5, 7)) - 1;
      if (mo < 0 || mo > 11) continue;
      if (yr === thisYear) cur[mo]++;
      else if (yr === prevYear) prv[mo]++;
    }
    return { thisYear, prevYear, data: MON.map((label, i) => ({ label, a: prv[i], b: cur[i] })) };
  }, [f]);

  // Enquiry vs Quote trend — last 8 month buckets.
  const enqVsQuote = React.useMemo(() => {
    const enq = new Map<string, number>();
    const qt = new Map<string, number>();
    for (const r of f) {
      if (!r.date || r.date.length < 7) continue;
      const key = r.date.slice(0, 7);
      enq.set(key, (enq.get(key) ?? 0) + 1);
      if (r.sent) qt.set(key, (qt.get(key) ?? 0) + 1);
    }
    const keys = Array.from(new Set([...enq.keys(), ...qt.keys()])).sort().slice(-8);
    return keys.map((key) => ({ label: MON[Number(key.slice(5, 7)) - 1] ?? key, a: enq.get(key) ?? 0, b: qt.get(key) ?? 0 }));
  }, [f]);

  // Salesperson leaderboard.
  const [topN, setTopN] = React.useState(5);
  const leaderboard = React.useMemo(() => {
    const m = new Map<string, { name: string; quotes: number; won: number; value: number }>();
    for (const r of f) {
      const name = r.salesperson || "Unassigned";
      const e = m.get(name) ?? { name, quotes: 0, won: 0, value: 0 };
      e.quotes++;
      if (r.won) { e.won++; e.value += r.value || 0; }
      m.set(name, e);
    }
    return Array.from(m.values()).sort((a, b) => b.won - a.won || b.value - a.value || b.quotes - a.quotes);
  }, [f]);
  const shownLeaders = topN >= 999 ? leaderboard : leaderboard.slice(0, topN);

  // Pending quotes — oldest first, with a user-set visible count + scroll.
  const pendingRows = React.useMemo(() => f
    .filter((r) => !r.won && !r.lost)
    .map((r) => ({ ...r, days: daysBetween(r.date) }))
    .sort((a, b) => b.days - a.days), [f]);
  const [pendingCount, setPendingCount] = React.useState(10);
  const shownPending = pendingRows.slice(0, Math.max(1, pendingCount || 1));

  const reset = () => { setQ(""); setFrom(""); setTo(""); setStatus(""); setSource(""); setCustomer(""); setProduct(""); setScope(""); };
  const anyFilter = q || from || to || status || source || customer || product || scope;

  const selCls = "h-9 rounded-lg border border-slate-200 bg-white px-2 text-[12.5px] font-semibold text-slate-600 outline-none focus:border-[#0180cf]";

  return (
    <div className="space-y-3">
      {/* filter bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search quotes…" className="h-9 w-[200px] max-w-[48vw] rounded-lg border border-slate-200 bg-white pl-8 pr-2.5 text-[13px] outline-none focus:border-[#0180cf]" />
        </div>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} title="Start date" className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-[12.5px] outline-none focus:border-[#0180cf]" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} title="End date" className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-[12.5px] outline-none focus:border-[#0180cf]" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={selCls}><option value="">All statuses</option>{statuses.map((s) => <option key={s} value={s}>{s}</option>)}</select>
        <select value={product} onChange={(e) => setProduct(e.target.value)} className={`${selCls} max-w-[160px]`}><option value="">All products</option>{products.map((p) => <option key={p} value={p}>{p}</option>)}</select>
        <select value={scope} onChange={(e) => setScope(e.target.value)} className={`${selCls} max-w-[160px]`}><option value="">All scopes</option>{scopes.map((s) => <option key={s} value={s}>{s}</option>)}</select>
        <select value={source} onChange={(e) => setSource(e.target.value)} className={selCls}><option value="">All sources</option>{sources.map((s) => <option key={s} value={s}>{s}</option>)}</select>
        <select value={customer} onChange={(e) => setCustomer(e.target.value)} className={`${selCls} max-w-[170px]`}><option value="">All customers</option>{customers.map((c) => <option key={c} value={c}>{c}</option>)}</select>
        {anyFilter && <button type="button" onClick={reset} className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-[12.5px] font-bold text-slate-500 hover:text-[#0069b3]"><X size={13} /> Clear</button>}
        <span className="ml-auto flex items-center gap-2 text-[12px] font-semibold text-slate-400"><Filter size={13} /> {f.length} of {rows.length}
          <ExportButtons filename="quote-status" headers={["Quote No", "Enquiry No", "Customer", "Product", "Scope", "Value", "Status", "Source", "Salesperson", "Date"]} rows={f.map((r) => [r.quoteNo, r.enquiryNo, r.company, r.product, r.scope, r.value, r.status, r.source, r.salesperson, r.date])} />
        </span>
      </div>

      {/* headline insight */}
      <InsightBanner right={`${conversion}% Conversion`}>
        {received} enquir{received === 1 ? "y" : "ies"} · <b>{won}</b> won · <b className="text-[#b45309]">{pending}</b> pending · {compactInr(quoteValue)} quoted
      </InsightBanner>

      {/* KPI grid */}
      <Section title="Quote Status — Overview" Icon={Target}>
        <div className="grid grid-cols-5 gap-3 max-xl:grid-cols-4 max-lg:grid-cols-3 max-sm:grid-cols-2">
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

      {/* charts row */}
      <div className="grid grid-cols-3 gap-4 max-lg:grid-cols-1">
        <Section title="Status Distribution" Icon={PieChart}>
          <DonutBreakdown data={statusDist} centerLabel="Quotes" />
        </Section>
        <Section title={`Monthly Trend · ${yoy.prevYear} vs ${yoy.thisYear}`} Icon={TrendingUp}>
          <StackedBars data={yoy.data} labelA={String(yoy.prevYear)} labelB={String(yoy.thisYear)} colorA="#c7d2e0" colorB="#0180cf" />
        </Section>
        <Section title="Enquiry vs Quote Trend" Icon={BarChart3}>
          <GroupedBars data={enqVsQuote} labelA="Enquiries" labelB="Quotes" colorA="#63b81e" colorB="#0180cf" />
        </Section>
      </div>

      {/* Salesperson leaderboard */}
      <Section title="Salesperson Leaderboard" Icon={Trophy}>
        <div className="mb-3 flex items-center gap-2 text-[12px] font-semibold text-slate-500">
          <span>Show top</span>
          <select value={topN} onChange={(e) => setTopN(Number(e.target.value))} className={selCls}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={20}>20</option>
            <option value={999}>All</option>
          </select>
          <span className="text-slate-400">of {leaderboard.length} salespeople</span>
        </div>
        <div className="max-h-[360px] overflow-y-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[560px] text-[12.5px]">
            <thead className="sticky top-0 z-10">
              <tr className="text-left text-[10.5px] font-extrabold uppercase tracking-[0.04em] text-white" style={{ background: "linear-gradient(180deg, #0069b3, #00598f)" }}>
                <th className="px-3 py-2 text-center">#</th><th className="px-3 py-2">Salesperson</th><th className="px-3 py-2 text-center">Quotes</th><th className="px-3 py-2 text-center">Won</th><th className="px-3 py-2 text-center">Conv.</th><th className="px-3 py-2 text-right">Won Value</th>
              </tr>
            </thead>
            <tbody>
              {shownLeaders.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No salesperson data in range.</td></tr>
              ) : shownLeaders.map((l, i) => {
                const conv = l.quotes ? Math.round((l.won / l.quotes) * 100) : 0;
                const medal = i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-slate-200 text-slate-600" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-500";
                return (
                  <tr key={l.name + i} className={i % 2 ? "bg-[#f5fafe]" : "bg-white"}>
                    <td className="border-b border-[#e7eff6] px-3 py-1.5 text-center"><span className={`inline-flex size-6 items-center justify-center rounded-full text-[11px] font-black tabular-nums ${medal}`}>{i + 1}</span></td>
                    <td className="border-b border-[#e7eff6] px-3 py-1.5 font-bold text-slate-700">{l.name}</td>
                    <td className="border-b border-[#e7eff6] px-3 py-1.5 text-center tabular-nums text-slate-600">{l.quotes}</td>
                    <td className="border-b border-[#e7eff6] px-3 py-1.5 text-center tabular-nums font-black text-[#4a9616]">{l.won}</td>
                    <td className="border-b border-[#e7eff6] px-3 py-1.5 text-center"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-black tabular-nums ${conv >= 50 ? "bg-green-100 text-green-700" : conv >= 25 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>{conv}%</span></td>
                    <td className="border-b border-[#e7eff6] px-3 py-1.5 text-right font-black tabular-nums text-[#0069b3]">{compactInr(l.value)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Pending Quotes — count control + scroll */}
      <Section title="Pending Quotes" Icon={Clock3}>
        <div className="mb-3 flex flex-wrap items-center gap-2 text-[12px] font-semibold text-slate-500">
          <span>Show</span>
          <input type="number" min={1} value={pendingCount} onChange={(e) => setPendingCount(Number(e.target.value))} className="h-9 w-20 rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] font-bold text-slate-700 outline-none focus:border-[#0180cf]" />
          <span>entries</span>
          <span className="ml-auto text-slate-400">{Math.min(shownPending.length, pendingRows.length)} of {pendingRows.length} pending</span>
        </div>
        <div className="max-h-[420px] overflow-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[760px] text-[12.5px]">
            <thead className="sticky top-0 z-10">
              <tr className="text-left text-[10.5px] font-extrabold uppercase tracking-[0.04em] text-white" style={{ background: "linear-gradient(180deg, #0069b3, #00598f)" }}>
                <th className="px-3 py-2">Quote No</th><th className="px-3 py-2">Customer</th><th className="px-3 py-2">Quote Date</th><th className="px-3 py-2 text-right">Value</th><th className="px-3 py-2 text-center">Days Pending</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Salesperson</th>
              </tr>
            </thead>
            <tbody>
              {shownPending.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No pending quotes in range.</td></tr>
              ) : shownPending.map((r, i) => (
                <tr key={r.quoteNo + i} className={i % 2 ? "bg-[#f5fafe]" : "bg-white"}>
                  <td className="border-b border-[#e7eff6] px-3 py-1.5 font-bold text-slate-700">{r.quoteNo}</td>
                  <td className="border-b border-[#e7eff6] px-3 py-1.5 text-slate-600">{r.company || "—"}</td>
                  <td className="border-b border-[#e7eff6] px-3 py-1.5 tabular-nums text-slate-500">{r.date || "—"}</td>
                  <td className="border-b border-[#e7eff6] px-3 py-1.5 text-right font-black tabular-nums text-[#0069b3]">{compactInr(r.value)}</td>
                  <td className="border-b border-[#e7eff6] px-3 py-1.5 text-center"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-black tabular-nums ${r.days > 14 ? "bg-red-100 text-red-700" : r.days > 7 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{r.days}d</span></td>
                  <td className="border-b border-[#e7eff6] px-3 py-1.5"><span className="inline-flex items-center rounded-full bg-[#0180cf]/10 px-2 py-0.5 text-[11px] font-bold text-[#0069b3]">{r.status || "—"}</span></td>
                  <td className="border-b border-[#e7eff6] px-3 py-1.5 text-slate-600">{r.salesperson || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
