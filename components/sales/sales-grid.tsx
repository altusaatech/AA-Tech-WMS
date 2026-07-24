"use client";

import * as React from "react";
import {
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Trash2,
  ExternalLink,
  Table2,
  SlidersHorizontal,
  Download,
  Upload,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  CheckCircle2,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { deleteSalesRow, importSalesRows, type SaleKind, type SalesRow } from "@/app/(app)/sales/actions";
import type { SalesColDef } from "@/lib/sales/columns";

const PAGE_SIZES = [10, 25, 50, 100];

// Visual range picker — how much of the sheet to render for selection.
const MAX_PREVIEW_ROWS = 300;
const MAX_PREVIEW_COLS = 40;

function normRange(r1: number, c1: number, r2: number, c2: number) {
  return { r1: Math.min(r1, r2), c1: Math.min(c1, c2), r2: Math.max(r1, r2), c2: Math.max(c1, c2) };
}
/** 0 → A, 1 → B, … 26 → AA (Excel column letters). */
function colLetter(i: number): string {
  let s = "";
  let n = i;
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
}
function cellToValue(col: SalesColDef, raw: string): string | boolean | null {
  const s = raw.trim();
  if (s === "") return null;
  if (col.type === "bool") return ["yes", "true", "1", "y"].includes(s.toLowerCase());
  if (col.type === "date") {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? s : d.toISOString().slice(0, 10);
  }
  return s;
}

/**
 * "Register" — a modern Excel-style data table: gradient sticky header, grid
 * lines, zebra rows, click-to-sort, global search, per-column filters,
 * pagination and one-click Export to Excel. Pure presentation; all writes
 * still go through the existing server actions.
 */
export function SalesDataGrid({
  kind,
  title,
  columns,
  rows,
  onEdit,
  onEditKyc,
  onDeleted,
  onImported,
  from = "#0069b3",
  to = "#0180cf",
  enquiryPiMap,
  groups,
}: {
  kind: SaleKind;
  title?: string;
  columns: SalesColDef[];
  rows: SalesRow[];
  onEdit: (row: SalesRow) => void;
  /** Edit the linked Customer KYC record (second pen) — shown when a row has one. */
  onEditKyc?: (row: SalesRow) => void;
  onDeleted: (id: string) => void;
  onImported: (rows: SalesRow[]) => void;
  from?: string;
  to?: string;
  /** Enquiry No (trimmed, lower-cased) → quotation id. When set, the Enquiry No
   *  cell links to that quotation's PI. */
  enquiryPiMap?: Record<string, string>;
  /** Ordered header groups spanning the columns (labels frozen above the column
   *  headers). A `spacer` segment renders an empty gutter between groups. */
  groups?: { label: string; span: number; spacer?: boolean }[];
}) {
  const [q, setQ] = React.useState("");
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");
  const [showFilters, setShowFilters] = React.useState(false);
  const [colFilters, setColFilters] = React.useState<Record<string, string>>({});
  const [page, setPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(25);
  const [importing, setImporting] = React.useState(false);
  const [banner, setBanner] = React.useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  // Multi-sheet workbooks: hold the parsed book and offer a sheet picker.
  const wbRef = React.useRef<import("xlsx").WorkBook | null>(null);
  const [sheetPicker, setSheetPicker] = React.useState<string[] | null>(null);
  // Visual range picker — show the sheet as a grid and let the user drag-select
  // the block to import (top row of the selection = column headers).
  const [rangeGrid, setRangeGrid] = React.useState<{ name: string; cells: string[][]; truncated: boolean } | null>(null);
  const [sel, setSel] = React.useState<{ r1: number; c1: number; r2: number; c2: number } | null>(null);
  const [anchor, setAnchor] = React.useState<{ r: number; c: number } | null>(null);

  const view = React.useMemo(() => {
    let r = rows;
    const t = q.trim().toLowerCase();
    if (t) r = r.filter((row) => columns.some((c) => String(row[c.key] ?? "").toLowerCase().includes(t)));
    for (const [key, val] of Object.entries(colFilters)) {
      const v = val.trim().toLowerCase();
      if (!v) continue;
      r = r.filter((row) => String(row[key] ?? "").toLowerCase().includes(v));
    }
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
  }, [rows, q, colFilters, sortKey, sortDir, columns]);

  // keep page in range as the filtered set shrinks
  const pageCount = Math.max(1, Math.ceil(view.length / pageSize));
  React.useEffect(() => {
    if (page > pageCount - 1) setPage(0);
  }, [page, pageCount]);
  const paged = view.slice(page * pageSize, page * pageSize + pageSize);

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  async function del(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    onDeleted(id);
    await deleteSalesRow(kind, id);
  }

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const data = view.map((row) => {
      const o: Record<string, string | number> = {};
      for (const c of columns) {
        const v = row[c.key];
        o[c.label] =
          v == null || v === ""
            ? ""
            : c.type === "bool"
            ? v === true || v === "true"
              ? "Yes"
              : "No"
            : c.type === "number"
            ? Number(v)
            : String(v);
      }
      return o;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = columns.map((c) => ({ wch: Math.min(40, Math.max(10, (c.label?.length ?? 10) + 4)) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, (title ?? "Data").slice(0, 28));
    const stamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `${(title ?? kind).replace(/\s+/g, "-")}-${stamp}.xlsx`);
  }

  // Blank Excel template with exactly the columns the importer expects, so
  // users can fill it and bulk-upload. Headers = writable column labels.
  async function downloadTemplate() {
    const XLSX = await import("xlsx");
    const headers = columns.filter((c) => !c.readOnly).map((c) => c.label);
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    ws["!cols"] = headers.map((h) => ({ wch: Math.min(40, Math.max(12, h.length + 4)) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `${(title ?? kind).replace(/\s+/g, "-")}-template.xlsx`);
  }

  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = "";
    if (!file) return;
    setBanner(null);
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: true });
      if (!wb.SheetNames.length) throw new Error("empty workbook");
      wbRef.current = wb;
      // Multiple sheets → let the user choose which one maps to this register.
      if (wb.SheetNames.length > 1) {
        setSheetPicker(wb.SheetNames);
        return;
      }
      await openRange(wb.SheetNames[0]!);
    } catch {
      setBanner({ kind: "err", text: "Could not read the file. Make sure it's a valid Excel/CSV file." });
    }
  }

  // Load a sheet into the visual range picker (capped for smooth rendering).
  async function openRange(sheetName: string) {
    const wb = wbRef.current;
    if (!wb) return;
    setSheetPicker(null);
    setBanner(null);
    try {
      const XLSX = await import("xlsx");
      const ws = wb.Sheets[sheetName];
      if (!ws) throw new Error("empty sheet");
      const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "", raw: false, blankrows: true });
      const capped = aoa.slice(0, MAX_PREVIEW_ROWS);
      const maxCols = Math.min(MAX_PREVIEW_COLS, capped.reduce((m, r) => Math.max(m, (r as unknown[]).length), 1));
      const cells = capped.map((r) => {
        const row = (r as unknown[]).slice(0, maxCols).map((v) => String(v ?? ""));
        while (row.length < maxCols) row.push("");
        return row;
      });
      setSel(null);
      setAnchor(null);
      setRangeGrid({ name: sheetName, cells, truncated: aoa.length > MAX_PREVIEW_ROWS });
    } catch {
      setBanner({ kind: "err", text: "Could not read that sheet." });
    }
  }

  function onCellDown(r: number, c: number, shift = false) {
    // Shift-click extends the current selection from its top-left origin, so a
    // large block can be picked without dragging across a scrolling grid:
    // click the header cell, scroll, then shift-click the bottom-right cell.
    if (shift && sel) {
      setSel(normRange(sel.r1, sel.c1, r, c));
      return;
    }
    setAnchor({ r, c });
    setSel({ r1: r, c1: c, r2: r, c2: c });
  }
  function onCellEnter(r: number, c: number) {
    if (anchor) setSel(normRange(anchor.r, anchor.c, r, c));
  }
  function endSelect() {
    setAnchor(null);
  }

  // Import the selected block: its top row is the header row, mapped to columns.
  async function importRange() {
    if (!rangeGrid || !sel) return;
    if (sel.r2 - sel.r1 < 1) {
      setBanner({ kind: "err", text: "Select the header row plus at least one data row." });
      return;
    }
    setImporting(true);
    setBanner(null);
    try {
      const { cells } = rangeGrid;
      const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
      const headerCols: (SalesColDef | null)[] = [];
      for (let c = sel.c1; c <= sel.c2; c++) {
        const h = norm(String(cells[sel.r1]?.[c] ?? ""));
        headerCols.push(columns.find((col) => !col.readOnly && norm(col.label) === h) ?? null);
      }
      const matched = headerCols.filter(Boolean).length;
      const mapped: Record<string, string | boolean | null>[] = [];
      let skipped = 0;
      for (let r = sel.r1 + 1; r <= sel.r2; r++) {
        const out: Record<string, string | boolean | null> = {};
        headerCols.forEach((col, i) => {
          if (!col) return;
          const raw = String(cells[r]?.[sel.c1 + i] ?? "").trim();
          if (raw === "") return;
          out[col.key] = cellToValue(col, raw);
        });
        if (Object.keys(out).length > 0) mapped.push(out);
        else skipped++;
      }
      if (!matched) {
        setBanner({ kind: "err", text: "No column headers in the top row of your selection matched this register. Include the header row and check the names (Template shows the exact ones)." });
        return;
      }
      if (!mapped.length) {
        setBanner({ kind: "err", text: "The selected rows are empty." });
        return;
      }
      const inserted = await importSalesRows(kind, mapped);
      if (inserted.length) onImported(inserted);
      setBanner({ kind: "ok", text: `Imported ${inserted.length} row${inserted.length === 1 ? "" : "s"} from “${rangeGrid.name}” · ${matched} column${matched === 1 ? "" : "s"} matched${skipped ? ` · ${skipped} empty skipped` : ""}.` });
      setRangeGrid(null);
      setSel(null);
      setAnchor(null);
      wbRef.current = null;
    } catch {
      setBanner({ kind: "err", text: "Import failed. Please try again." });
    } finally {
      setImporting(false);
    }
  }

  const activeColFilters = Object.values(colFilters).filter((v) => v.trim()).length;

  return (
    <div>
      {/* ── toolbar ── */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search all columns…"
              className="h-10 w-[260px] max-w-[60vw] rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-[13px] shadow-sm outline-none transition-all focus:border-[#0180cf] focus:ring-2 focus:ring-[#0180cf]/20"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((s) => !s)}
            className={`inline-flex h-10 items-center gap-1.5 rounded-xl border px-3.5 text-[13px] font-bold shadow-sm transition-all ${
              showFilters || activeColFilters
                ? "border-[#0180cf] bg-[#0180cf]/8 text-[#0069b3]"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <SlidersHorizontal size={15} /> Filters
            {activeColFilters > 0 && (
              <span className="ml-0.5 inline-flex size-5 items-center justify-center rounded-full bg-[#0180cf] text-[10px] font-black text-white">
                {activeColFilters}
              </span>
            )}
          </button>
          {activeColFilters > 0 && (
            <button
              type="button"
              onClick={() => setColFilters({})}
              className="inline-flex h-10 items-center gap-1 rounded-xl px-2 text-[12.5px] font-semibold text-slate-500 hover:text-red-600"
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span
            className="rounded-full px-3 py-1 text-[12px] font-bold tabular-nums text-white shadow-sm"
            style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
          >
            {view.length} of {rows.length}
          </span>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={onImportFile} className="hidden" />
          <button
            type="button"
            onClick={downloadTemplate}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-[13px] font-bold text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-50"
            title="Download a blank Excel template with the correct columns"
          >
            <FileSpreadsheet size={15} /> Template
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#0180cf]/40 bg-[#0180cf]/10 px-3.5 text-[13px] font-bold text-[#0069b3] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#0180cf]/15 disabled:opacity-50 disabled:hover:translate-y-0"
            title="Bulk upload — import rows from an Excel/CSV file"
          >
            {importing ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} Bulk Upload
          </button>
          <button
            type="button"
            onClick={exportExcel}
            disabled={rows.length === 0}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#63b81e]/40 bg-[#63b81e]/10 px-3.5 text-[13px] font-bold text-[#3f7a14] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#63b81e]/15 disabled:opacity-50 disabled:hover:translate-y-0"
            title="Export to Excel"
          >
            <Download size={15} /> Export
          </button>
        </div>
      </div>

      {/* import status banner */}
      {banner && (
        <div
          className={`mb-3 flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-[13px] font-semibold animate-in fade-in slide-in-from-top-1 ${
            banner.kind === "ok" ? "border-[#63b81e]/30 bg-[#63b81e]/10 text-[#3f7a14]" : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <span className="inline-flex items-center gap-2">
            {banner.kind === "ok" ? <CheckCircle2 size={16} /> : <X size={16} />}
            {banner.text}
          </span>
          <button type="button" onClick={() => setBanner(null)} className="rounded-md p-1 hover:bg-black/5">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── table ── */}
      <div
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
        style={{ boxShadow: "0 18px 40px -16px rgba(0,105,179,0.22), 0 2px 8px rgba(15,23,42,0.05)" }}
      >
        <div style={{ height: 4, background: `linear-gradient(90deg, #63b81e, ${to} 55%, ${from})` }} />

        <div className="overflow-auto" style={{ maxHeight: "60vh" }}>
          <table className="w-max border-collapse text-[13px]">
            <thead className="sticky top-0 z-10">
              {/* group heading row (frozen) — e.g. QUOTE STATUS | CUSTOMER KYC */}
              {groups && groups.length > 0 && (
                <tr>
                  {groups.map((g, gi) =>
                    g.spacer ? (
                      <th key={`g-${gi}`} colSpan={g.span} className="bg-slate-100" style={{ borderBottom: "1px solid #e2e8f0" }} />
                    ) : (
                      <th
                        key={`g-${gi}`}
                        colSpan={g.span}
                        className="whitespace-nowrap px-3.5 py-2 text-left font-black uppercase tracking-[0.1em] text-white"
                        style={{
                          fontSize: 11.5,
                          background: `linear-gradient(135deg, #63b81e, #0180cf)`,
                          borderRight: "2px solid rgba(255,255,255,0.35)",
                          borderBottom: "1px solid rgba(255,255,255,0.25)",
                        }}
                      >
                        {g.label}
                      </th>
                    ),
                  )}
                  <th className="sticky right-0" style={{ background: "linear-gradient(135deg, #63b81e, #0180cf)" }} />
                </tr>
              )}
              <tr>
                {columns.map((c) => {
                  if (c.key === "__gap__") return <th key={c.key} className="bg-slate-100" style={{ minWidth: c.width ?? 24 }} />;
                  const sorted = sortKey === c.key;
                  return (
                    <th
                      key={c.key}
                      onClick={() => toggleSort(c.key)}
                      className="cursor-pointer select-none whitespace-nowrap px-3.5 py-3 text-left font-extrabold uppercase tracking-[0.04em] text-white"
                      style={{
                        minWidth: c.width ?? 130,
                        fontSize: 11,
                        background: `linear-gradient(180deg, ${from}, #00598f)`,
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
                  style={{ background: `linear-gradient(180deg, ${from}, #00598f)`, boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.12)" }}
                />
              </tr>

              {/* per-column filter row */}
              {showFilters && (
                <tr>
                  {columns.map((c) =>
                    c.key === "__gap__" ? (
                      <th key={c.key} className="bg-slate-100" />
                    ) : (
                      <th key={c.key} className="bg-[#eef6fc] px-2 py-1.5" style={{ borderRight: "1px solid #dceaf5" }}>
                        <input
                          value={colFilters[c.key] ?? ""}
                          onChange={(e) => setColFilters((s) => ({ ...s, [c.key]: e.target.value }))}
                          placeholder="Filter…"
                          className="h-7 w-full min-w-[80px] rounded-md border border-slate-200 bg-white px-2 text-[12px] font-normal normal-case tracking-normal text-slate-700 outline-none focus:border-[#0180cf]"
                        />
                      </th>
                    ),
                  )}
                  <th className="sticky right-0 bg-[#eef6fc]" />
                </tr>
              )}
            </thead>

            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-16">
                    <EmptyState hasRows={rows.length > 0} from={from} to={to} />
                  </td>
                </tr>
              ) : (
                paged.map((row, i) => (
                  <tr
                    key={row.id}
                    onClick={() => onEdit(row)}
                    className={`group cursor-pointer transition-colors hover:bg-[#e4f2fc] ${i % 2 ? "bg-[#f5fafe]" : "bg-white"}`}
                  >
                    {columns.map((c) => {
                      if (c.key === "__gap__") return <td key={c.key} className="border-b border-[#e7eff6] bg-slate-100/60" style={{ minWidth: c.width ?? 24 }} />;
                      const piId =
                        enquiryPiMap && c.key === "enquiryNo"
                          ? enquiryPiMap[String(row[c.key] ?? "").trim().toLowerCase()]
                          : undefined;
                      return (
                        <td
                          key={c.key}
                          className={`whitespace-nowrap border-b border-r border-[#e7eff6] px-3.5 py-2.5 text-slate-600 ${
                            c.type === "number" ? "text-right font-semibold tabular-nums" : ""
                          }`}
                          style={{ minWidth: c.width ?? 130 }}
                        >
                          {piId ? (
                            <Link
                              href={`/quotation/${piId}/pi` as Route}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 font-bold text-[#0069b3] hover:underline"
                              title="Open the PI for this enquiry"
                            >
                              {String(row[c.key])}
                              <ExternalLink size={11} />
                            </Link>
                          ) : (
                            <CellValue row={row} col={c} />
                          )}
                        </td>
                      );
                    })}
                    <td className="sticky right-0 bg-inherit px-1.5">
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(row);
                          }}
                          className="rounded-lg p-1.5 text-slate-400 transition-all hover:-translate-y-0.5 hover:bg-[#0180cf]/10 hover:text-[#0069b3]"
                          title={onEditKyc ? "Edit Quote Status" : "Edit"}
                        >
                          <Pencil size={14} />
                        </button>
                        {onEditKyc && row.__kycId != null && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditKyc(row);
                            }}
                            className="rounded-lg p-1.5 text-[#63b81e] transition-all hover:-translate-y-0.5 hover:bg-[#63b81e]/12 hover:text-[#3f7a14]"
                            title="Edit Customer KYC"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => del(e, row.id)}
                          className="rounded-lg p-1.5 text-slate-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── pagination footer ── */}
        {view.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-[#f8fbfe] px-4 py-2.5">
            <div className="flex items-center gap-2 text-[12.5px] text-slate-500">
              <span>Rows per page</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(0);
                }}
                className="h-8 cursor-pointer rounded-lg border border-slate-200 bg-white px-2 text-[12.5px] font-semibold text-slate-700 outline-none focus:border-[#0180cf]"
              >
                {PAGE_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 text-[12.5px] font-semibold text-slate-600">
              <span className="tabular-nums">
                {view.length === 0 ? 0 : page * pageSize + 1}–{Math.min(view.length, (page + 1) * pageSize)} of {view.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="tabular-nums">
                  {page + 1} / {pageCount}
                </span>
                <button
                  type="button"
                  disabled={page >= pageCount - 1}
                  onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                  className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── sheet picker (multi-sheet workbooks) ── */}
      {sheetPicker && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm"
          onClick={() => setSheetPicker(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5">
              <span className="inline-flex size-9 items-center justify-center rounded-xl text-white shadow" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
                <FileSpreadsheet size={17} strokeWidth={2.3} />
              </span>
              <div>
                <h3 className="text-[15px] font-black text-slate-800">Choose a sheet</h3>
                <p className="text-[12px] text-slate-500">Import into {title ?? kind}</p>
              </div>
            </div>
            <p className="mt-3 text-[12.5px] text-slate-500">Your file has multiple sheets — pick the one to bulk upload:</p>
            <div className="mt-2 max-h-[46vh] space-y-1.5 overflow-y-auto">
              {sheetPicker.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => openRange(name)}
                  className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-left text-[13.5px] font-bold text-slate-700 transition-all hover:-translate-y-0.5 hover:border-[#0180cf] hover:bg-[#0180cf]/5"
                >
                  <FileSpreadsheet size={14} className="shrink-0 text-[#0069b3]" />
                  <span className="truncate">{name}</span>
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setSheetPicker(null)} className="mt-3 text-[12.5px] font-bold text-slate-400 hover:text-slate-600">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── visual range picker ── */}
      {rangeGrid && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="flex max-h-[92vh] w-[min(1100px,96vw)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* header */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex size-9 items-center justify-center rounded-xl text-white shadow" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
                  <FileSpreadsheet size={17} strokeWidth={2.3} />
                </span>
                <div>
                  <h3 className="text-[15px] font-black text-slate-800">Select the range to import</h3>
                  <p className="text-[12px] text-slate-500">
                    Sheet “{rangeGrid.name}” → {title ?? kind} · click the <b>header row</b> cell, then <b>drag</b> (or <b>shift-click</b>) the <b>bottom-right</b> data cell
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => { setRangeGrid(null); setSel(null); setAnchor(null); wbRef.current = null; }} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            {/* grid */}
            <div className="min-h-0 flex-1 overflow-auto bg-slate-50/60" onMouseUp={endSelect} onMouseLeave={endSelect}>
              <table className="border-collapse select-none text-[12px]" style={{ tableLayout: "fixed" }}>
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th className="sticky left-0 z-20 h-7 w-10 border border-slate-200 bg-slate-100 text-[11px] font-bold text-slate-400" />
                    {rangeGrid.cells[0]?.map((_, c) => (
                      <th key={c} className="h-7 min-w-[110px] border border-slate-200 bg-slate-100 px-2 text-[11px] font-black text-slate-500">{colLetter(c)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rangeGrid.cells.map((row, r) => (
                    <tr key={r}>
                      <td className="sticky left-0 z-10 h-7 w-10 border border-slate-200 bg-slate-100 text-center text-[11px] font-bold text-slate-400">{r + 1}</td>
                      {row.map((val, c) => {
                        const inSel = !!sel && r >= sel.r1 && r <= sel.r2 && c >= sel.c1 && c <= sel.c2;
                        const isHeaderRow = !!sel && inSel && r === sel.r1;
                        return (
                          <td
                            key={c}
                            onMouseDown={(e) => { e.preventDefault(); onCellDown(r, c, e.shiftKey); }}
                            onMouseEnter={() => onCellEnter(r, c)}
                            title={val}
                            className={`h-7 max-w-[110px] cursor-cell truncate border px-2 ${
                              isHeaderRow
                                ? "border-[#0180cf] bg-[#0180cf] font-bold text-white"
                                : inSel
                                ? "border-[#0180cf]/40 bg-[#0180cf]/12 text-slate-800"
                                : "border-slate-200 bg-white text-slate-600"
                            }`}
                          >
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-white px-5 py-3">
              <div className="text-[12.5px] text-slate-500">
                {sel ? (
                  <span>
                    Selected <b className="text-slate-800">{colLetter(sel.c1)}{sel.r1 + 1}:{colLetter(sel.c2)}{sel.r2 + 1}</b>
                    {" "}· <b className="text-slate-800">{Math.max(0, sel.r2 - sel.r1)}</b> data row{sel.r2 - sel.r1 === 1 ? "" : "s"} × {sel.c2 - sel.c1 + 1} col{sel.c2 - sel.c1 === 0 ? "" : "s"}
                    <span className="text-slate-400"> · top row = headers</span>
                  </span>
                ) : (
                  <span className="text-slate-400">No selection yet — click the header cell, then drag or shift-click the last data cell.{rangeGrid.truncated ? ` (showing first ${MAX_PREVIEW_ROWS} rows)` : ""}</span>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                {sel && (
                  <button type="button" onClick={() => { setSel(null); setAnchor(null); }} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-[13px] font-bold text-slate-600 hover:bg-slate-50">
                    Reset
                  </button>
                )}
                <button
                  type="button"
                  onClick={importRange}
                  disabled={!sel || sel.r2 - sel.r1 < 1 || importing}
                  className="inline-flex h-10 items-center gap-2 rounded-xl px-5 text-[14px] font-extrabold text-white shadow-lg transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                  style={{ background: `linear-gradient(135deg, ${from}, ${to})`, boxShadow: `0 12px 26px -10px ${to}99` }}
                >
                  {importing ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                  {sel && sel.r2 - sel.r1 >= 1 ? `Import ${sel.r2 - sel.r1} row${sel.r2 - sel.r1 === 1 ? "" : "s"} → save` : "Import & save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ hasRows, from, to }: { hasRows: boolean; from: string; to: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <span
        className="inline-flex size-16 items-center justify-center rounded-3xl text-white shadow-lg"
        style={{ background: `linear-gradient(135deg, #63b81e, ${from})`, boxShadow: `0 16px 32px -12px ${to}aa` }}
      >
        <Table2 size={30} strokeWidth={2.1} />
      </span>
      <p className="mt-4 text-[15px] font-bold text-slate-700">{hasRows ? "No rows match your filters" : "No entries yet"}</p>
      <p className="mt-1 text-[13px] text-slate-400">
        {hasRows ? "Try adjusting search or column filters." : "Click “New entry” to add your first row."}
      </p>
    </div>
  );
}

function CellValue({ row, col }: { row: SalesRow; col: SalesColDef }) {
  const v = row[col.key];
  if (v == null || v === "") return <span className="text-slate-300">—</span>;

  if (col.type === "bool") {
    const yes = v === true || v === "true";
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
        style={{
          background: yes ? "color-mix(in srgb, #63b81e 18%, transparent)" : "#eef1f4",
          color: yes ? "#3f7a14" : "#64748b",
        }}
      >
        <span className="size-1.5 rounded-full" style={{ background: yes ? "#63b81e" : "#9aa6b2" }} />
        {yes ? "Yes" : "No"}
      </span>
    );
  }
  if (col.type === "select") {
    return (
      <span className="inline-flex items-center rounded-full bg-[#0180cf]/10 px-2.5 py-0.5 text-[11.5px] font-bold text-[#0069b3]">
        {String(v)}
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
  return <span className="font-medium text-slate-800">{String(v)}</span>;
}
