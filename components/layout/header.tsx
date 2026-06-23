import { MainNavServer } from "./main-nav-server";
import { MobileMenuServer } from "./mobile-menu-server";
import { UserMenuServer } from "@/components/header/user-menu-server";
import { NewTaskTrigger } from "@/components/header/new-task-trigger";
import { AdminPill } from "@/components/header/admin-pill";
import { GlobalSearch } from "@/components/header/global-search";
import { getCurrentEmployee } from "@/lib/auth/current";

/**
 * Light glassy application header — single row, ~72px tall.
 *
 * Cyan triangle mark + bold "A A Tech" wordmark on the left, primary
 * nav centered with airy spacing, right cluster carries live indicator +
 * actions + avatar. Frosted-glass white surface with a single hairline
 * bottom border — no decorative washes, no rainbow strip. The nav-pill
 * colors flip to ink-on-light via `.header-light` scope.
 *
 * `generatedAt` is accepted to keep the prop contract stable for callers
 * but no longer rendered.
 */
export async function DashboardHeader({
  generatedAt: _generatedAt,
}: { generatedAt: Date }) {
  const me = await getCurrentEmployee();
  const isAdmin = me?.isAdmin ?? false;

  return (
    <header className="sticky top-0 z-50 header-light">
      <div
        className="relative"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.82)",
          backdropFilter: "blur(20px) saturate(160%)",
          WebkitBackdropFilter: "blur(20px) saturate(160%)",
          borderBottom: "1px solid var(--color-hairline)",
        }}
      >
        <div className="relative w-full h-[96px] px-6 max-md:h-[72px] max-md:px-4 flex items-center gap-4 2xl:gap-6 max-md:gap-3">
          {/* Mobile hamburger menu (phones only). */}
          <MobileMenuServer isAdmin={isAdmin} />

          {/* LEFT: A A Tech compact mark — the square triangle logo, so it
              stays short and doesn't eat horizontal space in the header. */}
          <a href="/" className="flex items-center shrink-0" aria-label="A A Tech home">
            <img
              src="/logo-mark.png"
              alt="A A Tech"
              className="h-11 w-auto max-md:h-10"
              style={{ display: "block" }}
            />
          </a>

          {/* CENTER: primary pill nav — visible on every desktop width (and
              under zoom). It stays centred while it fits; when space gets tight
              it scrolls horizontally FROM THE LEFT (w-max + mx-auto) so pills
              are never clipped, never overlap, and never disappear. Collapses
              to the hamburger drawer only on real phones (max-md). */}
          <div className="flex-1 min-w-0 overflow-x-auto nav-scroll max-md:hidden">
            <div className="flex w-max mx-auto">
              <MainNavServer />
            </div>
          </div>

          {/* RIGHT: search + live indicator + actions + avatar. Every item is
              shrink-0; secondary chrome (Live / Admin pill) hides below 2xl and
              the search collapses to an icon there too, so the nav always has
              room and nothing ever overlaps. */}
          <div className="flex items-center gap-2.5 2xl:gap-3 shrink-0 max-xl:ml-auto max-md:gap-1.5">
            <GlobalSearch />
            <NewTaskTrigger />
            {isAdmin && (
              <span className="max-2xl:hidden">
                <AdminPill />
              </span>
            )}
            <UserMenuServer />
            {/* Altus Corp — "Powered by" partner mark at the top-right corner */}
            <span
              className="flex items-center gap-2.5 pl-0.5 max-lg:hidden"
              aria-label="Powered by Altus Corp"
            >
              <span className="h-10 w-px bg-hairline-strong" aria-hidden />
              <span className="flex flex-col items-center leading-none">
                <span className="mb-1 text-[8.5px] font-bold uppercase tracking-[0.18em] text-ink-subtle">
                  Powered by
                </span>
                <img
                  src="/altus-corp-logo.png"
                  alt="Altus Corp"
                  className="h-10 w-auto"
                  style={{ display: "block" }}
                />
              </span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
