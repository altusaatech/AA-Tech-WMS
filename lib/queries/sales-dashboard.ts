import "server-only";

import { db } from "@/lib/db";
import { salesQuotes, salesSo, salesGa, salesWo, salesPi } from "@/db/schema";

/**
 * Sales & Quotation Pipeline dashboard data.
 *
 * The sales registers are register-sized (hundreds–low-thousands of rows), so
 * we full-scan each table once and aggregate in JS — simplest and robust, and
 * it matches the "load + transform" pattern used by lib/queries/dashboard.ts.
 * The date range filters every period metric (KPIs, trend, funnel, tables);
 * KPI deltas compare against the immediately-preceding equal-length window.
 */

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** A `date`/timestamp column comes back as a string or Date; normalise to a
 *  yyyy-mm-dd string (local) or null. */
function toDayStr(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v).trim();
  if (!s) return null;
  return s.length >= 10 ? s.slice(0, 10) : s;
}

function inRange(day: string | null, start: string, end: string): boolean {
  if (!day) return false;
  return day >= start && day <= end;
}

/** WON / lost / active classification from the free-text quote status + PO. */
function isWon(poNo: unknown, poAmount: unknown): boolean {
  return Boolean(String(poNo ?? "").trim()) || num(poAmount) > 0;
}
function isLost(status: unknown): boolean {
  return /lost|cancel|reject|drop|dead/i.test(String(status ?? ""));
}

export interface SalesDashboardFilters {
  start: string; // yyyy-mm-dd inclusive
  end: string; // yyyy-mm-dd inclusive
}

export interface KpiValue {
  value: number;
  previous: number;
}
export interface FunnelStage {
  key: string;
  label: string;
  count: number;
  value: number;
}
export interface TrendPoint {
  month: string; // yyyy-mm
  label: string; // e.g. "Jul"
  quoteValue: number;
  poValue: number;
  piValue: number;
}
export interface StatusSlice {
  label: string;
  count: number;
  value: number;
}
export interface CompanyRow {
  company: string;
  poValue: number;
  count: number;
}
export interface RecentQuote {
  id: string;
  enquiryNo: string;
  company: string;
  product: string;
  status: string;
  won: boolean;
  quoteValue: number;
  poValue: number;
  poNo: string;
  createdAt: string;
}

export interface SalesDashboardData {
  filters: SalesDashboardFilters;
  kpis: {
    orderBook: KpiValue;
    quoteValue: KpiValue;
    piBilled: KpiValue;
    winRate: number; // %
    quoteCount: number;
    wonCount: number;
    activeEnquiries: number;
    avgDaysToPo: number | null;
  };
  funnel: FunnelStage[];
  trend: TrendPoint[];
  statusDist: StatusSlice[];
  topCompanies: CompanyRow[];
  dispatch: { onTime: number; delayed: number; pending: number };
  recent: RecentQuote[];
  totals: { quotes: number; won: number; so: number; ga: number; wo: number; pi: number };
  partialError: boolean;
  generatedAt: string;
}

/** Default window: the last 6 whole months (first-of-month 5 months ago → today). */
export function defaultSalesRange(today = new Date()): SalesDashboardFilters {
  const end = today.toISOString().slice(0, 10);
  const s = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 5, 1));
  return { start: s.toISOString().slice(0, 10), end };
}

/** The window of equal length immediately before [start, end]. */
function previousWindow(start: string, end: string): SalesDashboardFilters {
  const s = new Date(start + "T00:00:00Z").getTime();
  const e = new Date(end + "T00:00:00Z").getTime();
  const span = e - s;
  const prevEnd = new Date(s - 24 * 3600 * 1000);
  const prevStart = new Date(prevEnd.getTime() - span);
  return { start: prevStart.toISOString().slice(0, 10), end: prevEnd.toISOString().slice(0, 10) };
}

/** Month buckets (yyyy-mm) spanning the range, oldest → newest. */
function monthBuckets(start: string, end: string): { month: string; label: string }[] {
  const out: { month: string; label: string }[] = [];
  const s = new Date(start + "T00:00:00Z");
  const e = new Date(end + "T00:00:00Z");
  const cur = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), 1));
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let guard = 0;
  while (cur <= e && guard < 60) {
    const month = `${cur.getUTCFullYear()}-${String(cur.getUTCMonth() + 1).padStart(2, "0")}`;
    out.push({ month, label: MONTHS[cur.getUTCMonth()] ?? month });
    cur.setUTCMonth(cur.getUTCMonth() + 1);
    guard += 1;
  }
  return out;
}

