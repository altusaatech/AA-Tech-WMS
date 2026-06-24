"use client";

import * as React from "react";
import { ArrowLeft, Plus, Trash2, Calculator, RotateCcw, Receipt } from "lucide-react";

const BLUE = "#0180cf";
const BLUE_DEEP = "#0069b3";
const GREEN = "#63b81e";

interface LineItem {
  id: number;
  desc: string;
  qty: string;
  rate: string;
}

const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(
    Number.isFinite(n) ? n : 0,
  );

const num = (v: string) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

let nextId = 1;

export function QuotationCalculator({ onBack }: { onBack: () => void }) {
  const [items, setItems] = React.useState<LineItem[]>(() => [
    { id: nextId++, desc: "", qty: "1", rate: "" },
  ]);
  const [discountPct, setDiscountPct] = React.useState("0");
  const [gstPct, setGstPct] = React.useState("18");

  const amounts = items.map((it) => num(it.qty) * num(it.rate));
  const subtotal = amounts.reduce((a, b) => a + b, 0);
  const discount = subtotal * (num(discountPct) / 100);
  const taxable = subtotal - discount;
  const gst = taxable * (num(gstPct) / 100);
  const grandTotal = taxable + gst;

  function update(id: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }
  function addRow() {
    setItems((prev) => [...prev, { id: nextId++, desc: "", qty: "1", rate: "" }]);
  }
  function removeRow(id: number) {
    setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.id !== id) : prev));
  }
  function reset() {
    setItems([{ id: nextId++, desc: "", qty: "1", rate: "" }]);
    setDiscountPct("0");
    setGstPct("18");
  }

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-bold text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
      >
        <ArrowLeft size={15} strokeWidth={2.6} /> Back to modules
      </button>

      {/* header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-xl text-white shadow" style={{ background: `linear-gradient(135deg, ${BLUE}, ${GREEN})` }}>
            <Calculator size={20} strokeWidth={2.3} />
          </span>
          <div>
            <h2 className="text-[19px] font-black text-slate-800">Quotation Calculator</h2>
            <p className="text-[12.5px] text-slate-500">Build a quick quote — qty × rate, discount &amp; GST</p>
          </div>
        </div>
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-bold text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-700"
        >
          <RotateCcw size={14} strokeWidth={2.4} /> Reset
        </button>
      </div>

      <div className="grid grid-cols-[1fr_340px] gap-5 max-lg:grid-cols-1">
        {/* line items */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white" style={{ boxShadow: "0 18px 40px -22px rgba(0,105,179,0.22)" }}>
          <div style={{ height: 4, background: `linear-gradient(90deg, ${GREEN}, ${BLUE} 55%, ${BLUE_DEEP})` }} />
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  {["#", "Description", "Qty", "Rate (₹)", "Amount (₹)", ""].map((h, i) => (
                    <th
                      key={i}
                      className="whitespace-nowrap px-3 py-2.5 text-left font-extrabold uppercase tracking-[0.04em] text-white"
                      style={{ fontSize: 10.5, background: `linear-gradient(180deg, ${BLUE_DEEP}, #00598f)`, textAlign: i >= 2 && i <= 4 ? "right" : "left" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={it.id} className={i % 2 ? "bg-[#f5fafe]" : "bg-white"}>
                    <td className="border-b border-[#e7eff6] px-3 py-2 text-center font-bold text-slate-400 tabular-nums">{i + 1}</td>
                    <td className="border-b border-[#e7eff6] px-2 py-1.5">
                      <input
                        value={it.desc}
                        onChange={(e) => update(it.id, { desc: e.target.value })}
                        placeholder="Item / service description"
                        className="h-9 w-full min-w-[180px] rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] outline-none focus:border-[#0180cf] focus:ring-2 focus:ring-[#0180cf]/15"
                      />
                    </td>
                    <td className="border-b border-[#e7eff6] px-2 py-1.5">
                      <input
                        type="number"
                        value={it.qty}
                        onChange={(e) => update(it.id, { qty: e.target.value })}
                        className="h-9 w-20 rounded-lg border border-slate-200 bg-white px-2.5 text-right text-[13px] tabular-nums outline-none focus:border-[#0180cf] focus:ring-2 focus:ring-[#0180cf]/15"
                      />
                    </td>
                    <td className="border-b border-[#e7eff6] px-2 py-1.5">
                      <input
                        type="number"
                        value={it.rate}
                        onChange={(e) => update(it.id, { rate: e.target.value })}
                        placeholder="0"
                        className="h-9 w-28 rounded-lg border border-slate-200 bg-white px-2.5 text-right text-[13px] tabular-nums outline-none focus:border-[#0180cf] focus:ring-2 focus:ring-[#0180cf]/15"
                      />
                    </td>
                    <td className="border-b border-[#e7eff6] px-3 py-2 text-right font-black tabular-nums text-slate-800">
                      {inr(amounts[i] ?? 0)}
                    </td>
                    <td className="border-b border-[#e7eff6] px-1 text-center">
                      <button
                        type="button"
                        onClick={() => removeRow(it.id)}
                        disabled={items.length === 1}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                        title="Remove row"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 p-3">
            <button
              type="button"
              onClick={addRow}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border-2 border-dashed border-[#0180cf]/40 px-3.5 text-[13px] font-extrabold text-[#0069b3] transition-colors hover:bg-[#0180cf]/5"
            >
              <Plus size={15} strokeWidth={2.8} /> Add item
            </button>
          </div>
        </div>

        {/* totals */}
        <div className="flex flex-col gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5" style={{ boxShadow: "0 18px 40px -22px rgba(0,105,179,0.22)" }}>
            <h3 className="mb-3 text-[12px] font-black uppercase tracking-[0.1em] text-slate-400">Summary</h3>

            <Row label="Subtotal" value={inr(subtotal)} />

            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="text-[13px] font-semibold text-slate-500">Discount</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={discountPct}
                  onChange={(e) => setDiscountPct(e.target.value)}
                  className="h-8 w-16 rounded-lg border border-slate-200 bg-white px-2 text-right text-[13px] tabular-nums outline-none focus:border-[#0180cf]"
                />
                <span className="text-[12px] font-bold text-slate-400">%</span>
              </div>
            </div>
            <Row label="" value={`− ${inr(discount)}`} muted />

            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="text-[13px] font-semibold text-slate-500">GST</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={gstPct}
                  onChange={(e) => setGstPct(e.target.value)}
                  className="h-8 w-16 rounded-lg border border-slate-200 bg-white px-2 text-right text-[13px] tabular-nums outline-none focus:border-[#0180cf]"
                />
                <span className="text-[12px] font-bold text-slate-400">%</span>
              </div>
            </div>
            <Row label="" value={`+ ${inr(gst)}`} muted />

            <div className="my-3 h-px w-full bg-slate-100" />
            <Row label="Taxable" value={inr(taxable)} />
          </div>

          {/* grand total */}
          <div
            className="relative overflow-hidden rounded-2xl px-5 py-4 text-white"
            style={{ background: `linear-gradient(120deg, ${BLUE_DEEP}, ${BLUE} 55%, ${GREEN})`, boxShadow: "0 22px 46px -20px rgba(1,128,207,0.55)" }}
          >
            <Receipt className="pointer-events-none absolute -right-3 -top-3 text-white/15" size={84} strokeWidth={1.5} />
            <div className="relative text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">Grand Total</div>
            <div className="relative mt-1 tabular-nums font-black" style={{ fontFamily: "var(--font-display), system-ui, sans-serif", fontSize: 34, letterSpacing: "-0.02em", lineHeight: 1 }}>
              {inr(grandTotal)}
            </div>
            <div className="relative mt-1.5 text-[12px] font-semibold text-white/65">
              {items.length} item{items.length === 1 ? "" : "s"} · incl. {num(gstPct)}% GST
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      {label ? <span className="text-[13px] font-semibold text-slate-500">{label}</span> : <span />}
      <span className={`tabular-nums ${muted ? "text-[12.5px] font-semibold text-slate-400" : "text-[15px] font-black text-slate-800"}`}>{value}</span>
    </div>
  );
}
