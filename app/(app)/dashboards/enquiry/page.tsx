import { Inbox } from "lucide-react";
import { requireUser } from "@/lib/auth/current";
import { db } from "@/lib/db";
import { salesQuotes, salesSo } from "@/db/schema";
import { DashboardCanvas } from "@/components/dashboards/dashboard-canvas";
import { EnquiryDashboard, type EnquiryRow, type Activity, type WeekBar } from "@/components/dashboards/enquiry/enquiry-dashboard";

export const dynamic = "force-dynamic";

const SENT_RE = /(sent|po|received|won|order|accept|lost|regret)/i;
const LOST_RE = /(lost|regret|cancel|drop|reject)/i;
const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : String(v ?? ""));
const num = (v: unknown) => Number(v) || 0;
const monthOf = (d: string) => (d || "").slice(0, 7);

function lastMonths(maps: Map<string, number>[], n: number): string[] {
  const set = new Set<string>();
  for (const m of maps) for (const k of m.keys()) set.add(k);
  return Array.from(set).sort().slice(-n);
}
function delta(map: Map<string, number>, months: string[]): number {
  const last = map.get(months[months.length - 1] ?? "") ?? 0;
  const prev = map.get(months[months.length - 2] ?? "") ?? 0;
  if (!prev) return last ? 100 : 0;
  return Math.max(-999, Math.min(999, Math.round(((last - prev) / prev) * 100)));
}
function weekStart(dateStr: string): Date {
  const d = new Date(dateStr + "T00:00:00Z");
  const dow = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dow);
  return d;
}
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