export async function loadSalesDashboard(filters: SalesDashboardFilters): Promise<SalesDashboardData> {
  const { start, end } = filters;
  const prev = previousWindow(start, end);

  // Per-query degradation: a single slow/failed table shouldn't blank the whole
  // dashboard (and hit the app error boundary). Only a total failure throws.
  let failures = 0;
  const safe = async <T,>(p: Promise<T[]>): Promise<T[]> => {
    try {
      return await p;
    } catch {
      failures += 1;
      return [];
    }
  };

  // Lean column projections — we only pull what the aggregations use.
  const [quotes, so, ga, wo, pi] = await Promise.all([
    safe(
      db
        .select({
          id: salesQuotes.id,
          createdAt: salesQuotes.createdAt,
          enquiryNo: salesQuotes.enquiryNo,
          companyName: salesQuotes.companyName,
          product: salesQuotes.product,
          description: salesQuotes.description,
          basicAmount: salesQuotes.basicAmount,
          quoteStatus: salesQuotes.quoteStatus,
          poNo: salesQuotes.poNo,
          poAmount: salesQuotes.poAmount,
          poDate: salesQuotes.poDate,
        })
        .from(salesQuotes),
    ),
    safe(
      db
        .select({
          soDate: salesSo.soDate,
          amountWoGst: salesSo.amountWoGst,
          actualDispatchDate: salesSo.actualDispatchDate,
          noOfDaysDelay: salesSo.noOfDaysDelay,
        })
        .from(salesSo),
    ),
    safe(db.select({ gaSubmissionDate: salesGa.gaSubmissionDate, soDate: salesGa.soDate }).from(salesGa)),
    safe(db.select({ workOrderDate: salesWo.workOrderDate, bomDate: salesWo.bomDate }).from(salesWo)),
    safe(
      db
        .select({ piDate: salesPi.piDate, totalAmount: salesPi.totalAmount, basicAmount: salesPi.basicAmount })
        .from(salesPi),
    ),
  ]);

  // Everything failed → let the caller's error boundary offer a retry.
  if (failures === 5) throw new Error("sales dashboard: all queries failed");
  const partialError = failures > 0;

  // ── quotes-centric metrics ──
  const quoteCreated = (q: (typeof quotes)[number]) => toDayStr(q.createdAt);
  const inWin = quotes.filter((q) => inRange(quoteCreated(q), start, end));
  const inPrev = quotes.filter((q) => inRange(quoteCreated(q), prev.start, prev.end));

  const wonInWin = quotes.filter((q) => isWon(q.poNo, q.poAmount) && inRange(toDayStr(q.poDate), start, end));
  const wonInPrev = quotes.filter((q) => isWon(q.poNo, q.poAmount) && inRange(toDayStr(q.poDate), prev.start, prev.end));

  const sum = <T,>(rows: T[], f: (r: T) => number) => rows.reduce((a, r) => a + f(r), 0);

  const orderBook: KpiValue = {
    value: sum(wonInWin, (q) => num(q.poAmount)),
    previous: sum(wonInPrev, (q) => num(q.poAmount)),
  };
  const quoteValue: KpiValue = {
    value: sum(inWin, (q) => num(q.basicAmount)),
    previous: sum(inPrev, (q) => num(q.basicAmount)),
  };

  const piInWin = pi.filter((p) => inRange(toDayStr(p.piDate), start, end));
  const piInPrev = pi.filter((p) => inRange(toDayStr(p.piDate), prev.start, prev.end));
  const piBilled: KpiValue = {
    value: sum(piInWin, (p) => num(p.totalAmount) || num(p.basicAmount)),
    previous: sum(piInPrev, (p) => num(p.totalAmount) || num(p.basicAmount)),
  };

  const quoteCount = inWin.length;
  const wonCount = inWin.filter((q) => isWon(q.poNo, q.poAmount)).length;
  const winRate = quoteCount ? Math.round((wonCount / quoteCount) * 100) : 0;
  const activeEnquiries = inWin.filter((q) => !isWon(q.poNo, q.poAmount) && !isLost(q.quoteStatus)).length;

  // avg days from quote creation → PO date
  const cycleRows = quotes.filter(
    (q) => isWon(q.poNo, q.poAmount) && quoteCreated(q) && toDayStr(q.poDate) && inRange(toDayStr(q.poDate), start, end),
  );
  const avgDaysToPo = cycleRows.length
    ? Math.round(
        cycleRows.reduce((a, q) => {
          const c = new Date((quoteCreated(q) ?? "") + "T00:00:00Z").getTime();
          const p = new Date((toDayStr(q.poDate) ?? "") + "T00:00:00Z").getTime();
          return a + Math.max(0, (p - c) / (24 * 3600 * 1000));
        }, 0) / cycleRows.length,
      )
    : null;

  // ── funnel (period-scoped by each stage's natural date) ──
  const soInWin = so.filter((r) => inRange(toDayStr(r.soDate), start, end));
  const gaInWin = ga.filter((r) => inRange(toDayStr(r.gaSubmissionDate) ?? toDayStr(r.soDate), start, end));
  const woInWin = wo.filter((r) => inRange(toDayStr(r.workOrderDate) ?? toDayStr(r.bomDate), start, end));

  const funnel: FunnelStage[] = [
    { key: "quote", label: "Quotes", count: quoteCount, value: quoteValue.value },
    { key: "won", label: "Orders Won", count: wonCount, value: orderBook.value },
    { key: "so", label: "Sales Orders", count: soInWin.length, value: sum(soInWin, (r) => num(r.amountWoGst)) },
    { key: "ga", label: "GA Approvals", count: gaInWin.length, value: 0 },
    { key: "wo", label: "Work Orders", count: woInWin.length, value: 0 },
    { key: "pi", label: "Proforma Invoices", count: piInWin.length, value: piBilled.value },
  ];

  // ── monthly trend ──
  const buckets = monthBuckets(start, end);
  const trend: TrendPoint[] = buckets.map((b) => {
    const quoteValueM = sum(
      quotes.filter((q) => (quoteCreated(q) ?? "").slice(0, 7) === b.month),
      (q) => num(q.basicAmount),
    );
    const poValueM = sum(
      quotes.filter((q) => isWon(q.poNo, q.poAmount) && (toDayStr(q.poDate) ?? "").slice(0, 7) === b.month),
      (q) => num(q.poAmount),
    );
    const piValueM = sum(
      pi.filter((p) => (toDayStr(p.piDate) ?? "").slice(0, 7) === b.month),
      (p) => num(p.totalAmount) || num(p.basicAmount),
    );
    return { month: b.month, label: b.label, quoteValue: quoteValueM, poValue: poValueM, piValue: piValueM };
  });

  // ── quote-status distribution (period) ──
  const statusMap = new Map<string, { count: number; value: number }>();
  for (const q of inWin) {
    const label = String(q.quoteStatus ?? "").trim() || (isWon(q.poNo, q.poAmount) ? "Won" : "Unspecified");
    const ex = statusMap.get(label) ?? { count: 0, value: 0 };
    ex.count += 1;
    ex.value += num(q.basicAmount);
    statusMap.set(label, ex);
  }
  const statusDist: StatusSlice[] = Array.from(statusMap.entries())
    .map(([label, v]) => ({ label, count: v.count, value: v.value }))
    .sort((a, b) => b.count - a.count);

  // ── top companies by order value (period) ──
  const compMap = new Map<string, { poValue: number; count: number }>();
  for (const q of wonInWin) {
    const company = String(q.companyName ?? "").trim() || "—";
    const ex = compMap.get(company) ?? { poValue: 0, count: 0 };
    ex.poValue += num(q.poAmount);
    ex.count += 1;
    compMap.set(company, ex);
  }
  const topCompanies: CompanyRow[] = Array.from(compMap.entries())
    .map(([company, v]) => ({ company, poValue: v.poValue, count: v.count }))
    .sort((a, b) => b.poValue - a.poValue)
    .slice(0, 8);

  // ── dispatch performance (from SO delay field, period-scoped) ──
  let onTime = 0;
  let delayed = 0;
  let pending = 0;
  for (const r of soInWin) {
    const dispatched = toDayStr(r.actualDispatchDate);
    if (!dispatched) pending += 1;
    else if (num(r.noOfDaysDelay) > 0) delayed += 1;
    else onTime += 1;
  }

  // ── recent quotes (period, newest first) ──
  const recent: RecentQuote[] = inWin
    .slice()
    .sort((a, b) => (toDayStr(b.createdAt) ?? "").localeCompare(toDayStr(a.createdAt) ?? ""))
    .slice(0, 12)
    .map((q) => ({
      id: q.id,
      enquiryNo: String(q.enquiryNo ?? "").trim(),
      company: String(q.companyName ?? "").trim() || "—",
      product: String(q.product ?? q.description ?? "").trim(),
      status: String(q.quoteStatus ?? "").trim() || (isWon(q.poNo, q.poAmount) ? "Won" : "—"),
      won: isWon(q.poNo, q.poAmount),
      quoteValue: num(q.basicAmount),
      poValue: num(q.poAmount),
      poNo: String(q.poNo ?? "").trim(),
      createdAt: quoteCreated(q) ?? "",
    }));

  return {
    filters,
    kpis: { orderBook, quoteValue, piBilled, winRate, quoteCount, wonCount, activeEnquiries, avgDaysToPo },
    funnel,
    trend,
    statusDist,
    topCompanies,
    dispatch: { onTime, delayed, pending },
    recent,
    totals: { quotes: quotes.length, won: quotes.filter((q) => isWon(q.poNo, q.poAmount)).length, so: so.length, ga: ga.length, wo: wo.length, pi: pi.length },
    partialError,
    generatedAt: new Date().toISOString(),
  };
}
