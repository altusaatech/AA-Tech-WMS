import * as React from "react";

/** Standard dashboard panel chrome — matches the app's premium-card section
 *  float (rounded-section, hairline border, white surface, title + subtitle). */
export function SectionCard({
  title,
  subtitle,
  right,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`premium-card rounded-section border border-hairline bg-surface-card p-6 ${className ?? ""}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2
            className="text-[15px] font-black tracking-[-0.01em] text-ink-strong"
            style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}
          >
            {title}
          </h2>
          {subtitle && <p className="mt-0.5 text-[12px] font-medium text-ink-subtle">{subtitle}</p>}
        </div>
        {right}
      </div>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
