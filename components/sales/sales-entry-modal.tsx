"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2, ChevronDown, AlertCircle, type LucideIcon, ClipboardList } from "lucide-react";
import { saveSalesRow, type SaleKind, type SalesRow } from "@/app/(app)/sales/actions";
import type { SalesColDef } from "@/lib/sales/columns";

type FieldVal = string | boolean;

export function SalesEntryModal({
  open,
  onOpenChange,
  kind,
  title,
  columns,
  row,
  onSaved,
  from = "#0069b3",
  to = "#0180cf",
  Icon = ClipboardList,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  kind: SaleKind;
  title: string;
  columns: SalesColDef[];
  row: SalesRow | null;
  onSaved: (row: SalesRow) => void;
  from?: string;
  to?: string;
  Icon?: LucideIcon;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[200] bg-slate-900/45 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[201] flex max-h-[90vh] w-[min(960px,94vw)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl border border-white/60 bg-white shadow-[0_40px_120px_-20px_rgba(0,40,80,0.45)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 data-[state=open]:slide-in-from-bottom-2"
          aria-describedby={undefined}
        >
          {open && (
            <FormBody
              key={row?.id ?? "new"}
              kind={kind}
              title={title}
              columns={columns}
              row={row}
              from={from}
              to={to}
              Icon={Icon}
              onSaved={(r) => {
                onSaved(r);
                onOpenChange(false);
              }}
              onCancel={() => onOpenChange(false)}
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function FormBody({
  kind,
  title,
  columns,
  row,
  from,
  to,
  Icon,
  onSaved,
  onCancel,
}: {
  kind: SaleKind;
  title: string;
  columns: SalesColDef[];
  row: SalesRow | null;
  from: string;
  to: string;
  Icon: LucideIcon;
  onSaved: (row: SalesRow) => void;
  onCancel: () => void;
}) {
  const editable = React.useMemo(() => columns.filter((c) => !c.readOnly), [columns]);
  const [vals, setVals] = React.useState<Record<string, FieldVal>>(() => {
    const o: Record<string, FieldVal> = {};
    for (const c of editable) {
      const v = row ? row[c.key] : null;
      o[c.key] = c.type === "bool" ? v === true || v === "true" : v == null ? "" : String(v);
    }
    return o;
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);

  function validate(): boolean {
    const next: Record<string, string> = {};
    for (const c of editable) {
      const v = vals[c.key];
      if (c.required && (v === "" || v == null)) {
        next[c.key] = "Required";
      } else if (c.type === "number" && typeof v === "string" && v.trim() !== "" && Number.isNaN(Number(v))) {
        next[c.key] = "Must be a number";
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function save() {
    if (!validate()) {
      // jump to the first invalid field
      const firstBad = editable.find((c) => errors[c.key] || (c.required && !vals[c.key]));
      if (firstBad) document.getElementById(`salesf-${firstBad.key}`)?.focus();
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, string | boolean | null> = {};
      for (const c of editable) payload[c.key] = vals[c.key] ?? (c.type === "bool" ? false : "");
      const saved = await saveSalesRow(kind, row?.id ?? null, payload);
      onSaved(saved);
    } finally {
      setSaving(false);
    }
  }

  const errorCount = Object.keys(errors).length;

  return (
    <>
      {/* ── header ── */}
      <header className="relative overflow-hidden px-6 py-5" style={{ background: `linear-gradient(120deg, ${from}, ${to})` }}>
        <Icon className="pointer-events-none absolute -right-4 -top-4 text-white/10" size={120} strokeWidth={1.5} />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-white/20 text-white ring-1 ring-white/30 backdrop-blur">
              <Icon size={22} strokeWidth={2.2} />
            </span>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/75">
                {row ? "Edit entry" : "New entry"}
              </div>
              <Dialog.Title className="mt-0.5 text-[19px] font-black tracking-[-0.01em] text-white">{title}</Dialog.Title>
            </div>
          </div>
          <Dialog.Close className="rounded-xl p-2 text-white/80 transition-colors hover:bg-white/20 hover:text-white" aria-label="Close">
            <X size={18} />
          </Dialog.Close>
        </div>
      </header>

      {/* ── fields ── */}
      <div className="grid grid-cols-1 gap-x-5 gap-y-4 overflow-y-auto bg-gradient-to-b from-[#f7fbff] to-white px-6 py-6 md:grid-cols-2">
        {editable.map((c) => (
          <Field
            key={c.key}
            col={c}
            value={vals[c.key] ?? ""}
            error={errors[c.key]}
            accent={to}
            onChange={(v) => {
              setVals((s) => ({ ...s, [c.key]: v }));
              if (errors[c.key]) setErrors((e) => ({ ...e, [c.key]: "" }));
            }}
          />
        ))}
      </div>

      {/* ── footer ── */}
      <footer className="flex items-center justify-between gap-3 border-t border-slate-100 bg-white px-6 py-4">
        <span className={`inline-flex items-center gap-1.5 text-[12.5px] font-semibold ${errorCount ? "text-red-600" : "text-transparent"}`}>
          <AlertCircle size={14} /> {errorCount > 0 ? `${errorCount} field${errorCount > 1 ? "s" : ""} need attention` : "ok"}
        </span>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="h-10 rounded-xl border border-slate-200 px-4 text-[14px] font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex h-10 items-center gap-2 rounded-xl px-6 text-[14px] font-extrabold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 disabled:opacity-60"
            style={{ background: `linear-gradient(135deg, ${from}, ${to})`, boxShadow: `0 12px 28px -10px ${to}cc` }}
          >
            {saving && <Loader2 size={15} className="animate-spin" />}
            {row ? "Save changes" : "Save entry"}
          </button>
        </div>
      </footer>
    </>
  );
}

function Field({
  col,
  value,
  error,
  accent,
  onChange,
}: {
  col: SalesColDef;
  value: FieldVal;
  error?: string;
  accent: string;
  onChange: (v: FieldVal) => void;
}) {
  const id = `salesf-${col.key}`;
  const ring = error ? "#ef4444" : accent;
  const base =
    "h-11 w-full rounded-xl border bg-white px-3.5 text-[14px] text-slate-800 shadow-sm outline-none transition-all placeholder:text-slate-300 focus:ring-2";
  const borderColor = error ? "#fca5a5" : "#e2e8f0";

  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1 text-[12px] font-bold text-slate-600">
        {col.label}
        {col.required && <span style={{ color: "#ef4444" }}>*</span>}
      </span>

      {col.type === "bool" ? (
        <SelectBox id={id} value={value ? "yes" : "no"} onChange={(v) => onChange(v === "yes")} ring={ring} borderColor={borderColor} options={[{ v: "no", l: "No" }, { v: "yes", l: "Yes" }]} />
      ) : col.type === "select" ? (
        <SelectBox
          id={id}
          value={typeof value === "string" ? value : ""}
          onChange={(v) => onChange(v)}
          ring={ring}
          borderColor={borderColor}
          options={[{ v: "", l: "Select…" }, ...(col.options ?? []).map((o) => ({ v: o, l: o }))]}
        />
      ) : (
        <input
          id={id}
          type={col.type === "number" ? "number" : col.type === "date" ? "date" : col.type === "url" ? "url" : "text"}
          value={typeof value === "string" ? value : ""}
          placeholder={col.type === "url" ? "https://…" : col.type === "number" ? "0" : `Enter ${col.label.toLowerCase()}`}
          onChange={(e) => onChange(e.target.value)}
          className={base}
          style={{ borderColor, ["--tw-ring-color" as string]: `${ring}40` }}
        />
      )}

      {error && (
        <span className="flex items-center gap-1 text-[11.5px] font-semibold text-red-600">
          <AlertCircle size={12} /> {error}
        </span>
      )}
    </label>
  );
}

function SelectBox({
  id,
  value,
  onChange,
  ring,
  borderColor,
  options,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  ring: string;
  borderColor: string;
  options: { v: string; l: string }[];
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full cursor-pointer appearance-none rounded-xl border bg-white px-3.5 pr-9 text-[14px] text-slate-800 shadow-sm outline-none transition-all focus:ring-2"
        style={{ borderColor, ["--tw-ring-color" as string]: `${ring}40` }}
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.l}
          </option>
        ))}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
    </div>
  );
}
