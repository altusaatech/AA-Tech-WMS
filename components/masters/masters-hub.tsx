"use client";

import * as React from "react";
import { Database, Layers, Boxes, type LucideIcon } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

interface GroupDef {
  no: number;
  name: string;
  desc: string;
  icon: LucideIcon;
  from: string;
  to: string;
  subs: string[];
}

const GROUPS: GroupDef[] = [
  {
    no: 1,
    name: "Raw Material",
    desc: "Base materials issued to production",
    icon: Layers,
    from: "#0180cf",
    to: "#0069b3",
    subs: ["Sheet", "Section", "Component"],
  },
  {
    no: 2,
    name: "Store & Spares",
    desc: "Stores, spares & consumables inventory",
    icon: Boxes,
    from: "#63b81e",
    to: "#0069b3",
    subs: [
      "Oil, Paint & Chemical",
      "Hardware",
      "Fasteners",
      "Consumable",
      "Tools",
      "Maintenance",
      "Seals & Gaskets",
      "Packing Materials",
      "Insulation, Films & Laminates",
    ],
  },
];

export function MastersHub() {
  const totalSubs = GROUPS.reduce((n, g) => n + g.subs.length, 0);

  return (
    <main className="relative mx-auto max-w-[1600px] px-8 pb-16 pt-8 max-md:px-4">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.5]"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(1,128,207,0.07) 1px, transparent 0)", backgroundSize: "26px 26px" }}
      />

      <PageHero
        eyebrow="Groups & Subgroups"
        title="Masters"
        subtitle={`Material classification used across the system — ${GROUPS.length} groups · ${totalSubs} subgroups.`}
        Icon={Database}
      />

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2 items-start">
        {GROUPS.map((g) => (
          <GroupCard key={g.no} group={g} />
        ))}
      </div>
    </main>
  );
}

function GroupCard({ group }: { group: GroupDef }) {
  const Icon = group.icon;
  return (
    <div className="group relative">
      <div
        aria-hidden
        className="absolute -inset-0.5 rounded-[26px] opacity-0 blur-lg transition-opacity duration-500 group-hover:opacity-40"
        style={{ background: `linear-gradient(135deg, ${group.from}, ${group.to})` }}
      />
      <div
        className="relative overflow-hidden rounded-[24px] border border-white/70 bg-white/80 p-6 backdrop-blur-xl transition-all duration-300 group-hover:-translate-y-1"
        style={{ boxShadow: "0 14px 36px -20px rgba(15,40,80,0.30), 0 1px 4px rgba(15,23,42,0.04)" }}
      >
        <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: `linear-gradient(90deg, ${group.from}, ${group.to})` }} />
        <Icon className="pointer-events-none absolute -bottom-6 -right-6 text-slate-900" size={140} strokeWidth={1.4} style={{ opacity: 0.04 }} />

        {/* header */}
        <div className="relative flex items-center gap-3.5">
          <span
            className="relative inline-flex size-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg transition-transform duration-300 group-hover:scale-105"
            style={{ background: `linear-gradient(135deg, ${group.from}, ${group.to})`, boxShadow: `0 10px 22px -10px ${group.to}cc` }}
          >
            <Icon size={24} strokeWidth={2.3} />
            <span
              className="absolute -right-1.5 -top-1.5 inline-flex size-5 items-center justify-center rounded-full bg-white text-[11px] font-black tabular-nums shadow"
              style={{ color: group.to }}
            >
              {group.no}
            </span>
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-[18px] font-black tracking-[-0.01em] text-slate-800">{group.name}</h3>
            <p className="mt-0.5 text-[12.5px] text-slate-500">{group.desc}</p>
          </div>
          <span
            className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.06em]"
            style={{ background: `color-mix(in srgb, ${group.to} 12%, transparent)`, color: group.to }}
          >
            {group.subs.length} subgroups
          </span>
        </div>

        {/* subgroups */}
        <div className="relative mt-4 grid grid-cols-2 gap-2 max-md:grid-cols-1">
          {group.subs.map((s, i) => (
            <div
              key={s}
              className="flex items-center gap-2.5 rounded-xl border border-slate-200/70 bg-white px-3 py-2 transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              <span
                className="inline-flex size-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-black tabular-nums text-white"
                style={{ background: `linear-gradient(135deg, ${group.from}, ${group.to})` }}
              >
                {i + 1}
              </span>
              <span className="truncate text-[13.5px] font-semibold text-slate-700">{s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