export default async function EnquiryDashboardPage() {
  await requireUser();

  let quotes: (typeof salesQuotes.$inferSelect)[] = [];
  let so: (typeof salesSo.$inferSelect)[] = [];
  try {
    [quotes, so] = await Promise.all([db.select().from(salesQuotes), db.select().from(salesSo)]);
  } catch {
    /* degrade to empty */
  }

  const soByEnquiry = new Map(so.filter((s) => (s.enquiryNo ?? "").trim()).map((s) => [(s.enquiryNo as string).trim(), s]));

  const rows: EnquiryRow[] = quotes.map((q) => {
    const enquiryNo = (q.enquiryNo ?? "").trim();
    const status = (q.quoteStatus ?? "").trim();
    const soRow = enquiryNo ? soByEnquiry.get(enquiryNo) : undefined;
    const quoteSent = (!!status && SENT_RE.test(status)) || !!(q.quoteLink && q.quoteLink.trim());
    const created = iso(q.createdAt);
    const date = (q.poDate as string | null)?.trim() || created.slice(0, 10);
    return {
      enquiryNo: enquiryNo || "—",
      company: q.companyName ?? "",
      person: q.personName ?? "",
      product: (q.product ?? "").trim() || "Doors",
      item: q.item ?? q.description ?? "",
      amount: num(q.basicAmount) || num(q.poAmount) || 0,
      quoteStatus: status || "Enquiry",
      quoteSent,
      soCreated: !!soRow,
      soNo: soRow?.ourSoNo ?? null,
      source: q.enquirySource ?? "—",
      date,
      createdAt: created,
    };
  });

  const enquiries = rows.length;
  const quotationsSent = rows.filter((r) => r.quoteSent).length;
  const soCreated = so.length;
  const revenue = so.reduce((s, r) => s + num(r.amountWoGst), 0);

  // ── monthly series for the KPI sparklines ──
  const qDate = (q: typeof salesQuotes.$inferSelect) => (q.poDate as string | null)?.trim() || iso(q.createdAt).slice(0, 10);
  const soDate = (s: typeof salesSo.$inferSelect) => (s.soDate as string | null)?.trim() || iso(s.createdAt).slice(0, 10);
  const enqM = new Map<string, number>(), quoM = new Map<string, number>(), soM = new Map<string, number>(), revM = new Map<string, number>();
  for (const q of quotes) {
    const mk = monthOf(qDate(q)); if (!mk) continue;
    enqM.set(mk, (enqM.get(mk) ?? 0) + 1);
    const sent = (!!(q.quoteStatus ?? "").trim() && SENT_RE.test((q.quoteStatus ?? "").trim())) || !!(q.quoteLink && q.quoteLink.trim());
    if (sent) quoM.set(mk, (quoM.get(mk) ?? 0) + 1);
  }
  for (const s of so) {
    const mk = monthOf(soDate(s)); if (!mk) continue;
    soM.set(mk, (soM.get(mk) ?? 0) + 1);
    revM.set(mk, (revM.get(mk) ?? 0) + num(s.amountWoGst));
  }
  const months = lastMonths([enqM, quoM, soM, revM], 8);
  const series = {
    enquiries: months.map((m) => enqM.get(m) ?? 0),
    quotations: months.map((m) => quoM.get(m) ?? 0),
    sales: months.map((m) => soM.get(m) ?? 0),
    revenue: months.map((m) => revM.get(m) ?? 0),
  };
  const deltas = { enquiries: delta(enqM, months), quotations: delta(quoM, months), sales: delta(soM, months), revenue: delta(revM, months) };

  // ── weekly Quotations vs Converted (last 5 weeks) ──
  const allDates = [...quotes.map(qDate), ...so.map(soDate)].filter(Boolean).sort();
  const anchor = allDates[allDates.length - 1] ?? "";
  let weekly: WeekBar[] = [];
  if (anchor) {
    const start0 = weekStart(anchor);
    const weeks: { key: string; label: string; quotations: number; converted: number }[] = [];
    for (let i = 4; i >= 0; i--) {
      const s = new Date(start0); s.setUTCDate(s.getUTCDate() - i * 7);
      weeks.push({ key: dayKey(s), label: `${s.getUTCDate()}/${s.getUTCMonth() + 1}`, quotations: 0, converted: 0 });
    }
    const idxOf = (d: string) => { const k = dayKey(weekStart(d)); return weeks.findIndex((w) => w.key === k); };
    for (const q of quotes) {
      const sent = (!!(q.quoteStatus ?? "").trim() && SENT_RE.test((q.quoteStatus ?? "").trim())) || !!(q.quoteLink && q.quoteLink.trim());
      if (!sent) continue; const i = idxOf(qDate(q)); if (i >= 0) weeks[i]!.quotations++;
    }
    for (const s of so) { const i = idxOf(soDate(s)); if (i >= 0) weeks[i]!.converted++; }
    weekly = weeks.map((w) => ({ label: w.label, quotations: w.quotations, converted: w.converted }));
  }

  // ── recent activity feed (newest first, by best date) ──
  const acts: Activity[] = [];
  for (const s of so) acts.push({ kind: "so", title: `Sales Order ${s.ourSoNo ?? ""}`.trim(), subtitle: s.companyName ?? "", date: soDate(s), amount: num(s.amountWoGst) });
  for (const q of quotes) {
    if ((q.poNo ?? "").trim()) acts.push({ kind: "po", title: `PO received · ${q.poNo}`, subtitle: q.companyName ?? "", date: qDate(q), amount: num(q.poAmount) });
    else if ((!!(q.quoteStatus ?? "").trim() && SENT_RE.test((q.quoteStatus ?? "").trim())) || !!(q.quoteLink && q.quoteLink.trim()))
      acts.push({ kind: "quote", title: `Quotation sent · ${q.companyName ?? ""}`, subtitle: (q.enquiryNo ?? "").trim() || (q.product ?? ""), date: qDate(q), amount: num(q.basicAmount) });
    else acts.push({ kind: "enquiry", title: `Enquiry · ${q.companyName ?? ""}`, subtitle: (q.product ?? "").trim() || (q.enquiryNo ?? ""), date: qDate(q), amount: num(q.basicAmount) });
  }
  const activities = acts.filter((a) => a.date).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);

  // ── funnel stages (real) ──
  const lost = rows.filter((r) => LOST_RE.test(r.quoteStatus)).length;
  const discussion = rows.filter((r) => r.quoteSent && !r.soCreated && !LOST_RE.test(r.quoteStatus)).length;
  const funnel = [
    { label: "New Enquiries", value: enquiries, from: "#2a78d6", to: "#185fa5" },
    { label: "Quotations Sent", value: quotationsSent, from: "#63b81e", to: "#4a9616" },
    { label: "In Discussion", value: discussion, from: "#f59e0b", to: "#d97706" },
    { label: "Converted", value: soCreated, from: "#0a7d8a", to: "#0069b3" },
    { label: "Lost", value: lost, from: "#7c3aed", to: "#6d28d9" },
  ];

  const dated = rows.map((r) => r.date).filter(Boolean).sort();
  const latest = dated[dated.length - 1] ?? "";
  const initialYear = latest ? Number(latest.slice(0, 4)) : new Date().getFullYear();
  const initialMonth = latest ? Number(latest.slice(5, 7)) - 1 : new Date().getMonth();

  return (
    <DashboardCanvas eyebrow="Live · Sales" title="Enquiry Dashboard" subtitle="Enquiries, quotations, conversion & activity — at a glance" Icon={Inbox}>
      <EnquiryDashboard
        rows={rows}
        kpis={{ enquiries, quotationsSent, soCreated, revenue }}
        series={series}
        deltas={deltas}
        funnel={funnel}
        weekly={weekly}
        activities={activities}
        initialYear={initialYear}
        initialMonth={initialMonth}
      />
    </DashboardCanvas>
  );
}
