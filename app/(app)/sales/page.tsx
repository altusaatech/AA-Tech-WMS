import { asc } from "drizzle-orm";
import { requireUser } from "@/lib/auth/current";
import { db } from "@/lib/db";
import { salesKyc, salesQuotes, salesBom, salesSo, salesGa, salesWo, salesPi, quotations } from "@/db/schema";
import { KYC_KEYS, QUOTE_KEYS, BOM_KEYS, SO_KEYS, GA_KEYS, WO_KEYS, PI_KEYS } from "@/lib/sales/columns";
import { SalesWorkspace } from "@/components/sales/sales-workspace";
import type { SalesRow } from "./actions";

export const dynamic = "force-dynamic";

function pick(row: Record<string, unknown>, keys: string[]): SalesRow {
  const out: SalesRow = { id: String(row.id) };
  for (const k of keys) out[k] = (row[k] ?? null) as string | number | boolean | null;
  return out;
}

export default async function SalesPage() {
  await requireUser();
  const [kycs, quotes, boms, sos, gas, wos, pis, quos] = await Promise.all([
    db.select().from(salesKyc).orderBy(asc(salesKyc.createdAt)),
    db.select().from(salesQuotes).orderBy(asc(salesQuotes.createdAt)),
    db.select().from(salesBom).orderBy(asc(salesBom.createdAt)),
    db.select().from(salesSo).orderBy(asc(salesSo.createdAt)),
    db.select().from(salesGa).orderBy(asc(salesGa.createdAt)),
    db.select().from(salesWo).orderBy(asc(salesWo.createdAt)),
    db.select().from(salesPi).orderBy(asc(salesPi.createdAt)),
    db
      .select({ id: quotations.id, enquiryNo: quotations.enquiryNo })
      .from(quotations)
      .orderBy(asc(quotations.createdAt)),
  ]);

  // Enquiry No → quotation id, so the Quote Status register can link an enquiry
  // number straight to that quotation's PI. Keyed by the trimmed, lower-cased
  // enquiry number; the most recent quotation wins on collisions.
  const enquiryPiMap: Record<string, string> = {};
  for (const q of quos) {
    const key = (q.enquiryNo ?? "").trim().toLowerCase();
    if (key) enquiryPiMap[key] = q.id;
  }

  return (
    <SalesWorkspace
      enquiryPiMap={enquiryPiMap}
      kycRows={kycs.map((r) => pick(r as Record<string, unknown>, KYC_KEYS))}
      quoteRows={quotes.map((r) => pick(r as Record<string, unknown>, QUOTE_KEYS))}
      bomRows={boms.map((r) => pick(r as Record<string, unknown>, BOM_KEYS))}
      soRows={sos.map((r) => pick(r as Record<string, unknown>, SO_KEYS))}
      gaRows={gas.map((r) => pick(r as Record<string, unknown>, GA_KEYS))}
      woRows={wos.map((r) => pick(r as Record<string, unknown>, WO_KEYS))}
      piRows={pis.map((r) => pick(r as Record<string, unknown>, PI_KEYS))}
    />
  );
}
