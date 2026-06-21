"use client";

import * as React from "react";
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, Trash2, ExternalLink, Table2 } from "lucide-react";
import { deleteSalesRow, type SaleKind, type SalesRow } from "@/app/(app)/sales/actions";
import type { SalesColDef } from "@/lib/sales/columns";

const BLUE = "#0180cf";
const BLUE_DEEP = "#0069b3";
const GREEN = "#63b81e";

/**
 * "Excel Data" panel — a bold, premium spreadsheet view: gradient header row,
 * tri-colour accent bar, zebra rows, click-to-sort, search, row-click-to-edit.
 * Pure presentation; all writes still go through the existing server actions.
 */
export function SalesDataGrid({
  kind,
  columns,
  rows,
  onEdit,
  onDeleted,
}: {
  kind: SaleKind;
  columns: SalesColDef[];
  rows: SalesRow[];
  onEdit: (row: SalesRow) => void;
  onDeleted: (id: string) => void;
}) {
  const [q, setQ] = React.useState("");
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");

  const view = React.useMemo(() => {
    let r = rows;
    const t = q.trim().toLowerCase();
    if (t) r = r.filter((row) => columns.some((c) => String(row[c.key] ?? "").toLowerCase().includes(t)));
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      r = [...r].sort((a, b) => {
        const av = a[sortKey] ?? "";
        const bv = b[sortKey] ?? "";
        const cmp =
          col?.type === "number"
            ? (Number(av) || 0) - (Number(bv) || 0)
            : String(av).localeCompare(String(bv));
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return r;
  }, [rows, q, sortKey, sortDir, columns]);

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  async function del(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!window.confirm("Delete this entry?")) return;
    onDeleted(id);
    await deleteSalesRow(kind, id);
  }

  return (
    <div>
      {/* toolbar */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            className="h-10 w-[280px] max-w-[60vw] rounded-xl border border-hairline bg-surface-card pl-9 pr-3 text-[13px] shadow-sm outline-none transition-all focus:border-[#0180cf] focus:ring-2 focus:ring-[#0180cf]/20"
          />
        </div>
        <span
          className="rounded-full px-3 py-1 text-[12px] font-bold tabular-nums text-white"
          style={{ background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DEEP})` }}
        >
          {view.length} of {rows.length}
        </span>
      </div>

      <div
        className="overflow-hidden rounded-2xl border border-hairline bg-surface-card"
        style={{ boxShadow: "0 18px 40px -16px rgba(0,105,179,0.28), 0 2px 8px rgba(15,23,42,0.05)" }}
      >
        {/* tri-colour accent bar */}
        <div style={{ height: 4, background: `linear-gradient(90deg, ${GREEN}, ${BLUE} 55%, ${BLUE_DEEP})` }} />

        <div className="overflow-auto" style={{ maxHeight: "62vh" }}>
          <table className="w-max border-collapse text-[13px]">
            <thead className="sticky top-0 z-10">
              <tr>
                {columns.map((c) => {
                  const sorted = sortKey === c.key;
                  return (
                    <th
                      key={c.key}
                      onClick={() => toggleSort(c.key)}
                      className="cursor-pointer select-none whitespace-nowrap px-3.5 py-3 text-left font-extrabold uppercase tracking-[0.04em] text-white"
                      style={{
                        minWidth: c.width ?? 130,
                        fontSize: 11,
                        background: `linear-gradient(180deg, ${BLUE_DEEP}, #00598f)`,
                        borderRight: "1px solid rgba(255,255,255,0.14)",
                        boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.12)",
                      }}
                    >
                      <span className="inline-flex items-center gap-1">
                        {c.label}
                        {sorted ? (
                          sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                        ) : (
                          <ChevronsUpDown size={12} className="text-white/45" />
                        )}
                      </span>
                    </th>
                  );
                })}
                <th
                  className="sticky right-0 px-2 py-3"
                  style={{ background: `linear-gradient(180deg, ${BLUE_DEEP}, #00598f)`, boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.12)" }}
                />
              </tr>
            </thead>
            <tbody>
              {view.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-16">
                    <div className="flex flex-col items-center justify-center text-center">
                      <span
                        className="inline-flex size-14 items-center justify-center rounded-2xl text-white shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${GREEN}, ${BLUE_DEEP})` }}
                      >
                        <Table2 size={26} strokeWidth={2.2} />
                      </span>
                      <p className="mt-3 text-[15px] font-bold text-ink-strong">
                        {rows.length === 0 ? "No entries yet" : "No rows match your search"}
                      </p>
                      <p className="mt-1 text-[13px] text-ink-subtle">
                        {rows.length === 0 ? "Click “New entry” to add your first row." : "Try a different search."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                view.map((row, i) => (
                  <tr
                    key={row.id}
                    onClick={() => onEdit(row)}
                    className={`group cursor-pointer transition-colors hover:bg-[#e4f2fc] ${i % 2 ? "bg-[#f5fafe]" : "bg-white"}`}
                  >
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={`whitespace-nowrap border-b border-r border-[#e7eff6] px-3.5 py-2.5 text-ink-soft ${
                          c.type === "number" ? "text-right font-semibold tabular-nums" : ""
                        }`}
                        style={{ minWidth: c.width ?? 130 }}
                      >
                        <CellValue row={row} col={c} />
                      </td>
                    ))}
                    <td className="sticky right-0 bg-inherit px-1 text-center">
                      <button
                        type="button"
                        onClick={(e) => del(e, row.id)}
                        className="rounded-lg p-1.5 text-ink-subtle opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CellValue({ row, col }: { row: SalesRow; col: SalesColDef }) {
  const v = row[col.key];
  if (v == null || v === "") return <span className="text-ink-subtle/35">—</span>;

  if (col.type === "bool") {
    const yes = v === true || v === "true";
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
        style={{
          background: yes ? "color-mix(in srgb, #63b81e 18%, transparent)" : "var(--color-hairline)",
          color: yes ? "#3f7a14" : "var(--color-ink-subtle)",
        }}
      >
        <span className="size-1.5 rounded-full" style={{ background: yes ? "#63b81e" : "#9aa6b2" }} />
        {yes ? "Yes" : "No"}
      </span>
    );
  }
  if (col.type === "url") {
    return (
      <a
        href={String(v)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1 font-bold text-[#0180cf] hover:underline"
      >
        <ExternalLink size={12} /> Link
      </a>
    );
  }
  return <span className="font-medium text-ink-strong">{String(v)}</span>;
}
