import { MainNavServer } from "./main-nav-server";
import { MobileMenuServer } from "./mobile-menu-server";
import { HeaderStatusBar } from "./header-clock";
import { UserMenuServer } from "@/components/header/user-menu-server";
import { NewTaskTrigger } from "@/components/header/new-task-trigger";
import { AdminPill } from "@/components/header/admin-pill";
import { GlobalSearch } from "@/components/header/global-search";
import { getCurrentEmployee } from "@/lib/auth/current";

/**
 * Command-center application header.
 *
 *  1. HERO CARD (scrolls away): a wide, fully-rounded glass card with a
 *     dark-blue→green gradient and a soft outer glow. AA Tech mark in a glass
 *     tile on the left; the "Anant Avinya Technologies" wordmark + tagline +
 *     a live status-pill bar (date · time · system · modules) in the center;
 *     the "Powered by Altus Corp" partner mark on the right.
 *  2. NAV BAR (sticky): the primary pill nav + search + actions + avatar on a
 *     light frosted strip. `.header-light` keeps the nav pills ink-on-light.
 *
 * `generatedAt` is accepted to keep the prop contract stable for callers but
 * no longer rendered.
 */
export async function DashboardHeader({
  generatedAt: _generatedAt,
}: { generatedAt: Date }) {
  const me = await getCurrentEmployee();
  const isAdmin = me?.isAdmin ?? false;
  const moduleCount = 6 + (isAdmin ? 1 : 0); // primary nav modules in reach

  return (
    <header className="header-light">
      {/* ─────────────── HERO COMMAND CARD ─────────────── */}
      <div className="px-4 pt-4 max-md:px-3 max-md:pt-3">
        <div className="relative mx-auto max-w-[1760px]">
          {/* soft outer glow */}
          <div
            aria-hidden
            className="absolute -inset-1.5 rounded-[34px] opacity-50 blur-2xl"
            style={{ background: "linear-gradient(105deg, #0180cf 0%, #0a7d8a 50%, #63b81e 100%)" }}
          />

          {/* the card */}
          <div
            className="relative overflow-hidden rounded-[26px] ring-1 ring-white/10"
            style={{
              background: "linear-gradient(105deg, #08233f 0%, #0c3a47 46%, #1f6b3a 100%)",
              boxShadow: "0 34px 80px -34px rgba(3,30,55,0.8), inset 0 1px 0 rgba(255,255,255,0.14)",
            }}
          >
            {/* decorative backdrop */}
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute inset-0 opacity-[0.45]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.07) 1px, transparent 0)", backgroundSize: "26px 26px" }} />
              <div className="hero-anim absolute -left-24 -top-28 h-72 w-72 rounded-full" style={{ background: "radial-gradient(circle, rgba(1,128,207,0.5), transparent 68%)", filter: "blur(30px)", animation: "heroFloat1 18s ease-in-out infinite" }} />
              <div className="hero-anim absolute right-[-4rem] -bottom-32 h-80 w-80 rounded-full" style={{ background: "radial-gradient(circle, rgba(99,184,30,0.42), transparent 68%)", filter: "blur(34px)", animation: "heroFloat2 22s ease-in-out infinite" }} />
              <div className="hero-anim absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-transparent via-white/10 to-transparent" style={{ animation: "headerStreak 9s ease-in-out infinite" }} />
            </div>

            <div className="relative flex items-center justify-between gap-6 px-8 py-5 max-md:px-4 max-md:py-4 max-md:gap-3">
              {/* LEFT — logo glass tile */}
              <a
                href="/"
                aria-label="A A Tech home"
                className="group relative flex shrink-0 flex-col items-center justify-center rounded-2xl bg-white/[0.07] ring-1 ring-white/15 backdrop-blur transition-transform hover:scale-[1.04]"
                style={{ width: 86, height: 86, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18), 0 14px 32px -16px rgba(1,128,207,0.7)" }}
              >
                <span aria-hidden className="absolute -inset-2 rounded-3xl opacity-60 blur-lg" style={{ background: "radial-gradient(circle, rgba(99,184,30,0.35), transparent 70%)" }} />
                <img src="/logo-mark.png" alt="A A Tech" className="relative h-9 w-auto" style={{ display: "block", filter: "drop-shadow(0 3px 10px rgba(0,0,0,0.4))" }} />
                <span className="relative mt-1 text-[8px] font-black uppercase tracking-[0.22em] text-white/85">AA Tech</span>
              </a>

              {/* CENTER — wordmark + tagline + status pills */}
              <div className="flex min-w-0 flex-1 flex-col items-center text-center">
                <h1
                  className="truncate max-w-full"
                  style={{
                    fontFamily: "var(--font-display), system-ui, sans-serif",
                    fontWeight: 900,
                    fontSize: "clamp(20px, 2.5vw, 33px)",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.05,
                    background: "linear-gradient(95deg, #bfe3ff 0%, #ffffff 40%, #c5f0a3 100%)",
                    backgroundSize: "200% auto",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                    WebkitTextFillColor: "transparent",
                    animation: "headerTextShimmer 7s linear infinite",
                  }}
                >
                  Anant Avinya Technologies
                </h1>
                <div className="mt-1 flex items-center gap-3 max-md:hidden">
                  <span aria-hidden className="h-px w-10" style={{ background: "linear-gradient(90deg, transparent, #0180cf)" }} />
                  <span className="text-[11px] font-bold uppercase tracking-[0.32em] text-white/55">Smart Warehouse Management System</span>
                  <span aria-hidden className="h-px w-10" style={{ background: "linear-gradient(90deg, #63b81e, transparent)" }} />
                </div>
                <div className="mt-3.5 max-md:mt-2.5">
                  <HeaderStatusBar moduleCount={moduleCount} />
                </div>
              </div>

              {/* RIGHT — powered by Altus Corp */}
              <div className="flex shrink-0 flex-col items-center gap-1.5 max-lg:hidden" aria-label="Powered by Altus Corp">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/50">Powered by</span>
                <span className="inline-flex items-center rounded-xl bg-white px-3 py-2 shadow-lg">
                  <img src="/altus-corp-logo.png" alt="Altus Corp" className="h-9 w-auto" style={{ display: "block" }} />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────── FUNCTIONAL NAV BAR (sticky) ─────────────── */}
      <div
        className="sticky top-0 z-50 mt-3"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.82)",
          backdropFilter: "blur(20px) saturate(160%)",
          WebkitBackdropFilter: "blur(20px) saturate(160%)",
          borderTop: "1px solid var(--color-hairline)",
          borderBottom: "1px solid var(--color-hairline)",
        }}
      >
        <div className="relative w-full h-[62px] px-6 max-md:h-[58px] max-md:px-4 flex items-center gap-4 2xl:gap-6 max-md:gap-3">
          <MobileMenuServer isAdmin={isAdmin} />

          <div className="flex-1 min-w-0 overflow-x-auto nav-scroll max-md:hidden">
            <div className="flex w-max mx-auto">
              <MainNavServer />
            </div>
          </div>

          <div className="flex items-center gap-2.5 2xl:gap-3 shrink-0 max-xl:ml-auto max-md:gap-1.5">
            <GlobalSearch />
            <NewTaskTrigger />
            {isAdmin && (
              <span className="max-2xl:hidden">
                <AdminPill />
              </span>
            )}
            <UserMenuServer />
          </div>
        </div>
      </div>
    </header>
  );
}
