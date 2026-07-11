"use client";

import * as React from "react";
import { Search, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { SectionCard } from "@/components/dashboards/section-card";
import { formatInr } from "@/lib/format";
import type { RecentQuote } from "@/lib/queries/sales-dashboard";

type SortKey = "enquiryNo" | "company" | "status" | "quoteValue" | "poValue" | "createdAt";

const COLS: { key: SortKey; label: string; numeric?: boolean; className?: string }[] = [
  { key: "enquiryNo", label: "Enquiry" },
  { key: "company", label: "Company" },
  { key: "status", label: "Status" },
  { key: "quoteValue", label: "Quote ₹", numeric: true },
  { key: "poValue", label: "PO ₹", numeric: true },
  { key: "createdAt", label: "Date" },
];

export function RecentQuotesTable({ rows }: { rows: RecentQuote[] }) {
  const [q, setQ] = React.useState("");
  const [sortKey, setSortKey] = React.useState<SortKey>("createdAt");
  const [dir, setDir] = React.useState<"asc" | "desc">("desc");

  const view = React.useMemo(() => {
    const t = q.trim().toLowerCase();
    let r = rows;
    if (t) r = r.filter((x) => `${x.enquiryNo} ${x.company} ${x.product} ${x.status}`.toLowerCase().includes(t));
    const numeric = sortKey === "quoteValue" || sortKey === "poValue";
    return [...r].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = numeric ? Number(av) - Number(bv) : String(av).localeCompare(String(bv));
      return dir === "asc" ? cmp : -cmp;
    });
  }, [rows, q, sortKey, dir]);

  function toggle(k: SortKey) {
    if (k === sortKey) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setDir(k === "quoteValue" || k === "poValue" || k === "createdAt" ? "desc" : "asc");
    }
  }

  return (
    <SectionCard
      title="Recent Quotes"
      subtitle="Latest enquiries in the selected period"
      right={
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-subtle" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            className="h-8 w-[180px] max-w-[46vw] rounded-lg border border-hairline bg-surface-soft pl-8 pr-2.5 text-[12.5px] outline-none focus:border-[#0180cf]"
          />
        </div>
      }
      bodyClassName="thin-scroll -mx-2 overflow-x-auto"
    >
      <table className="w-full border-collapse text-[12.5px]">
        <thead>
          <tr className="border-b border-hairline-strong">
            {COLS.map((c) => {
              const active = sortKey === c.key;
              return (
                <th
                  key={c.key}
                  onClick={() => toggle(c.key)}
                  className={`cursor-pointer select-none whitespace-nowrap px-3 py-2 font-black uppercase tracking-[0.05em] text-ink-subtle ${c.numeric ? "text-right" : "text-left"}`}
                  style={{ fontSize: 10.5 }}
                >
                  <span className={`inline-flex items-center gap-1 ${c.numeric ? "flex-row-reverse" : ""}`}>
                    {c.label}
                    {active ? (
                      dir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                    ) : (
                      <ChevronsUpDown size={12} className="text-slate-300" />
                    )}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {view.length === 0 ? (
            <tr>
              <td colSpan={COLS.length} className="px-3 py-10 text-center text-[13px] text-ink-subtle">
                No quotes match.
              </td>
            </tr>
          ) : (
            view.map((r, i) => (
              <tr key={r.id} className={`border-b border-hairline ${i % 2 ? "bg-surface-soft/50" : ""}`}>
                <td className="whitespace-nowrap px-3 py-2 font-bold text-ink-soft">{r.enquiryNo || "—"}</td>
                <td className="max-w-[220px] truncate px-3 py-2 text-ink" title={r.company}>{r.company}</td>
                <td className="whitespace-nowrap px-3 py-2">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
                    style={
                      r.won
                        ? { background: "rgba(99,184,30,0.14)", color: "#3f7a14" }
                        : { background: "rgba(1,128,207,0.10)", color: "#0069b3" }
                    }
                  >
                    {r.status || "—"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums text-ink">{r.quoteValue ? formatInr(r.quoteValue) : "—"}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right font-black tabular-nums text-ink-strong">{r.poValue ? formatInr(r.poValue) : "—"}</td>
                <td className="whitespace-nowrap px-3 py-2 tabular-nums text-ink-subtle">{r.createdAt || "—"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </SectionCard>
  );
}
