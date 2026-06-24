import { MainNavServer } from "./main-nav-server";
import { MobileMenuServer } from "./mobile-menu-server";
import { HeaderClock } from "./header-clock";
import { UserMenuServer } from "@/components/header/user-menu-server";
import { NewTaskTrigger } from "@/components/header/new-task-trigger";
import { AdminPill } from "@/components/header/admin-pill";
import { GlobalSearch } from "@/components/header/global-search";
import { getCurrentEmployee } from "@/lib/auth/current";

/**
 * Command-center application header — two stacked bands inside one sticky shell:
 *
 *  1. HERO BAND (dark, animated): AA Tech logo in a glass pill + live system
 *     status/clock on the left, the gradient "AA Tech WMS" wordmark + tagline
 *     as the centerpiece, and the "Powered by Altus Corp" partner mark on the
 *     right. A rotating-free, transform-only animated backdrop (grid, drifting
 *     glow blobs, a light streak) gives it a premium control-tower feel.
 *  2. NAV ROW (light frosted): the primary pill nav + search + actions + avatar.
 *     The `.header-light` scope keeps the nav pills ink-on-light.
 *
 * `generatedAt` is accepted to keep the prop contract stable for callers but
 * no longer rendered.
 */
export async function DashboardHeader({
  generatedAt: _generatedAt,
}: { generatedAt: Date }) {
  const me = await getCurrentEmployee();
  const isAdmin = me?.isAdmin ?? false;

  return (
    <header className="sticky top-0 z-50 header-light">
      {/* ─────────────── HERO COMMAND BAND ─────────────── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(120deg, #04203a 0%, #061a30 50%, #06352b 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* animated backdrop */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.5]"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)", backgroundSize: "26px 26px" }}
          />
          <div className="hero-anim absolute -left-20 -top-24 h-64 w-64 rounded-full" style={{ background: "radial-gradient(circle, rgba(1,128,207,0.5), transparent 68%)", filter: "blur(26px)", animation: "heroFloat1 17s ease-in-out infinite" }} />
          <div className="hero-anim absolute right-16 -bottom-28 h-72 w-72 rounded-full" style={{ background: "radial-gradient(circle, rgba(99,184,30,0.4), transparent 68%)", filter: "blur(30px)", animation: "heroFloat2 21s ease-in-out infinite" }} />
          <div className="hero-anim absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-transparent via-white/10 to-transparent" style={{ animation: "headerStreak 8s ease-in-out infinite" }} />
        </div>

        <div className="relative mx-auto flex h-[60px] max-w-[1760px] items-center justify-between gap-4 px-6 max-md:h-[52px] max-md:px-4">
          {/* LEFT — logo glass pill + live status/clock */}
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="/"
              aria-label="A A Tech home"
              className="relative inline-flex items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur transition-transform hover:scale-105"
              style={{ padding: "6px 10px", boxShadow: "0 10px 26px -12px rgba(1,128,207,0.7)" }}
            >
              <span aria-hidden className="absolute -inset-2 rounded-3xl opacity-60 blur-lg" style={{ background: "radial-gradient(circle, rgba(1,128,207,0.4), transparent 70%)" }} />
              <img src="/logo-mark.png" alt="A A Tech" className="relative h-8 w-auto max-md:h-7" style={{ display: "block", filter: "drop-shadow(0 2px 8px rgba(1,128,207,0.55))" }} />
            </a>
            <span className="h-9 w-px bg-white/12 max-md:hidden" aria-hidden />
            <div className="max-md:hidden">
              <HeaderClock />
            </div>
          </div>

          {/* CENTER — the hero wordmark */}
          <a href="/" className="min-w-0 flex-1 text-center" aria-label="AA Tech WMS home">
            <h1
              className="truncate"
              style={{
                fontFamily: "var(--font-display), system-ui, sans-serif",
                fontWeight: 900,
                fontSize: "clamp(18px, 2.1vw, 27px)",
                letterSpacing: "-0.02em",
                lineHeight: 1.04,
                background: "linear-gradient(90deg, #7fd4ff, #ffffff 28%, #aef07f 56%, #7fd4ff 90%)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                WebkitTextFillColor: "transparent",
                animation: "headerTextShimmer 6s linear infinite",
              }}
            >
              AA Tech WMS
            </h1>
            <p className="mt-0.5 flex items-center justify-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.26em] text-white/45 max-md:hidden">
              <span className="inline-block h-px w-4 bg-white/25" aria-hidden />
              Intelligent Operations Platform
              <span className="inline-block h-px w-4 bg-white/25" aria-hidden />
            </p>
          </a>

          {/* RIGHT — powered by Altus Corp */}
          <div className="flex items-center gap-2.5 shrink-0 max-md:hidden" aria-label="Powered by Altus Corp">
            <span className="text-[8.5px] font-bold uppercase tracking-[0.18em] text-white/45 leading-tight text-right">
              Powered
              <br />
              by
            </span>
            <span className="inline-flex items-center rounded-xl bg-white px-2.5 py-1.5 shadow-lg">
              <img src="/altus-corp-logo.png" alt="Altus Corp" className="h-7 w-auto" style={{ display: "block" }} />
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────── FUNCTIONAL NAV ROW ─────────────── */}
      <div
        className="relative"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.82)",
          backdropFilter: "blur(20px) saturate(160%)",
          WebkitBackdropFilter: "blur(20px) saturate(160%)",
          borderBottom: "1px solid var(--color-hairline)",
        }}
      >
        <div className="relative w-full h-[64px] px-6 max-md:h-[60px] max-md:px-4 flex items-center gap-4 2xl:gap-6 max-md:gap-3">
          {/* Mobile hamburger menu (phones only). */}
          <MobileMenuServer isAdmin={isAdmin} />

          {/* CENTER: primary pill nav — scrolls horizontally when tight, collapses
              to the hamburger drawer on phones. */}
          <div className="flex-1 min-w-0 overflow-x-auto nav-scroll max-md:hidden">
            <div className="flex w-max mx-auto">
              <MainNavServer />
            </div>
          </div>

          {/* RIGHT: search + actions + avatar. */}
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
