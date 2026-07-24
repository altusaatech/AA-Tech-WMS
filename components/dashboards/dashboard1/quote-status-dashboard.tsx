"use client";

import * as React from "react";
import { Inbox, Send, BadgeCheck, X, Clock3, Target, IndianRupee, Search, Filter, type LucideIcon } from "lucide-react";
import { Section, compactInr, ExportButtons } from "@/components/dashboards/shared/kit";

export interface QsRow {
  quoteNo: string;
  enquiryNo: string;
  company: string;
  product: string;
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

export function QuoteStatusDashboard({ rows }: { rows: QsRow[] }) {
  const [q, setQ] = React.useState("");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [source, setSource] = React.useState("");
  const [customer, setCustomer] = React.useState("");

  const statuses = React.useMemo(() => Array.from(new Set(rows.map((r) => r.status).filter(Boolean))).sort(), [rows]);
  const sources = React.useMemo(() => Array.from(new Set(rows.map((r) => r.source).filter(Boolean))).sort(), [rows]);
  const customers = React.useMemo(() => Array.from(new Set(rows.map((r) => r.company).filter(Boolean))).sort(), [rows]);

  const f = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (from && r.date < from) return false;
      if (to && r.date > to) return false;
      if (status && r.status !== status) return false;
      if (source && r.source !== source) return false;
      if (customer && r.company !== customer) return false;
      if (needle && ![r.quoteNo, r.enquiryNo, r.company, r.product, r.salesperson, r.status].some((v) => v.toLowerCase().includes(needle))) return false;
      return true;
    });
  }, [rows, q, from, to, status, source, customer]);

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

  const pendingRows = f
    .filter((r) => !r.won && !r.lost)
    .map((r) => ({ ...r, days: daysBetween(r.date) }))
    .sort((a, b) => b.days - a.days);

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
    { label: "Quotes Sent Value", value: compactInr(sentValue), from: "#0180cf", to: "#63b81e", Icon: IndianRupee },
  ];

  const reset = () => { setQ(""); setFrom(""); setTo(""); setStatus(""); setSource(""); setCustomer(""); };
  const anyFilter = q || from || to || status || source || customer;

  return (
    <div className="mt-6 space-y-5">
      {/* filter bar */}
      <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search quotes…" className="h-9 w-[220px] max-w-[52vw] rounded-lg border border-slate-200 bg-white pl-8 pr-2.5 text-[13px] outline-none focus:border-[#0180cf]" />
        </div>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} title="Start date" className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-[12.5px] outline-none focus:border-[#0180cf]" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} title="End date" className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-[12.5px] outline-none focus:border-[#0180cf]" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-[12.5px] font-semibold text-slate-600 outline-none focus:border-[#0180cf]"><option value="">All statuses</option>{statuses.map((s) => <option key={s} value={s}>{s}</option>)}</select>
        <select value={source} onChange={(e) => setSource(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-[12.5px] font-semibold text-slate-600 outline-none focus:border-[#0180cf]"><option value="">All sources</option>{sources.map((s) => <option key={s} value={s}>{s}</option>)}</select>
        <select value={customer} onChange={(e) => setCustomer(e.target.value)} className="h-9 max-w-[180px] rounded-lg border border-slate-200 bg-white px-2 text-[12.5px] font-semibold text-slate-600 outline-none focus:border-[#0180cf]"><option value="">All customers</option>{customers.map((c) => <option key={c} value={c}>{c}</option>)}</select>
        {anyFilter && <button type="button" onClick={reset} className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-[12.5px] font-bold text-slate-500 hover:text-[#0069b3]"><X size={13} /> Clear</button>}
        <span className="ml-auto flex items-center gap-2 text-[12px] font-semibold text-slate-400"><Filter size={13} /> {f.length} of {rows.length}
          <ExportButtons filename="quote-status" headers={["Quote No", "Enquiry No", "Customer", "Product", "Value", "Status", "Source", "Salesperson", "Date"]} rows={f.map((r) => [r.quoteNo, r.enquiryNo, r.company, r.product, r.value, r.status, r.source, r.salesperson, r.date])} />
        </span>
      </div>

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

      {/* Pending Quotes table */}
      <Section title="Pending Quotes" Icon={Clock3}>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[760px] text-[12.5px]">
            <thead>
              <tr className="text-left text-[10.5px] font-extrabold uppercase tracking-[0.04em] text-white" style={{ background: "linear-gradient(180deg, #0069b3, #00598f)" }}>
                <th className="px-3 py-2">Quote No</th><th className="px-3 py-2">Customer</th><th className="px-3 py-2">Quote Date</th><th className="px-3 py-2 text-right">Value</th><th className="px-3 py-2 text-center">Days Pending</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Salesperson</th>
              </tr>
            </thead>
            <tbody>
              {pendingRows.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No pending quotes in range.</td></tr>
              ) : pendingRows.map((r, i) => (
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
