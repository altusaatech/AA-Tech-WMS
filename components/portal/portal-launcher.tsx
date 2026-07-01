"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import {
  LayoutDashboard,
  ShieldCheck,
  Database,
  ArrowRight,
  LogOut,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { PortalBackground } from "./portal-background";

interface WorkspaceDef {
  key: string;
  label: string;
  title: string;
  desc: string;
  href: Route;
  icon: LucideIcon;
  from: string;
  to: string;
  adminOnly?: boolean;
}

const WORKSPACES: WorkspaceDef[] = [
  {
    key: "wms",
    label: "WMS",
    title: "Warehouse Management",
    desc: "The work dashboard — tasks, projects, production & the daily loop.",
    href: "/" as Route,
    icon: LayoutDashboard,
    from: "#0180cf",
    to: "#0069b3",
  },
  {
    key: "admin",
    label: "Admin",
    title: "Administration",
    desc: "Employees, departments, settings & the control room.",
    href: "/admin" as Route,
    icon: ShieldCheck,
    from: "#0069b3",
    to: "#0180cf",
    adminOnly: true,
  },
  {
    key: "masters",
    label: "Masters",
    title: "Master Data",
    desc: "Products, hardware, quotations & the reference catalogues.",
    href: "/masters" as Route,
    icon: Database,
    from: "#63b81e",
    to: "#0069b3",
  },
];

export function PortalLauncher({
  name,
  firstName,
  isAdmin,
}: {
  name: string;
  firstName: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [active, setActive] = React.useState("wms");
  const ws = WORKSPACES.find((w) => w.key === active)!;
  const locked = !!ws.adminOnly && !isAdmin;

  async function signOutNow() {
    try {
      await signOut(getFirebaseAuth());
    } catch {
      /* server revoke below is what matters */
    }
    await fetch("/api/auth/signout", { method: "POST" });
    router.replace("/login" as Route);
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <PortalBackground />

      {/* ── top bar ── */}
      <header className="relative z-10 flex items-center justify-between gap-4 px-8 py-5 max-md:px-4">
        {/* AA Tech logo — left */}
        <Link href={"/" as Route} className="flex items-center gap-2.5 shrink-0" aria-label="A A Tech">
          <img src="/logo-mark.png?v=3" alt="A A Tech" className="h-11 w-auto" />
          <span className="flex flex-col leading-none">
            <span className="text-[15px] font-black tracking-[-0.01em] text-slate-800">A A Tech</span>
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#63b81e]">WMS</span>
          </span>
        </Link>

        {/* right cluster — user + Altus */}
        <div className="flex items-center gap-3 max-md:gap-2">
          <span className="text-[13.5px] text-slate-500 max-sm:hidden">
            Hi, <b className="text-slate-800">{firstName}</b>
          </span>
          <button
            type="button"
            onClick={signOutNow}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-bold text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
          >
            <LogOut size={14} strokeWidth={2.4} /> Sign out
          </button>
          <span className="h-8 w-px bg-slate-200 max-lg:hidden" aria-hidden />
          <span className="flex flex-col items-center leading-none max-lg:hidden" aria-label="Powered by Altus Corp">
            <span className="mb-0.5 text-[8px] font-bold uppercase tracking-[0.18em] text-slate-400">Powered by</span>
            <img src="/altus-corp-logo.png" alt="Altus Corp" className="h-9 w-auto" />
          </span>
        </div>
      </header>

      {/* ── content ── */}
      <main className="relative z-10 mx-auto flex max-w-[880px] flex-col items-center px-6 pb-20 pt-6 max-md:px-4">
        <div className="w-full rounded-[32px] border border-white/70 bg-white/75 p-9 shadow-[0_50px_120px_-40px_rgba(12,38,74,0.5)] backdrop-blur-2xl max-md:p-6">
          {/* hero */}
          <div className="text-center">
            <div className="text-[12px] font-black uppercase tracking-[0.2em] text-[#0180cf]">
              A A Tech <span className="text-slate-300">/</span> Workspaces
            </div>
            <h1
              className="mt-2 text-slate-900"
              style={{ fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 900, fontSize: "clamp(30px, 4vw, 46px)", letterSpacing: "-0.03em", lineHeight: 1.03 }}
            >
              Welcome back, {firstName}
            </h1>
            <p className="mt-2 text-[15px] text-slate-500">Choose a workspace to get started</p>
          </div>

          {/* tabs */}
          <div className="mt-7 flex justify-center">
            <div className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-white/70 p-1.5 shadow-sm backdrop-blur max-md:w-full max-md:flex-col max-md:items-stretch">
              {WORKSPACES.map((w) => {
                const on = w.key === active;
                const Icon = w.icon;
                return (
                  <button
                    key={w.key}
                    type="button"
                    onClick={() => setActive(w.key)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-6 text-[14.5px] font-extrabold transition-all max-md:w-full"
                    style={
                      on
                        ? { background: `linear-gradient(135deg, ${w.from}, ${w.to})`, color: "#fff", boxShadow: `0 10px 24px -10px ${w.to}aa` }
                        : { color: "#64748b" }
                    }
                  >
                    <Icon size={17} strokeWidth={2.4} />
                    {w.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* active workspace */}
          <div className="mt-7">
            <div
              className="relative overflow-hidden rounded-[24px] border border-white/80 bg-white p-8 shadow-lg max-md:p-6"
              style={{ boxShadow: "0 24px 60px -34px rgba(15,40,80,0.4)" }}
            >
              <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: `linear-gradient(90deg, ${ws.from}, ${ws.to})` }} />
              <ws.icon className="pointer-events-none absolute -bottom-8 -right-8 text-slate-900" size={190} strokeWidth={1.2} style={{ opacity: 0.04 }} />

              <div className="relative flex items-start gap-5 max-md:flex-col">
                <span
                  className="inline-flex size-16 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${ws.from}, ${ws.to})`, boxShadow: `0 16px 34px -14px ${ws.to}cc` }}
                >
                  <ws.icon size={30} strokeWidth={2.2} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[24px] font-black tracking-[-0.01em] text-slate-800">{ws.title}</h2>
                    {locked && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-black uppercase tracking-[0.06em] text-slate-500">
                        <Lock size={11} /> No access
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-[14.5px] leading-relaxed text-slate-500">{ws.desc}</p>

                  <div className="mt-6">
                    {locked ? (
                      <span className="inline-flex h-12 items-center gap-2 rounded-xl bg-slate-100 px-6 text-[14.5px] font-extrabold text-slate-400">
                        <Lock size={16} /> No access
                      </span>
                    ) : (
                      <Link
                        href={ws.href}
                        className="group/btn inline-flex h-12 items-center gap-2 rounded-xl px-6 text-[15px] font-extrabold text-white shadow-lg transition-all hover:-translate-y-0.5"
                        style={{ background: `linear-gradient(135deg, ${ws.from}, ${ws.to})`, boxShadow: `0 16px 34px -14px ${ws.to}cc` }}
                      >
                        Enter workspace
                        <ArrowRight size={17} strokeWidth={2.6} className="transition-transform group-hover/btn:translate-x-0.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
