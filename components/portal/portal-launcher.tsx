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
  Users,
  ArrowRight,
  LogOut,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { LoginMosaic } from "@/components/auth/login-mosaic";

interface ModuleLink {
  label: string;
  href: Route;
}

interface WorkspaceDef {
  key: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  from: string;
  to: string;
  /** Single-destination card (WMS, Admin). */
  href?: Route;
  /** Grouped card — shows one chip per module (Masters, Employees). */
  modules?: ModuleLink[];
  adminOnly?: boolean;
}

// Grouped workspace cards — AA Tech palette (blue / green / deep-blue), plus a
// neutral slate for the access-gated Admin card. No red.
const WORKSPACES: WorkspaceDef[] = [
  {
    key: "wms",
    title: "WMS",
    desc: "The work dashboard — tasks, projects & the daily loop.",
    href: "/" as Route,
    icon: LayoutDashboard,
    from: "#0180cf",
    to: "#0069b3",
  },
  {
    key: "masters",
    title: "Masters",
    desc: "Production floor, products, hardware & quotations.",
    icon: Database,
    from: "#63b81e",
    to: "#4a9616",
    modules: [
      { label: "Production", href: "/sales" as Route },
      { label: "Masters", href: "/masters" as Route },
    ],
  },
  {
    key: "employees",
    title: "Employees",
    desc: "Attendance, leave, salary & the team roster.",
    icon: Users,
    from: "#0069b3",
    to: "#024a7d",
    modules: [
      { label: "Attendance", href: "/attendance" as Route },
      { label: "Leave", href: "/attendance/leave" as Route },
      { label: "Salary", href: "/salary" as Route },
    ],
  },
  {
    key: "admin",
    title: "Admin",
    desc: "Employees, departments & the control room.",
    href: "/admin" as Route,
    icon: ShieldCheck,
    from: "#3b4859",
    to: "#232d3b",
    adminOnly: true,
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
    <div className="relative isolate min-h-screen overflow-hidden bg-[#0c0807]">
      {/* poster-wall backdrop — same drifting mosaic as the sign-in screen.
          z-0 (not -z-10) so it paints above the root background, below content. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <LoginMosaic overlay="soft" />
      </div>

      {/* ── top bar (premium dark glass, matches the sign-in card) ── */}
      <div className="relative z-10 px-6 pt-6 max-md:px-3">
        <div className="relative mx-auto max-w-[1180px]">
          {/* soft brand glow behind the bar */}
          <div
            aria-hidden
            className="absolute -inset-[3px] rounded-[26px] opacity-45 blur-2xl"
            style={{ background: "linear-gradient(110deg, #0180cf, #0a7d8a 52%, #63b81e)" }}
          />
          <header
            className="relative flex items-center justify-between gap-4 overflow-hidden rounded-[22px] px-6 py-4 backdrop-blur-2xl max-md:px-4"
            style={{
              background: "linear-gradient(180deg, rgba(26,21,20,0.90), rgba(14,11,10,0.95))",
              border: "1px solid rgba(255,255,255,0.10)",
              boxShadow:
                "0 34px 80px -34px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -40px 70px -55px rgba(1,128,207,0.5)",
            }}
          >
            {/* animated top accent strip */}
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-[3px]"
              style={{ background: "linear-gradient(90deg, #0180cf, #0069b3 45%, #63b81e)", backgroundSize: "200% auto", animation: "headerTextShimmer 7s linear infinite" }}
            />
            {/* faint dotted texture */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-50"
              style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)", backgroundSize: "22px 22px" }}
            />

            {/* AA Tech logo — left */}
            <Link href={"/" as Route} className="group relative flex items-center gap-3 shrink-0" aria-label="A A Tech">
              <span className="inline-flex items-center justify-center rounded-xl bg-white p-1.5 shadow-lg ring-1 ring-white/25 transition-transform group-hover:scale-105">
                <img src="/logo-mark.png?v=3" alt="A A Tech" className="h-9 w-auto" />
              </span>
              <span className="flex flex-col leading-none">
                <span className="text-[16px] font-black tracking-[-0.01em] text-white">A A Tech</span>
                <span className="text-[9px] font-black uppercase tracking-[0.24em] text-[#7ed957]">Workspaces</span>
              </span>
            </Link>

            {/* right cluster — user + Altus */}
            <div className="relative flex items-center gap-3.5 max-md:gap-2">
              <span className="text-[13.5px] text-white/60 max-sm:hidden">
                Hi, <b className="text-white">{firstName}</b>
              </span>
              <button
                type="button"
                onClick={signOutNow}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-3.5 text-[13px] font-bold text-white/90 backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white/20 hover:text-white"
              >
                <LogOut size={14} strokeWidth={2.4} /> Sign out
              </button>
              <span className="h-8 w-px bg-white/15 max-lg:hidden" aria-hidden />
              <span className="flex flex-col items-center leading-none max-lg:hidden" aria-label="Powered by Altus Corp">
                <span className="mb-0.5 text-[8px] font-bold uppercase tracking-[0.18em] text-white/40">Powered by</span>
                <img src="/altus-corp-logo.png" alt="Altus Corp" className="h-9 w-auto" />
              </span>
            </div>
          </header>
        </div>
      </div>

      {/* ── content ── */}
      <main className="relative z-10 mx-auto max-w-[1180px] px-8 pb-20 pt-4 max-md:px-4">
        {/* welcome */}
        <div className="mb-8 max-md:mb-6">
          <div className="text-[12px] font-black uppercase tracking-[0.2em] text-[#5cc0f5]">
            A A Tech <span className="text-white/30">/</span> Workspaces
          </div>
          <h1
            className="mt-1.5 text-white"
            style={{ fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 900, fontSize: "clamp(28px, 3.6vw, 42px)", letterSpacing: "-0.03em", lineHeight: 1.03, textShadow: "0 2px 24px rgba(0,0,0,0.5)" }}
          >
            Welcome back, {firstName}
          </h1>
          <p className="mt-1.5 text-[15px] text-white/70">Pick a workspace to jump into.</p>
        </div>

        {/* card grid on a black stage (behind the cards only, not full page) */}
        <div className="rounded-[30px] border border-white/10 bg-black/70 p-5 shadow-[0_40px_90px_-40px_rgba(0,0,0,0.9)] backdrop-blur-sm max-md:p-3.5">
          <div className="grid grid-cols-2 gap-5 max-sm:grid-cols-1">
            {WORKSPACES.map((w) => (
              <WorkspaceCard key={w.key} ws={w} locked={!!w.adminOnly && !isAdmin} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function WorkspaceCard({ ws, locked }: { ws: WorkspaceDef; locked: boolean }) {
  const Icon = ws.icon;
  const grouped = !locked && !!ws.modules?.length;

  const inner = (
    <div
      className="group relative flex h-full min-h-[200px] flex-col overflow-hidden rounded-[22px] p-6 shadow-lg transition-all duration-200"
      style={{
        background: `linear-gradient(145deg, ${ws.from}, ${ws.to})`,
        boxShadow: `0 22px 46px -22px ${ws.to}cc`,
      }}
    >
      {/* decorative oversized icon */}
      <Icon
        aria-hidden
        className="pointer-events-none absolute -bottom-6 -right-4 text-white transition-transform duration-300 group-hover:scale-105"
        size={168}
        strokeWidth={1.2}
        style={{ opacity: 0.14 }}
      />
      {/* subtle sheen */}
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0) 42%)" }} />

      {/* icon chip */}
      <span className="relative inline-flex size-11 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-sm">
        <Icon size={21} strokeWidth={2.3} />
      </span>

      {/* text */}
      <div className="relative mt-auto pt-5">
        <h2 className="text-[26px] font-black leading-none tracking-[-0.01em] text-white">{ws.title}</h2>
        <p className="mt-2 max-w-[80%] text-[13.5px] font-medium leading-snug text-white/85">{ws.desc}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {locked ? (
            <span className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-black/20 px-3.5 text-[13px] font-bold text-white/80 ring-1 ring-white/15">
              <Lock size={13} strokeWidth={2.5} /> No access
            </span>
          ) : grouped ? (
            ws.modules!.map((m) => (
              <Link
                key={m.label}
                href={m.href}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3.5 text-[13px] font-extrabold shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{ color: ws.to }}
              >
                {m.label}
                <ArrowRight size={14} strokeWidth={2.7} />
              </Link>
            ))
          ) : (
            <span className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-4 text-[13.5px] font-extrabold shadow-sm transition-transform group-hover:translate-x-0.5" style={{ color: ws.to }}>
              Enter workspace
              <ArrowRight size={15} strokeWidth={2.7} />
            </span>
          )}
        </div>
      </div>
    </div>
  );

  // Grouped cards have several destinations, so the card itself isn't a link —
  // each module chip links on its own. Single-destination cards wrap in a Link.
  if (locked || grouped) return inner;

  return (
    <Link href={ws.href!} className="block transition-transform duration-200 hover:-translate-y-1">
      {inner}
    </Link>
  );
}
