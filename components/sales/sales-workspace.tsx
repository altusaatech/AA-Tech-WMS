"use client";

import * as React from "react";
import { FileText, ClipboardList, Plus, Table2, TrendingUp, type LucideIcon } from "lucide-react";
import { SalesDataGrid } from "./sales-grid";
import { SalesEntryModal } from "./sales-entry-modal";
import { QUOTE_COLUMNS, BOM_COLUMNS, type SalesColDef } from "@/lib/sales/columns";
import type { SaleKind, SalesRow } from "@/app/(app)/sales/actions";

const BLUE = "#0180cf";
const BLUE_DEEP = "#0069b3";
const GREEN = "#63b81e";

interface FormDef {
  key: SaleKind;
  label: string;
  desc: string;
  icon: LucideIcon;
  columns: SalesColDef[];
}

const FORMS: FormDef[] = [
  { key: "quote", label: "Quote Status", desc: "Enquiries → quotations → PO received", icon: FileText, columns: QUOTE_COLUMNS },
  { key: "bom", label: "BOM Status", desc: "PO → sales orders → production & dispatch", icon: ClipboardList, columns: BOM_COLUMNS },
];

export function SalesWorkspace({
  quoteRows: q0,
  bomRows: b0,
}: {
  quoteRows: SalesRow[];
  bomRows: SalesRow[];
}) {
  const [active, setActive] = React.useState<SaleKind>("quote");
  const [quoteRows, setQuoteRows] = React.useState<SalesRow[]>(q0);
  const [bomRows, setBomRows] = React.useState<SalesRow[]>(b0);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalRow, setModalRow] = React.useState<SalesRow | null>(null);

  const current = FORMS.find((f) => f.key === active)!;
  const rows = active === "quote" ? quoteRows : bomRows;
  const setRows = active === "quote" ? setQuoteRows : setBomRows;

  function openNew() {
    setModalRow(null);
    setModalOpen(true);
  }
  function openEdit(row: SalesRow) {
    setModalRow(row);
    setModalOpen(true);
  }
  function onSaved(saved: SalesRow) {
    setRows((prev) => {
      const i = prev.findIndex((r) => r.id === saved.id);
      if (i >= 0) {
        const copy = [...prev];
        copy[i] = saved;
        return copy;
      }
      return [...prev, saved];
    });
  }
  function onDeleted(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <main className="mx-auto max-w-[1600px] px-8 max-md:px-4 pt-8 pb-16">
      {/* ── Bold page header ── */}
      <div className="flex items-center gap-4">
        <span
          className="inline-flex size-12 items-center justify-center rounded-2xl text-white shadow-lg"
          style={{ background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DEEP})`, boxShadow: `0 10px 24px -8px ${BLUE}88` }}
        >
          <TrendingUp size={24} strokeWidth={2.4} />
        </span>
        <div>
          <h1
            className="text-ink-strong"
            style={{ fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 900, fontSize: 30, letterSpacing: "-0.03em", lineHeight: 1.05 }}
          >
            AA-Tech Production System
          </h1>
          <p className="mt-1 text-[14px] text-ink-subtle">
            Pick a form, add entries via the popup, and view everything in the Excel grid.
          </p>
        </div>
      </div>
      <div className="mt-4 h-[3px] w-full rounded-full" style={{ background: `linear-gradient(90deg, ${GREEN}, ${BLUE} 45%, ${BLUE_DEEP})`, opacity: 0.85 }} />

      <div className="mt-6 flex gap-6 max-md:flex-col">
        {/* ── Left: bold forms menu ── */}
        <aside className="w-60 shrink-0 max-md:w-full">
          <div className="mb-2.5 px-1 text-[10px] font-black uppercase tracking-[0.16em] text-ink-subtle">Forms</div>
          <nav className="flex flex-col gap-2">
            {FORMS.map((f) => {
              const Icon = f.icon;
              const isActive = f.key === active;
              const count = f.key === "quote" ? quoteRows.length : bomRows.length;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setActive(f.key)}
                  className="group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-left transition-all"
                  style={
                    isActive
                      ? { background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DEEP})`, color: "#fff", boxShadow: `0 12px 26px -10px ${BLUE_DEEP}99` }
                      : { background: "var(--color-surface-card)", color: "var(--color-ink-soft)", border: "1px solid var(--color-hairline)" }
                  }
                >
                  <span
                    className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl"
                    style={
                      isActive
                        ? { background: "rgba(255,255,255,0.18)", color: "#fff" }
                        : { background: "color-mix(in srgb, #0180cf 12%, transparent)", color: BLUE_DEEP }
                    }
                  >
                    <Icon size={18} strokeWidth={2.3} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-extrabold">{f.label}</span>
                    <span className={`block truncate text-[11px] ${isActive ? "text-white/70" : "text-ink-subtle"}`}>
                      {count} {count === 1 ? "entry" : "entries"}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ── Main: header + Excel grid ── */}
        <section className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[20px] font-black text-ink-strong">{current.label}</h2>
              <p className="text-[13px] text-ink-subtle">{current.desc}</p>
            </div>
            <button
              type="button"
              onClick={openNew}
              className="inline-flex h-11 items-center gap-2 rounded-xl px-5 text-[14px] font-extrabold text-white shadow-lg transition-all hover:-translate-y-0.5"
              style={{ background: `linear-gradient(135deg, ${GREEN}, ${BLUE})`, boxShadow: `0 12px 26px -10px ${BLUE}99` }}
            >
              <Plus size={17} strokeWidth={2.8} /> New entry
            </button>
          </div>

          <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-black uppercase tracking-[0.12em]"
            style={{ background: "color-mix(in srgb, #0069b3 10%, transparent)", color: BLUE_DEEP }}>
            <Table2 size={13} /> Excel Data
          </div>

          <SalesDataGrid
            kind={active}
            columns={current.columns}
            rows={rows}
            onEdit={openEdit}
            onDeleted={onDeleted}
          />
        </section>
      </div>

      <SalesEntryModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        kind={active}
        title={current.label}
        columns={current.columns}
        row={modalRow}
        onSaved={onSaved}
      />
    </main>
  );
}
