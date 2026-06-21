"use client";

import * as React from "react";
import {
  FileText,
  ClipboardList,
  Plus,
  ArrowLeft,
  FilePlus2,
  Table2,
  TrendingUp,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { SalesDataGrid } from "./sales-grid";
import { SalesEntryModal } from "./sales-entry-modal";
import { QUOTE_COLUMNS, BOM_COLUMNS, type SalesColDef } from "@/lib/sales/columns";
import type { SaleKind, SalesRow } from "@/app/(app)/sales/actions";

const BLUE = "#0180cf";
const BLUE_DEEP = "#0069b3";
const GREEN = "#63b81e";
const INK = "#0a0a0a";

interface FormDef {
  key: SaleKind;
  label: string;
  desc: string;
  icon: LucideIcon;
  from: string;
  to: string;
  columns: SalesColDef[];
}

const FORMS: FormDef[] = [
  { key: "quote", label: "Quote Status", desc: "Enquiries → quotations → PO received", icon: FileText, from: BLUE, to: BLUE_DEEP, columns: QUOTE_COLUMNS },
  { key: "bom", label: "BOM Status", desc: "PO → sales orders → production & dispatch", icon: ClipboardList, from: GREEN, to: BLUE_DEEP, columns: BOM_COLUMNS },
];

type View = "hub" | "register";

export function SalesWorkspace({
  quoteRows: q0,
  bomRows: b0,
}: {
  quoteRows: SalesRow[];
  bomRows: SalesRow[];
}) {
  const [view, setView] = React.useState<View>("hub");
  const [active, setActive] = React.useState<SaleKind>("quote");
  const [quoteRows, setQuoteRows] = React.useState<SalesRow[]>(q0);
  const [bomRows, setBomRows] = React.useState<SalesRow[]>(b0);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalRow, setModalRow] = React.useState<SalesRow | null>(null);

  const current = FORMS.find((f) => f.key === active)!;
  const rows = active === "quote" ? quoteRows : bomRows;
  const setRows = active === "quote" ? setQuoteRows : setBomRows;
  const countOf = (k: SaleKind) => (k === "quote" ? quoteRows.length : bomRows.length);

  function openForm(k: SaleKind) {
    setActive(k);
    setModalRow(null);
    setModalOpen(true);
  }
  function openRegister(k: SaleKind) {
    setActive(k);
    setView("register");
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
    setView("register"); // after adding/editing, show the data
  }
  function onDeleted(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <main className="mx-auto max-w-[1600px] px-8 max-md:px-4 pt-8 pb-16">
      {/* ── Page header ── */}
      <div className="flex items-center gap-4">
        <span
          className="inline-flex size-12 items-center justify-center rounded-2xl text-white shadow-lg"
          style={{ background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DEEP})`, boxShadow: `0 10px 24px -8px ${BLUE}88` }}
        >
          <TrendingUp size={24} strokeWidth={2.4} />
        </span>
        <div>
          <h1
            style={{
              fontFamily: "var(--font-display), system-ui, sans-serif",
              fontWeight: 900,
              fontSize: 30,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              width: "fit-content",
              background: `linear-gradient(120deg, ${BLUE_DEEP} 0%, ${BLUE} 45%, ${GREEN} 115%)`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              WebkitTextFillColor: "transparent",
            }}
          >
            AA-Tech Production System
          </h1>
          <p className="mt-1 text-[14px] text-ink-subtle">
            {view === "hub"
              ? "Choose a window, then open its Form to add an entry or its Register to view stored data."
              : `${current.label} register`}
          </p>
        </div>
      </div>
      <div className="mt-4 h-[3px] w-full rounded-full" style={{ background: `linear-gradient(90deg, ${GREEN}, ${BLUE} 45%, ${BLUE_DEEP})`, opacity: 0.85 }} />

      {view === "hub" ? (
        /* ── HUB: two windows ── */
        <div className="mt-8 grid grid-cols-2 gap-6 max-lg:grid-cols-1">
          {FORMS.map((f) => (
            <WindowCard key={f.key} form={f} count={countOf(f.key)} onForm={() => openForm(f.key)} onRegister={() => openRegister(f.key)} />
          ))}
        </div>
      ) : (
        /* ── REGISTER: the stored data ── */
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setView("hub")}
            className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-surface-card px-3 h-9 text-[13px] font-bold text-ink-soft transition-colors hover:bg-surface-soft"
          >
            <ArrowLeft size={15} strokeWidth={2.6} /> Back to windows
          </button>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-10 items-center justify-center rounded-xl text-white shadow" style={{ background: `linear-gradient(135deg, ${current.from}, ${current.to})` }}>
                <current.icon size={20} strokeWidth={2.3} />
              </span>
              <div>
                <h2 className="text-[20px] font-black text-ink-strong">{current.label} · Register</h2>
                <p className="text-[13px] text-ink-subtle">{current.desc}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => openForm(active)}
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

          <SalesDataGrid kind={active} columns={current.columns} rows={rows} onEdit={openEdit} onDeleted={onDeleted} />
        </div>
      )}

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

/* ── A single "window" card with Form + Register options ── */
function WindowCard({
  form,
  count,
  onForm,
  onRegister,
}: {
  form: FormDef;
  count: number;
  onForm: () => void;
  onRegister: () => void;
}) {
  const Icon = form.icon;
  return (
    <div
      className="group relative overflow-hidden rounded-3xl border border-hairline bg-surface-card p-6 transition-all hover:-translate-y-1"
      style={{ boxShadow: `0 22px 50px -22px ${form.to}55, 0 2px 8px rgba(15,23,42,0.05)` }}
    >
      {/* top accent */}
      <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: `linear-gradient(90deg, ${form.from}, ${form.to})` }} />
      {/* faint corner watermark icon */}
      <Icon className="pointer-events-none absolute -bottom-6 -right-6 text-ink-strong" size={150} strokeWidth={1.4} style={{ opacity: 0.04 }} />

      <div className="relative flex items-center gap-4">
        <span
          className="inline-flex size-14 items-center justify-center rounded-2xl text-white shadow-lg"
          style={{ background: `linear-gradient(135deg, ${form.from}, ${form.to})`, boxShadow: `0 12px 26px -10px ${form.to}aa` }}
        >
          <Icon size={28} strokeWidth={2.3} />
        </span>
        <div className="min-w-0">
          <h3 className="text-[21px] font-black tracking-[-0.01em]" style={{ color: INK }}>{form.label}</h3>
          <p className="text-[13px] text-ink-subtle">{form.desc}</p>
        </div>
      </div>

      <div className="relative mt-4 flex items-baseline gap-1.5">
        <span className="text-[26px] font-black tabular-nums" style={{ color: form.to }}>{count}</span>
        <span className="text-[13px] font-semibold text-ink-muted">{count === 1 ? "entry" : "entries"} stored</span>
      </div>

      <div className="relative mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onForm}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 text-[14px] font-extrabold transition-all hover:-translate-y-0.5"
          style={{ borderColor: `color-mix(in srgb, ${form.to} 35%, transparent)`, color: form.to, background: `color-mix(in srgb, ${form.from} 7%, transparent)` }}
        >
          <FilePlus2 size={17} strokeWidth={2.4} /> Form
        </button>
        <button
          type="button"
          onClick={onRegister}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl text-[14px] font-extrabold text-white shadow-md transition-all hover:-translate-y-0.5"
          style={{ background: `linear-gradient(135deg, ${form.from}, ${form.to})`, boxShadow: `0 12px 26px -10px ${form.to}aa` }}
        >
          <Table2 size={17} strokeWidth={2.4} /> Register
          <ArrowRight size={15} strokeWidth={2.6} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}
