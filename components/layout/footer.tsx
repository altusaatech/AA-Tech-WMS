export function DashboardFooter() {
  return (
    <footer
      className="mt-32"
      style={{
        background:
          "linear-gradient(180deg, var(--color-ink-strong) 0%, #020617 100%)",
        color: "#ffffff",
      }}
    >
      <div className="mx-auto max-w-[1600px] px-12 py-8 max-md:px-4 flex items-center justify-between gap-6 flex-wrap">
        {/* LEFT — A A Tech */}
        <div
          className="inline-flex items-center rounded-lg bg-white px-3 py-2"
          style={{ boxShadow: "0 4px 14px rgba(0, 0, 0, 0.25)" }}
        >
          <img
            src="/logo.png"
            alt="A A Tech"
            style={{ height: 34, width: "auto", display: "block" }}
          />
        </div>

        {/* CENTER — copyright */}
        <p
          className="text-xs order-last w-full text-center md:order-none md:w-auto"
          style={{ color: "rgba(255, 255, 255, 0.55)" }}
        >
          © A A Tech 2025–2035 · All rights reserved
        </p>

        {/* RIGHT — Altus Corp */}
        <div
          className="inline-flex items-center rounded-lg bg-white px-3 py-2"
          style={{ boxShadow: "0 4px 14px rgba(0, 0, 0, 0.25)" }}
        >
          <img
            src="/altus-corp-logo.png"
            alt="Altus Corp"
            style={{ height: 42, width: "auto", display: "block" }}
          />
        </div>
      </div>
    </footer>
  );
}
