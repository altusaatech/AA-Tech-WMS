"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import {
  Database,
  Wrench,
  Plus,
  RefreshCw,
  Receipt,
  Factory,
  ArrowRight,
  ArrowLeft,
  DoorOpen,
  Boxes,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { fireToast } from "@/lib/toast";
import { PageHero } from "@/components/layout/page-hero";
import { SalesDataGrid } from "@/components/sales/sales-grid";
import { SalesEntryModal } from "@/components/sales/sales-entry-modal";
import { PRODUCT_COLUMNS, HARDWARE_COLUMNS, DOOR_COLUMNS, type SalesColDef } from "@/lib/sales/columns";
import type { SaleKind, SalesRow } from "@/app/(app)/sales/actions";

type MasterKind = "product" | "hardware" | "door";

interface LeafDef {
  key: MasterKind;
  label: string;
  /** Singular noun for the "Add …" button. */
  addLabel: string;
  desc: string;
  icon: LucideIcon;
  from: string;
  to: string;
  /** Pastel card background gradient. */
  soft: string;
  /** Pastel border tint. */
  ring: string;
  columns: SalesColDef[];
  primaryKey: string;
}

/** The three leaf masters that actually hold data grids. */
const LEAVES: Record<MasterKind, LeafDef> = {
  door: {
    key: "door",
    label: "Door",
    addLabel: "Door",
    desc: "Door kit master — a code auto-fills the quotation",
    icon: DoorOpen,
    from: "#0180cf",
    to: "#0069b3",
    soft: "linear-gradient(135deg, #eaf4fc, #f6fbff)",
    ring: "rgba(1,128,207,0.28)",
    columns: DOOR_COLUMNS,
    primaryKey: "doorCode",
  },
  product: {
    key: "product",
    label: "Fabrication",
    addLabel: "Fabrication Item",
    desc: "Fabricated finished-goods — groups, specs & pricing",
    icon: Factory,
    from: "#63b81e",
    to: "#3f7a14",
    soft: "linear-gradient(135deg, #eff8e3, #f8fcec)",
    ring: "rgba(99,184,30,0.30)",
    columns: PRODUCT_COLUMNS,
    primaryKey: "typeOfFinishedGood",
  },
  hardware: {
    key: "hardware",
    label: "Hardware Master",
    addLabel: "Hardware",
    desc: "Hardware & components — make, model, rates & images",
    icon: Wrench,
    from: "#0069b3",
    to: "#0180cf",
    soft: "linear-gradient(135deg, #e9f1f9, #f4f9fe)",
    ring: "rgba(0,105,179,0.26)",
    columns: HARDWARE_COLUMNS,
    primaryKey: "model",
  },
};

type Screen = "home" | "product" | "grid";

