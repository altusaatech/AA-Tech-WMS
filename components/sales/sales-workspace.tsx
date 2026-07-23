"use client";

import * as React from "react";
import {
  FileText,
  FileCheck2,
  BadgeCheck,
  ClipboardList,
  Factory,
  ReceiptText,
  IdCard,
  Plus,
  ArrowLeft,
  FilePlus2,
  Table2,
  TrendingUp,
  ArrowRight,
  ChevronRight,
  Receipt,
  Search,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { PageHero } from "@/components/layout/page-hero";
import { SalesDataGrid } from "./sales-grid";
import { SalesEntryModal } from "./sales-entry-modal";
import {
  KYC_COLUMNS,
  QUOTE_COLUMNS,
  BOM_COLUMNS,
  SO_COLUMNS,
  GA_COLUMNS,
  WO_COLUMNS,
  type SalesColDef,
} from "@/lib/sales/columns";
import type { SaleKind, SalesRow } from "@/app/(app)/sales/actions";

/** The five production-workflow kinds (subset of SaleKind, which also covers masters). */
type Kind = Extract<SaleKind, "kyc" | "quote" | "bom" | "so" | "ga" | "wo" | "pi">;

interface FormDef {
  key: Kind;
  label: string;
  desc: string;
  icon: LucideIcon;
  from: string;
  to: string;
  steps: string[];
  columns: SalesColDef[];
  /** Column checked for duplicate entries when saving via the form. */
  primaryKey: string;
}

const FORMS: FormDef[] = [
  {
    key: "kyc",
    label: "Customer KYC",
    desc: "Company, contact & enquiry details — the sales entry point",
    icon: IdCard,
    from: "#63b81e",
    to: "#0180cf",
    steps: ["Enquiry", "Company", "Contact"],
    columns: KYC_COLUMNS,
    primaryKey: "enquiryNo",
  },
  {
    key: "quote",
    label: "Quote Status",
    desc: "Enquiries to quotations to PO received",
    icon: FileText,
    from: "#63b81e",
    to: "#0180cf",
    steps: ["Enquiry", "Quotation", "PO Received"],
    columns: QUOTE_COLUMNS,
    primaryKey: "enquiryNo",
  },
  {
    key: "so",
    label: "SO Status",
    desc: "PO to sales order, amendments & dispatch",
    icon: FileCheck2,
    from: "#63b81e",
    to: "#0180cf",
    steps: ["PO", "Sales Order", "Amendment", "Dispatch"],
    columns: SO_COLUMNS,
    primaryKey: "ourSoNo",
  },
  {
    key: "ga",
    label: "GA Approval Status",
    desc: "GA drawing submission to approval",
    icon: BadgeCheck,
    from: "#63b81e",
    to: "#0180cf",
    steps: ["SO", "GA Submission", "GA Approval"],
    columns: GA_COLUMNS,
    primaryKey: "gaNo",
  },
  {
    key: "bom",
    label: "BOM Status",
    desc: "PO to sales orders to production & dispatch",
    icon: ClipboardList,
    from: "#63b81e",
    to: "#0180cf",
    steps: ["PO", "Sales Order", "Production", "Dispatch"],
    columns: BOM_COLUMNS,
    primaryKey: "ourSoNo",
  },
  {
    key: "wo",
    label: "Work Order Status",
    desc: "BOM to pre-production to work order",
    icon: Factory,
    from: "#63b81e",
    to: "#0180cf",
    steps: ["BOM", "Pre-Production", "Work Order"],
    columns: WO_COLUMNS,
    primaryKey: "workOrderNo",
  },
];

type View = "hub" | "register";

export function SalesWorkspace({
  kycRows,
  quoteRows,
  bomRows,
  soRows,
  gaRows,
  woRows,
  piRows,
  enquiryPiMap = {},
}: {
  kycRows: SalesRow[];
  quoteRows: SalesRow[];
  bomRows: SalesRow[];
  soRows: SalesRow[];
  gaRows: SalesRow[];
  woRows: SalesRow[];
  piRows: SalesRow[];
  /** Enquiry No (trimmed, lower-cased) → quotation id, for the Quote Status
   *  register's Enquiry No → PI links. */
  enquiryPiMap?: Record<string, string>;
}) {
  const [view, setView] = React.useState<View>("hub");
  const [active, setActive] = React.useState<Kind>("kyc");
  const [rowsByKind, setRowsByKind] = React.useState<Record<Kind, SalesRow[]>>({
    kyc: kycRows,
    quote: quoteRows,
    so: soRows,
    ga: gaRows,
    bom: bomRows,
    wo: woRows,
    pi: piRows,
  });
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalRow, setModalRow] = React.useState<SalesRow | null>(null);
  const [hubQuery, setHubQuery] = React.useState("");

  const current = FORMS.find((f) => f.key === active)!;
  const rows = rowsByKind[active];
  const countOf = (k: Kind) => rowsByKind[k].length;

  function openForm(k: Kind) {
    setActive(k);
    setModalRow(null);
    setModalOpen(true);
  }
  function openRegister(k: Kind) {
    setActive(k);
    setView("register");
  }
  function openEdit(row: SalesRow) {
    setModalRow(row);
    setModalOpen(true);
  }
  function onSaved(saved: SalesRow, opts: { close: boolean }) {
    setRowsByKind((prev) => {
      const list = prev[active];
      const i = list.findIndex((r) => r.id === saved.id);
      const next = i >= 0 ? list.map((r) => (r.id === saved.id ? saved : r)) : [...list, saved];
      return { ...prev, [active]: next };
    });
    if (opts.close) {
      setModalOpen(false);
      setView("register");
    }
  }
  function onDeleted(id: string) {
    setRowsByKind((prev) => ({ ...prev, [active]: prev[active].filter((r) => r.id !== id) }));
  }
  function onImported(imported: SalesRow[]) {
    setRowsByKind((prev) => ({ ...prev, [active]: [...prev[active], ...imported] }));
  }

  return (
    <main className="relative mx-auto max-w-[1600px] px-8 pb-8 pt-6 max-md:px-4">
      {/* subtle background pattern */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.5]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(1,128,207,0.07) 1px, transparent 0)",
          backgroundSize: "26px 26px",
        }}
      />

      {view === "hub" ? (
        <>
          <PageHero
            center
            title="Anant Avinya Technologies Production System"
            Icon={TrendingUp}
            actions={
              <div className="relative">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={hubQuery}
                  onChange={(e) => setHubQuery(e.target.value)}
                  placeholder="Search modules…"
                  className="h-11 w-[240px] max-w-[55vw] rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-[13.5px] shadow-sm outline-none transition-all focus:border-[#0180cf] focus:ring-2 focus:ring-[#0180cf]/20"
                />
              </div>
            }
          />
          {(() => {
            const q = hubQuery.trim().toLowerCase();
            const forms = q ? FORMS.filter((f) => f.label.toLowerCase().includes(q)) : FORMS;
            const showQuote = !q || "quotation".includes(q);
            const showPi = !q || "pi".includes(q) || "proforma invoice".includes(q);
            const empty = forms.length === 0 && !showQuote && !showPi;
            return empty ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center text-[14px] font-semibold text-slate-500 backdrop-blur">
                No modules match “{hubQuery}”.
              </div>
            ) : (
              <div className="mt-4 grid auto-rows-fr grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
                {forms.map((f) => (
                  <WindowCard key={f.key} form={f} count={countOf(f.key)} onForm={() => openForm(f.key)} onRegister={() => openRegister(f.key)} />
                ))}
                {showQuote && <QuotationLinkCard />}
                {showPi && <PiLinkCard />}
              </div>
            );
          })()}
        </>
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

          <SalesDataGrid kind={active} title={current.label} columns={current.columns} rows={rows} onEdit={openEdit} onDeleted={onDeleted} onImported={onImported} from={current.from} to={current.to} enquiryPiMap={active === "quote" ? enquiryPiMap : undefined} />
        </div>
      )}

      <SalesEntryModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        kind={active}
        title={current.label}
        columns={current.columns}
        row={modalRow}
        existingRows={rows}
        primaryKey={current.primaryKey}
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
  const grad = `linear-gradient(135deg, ${form.from}, ${form.to})`;
  return (
    <div className="group relative h-full">
      {/* glow halo (fades in on hover) */}
      <div
        aria-hidden
        className="absolute -inset-0.5 rounded-[24px] opacity-0 blur-lg transition-opacity duration-500 group-hover:opacity-60"
        style={{ background: grad }}
      />

      {/* card — solid green→blue gradient, flex-col so the buttons pin to the bottom */}
      <div
        className="relative flex h-full flex-col overflow-hidden rounded-[20px] border border-white/25 p-4 text-white transition-all duration-300 group-hover:-translate-y-1"
        style={{ background: grad, boxShadow: "0 16px 34px -18px rgba(1,128,207,0.55)" }}
      >
        {/* glossy top sheen */}
        <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0) 46%)" }} />
        {/* shine sweep on hover */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-2/3 -translate-x-[180%] -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[260%]"
        />
        {/* faint corner watermark icon */}
        <Icon className="pointer-events-none absolute -bottom-5 -right-5 text-white" size={92} strokeWidth={1.4} style={{ opacity: 0.1 }} />

        {/* header */}
        <div className="relative flex items-start gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white ring-1 ring-white/30 transition-transform duration-300 group-hover:scale-105">
            <Icon size={19} strokeWidth={2.3} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-black tracking-[-0.01em] text-white">{form.label}</h3>
            <p className="mt-0.5 line-clamp-1 text-[11.5px] text-white/80">{form.desc}</p>
          </div>
        </div>

        {/* workflow path */}
        <div className="relative mt-2.5 flex flex-wrap items-center gap-1">
          {form.steps.map((s, i) => (
            <React.Fragment key={s}>
              <span className="rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.02em] text-white">{s}</span>
              {i < form.steps.length - 1 && <ChevronRight size={11} className="text-white/50" strokeWidth={3} />}
            </React.Fragment>
          ))}
        </div>

        {/* count */}
        <div className="relative mt-2 flex items-baseline gap-1.5">
          <span className="text-[18px] font-black tabular-nums text-white">{count}</span>
          <span className="text-[12px] font-semibold text-white/70">{count === 1 ? "entry" : "entries"} stored</span>
        </div>

        {/* actions — mt-auto pins them to the bottom so every card lines up */}
        <div className="relative mt-auto grid grid-cols-2 gap-2 pt-3">
          <button
            type="button"
            onClick={onForm}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-white/40 bg-white/15 text-[13.5px] font-extrabold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/25 active:translate-y-0"
          >
            <FilePlus2 size={16} strokeWidth={2.4} /> Form
          </button>
          <button
            type="button"
            onClick={onRegister}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-white text-[13.5px] font-extrabold text-[#0069b3] shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Table2 size={16} strokeWidth={2.4} /> Register
            <ArrowRight size={14} strokeWidth={2.6} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Quotation launcher card (links into the Quotation builder) ── */
function QuotationLinkCard() {
  const grad = "linear-gradient(135deg, #63b81e, #0180cf)";
  const steps = ["Doors", "Hardware", "Print"];
  return (
    <Link href={"/quotation" as Route} className="group relative block h-full">
      <div
        aria-hidden
        className="absolute -inset-0.5 rounded-[24px] opacity-0 blur-lg transition-opacity duration-500 group-hover:opacity-60"
        style={{ background: grad }}
      />
      <div
        className="relative flex h-full flex-col overflow-hidden rounded-[20px] border border-white/25 p-4 text-white transition-all duration-300 group-hover:-translate-y-1"
        style={{ background: grad, boxShadow: "0 16px 34px -18px rgba(1,128,207,0.55)" }}
      >
        <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0) 46%)" }} />
        <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-2/3 -translate-x-[180%] -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[260%]" />
        <Receipt className="pointer-events-none absolute -bottom-5 -right-5 text-white" size={92} strokeWidth={1.4} style={{ opacity: 0.1 }} />

        <div className="relative flex items-start gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white ring-1 ring-white/30 transition-transform duration-300 group-hover:scale-105">
            <Receipt size={19} strokeWidth={2.3} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-black tracking-[-0.01em] text-white">Working Specification</h3>
            <p className="mt-0.5 line-clamp-1 text-[11.5px] text-white/80">Build &amp; print door specifications from the masters</p>
          </div>
        </div>

        <div className="relative mt-2.5 flex flex-wrap items-center gap-1">
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <span className="rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.02em] text-white">{s}</span>
              {i < steps.length - 1 && <ChevronRight size={11} className="text-white/50" strokeWidth={3} />}
            </React.Fragment>
          ))}
        </div>

        <div className="relative mt-2 text-[12px] font-semibold text-white/70">Looks up Product &amp; Hardware</div>

        <div className="relative mt-auto pt-3">
          <span className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-white text-[13.5px] font-extrabold text-[#0069b3] shadow-md transition-all duration-200 group-hover:-translate-y-0.5">
            <Receipt size={16} strokeWidth={2.4} /> Open Working Specification
            <ArrowRight size={14} strokeWidth={2.6} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ── PI launcher card (Proforma Invoice — made from a quotation) ── */
function PiLinkCard() {
  const grad = "linear-gradient(135deg, #63b81e, #0180cf)";
  const steps = ["Quote", "Fill", "Print"];
  return (
    <Link href={"/quotation/pi" as Route} className="group relative block h-full">
      <div
        aria-hidden
        className="absolute -inset-0.5 rounded-[24px] opacity-0 blur-lg transition-opacity duration-500 group-hover:opacity-60"
        style={{ background: grad }}
      />
      <div
        className="relative flex h-full flex-col overflow-hidden rounded-[20px] border border-white/25 p-4 text-white transition-all duration-300 group-hover:-translate-y-1"
        style={{ background: grad, boxShadow: "0 16px 34px -18px rgba(1,128,207,0.55)" }}
      >
        <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0) 46%)" }} />
        <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-2/3 -translate-x-[180%] -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[260%]" />
        <ReceiptText className="pointer-events-none absolute -bottom-5 -right-5 text-white" size={92} strokeWidth={1.4} style={{ opacity: 0.1 }} />

        <div className="relative flex items-start gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white ring-1 ring-white/30 transition-transform duration-300 group-hover:scale-105">
            <ReceiptText size={19} strokeWidth={2.3} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-black tracking-[-0.01em] text-white">PI · Proforma Invoice</h3>
            <p className="mt-0.5 line-clamp-1 text-[11.5px] text-white/80">Made from a quotation — open a quote &amp; “Go to PI”</p>
          </div>
        </div>

        <div className="relative mt-2.5 flex flex-wrap items-center gap-1">
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <span className="rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.02em] text-white">{s}</span>
              {i < steps.length - 1 && <ChevronRight size={11} className="text-white/50" strokeWidth={3} />}
            </React.Fragment>
          ))}
        </div>

        <div className="relative mt-2 text-[12px] font-semibold text-white/70">Supply &amp; Installation invoice</div>

        <div className="relative mt-auto pt-3">
          <span className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-white text-[13.5px] font-extrabold text-[#0069b3] shadow-md transition-all duration-200 group-hover:-translate-y-0.5">
            <ReceiptText size={16} strokeWidth={2.4} /> Open PI
            <ArrowRight size={14} strokeWidth={2.6} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

