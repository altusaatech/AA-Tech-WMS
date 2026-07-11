// Compact ₹ formatting for dashboard headline numbers (Indian crore/lakh
// scale). Pure functions — safe to import from both server and client
// components. For full-precision grouping use formatInr from lib/format.

export function inrCompact(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(2)} L`;
  if (abs >= 1e3) return `${sign}₹${(abs / 1e3).toFixed(1)}K`;
  return `${sign}₹${Math.round(abs)}`;
}

/** Percent delta between value and previous, rounded; null when no baseline. */
export function pctDelta(value: number, previous: number): number | null {
  if (!previous) return null;
  return Math.round(((value - previous) / Math.abs(previous)) * 100);
}