export function MastersTabs({
  productRows,
  hardwareRows,
  doorRows,
}: {
  productRows: SalesRow[];
  hardwareRows: SalesRow[];
  doorRows: SalesRow[];
}) {
  const router = useRouter();
  const [screen, setScreen] = React.useState<Screen>("home");
  const [active, setActive] = React.useState<MasterKind>("door");
  const [rowsByKind, setRowsByKind] = React.useState<Record<MasterKind, SalesRow[]>>({
    product: productRows,
    hardware: hardwareRows,
    door: doorRows,
  });
  // Re-sync when the server sends fresh data (e.g. after Refresh).
  React.useEffect(() => {
    setRowsByKind({ product: productRows, hardware: hardwareRows, door: doorRows });
  }, [productRows, hardwareRows, doorRows]);

  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalRow, setModalRow] = React.useState<SalesRow | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  const leaf = LEAVES[active];
  const rows = rowsByKind[active];

  function openGrid(kind: MasterKind) {
    setActive(kind);
    setScreen("grid");
  }
  function openAdd() {
    setModalRow(null);
    setModalOpen(true);
  }
  function openEdit(row: SalesRow) {
    fireToast({ message: "You can now edit this record.", type: "info" });
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
    // Success/error feedback is fired centrally by the entry modal.
    if (opts.close) setModalOpen(false);
  }
  function onDeleted(id: string) {
    setRowsByKind((prev) => ({ ...prev, [active]: prev[active].filter((r) => r.id !== id) }));
  }
  function onImported(imported: SalesRow[]) {
    setRowsByKind((prev) => ({ ...prev, [active]: [...prev[active], ...imported] }));
  }
  function refresh() {
    setRefreshing(true);
    router.refresh();
    window.setTimeout(() => setRefreshing(false), 800);
  }

  const productCount = rowsByKind.door.length + rowsByKind.product.length;

  return (
    <main className="relative mx-auto max-w-[1600px] px-8 pb-16 pt-8 max-md:px-4">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.5]"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(1,128,207,0.07) 1px, transparent 0)", backgroundSize: "26px 26px" }}
      />

      {screen === "grid" ? (
        /* ─────────────── DATA GRID ─────────────── */
        <div className="mt-1">
          <button
            type="button"
            onClick={() => setScreen(active === "hardware" ? "home" : "product")}
            className="mb-4 inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-bold text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
          >
            <ArrowLeft size={15} strokeWidth={2.6} /> Back
          </button>

          <Breadcrumb
            trail={active === "hardware" ? ["Masters", "Hardware Master"] : ["Masters", "Product Master", leaf.label]}
          />

          <div className="mt-3 mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-10 items-center justify-center rounded-xl text-white shadow" style={{ background: `linear-gradient(135deg, ${leaf.from}, ${leaf.to})` }}>
                <leaf.icon size={20} strokeWidth={2.3} />
              </span>
              <div>
                <h2 className="text-[19px] font-black text-slate-800">{leaf.label}</h2>
                <p className="text-[12.5px] text-slate-500">{leaf.desc}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={refresh}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-[13px] font-bold text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
              >
                <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh
              </button>
              <button
                type="button"
                onClick={openAdd}
                className="inline-flex h-10 items-center gap-2 rounded-xl px-5 text-[14px] font-extrabold text-white shadow-lg transition-all hover:-translate-y-0.5"
                style={{ background: `linear-gradient(135deg, ${leaf.from}, ${leaf.to})`, boxShadow: `0 12px 26px -10px ${leaf.to}99` }}
              >
                <Plus size={17} strokeWidth={2.8} /> Add {leaf.addLabel}
              </button>
            </div>
          </div>

          <SalesDataGrid
            kind={active as SaleKind}
            title={leaf.label}
            columns={leaf.columns}
            rows={rows}
            onEdit={openEdit}
            onDeleted={onDeleted}
            onImported={onImported}
            from={leaf.from}
            to={leaf.to}
          />
        </div>
      ) : (
        /* ─────────────── BLOCK HUB ─────────────── */
        <>
          <PageHero
            eyebrow="Master Data"
            title="Masters"
            subtitle="Two clean masters — Product (Door & Fabrication) and Hardware — the reference data the whole system reuses."
            Icon={Database}
            actions={
              <div className="flex flex-wrap items-center gap-2.5">
                <Link
                  href={"/sales" as Route}
                  className="group inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[14px] font-extrabold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-50"
                >
                  <Factory size={16} strokeWidth={2.4} /> Go to Production
                  <ArrowRight size={15} strokeWidth={2.6} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href={"/quotation" as Route}
                  className="group inline-flex h-11 items-center gap-2 rounded-xl px-5 text-[14px] font-extrabold text-white shadow-lg transition-all hover:-translate-y-0.5"
                  style={{ background: "linear-gradient(135deg, #0180cf, #63b81e)", boxShadow: "0 14px 30px -14px rgba(1,128,207,0.6)" }}
                >
                  <Receipt size={16} strokeWidth={2.4} /> Go to Quotation
                  <ArrowRight size={15} strokeWidth={2.6} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            }
            stats={[
              { label: "Fabrication", value: rowsByKind.product.length, icon: Factory, from: "#63b81e", to: "#3f7a14" },
              { label: "Doors", value: rowsByKind.door.length, icon: DoorOpen, from: "#0180cf", to: "#0069b3" },
              { label: "Hardware", value: rowsByKind.hardware.length, icon: Wrench, from: "#0069b3", to: "#0180cf" },
            ]}
          />

          {screen === "product" && (
            <button
              type="button"
              onClick={() => setScreen("home")}
              className="mt-6 inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-bold text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
            >
              <ArrowLeft size={15} strokeWidth={2.6} /> Back to masters
            </button>
          )}

          <div className={screen === "product" ? "mt-4" : "mt-6"}>
            <Breadcrumb trail={screen === "product" ? ["Masters", "Product Master"] : ["Masters"]} />
          </div>

          {screen === "home" ? (
            <div className="mt-4 grid grid-cols-2 gap-6 max-md:grid-cols-1">
              <BlockCard
                title="Product Master"
                desc="Doors and fabricated finished-goods catalogues"
                icon={Boxes}
                from="#0180cf"
                to="#63b81e"
                soft="linear-gradient(135deg, #eef6ec, #f4fbf6)"
                ring="rgba(1,128,207,0.24)"
                count={productCount}
                sub={`${productCount === 1 ? "entry" : "entries"} · 2 masters`}
                cta="Open"
                onClick={() => setScreen("product")}
              />
              <BlockCard
                title={LEAVES.hardware.label}
                desc={LEAVES.hardware.desc}
                icon={LEAVES.hardware.icon}
                from={LEAVES.hardware.from}
                to={LEAVES.hardware.to}
                soft={LEAVES.hardware.soft}
                ring={LEAVES.hardware.ring}
                count={rowsByKind.hardware.length}
                sub={rowsByKind.hardware.length === 1 ? "entry" : "entries"}
                cta="Open master"
                onClick={() => openGrid("hardware")}
              />
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-6 max-md:grid-cols-1">
              {(["door", "product"] as const).map((k) => {
                const d = LEAVES[k];
                return (
                  <BlockCard
                    key={k}
                    title={d.label}
                    desc={d.desc}
                    icon={d.icon}
                    from={d.from}
                    to={d.to}
                    soft={d.soft}
                    ring={d.ring}
                    count={rowsByKind[k].length}
                    sub={rowsByKind[k].length === 1 ? "entry" : "entries"}
                    cta="Open master"
                    onClick={() => openGrid(k)}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      <SalesEntryModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        kind={active as SaleKind}
        title={leaf.label}
        columns={leaf.columns}
        row={modalRow}
        existingRows={rows}
        primaryKey={leaf.primaryKey}
        onSaved={onSaved}
        from={leaf.from}
        to={leaf.to}
        Icon={leaf.icon}
      />
    </main>
  );
}

/* ── breadcrumb ── */
function Breadcrumb({ trail }: { trail: string[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-[12.5px] font-bold text-slate-400">
      {trail.map((t, i) => (
        <React.Fragment key={t}>
          <span className={i === trail.length - 1 ? "text-[#0069b3]" : ""}>{t}</span>
          {i < trail.length - 1 && <ChevronRight size={13} strokeWidth={3} className="text-slate-300" />}
        </React.Fragment>
      ))}
    </nav>
  );
}

/* ── a big pastel navigation block ── */
function BlockCard({
  title,
  desc,
  icon: Icon,
  from,
  to,
  soft,
  ring,
  count,
  sub,
  cta,
  onClick,
}: {
  title: string;
  desc: string;
  icon: LucideIcon;
  from: string;
  to: string;
  soft: string;
  ring: string;
  count: number;
  sub: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative overflow-hidden rounded-[26px] border p-6 text-left transition-all duration-300 hover:-translate-y-1.5"
      style={{ background: soft, borderColor: ring, boxShadow: "0 16px 40px -22px rgba(15,40,80,0.28), 0 1px 3px rgba(15,23,42,0.04)" }}
    >
      {/* accent top bar */}
      <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: `linear-gradient(90deg, ${from}, ${to})` }} />
      {/* shine sweep */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-2/3 -translate-x-[180%] -skew-x-12 bg-gradient-to-r from-transparent via-white/55 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[280%]"
      />
      {/* watermark icon */}
      <Icon className="pointer-events-none absolute -bottom-7 -right-7" size={150} strokeWidth={1.3} style={{ color: to, opacity: 0.08 }} />

      <div className="relative flex items-start gap-4">
        <span
          className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg transition-transform duration-300 group-hover:scale-105"
          style={{ background: `linear-gradient(135deg, ${from}, ${to})`, boxShadow: `0 12px 26px -12px ${to}` }}
        >
          <Icon size={28} strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[20px] font-black tracking-[-0.01em] text-slate-800" style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}>
            {title}
          </h3>
          <p className="mt-1 text-[13px] font-medium text-slate-500">{desc}</p>
        </div>
      </div>

      <div className="relative mt-5 flex items-center justify-between">
        <span className="inline-flex items-baseline gap-1.5">
          <span className="text-[26px] font-black tabular-nums" style={{ color: to }}>{count}</span>
          <span className="text-[12.5px] font-semibold text-slate-400">{sub}</span>
        </span>
        <span className="inline-flex items-center gap-1 text-[13.5px] font-extrabold" style={{ color: to }}>
          {cta} <ArrowRight size={15} strokeWidth={2.6} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </button>
  );
}
