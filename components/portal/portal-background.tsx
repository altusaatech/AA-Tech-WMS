/**
 * Bold architectural backdrop for the portal — a brutalist stack of concrete
 * slabs in soft grey with one dominant AA-Tech blue→green colour band that
 * descends from the top and points down (echoing the logo mark). Crisp SVG,
 * covers the viewport, pastel + bold. Purely decorative.
 */
export function PortalBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#eef3f8]">
      <svg className="h-full w-full" viewBox="0 0 1440 1024" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="pb-sky" x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0" stopColor="#f6f9fc" />
            <stop offset="1" stopColor="#e6eef6" />
          </linearGradient>
          <linearGradient id="pb-band" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#5cb8ea" />
            <stop offset="0.5" stopColor="#4fb0e6" />
            <stop offset="1" stopColor="#8fd06a" />
          </linearGradient>
          <linearGradient id="pb-top" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f0f4f8" />
            <stop offset="1" stopColor="#dbe2ea" />
          </linearGradient>
          <linearGradient id="pb-face" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#dbe2ea" />
            <stop offset="1" stopColor="#bcc6d1" />
          </linearGradient>
          <linearGradient id="pb-side" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#aab5c2" />
            <stop offset="1" stopColor="#8b98a6" />
          </linearGradient>
          <linearGradient id="pb-glass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3b4c5e" />
            <stop offset="0.5" stopColor="#2b3744" />
            <stop offset="0.5" stopColor="#33414f" />
            <stop offset="1" stopColor="#232d38" />
          </linearGradient>
          <filter id="pb-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="10" stdDeviation="18" floodColor="#1e2a38" floodOpacity="0.22" />
          </filter>
        </defs>

        <rect width="1440" height="1024" fill="url(#pb-sky)" />

        {/* bold colour band — descends and points down (AA Tech chevron) */}
        <path d="M612 0 H838 V536 L725 648 Z" fill="url(#pb-band)" />
        {/* faint reflected glow of the band */}
        <path d="M612 0 H838 V536 L725 648 Z" fill="#ffffff" opacity="0.06" />

        {/* ── brutalist stacked slabs ── */}
        <g filter="url(#pb-shadow)">
          {/* slab 1 — top */}
          <polygon points="662,532 690,506 912,506 884,532" fill="url(#pb-top)" />
          <polygon points="884,532 912,506 912,604 884,630" fill="url(#pb-side)" />
          <rect x="662" y="532" width="222" height="98" fill="url(#pb-face)" />

          {/* slab 2 */}
          <polygon points="588,604 616,578 934,578 906,604" fill="url(#pb-top)" />
          <polygon points="906,604 934,578 934,690 906,716" fill="url(#pb-side)" />
          <rect x="588" y="604" width="318" height="112" fill="url(#pb-face)" />
          <rect x="612" y="628" width="270" height="64" fill="url(#pb-glass)" />
          <rect x="612" y="628" width="270" height="8" fill="#ffffff" opacity="0.14" />

          {/* slab 3 */}
          <polygon points="624,690 652,664 956,664 928,690" fill="url(#pb-top)" />
          <polygon points="928,690 956,664 956,780 928,806" fill="url(#pb-side)" />
          <rect x="624" y="690" width="304" height="116" fill="url(#pb-face)" />
          <rect x="648" y="716" width="256" height="66" fill="url(#pb-glass)" />
          <rect x="648" y="716" width="256" height="8" fill="#ffffff" opacity="0.14" />

          {/* slab 4 — base (widest) */}
          <polygon points="520,780 548,754 992,754 964,780" fill="url(#pb-top)" />
          <polygon points="964,780 992,754 992,872 964,898" fill="url(#pb-side)" />
          <rect x="520" y="780" width="444" height="118" fill="url(#pb-face)" />
        </g>

        {/* pillars (base voids) */}
        <rect x="520" y="860" width="444" height="38" fill="url(#pb-face)" />
        <rect x="576" y="862" width="70" height="36" fill="#212b35" opacity="0.9" />
        <rect x="702" y="862" width="70" height="36" fill="#212b35" opacity="0.9" />
        <rect x="828" y="862" width="70" height="36" fill="#212b35" opacity="0.9" />

        {/* ground */}
        <rect y="896" width="1440" height="128" fill="#cbd4dd" />
        <rect y="896" width="1440" height="4" fill="#b3bdc8" />
      </svg>

      {/* soft light wash so foreground content stays readable */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(70% 55% at 50% 42%, rgba(255,255,255,0.55), rgba(255,255,255,0) 70%)" }} />
    </div>
  );
}
