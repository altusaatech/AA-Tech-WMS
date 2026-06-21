"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2 } from "lucide-react";
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
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  kind: SaleKind;
  title: string;
  columns: SalesColDef[];
  row: SalesRow | null;
  onSaved: (row: SalesRow) => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[201] flex max-h-[90vh] w-[min(940px,94vw)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-hairline bg-surface-card shadow-2xl"
          aria-describedby={undefined}
        >
          {open && (
            <FormBody
              key={row?.id ?? "new"}
              kind={kind}
              title={title}
              columns={columns}
              row={row}
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
  onSaved,
  onCancel,
}: {
  kind: SaleKind;
  title: string;
  columns: SalesColDef[];
  row: SalesRow | null;
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
  const [saving, setSaving] = React.useState(false);

  async function save() {
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

  return (
    <>
      <header
        className="flex items-center justify-between px-6 py-4"
        style={{ background: "linear-gradient(135deg, #0069b3, #0180cf)" }}
      >
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">
            {row ? "Edit entry" : "New entry"}
          </div>
          <Dialog.Title className="mt-0.5 text-[18px] font-extrabold text-white">{title}</Dialog.Title>
        </div>
        <Dialog.Close className="rounded-lg p-1.5 text-white/80 hover:bg-white/15 hover:text-white" aria-label="Close">
          <X size={18} />
        </Dialog.Close>
      </header>

      <div className="grid grid-cols-1 gap-x-5 gap-y-4 overflow-y-auto px-6 py-5 md:grid-cols-2">
        {editable.map((c) => (
          <Field
            key={c.key}
            col={c}
            value={vals[c.key] ?? ""}
            onChange={(v) => setVals((s) => ({ ...s, [c.key]: v }))}
          />
        ))}
      </div>

      <footer className="flex items-center justify-end gap-2.5 border-t border-hairline bg-surface-soft px-6 py-4">
        <button
          type="button"
          onClick={onCancel}
          className="h-10 rounded-lg border border-hairline px-4 text-[14px] font-semibold text-ink-soft hover:bg-hairline"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex h-10 items-center gap-2 rounded-lg px-5 text-[14px] font-extrabold text-white shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #63b81e, #0180cf)" }}
        >
          {saving && <Loader2 size={15} className="animate-spin" />}
          {row ? "Save changes" : "Save"}
        </button>
      </footer>
    </>
  );
}

function Field({
  col,
  value,
  onChange,
}: {
  col: SalesColDef;
  value: FieldVal;
  onChange: (v: FieldVal) => void;
}) {
  const id = `salesf-${col.key}`;
  const base =
    "h-10 rounded-lg border border-hairline bg-surface-card px-3 text-[14px] text-ink-strong outline-none focus:border-brand-blue";
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      <span className="text-[12px] font-semibold text-ink-soft">{col.label}</span>
      {col.type === "bool" ? (
        <select
          id={id}
          value={value ? "yes" : "no"}
          onChange={(e) => onChange(e.target.value === "yes")}
          className={`${base} cursor-pointer`}
        >
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
      ) : (
        <input
          id={id}
          type={col.type === "number" ? "number" : col.type === "date" ? "date" : col.type === "url" ? "url" : "text"}
          value={typeof value === "string" ? value : ""}
          placeholder={
            col.type === "url" ? "https://…" : col.type === "number" ? "0" : `Enter ${col.label.toLowerCase()}`
          }
          onChange={(e) => onChange(e.target.value)}
          className={base}
        />
      )}
    </label>
  );
}
