"use client";

import * as React from "react";
import {
  FileText,
  FileCheck2,
  BadgeCheck,
  ClipboardList,
  Factory,
  Plus,
  ArrowLeft,
  FilePlus2,
  Table2,
  TrendingUp,
  ArrowRight,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { SalesDataGrid } from "./sales-grid";
import { SalesEntryModal } from "./sales-entry-modal";
import {
  QUOTE_COLUMNS,
  BOM_COLUMNS,
  SO_COLUMNS,
  GA_COLUMNS,
  WO_COLUMNS,
  type SalesColDef,
} from "@/lib/sales/columns";
import type { SaleKind, SalesRow } from "@/app/(app)/sales/actions";

interface FormDef {
  key: SaleKind;
  label: string;
  desc: string;
  icon: LucideIcon;
  from: string;
  to: string;
  steps: string[];
  columns: SalesColDef[];
}

const FORMS: FormDef[] = [
  {
    key: "quote",
    label: "Quote Status",
    desc: "Enquiries to quotations to PO received",
    icon: FileText,
    from: "#0180cf",
    to: "#0069b3",
    steps: ["Enquiry", "Quotation", "PO Received"],
    columns: QUOTE_COLUMNS,
  },
  {
    key: "so",
    label: "SO Status",
    desc: "PO to sales order, amendments & dispatch",
    icon: FileCheck2,
    from: "#0180cf",
    to: "#63b81e",
    steps: ["PO", "Sales Order", "Amendment", "Dispatch"],
    columns: SO_COLUMNS,
  },
  {
    key: "ga",
    label: "GA Approval Status",
    desc: "GA drawing submission to approval",
    icon: BadgeCheck,
    from: "#0069b3",
    to: "#0180cf",
    steps: ["SO", "GA Submission", "GA Approval"],
    columns: GA_COLUMNS,
  },
  {
    key: "bom",
    label: "BOM Status",
    desc: "PO to sales orders to production & dispatch",
    icon: ClipboardList,
    from: "#63b81e",
    to: "#0069b3",
    steps: ["PO", "Sales Order", "Production", "Dispatch"],
    columns: BOM_COLUMNS,
  },
  {
    key: "wo",
    label: "Work Order Status",
    desc: "BOM to pre-production to work order",
    icon: Factory,
    from: "#0069b3",
    to: "#16303f",
    steps: ["BOM", "Pre-Production", "Work Order"],
    columns: WO_COLUMNS,
  },
];

type View = "hub" | "register";

export function SalesWorkspace({
  quoteRows,
  bomRows,
  soRows,
  gaRows,
  woRows,
}: {
  quoteRows: SalesRow[];
  bomRows: SalesRow[];
  soRows: SalesRow[];
  gaRows: SalesRow[];
  woRows: SalesRow[];
}) {
  const [view, setView] = React.useState<View>("hub");
  const [active, setActive] = React.useState<SaleKind>("quote");
  const [rowsByKind, setRowsByKind] = React.useState<Record<SaleKind, SalesRow[]>>({
    quote: quoteRows,
    so: soRows,
    ga: gaRows,
    bom: bomRows,
    wo: woRows,
  });
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalRow, setModalRow] = React.useState<SalesRow | null>(null);

  const current = FORMS.find((f) => f.key === active)!;
  const rows = rowsByKind[active];
  const countOf = (k: SaleKind) => rowsByKind[k].length;

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
    setRowsByKind((prev) => {
      const list = prev[active];
      const i = list.findIndex((r) => r.id === saved.id);
      const next = i >= 0 ? list.map((r) => (r.id === saved.id ? saved : r)) : [...list, saved];
      return { ...prev, [active]: next };
    });
    setView("register");
  }
  function onDeleted(id: string) {
    setRowsByKind((prev) => ({ ...prev, [active]: prev[active].filter((r) => r.id !== id) }));
  }

  return (
    <main className="relative mx-auto max-w-[1600px] px-8 pb-16 pt-8 max-md:px-4">
      {/* subtle background pattern */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.5]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(1,128,207,0.07) 1px, transparent 0)",
          backgroundSize: "26px 26px",
        }}
      />

      {/* ── page header ── */}
      <div className="flex items-center gap-3.5">
        <span
          className="inline-flex size-11 items-center justify-center rounded-2xl text-white shadow-lg"
          style={{ background: "linear-gradient(135deg, #0180cf, #0069b3)", boxShadow: "0 10px 22px -8px #0180cf88" }}
        >
          <TrendingUp size={22} strokeWidth={2.4} />
        </span>
        <div>
          <h1
            style={{
              fontFamily: "var(--font-display), system-ui, sans-serif",
              fontWeight: 900,
              fontSize: 26,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              width: "fit-content",
              background: "linear-gradient(120deg, #0069b3 0%, #0180cf 45%, #63b81e 120%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              WebkitTextFillColor: "transparent",
            }}
          >
            AA-Tech Production System
          </h1>
          <p className="mt-0.5 text-[13px] text-slate-500">
            {view === "hub"
              ? "Pick a module — open its Form to add an entry, or its Register to view stored data."
              : `${current.label} register`}
          </p>
        </div>
      </div>
      <div className="mt-3.5 h-[3px] w-full rounded-full" style={{ background: "linear-gradient(90deg, #63b81e, #0180cf 45%, #0069b3)", opacity: 0.85 }} />

      {view === "hub" ? (
        <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {FORMS.map((f) => (
            <WindowCard key={f.key} form={f} count={countOf(f.key)} onForm={() => openForm(f.key)} onRegister={() => openRegister(f.key)} />
          ))}
        </div>
      ) : (
        <div className="mt-5">
          <button
            type="button"
            onClick={() => setView("hub")}
            className="mb-4 inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-bold text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
          >
            <ArrowLeft size={15} strokeWidth={2.6} /> Back to modules
          </button>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-10 items-center justify-center rounded-xl text-white shadow" style={{ background: `linear-gradient(135deg, ${current.from}, ${current.to})` }}>
                <current.icon size={20} strokeWidth={2.3} />
              </span>
              <div>
                <h2 className="text-[19px] font-black text-slate-800">{current.label} · Register</h2>
                <p className="text-[12.5px] text-slate-500">{current.desc}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => openForm(active)}
              className="inline-flex h-10 items-center gap-2 rounded-xl px-5 text-[14px] font-extrabold text-white shadow-lg transition-all hover:-translate-y-0.5"
              style={{ background: `linear-gradient(135deg, ${current.from}, ${current.to})`, boxShadow: `0 12px 26px -10px ${current.to}99` }}
            >
              <Plus size={17} strokeWidth={2.8} /> New entry
            </button>
          </div>

          <SalesDataGrid kind={active} title={current.label} columns={current.columns} rows={rows} onEdit={openEdit} onDeleted={onDeleted} from={current.from} to={current.to} />
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
        from={current.from}
        to={current.to}
        Icon={current.icon}
      />
    </main>
  );
}

