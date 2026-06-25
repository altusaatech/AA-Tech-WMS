"use client";

import * as React from "react";
import {
  Database,
  Users,
  Package,
  Truck,
  Ruler,
  IndianRupee,
  Building2,
  Boxes,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

interface MasterDef {
  key: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  from: string;
  to: string;
}

const MASTERS: MasterDef[] = [
  { key: "customers", label: "Customers", desc: "Companies, contacts & billing details", icon: Users, from: "#0180cf", to: "#0069b3" },
  { key: "items", label: "Items / Products", desc: "Finished goods, codes & specifications", icon: Package, from: "#0180cf", to: "#63b81e" },
  { key: "vendors", label: "Vendors", desc: "Suppliers & purchase sources", icon: Truck, from: "#63b81e", to: "#0069b3" },
  { key: "materials", label: "Raw Materials", desc: "Components & inventory items", icon: Boxes, from: "#0d9488", to: "#63b81e" },
  { key: "uom", label: "Units of Measure", desc: "Nos, Kg, Mtr, Set & more", icon: Ruler, from: "#0069b3", to: "#0180cf" },
  { key: "rates", label: "Rate / Price List", desc: "Standard rates & pricing", icon: IndianRupee, from: "#63b81e", to: "#3f7a14" },
  { key: "departments", label: "Departments", desc: "Teams & functional units", icon: Building2, from: "#0180cf", to: "#0069b3" },
];

export function MastersHub() {
  return (
    <main className="relative mx-auto max-w-[1600px] px-8 pb-16 pt-8 max-md:px-4">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.5]"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(1,128,207,0.07) 1px, transparent 0)", backgroundSize: "26px 26px" }}
      />

      <PageHero
        eyebrow="Master Data"
        title="Masters"
        subtitle="The central library for the data the whole system reuses — customers, items, vendors, rates and more."
        Icon={Database}
      />

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {MASTERS.map((m) => (
          <MasterCard key={m.key} master={m} />
        ))}
      </div>
    </main>
  );
}

function MasterCard({ master }: { master: MasterDef }) {
  const Icon = master.icon;
  return (
    <div className="group relative">
      <div
        aria-hidden
        className="absolute -inset-0.5 rounded-[26px] opacity-0 blur-lg transition-opacity duration-500 group-hover:opacity-40"
        style={{ background: `linear-gradient(135deg, ${master.from}, ${master.to})` }}
      />
      <div
        className="relative overflow-hidden rounded-[24px] border border-white/70 bg-white/80 p-5 backdrop-blur-xl transition-all duration-300 group-hover:-translate-y-1"
        style={{ boxShadow: "0 14px 36px -20px rgba(15,40,80,0.30), 0 1px 4px rgba(15,23,42,0.04)" }}
      >
        <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: `linear-gradient(90deg, ${master.from}, ${master.to})` }} />
        <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-2/3 -translate-x-[180%] -skew-x-12 bg-gradient-to-r from-transparent via-white/55 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[260%]" />
        <Icon className="pointer-events-none absolute -bottom-5 -right-5 text-slate-900" size={120} strokeWidth={1.4} style={{ opacity: 0.04 }} />

        <div className="relative flex items-start gap-3.5">
          <span
            className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg transition-transform duration-300 group-hover:scale-105"
            style={{ background: `linear-gradient(135deg, ${master.from}, ${master.to})`, boxShadow: `0 10px 22px -10px ${master.to}cc` }}
          >
            <Icon size={24} strokeWidth={2.3} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-[17px] font-black tracking-[-0.01em] text-slate-800">{master.label}</h3>
            <p className="mt-0.5 line-clamp-1 text-[12px] text-slate-500">{master.desc}</p>
          </div>
        </div>

        <div className="relative mt-5 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-amber-700">
            Coming soon
          </span>
          <span className="inline-flex items-center gap-1 text-[13px] font-bold text-slate-400">
            Open
            <ArrowRight size={14} strokeWidth={2.6} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
