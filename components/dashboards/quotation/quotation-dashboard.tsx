"use client";

import * as React from "react";
import {
  Inbox, Send, RefreshCcw, FileStack, BadgeCheck, Clock3, TrendingUp, Filter, Search, X,
  Building2, Users, GitBranch, ListChecks, MessagesSquare, FileText, ReceiptText, PartyPopper, FileCheck2,
  Sparkles, Target, AlertTriangle, Rocket, IndianRupee,
} from "lucide-react";
import {
  Section, TrendBars, StatusBars, InsightsPanel, DetailModal, Funnel, ProgressStat,
  WorkflowTimeline, ExportButtons, compactInr, Gauge, MetricChip,
  StatCard, ActivityFeed, Donut, type Activity,
} from "@/components/dashboards/shared/kit";

export interface QuoteRow {
  enquiryNo: string; quoteNo: string; company: string; item: string; value: number;
  status: string; sent: boolean; revised: boolean; revisions: number;
  piNo: string | null; piStatus: string; piSent: boolean; piApproved: boolean;
  converted: boolean; soNo: string | null; executive: string;
  created: string; updated: string; date: string;
}

type ModalKey = "enquiries" | "sent" | "revised" | "piSent" | "piApproved" | "pendingPi" | null;

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function QuotationDashboard({ rows }: { rows: QuoteRow[] }) {
  const [q, setQ] = React.useState("");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [customer, setCustomer] = React.useState("");
  const [modal, setModal] = React.useState<ModalKey>(null);

  const statuses = React.useMemo(() => Array.from(new Set(rows.map((r) => r.status))).sort(), [rows]);
  const customers = React.useMemo(() => Array.from(new Set(rows.map((r) => r.company).filter(Boolean))).sort(), [rows]);

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (from && r.date < from) return false;
      if (to && r.date > to) return false;
      if (status && r.status !== status) return false;
      if (customer && r.company !== customer) return false;
      if (needle && ![r.enquiryNo, r.quoteNo, r.company, r.item, r.executive, r.piNo ?? "", r.status].some((v) => v.toLowerCase().includes(needle))) return false;
      return true;
    });
  }, [rows, q, from, to, status, customer]);

  const k = React.useMemo(() => ({
    enquiries: filtered.length,
    sent: filtered.filter((r) => r.sent).length,
    revised: filtered.filter((r) => r.revised).length,
    piSent: filtered.filter((r) => r.piSent).length,
    piApproved: filtered.filter((r) => r.piApproved).length,
    pendingPi: filtered.filter((r) => !r.piSent).length,
    converted: filtered.filter((r) => r.converted).length,
    value: filtered.reduce((s, r) => s + r.value, 0),
  }), [filtered]);

  const trend = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtered) if (r.date) m.set(r.date.slice(0, 7), (m.get(r.date.slice(0, 7)) ?? 0) + 1);
    return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-8).map(([key, v]) => ({ label: MON[Number(key.slice(5, 7)) - 1] ?? key, value: v }));
  }, [filtered]);

  const revisionTrend = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtered) if (r.date && r.revisions) m.set(r.date.slice(0, 7), (m.get(r.date.slice(0, 7)) ?? 0) + r.revisions);
    return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-8).map(([key, v]) => ({ label: MON[Number(key.slice(5, 7)) - 1] ?? key, value: v }));
  }, [filtered]);

  const custDist = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filtered) if (r.company) m.set(r.company, (m.get(r.company) ?? 0) + 1);
    return Array.from(m.entries()).sort(([, a], [, b]) => b - a).slice(0, 6).map(([label, v]) => ({ label, value: v }));
  }, [filtered]);

  // monthly sparklines + month-over-month deltas (respond to filters)
  const sp = React.useMemo(() => {
    const g = () => new Map<string, number>();
    const enq = g(), sent = g(), pia = g(), val = g();
    for (const r of filtered) {
      if (!r.date) continue; const m = r.date.slice(0, 7);
      enq.set(m, (enq.get(m) ?? 0) + 1);
      if (r.sent) sent.set(m, (sent.get(m) ?? 0) + 1);
      if (r.piApproved) pia.set(m, (pia.get(m) ?? 0) + 1);
      val.set(m, (val.get(m) ?? 0) + r.value);
    }
    const months = [...new Set([...enq.keys(), ...sent.keys(), ...pia.keys(), ...val.keys()])].sort().slice(-8);
    const arr = (mp: Map<string, number>) => months.map((m) => mp.get(m) ?? 0);
    const d = (mp: Map<string, number>) => { const a = mp.get(months[months.length - 1] ?? "") ?? 0, b = mp.get(months[months.length - 2] ?? "") ?? 0; return b ? Math.max(-999, Math.min(999, Math.round(((a - b) / b) * 100))) : a ? 100 : 0; };
    return { enq: arr(enq), sent: arr(sent), pia: arr(pia), val: arr(val), dEnq: d(enq), dSent: d(sent), dPia: d(pia), dVal: d(val) };
  }, [filtered]);

  const convRate = k.enquiries ? Math.round((k.converted / k.enquiries) * 100) : 0;

  const activities: Activity[] = React.useMemo(() => {
    const acts = filtered.map((r): Activity => {
      if (r.converted) return { kind: "so", title: `Sales Order ${r.soNo ?? ""}`.trim(), subtitle: r.company, date: r.date, amount: r.value };
      if (r.piApproved) return { kind: "po", title: `PI approved · ${r.company}`, subtitle: r.piNo ?? r.enquiryNo, date: r.date, amount: r.value };
      if (r.sent) return { kind: "quote", title: `Quotation sent · ${r.company}`, subtitle: r.quoteNo, date: r.date, amount: r.value };
      return { kind: "enquiry", title: `Enquiry · ${r.company}`, subtitle: r.enquiryNo, date: r.date, amount: r.value };
    });
    return acts.filter((a) => a.date).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
  }, [filtered]);

  const modalMeta = {
    enquiries: { title: "Total Enquiries Received", Icon: Inbox, from: "#0180cf", to: "#0069b3", rows: filtered },
    sent: { title: "Quotations Sent", Icon: Send, from: "#0a7d8a", to: "#0069b3", rows: filtered.filter((r) => r.sent) },
    revised: { title: "Revised Quotations", Icon: RefreshCcw, from: "#7c3aed", to: "#6d28d9", rows: filtered.filter((r) => r.revised) },
    piSent: { title: "Proforma Invoices Sent", Icon: FileStack, from: "#0069b3", to: "#0180cf", rows: filtered.filter((r) => r.piSent) },
    piApproved: { title: "PI Approved", Icon: BadgeCheck, from: "#63b81e", to: "#3f7a14", rows: filtered.filter((r) => r.piApproved) },
    pendingPi: { title: "Pending PI / Not Sent", Icon: Clock3, from: "#b45309", to: "#92400e", rows: filtered.filter((r) => !r.piSent) },
  } as const;
  const active = modal ? modalMeta[modal] : null;

  const reset = () => { setQ(""); setFrom(""); setTo(""); setStatus(""); setCustomer(""); };
  const anyFilter = q || from || to || status || customer;

  return (
    <div className="mt-6 space-y-5">
      {/* filter bar */}
      <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search records…" className="h-9 w-[220px] max-w-[52vw] rounded-lg border border-slate-200 bg-white pl-8 pr-2.5 text-[13px] outline-none focus:border-[#0180cf]" />
        </div>
        <FilterField label="From"><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-[12.5px] outline-none focus:border-[#0180cf]" /></FilterField>
        <FilterField label="To"><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-[12.5px] outline-none focus:border-[#0180cf]" /></FilterField>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-[12.5px] font-semibold text-slate-600 outline-none focus:border-[#0180cf]"><option value="">All statuses</option>{statuses.map((s) => <option key={s} value={s}>{s}</option>)}</select>
        <select value={customer} onChange={(e) => setCustomer(e.target.value)} className="h-9 max-w-[180px] rounded-lg border border-slate-200 bg-white px-2 text-[12.5px] font-semibold text-slate-600 outline-none focus:border-[#0180cf]"><option value="">All customers</option>{customers.map((c) => <option key={c} value={c}>{c}</option>)}</select>
        {anyFilter && <button type="button" onClick={reset} className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-[12.5px] font-bold text-slate-500 hover:text-[#0069b3]"><X size={13} /> Clear</button>}
        <span className="ml-auto flex items-center gap-2 text-[12px] font-semibold text-slate-400"><Filter size={13} /> {filtered.length} of {rows.length}
          <ExportButtons filename="quotations" headers={["Enquiry", "Quote No", "PI No", "Customer", "Executive", "Status", "PI Status", "Value", "Created", "Updated", "Revisions"]} rows={filtered.map((r) => [r.enquiryNo, r.quoteNo, r.piNo ?? "", r.company, r.executive, r.status, r.piStatus, r.value, r.created, r.updated, r.revisions])} />
        </span>
      </div>

      {/* hero stat cards */}
      <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
        <StatCard label="Total Enquiries" display={String(k.enquiries)} delta={sp.dEnq} spark={sp.enq} Icon={Inbox} from="#2a78d6" to="#185fa5" onDetails={() => setModal("enquiries")} />
        <StatCard label="Quotations Sent" display={String(k.sent)} delta={sp.dSent} spark={sp.sent} Icon={Send} from="#63b81e" to="#4a9616" onDetails={() => setModal("sent")} />
        <StatCard label="PI Approved" display={String(k.piApproved)} delta={sp.dPia} spark={sp.pia} Icon={BadgeCheck} from="#7c3aed" to="#6d28d9" onDetails={() => setModal("piApproved")} />
        <StatCard label="Quoted Value" display={compactInr(k.value)} delta={sp.dVal} spark={sp.val} Icon={IndianRupee} from="#f59e0b" to="#d97706" />
      </div>

      {/* recent activity + conversion */}
      <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-1">
        <div className="col-span-2 max-lg:col-span-1"><Section title="Recent Activity" Icon={Clock3}><ActivityFeed items={activities} /></Section></div>
        <Section title="Enquiry → Order Conversion" Icon={Target}>
          <div className="flex flex-col items-center gap-3 py-1">
            <Donut pct={convRate} />
            <div className="grid w-full grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-center"><div className="text-[11px] font-bold uppercase tracking-[0.05em] text-slate-400">Sent</div><div className="text-[18px] font-black tabular-nums text-slate-800">{k.sent}</div></div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-center"><div className="text-[11px] font-bold uppercase tracking-[0.05em] text-slate-400">Won</div><div className="text-[18px] font-black tabular-nums text-[#0069b3]">{k.converted}</div></div>
            </div>
          </div>
        </Section>
      </div>

      {/* funnel + PI approval + pending/completed */}
      <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-1">
        <div className="col-span-2 max-lg:col-span-1"><Section title="Quotation Conversion Funnel" Icon={GitBranch}>
          <Funnel stages={[{ label: "Enquiries", value: k.enquiries }, { label: "Quotations Sent", value: k.sent }, { label: "PI Sent", value: k.piSent }, { label: "PI Approved", value: k.piApproved }, { label: "Sales Orders", value: k.converted }]} />
        </Section></div>
        <Section title="Rates & Split" Icon={BadgeCheck}>
          <div className="space-y-4">
            <ProgressStat label="PI Approval Rate" done={k.piApproved} total={k.piSent} />
            <ProgressStat label="Sent → Order Win Rate" done={k.converted} total={k.sent} from="#0180cf" to="#0069b3" />
            <ProgressStat label="Completed vs Total" done={k.converted} total={k.enquiries} from="#0a7d8a" to="#0069b3" />
          </div>
        </Section>
      </div>

      {/* trends */}
      <div className="grid grid-cols-2 gap-5 max-lg:grid-cols-1">
        <Section title="Monthly Quotation Trend" Icon={TrendingUp}><TrendBars data={trend} /></Section>
        <Section title="Quotation Revision Trend" Icon={RefreshCcw}><TrendBars data={revisionTrend} /></Section>
      </div>

      {/* customer distribution + workflow */}
      <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-1">
        <Section title="Customer-wise Quotations" Icon={Users}><StatusBars data={custDist} /></Section>
        <div className="col-span-2 max-lg:col-span-1"><Section title="Workflow" Icon={GitBranch}>
          <WorkflowTimeline stages={[{ label: "Enquiry", count: k.enquiries }, { label: "Quotation", count: k.sent }, { label: "PI", count: k.piSent }, { label: "PI Approval", count: k.piApproved }, { label: "Sales Order", count: k.converted }]} icons={[MessagesSquare, FileText, ReceiptText, PartyPopper, FileCheck2]} />
        </Section></div>
      </div>

      {/* ── advanced: Smart Sales Forecast ── */}
      <SalesForecast rows={filtered} />

      {/* Insights always last */}
      <InsightsPanel items={insights(k)} />


      {active && (
        <DetailModal title={active.title} Icon={active.Icon} from={active.from} to={active.to} onClose={() => setModal(null)}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-[13px] font-bold text-slate-500">{active.rows.length} record{active.rows.length === 1 ? "" : "s"} · <span className="text-slate-400">executive & revisions are sample data</span></span>
            <ExportButtons filename={active.title.replace(/\s+/g, "-").toLowerCase()} headers={["Enquiry", "Quote No", "PI No", "Customer", "Executive", "Status", "PI Status", "Created", "Updated", "Revisions"]} rows={active.rows.map((r) => [r.enquiryNo, r.quoteNo, r.piNo ?? "", r.company, r.executive, r.status, r.piStatus, r.created, r.updated, r.revisions])} />
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full border-collapse text-[12px]">
              <thead className="bg-slate-50"><tr className="text-left text-[10.5px] font-bold uppercase tracking-[0.03em] text-slate-400">
                {["Enquiry", "Quote No", "PI No", "Customer", "Executive", "Status", "PI Status", "Created", "Updated", "Rev"].map((h) => <th key={h} className="px-2.5 py-2">{h}</th>)}
              </tr></thead>
              <tbody>
                {active.rows.map((r, i) => (
                  <tr key={`${r.enquiryNo}-${i}`} className="border-t border-slate-100">
                    <td className="px-2.5 py-1.5 font-bold text-slate-800">{r.enquiryNo}</td>
                    <td className="px-2.5 py-1.5 text-slate-600">{r.quoteNo}</td>
                    <td className="px-2.5 py-1.5 text-slate-600">{r.piNo ?? "—"}</td>
                    <td className="px-2.5 py-1.5 text-slate-600"><span className="flex items-center gap-1"><Building2 size={11} className="text-[#0069b3]" />{r.company || "—"}</span></td>
                    <td className="px-2.5 py-1.5 text-slate-500">{r.executive}</td>
                    <td className="px-2.5 py-1.5"><span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-600">{r.status}</span></td>
                    <td className="px-2.5 py-1.5"><span className="rounded-full bg-[#0180cf]/10 px-1.5 py-0.5 text-[11px] font-bold text-[#0069b3]">{r.piStatus}</span></td>
                    <td className="px-2.5 py-1.5 tabular-nums text-slate-500">{r.created}</td>
                    <td className="px-2.5 py-1.5 tabular-nums text-slate-500">{r.updated}</td>
                    <td className="px-2.5 py-1.5 text-center tabular-nums font-bold text-slate-700">{r.revisions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DetailModal>
      )}
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="inline-flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[0.04em] text-slate-400">{label}{children}</label>;
}

function insights(k: { enquiries: number; sent: number; revised: number; piSent: number; piApproved: number; pendingPi: number; converted: number; value: number }): string[] {
  const out: string[] = [];
  if (k.enquiries) out.push(`${k.sent} of ${k.enquiries} enquiries quoted (${Math.round((k.sent / k.enquiries) * 100)}%).`);
  if (k.piSent) out.push(`${k.piApproved} of ${k.piSent} PIs approved — a ${Math.round((k.piApproved / k.piSent) * 100)}% PI approval rate.`);
  if (k.pendingPi) out.push(`${k.pendingPi} enquir${k.pendingPi === 1 ? "y" : "ies"} still without a sent PI.`);
  if (k.revised) out.push(`${k.revised} quotation${k.revised === 1 ? "" : "s"} revised at least once (sample).`);
  if (k.value) out.push(`Total quoted value in view: ${compactInr(k.value)}.`);
  if (out.length === 0) out.push("No quotations match the current filters.");
  return out;
}

/* ── advanced: Smart Sales Forecast ── */
function prob(r: QuoteRow): number {
  if (r.converted) return 100;
  if (r.piApproved) return 92;
  if (r.piSent) return 68;
  if (r.sent) return 42;
  return 18;
}

function SalesForecast({ rows }: { rows: QuoteRow[] }) {
  const open = rows.filter((r) => !r.converted); // pipeline = not yet won
  const scored = open.map((r) => ({ r, p: prob(r) })).sort((a, b) => b.p * b.r.value - a.p * a.r.value);
  const expectedSO = Math.round(open.reduce((s, x) => s + prob(x) / 100, 0));
  const pipeline = open.reduce((s, x) => s + (x.value * prob(x)) / 100, 0);
  const highProb = open.filter((r) => prob(r) >= 60).length;
  const atRisk = open.filter((r) => r.sent && prob(r) < 45).length;
  const avgConf = open.length ? Math.round(open.reduce((s, x) => s + prob(x), 0) / open.length) : 0;
  const top = scored.slice(0, 6);

  return (
    <section className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm max-md:p-4">
      <div className="mb-5 flex items-center gap-3">
        <span className="inline-flex size-11 items-center justify-center rounded-2xl text-white shadow-lg" style={{ background: "linear-gradient(135deg, #63b81e, #0180cf)", boxShadow: "0 12px 26px -12px #0069b3" }}><Rocket size={22} strokeWidth={2.2} /></span>
        <div>
          <div className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-slate-400">Advanced</div>
          <h2 className="text-[19px] font-black tracking-[-0.01em] text-slate-800" style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}>Smart Sales Forecast</h2>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2">
        <MetricChip icon={FileCheck2} label="Expected Sales Orders" value={String(expectedSO)} tint="#0069b3" />
        <MetricChip icon={IndianRupee} label="Estimated Pipeline" value={compactInr(pipeline)} tint="#0a7d8a" />
        <MetricChip icon={Target} label="High-Probability" value={String(highProb)} tint="#3f7a14" />
        <MetricChip icon={AlertTriangle} label="At-Risk Quotes" value={String(atRisk)} tint="#b45309" />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-5 max-lg:grid-cols-1">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
          <Gauge pct={avgConf} label="Pipeline Confidence" sub={`${open.length} open quotes`} />
        </div>
        <div className="col-span-2 max-lg:col-span-1">
          <div className="mb-2 flex items-center gap-2 text-[13px] font-black text-slate-700"><Sparkles size={15} className="text-[#0069b3]" /> Probability by Quotation <span className="text-[11px] font-semibold text-slate-400">(sample scoring)</span></div>
          <div className="space-y-2">
            {top.length === 0 ? <p className="py-6 text-center text-[13px] text-slate-400">No open quotations to forecast.</p> : top.map(({ r, p }) => (
              <div key={r.enquiryNo} className="flex items-center gap-3">
                <div className="w-40 shrink-0 truncate text-[12.5px] font-bold text-slate-700" title={r.company}>{r.company || r.enquiryNo}</div>
                <div className="relative h-6 flex-1 overflow-hidden rounded-lg bg-slate-100">
                  <div className="flex h-full items-center justify-end rounded-lg px-2 text-[11px] font-black text-white" style={{ width: `${Math.max(14, p)}%`, background: p >= 60 ? "linear-gradient(90deg,#63b81e,#3f7a14)" : p >= 45 ? "linear-gradient(90deg,#0180cf,#0069b3)" : "linear-gradient(90deg,#f59e0b,#b45309)" }}>{p}%</div>
                </div>
                <div className="w-16 shrink-0 text-right text-[12px] font-bold tabular-nums text-slate-600">{compactInr(r.value)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