/* ── A single premium "module" card with Form + Register options ── */
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
    <div className="group relative">
      {/* glow halo (fades in on hover) */}
      <div
        aria-hidden
        className="absolute -inset-0.5 rounded-[26px] opacity-0 blur-lg transition-opacity duration-500 group-hover:opacity-50"
        style={{ background: `linear-gradient(135deg, ${form.from}, ${form.to})` }}
      />

      {/* card */}
      <div
        className="relative overflow-hidden rounded-[24px] border border-white/70 bg-white/80 p-5 backdrop-blur-xl transition-all duration-300 group-hover:-translate-y-1.5"
        style={{ boxShadow: "0 14px 36px -20px rgba(15,40,80,0.30), 0 1px 4px rgba(15,23,42,0.04)" }}
      >
        {/* top accent bar */}
        <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: `linear-gradient(90deg, ${form.from}, ${form.to})` }} />

        {/* shine sweep on hover */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-2/3 -translate-x-[180%] -skew-x-12 bg-gradient-to-r from-transparent via-white/55 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[260%]"
        />

        {/* faint corner watermark icon */}
        <Icon className="pointer-events-none absolute -bottom-5 -right-5 text-slate-900" size={120} strokeWidth={1.4} style={{ opacity: 0.04 }} />

        {/* header */}
        <div className="relative flex items-start gap-3.5">
          <span
            className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg transition-transform duration-300 group-hover:scale-105"
            style={{ background: `linear-gradient(135deg, ${form.from}, ${form.to})`, boxShadow: `0 10px 22px -10px ${form.to}cc` }}
          >
            <Icon size={24} strokeWidth={2.3} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-[17px] font-black tracking-[-0.01em] text-slate-800">{form.label}</h3>
            <p className="mt-0.5 line-clamp-1 text-[12px] text-slate-500">{form.desc}</p>
          </div>
        </div>

        {/* workflow path */}
        <div className="relative mt-3.5 flex flex-wrap items-center gap-1">
          {form.steps.map((s, i) => (
            <React.Fragment key={s}>
              <span
                className="rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.02em]"
                style={{ background: `color-mix(in srgb, ${form.to} 11%, transparent)`, color: form.to }}
              >
                {s}
              </span>
              {i < form.steps.length - 1 && <ChevronRight size={11} className="text-slate-300" strokeWidth={3} />}
            </React.Fragment>
          ))}
        </div>

        {/* count */}
        <div className="relative mt-3 flex items-baseline gap-1.5">
          <span className="text-[22px] font-black tabular-nums" style={{ color: form.to }}>{count}</span>
          <span className="text-[12px] font-semibold text-slate-400">{count === 1 ? "entry" : "entries"} stored</span>
        </div>

        {/* actions */}
        <div className="relative mt-4 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onForm}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border-2 text-[13.5px] font-extrabold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            style={{ borderColor: `color-mix(in srgb, ${form.to} 35%, transparent)`, color: form.to, background: `color-mix(in srgb, ${form.from} 6%, transparent)` }}
          >
            <FilePlus2 size={16} strokeWidth={2.4} /> Form
          </button>
          <button
            type="button"
            onClick={onRegister}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl text-[13.5px] font-extrabold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            style={{ background: `linear-gradient(135deg, ${form.from}, ${form.to})`, boxShadow: `0 10px 22px -10px ${form.to}aa` }}
          >
            <Table2 size={16} strokeWidth={2.4} /> Register
            <ArrowRight size={14} strokeWidth={2.6} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
