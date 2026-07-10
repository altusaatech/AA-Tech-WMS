import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/current";
import { db } from "@/lib/db";
import { quotations, masterProduct, masterHardware, masterDoor } from "@/db/schema";
import { QuotationBuilder } from "@/components/quotation/quotation-builder";
import { DEFAULT_NOTES, DEFAULT_SUBJECT, DEFAULT_PI_META, type DoorLine, type PiMeta } from "@/lib/quotation/types";

export const dynamic = "force-dynamic";

export default async function QuotationBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;

  const [q] = await db.select().from(quotations).where(eq(quotations.id, id));
  if (!q) notFound();

  const [products, hardware, doors] = await Promise.all([
    db.select().from(masterProduct),
    db.select().from(masterHardware),
    db.select().from(masterDoor),
  ]);

  const productOptions = products
    .filter((p) => p.typeOfFinishedGood)
    .map((p) => ({
      type: p.typeOfFinishedGood as string,
      ratePerSqm: Number(p.sellingPrice) || 0,
      insulation: p.insulation ?? "",
      uom: p.uom ?? "",
    }));

  // Door master — one entry per code. Typing/selecting a code in the builder
  // auto-fills the code→spec parameters (type, config, frame, shutter,
  // insulation, rates). The yellow fields (orientation, finish, shade, size…)
  // are picked per door from dropdowns, not stored in the master.
  const num = (v: unknown) => Number(v) || 0;
  const doorOptions = doors
    .filter((d) => (d.doorCode ?? "").trim())
    .map((d) => ({
      code: (d.doorCode as string).trim(),
      doorType: d.doorType ?? "",
      doorConfig: d.doorConfig ?? "",
      frameProfile: d.frameProfile ?? "",
      frameMaterial: d.frameMaterial ?? "",
      shutterType: d.shutterType ?? "",
      shutterMaterial: d.shutterMaterial ?? "",
      insulation: d.insulation ?? "",
      ratePerSqm: num(d.ratePerSqm),
      installPerSqm: num(d.installPerSqm),
    }))
    .sort((a, b) => a.code.localeCompare(b.code));

  // Working-spec hardware picker — every item from the hardware master,
  // labelled with make/model so variants (e.g. the two Hinges) stay distinct,
  // each carrying its selling rate so picking a name auto-fills the rate.
  const hwLabel = (h: (typeof hardware)[number]) => {
    const base = (h.hardwareType || h.description || "").trim();
    const extra = [h.make, h.model].map((x) => (x ?? "").trim()).filter(Boolean).join(" ");
    return extra ? `${base} (${extra})` : base;
  };
  const hardwareOptions = Array.from(
    new Map(
      hardware
        .map((h) => ({ name: hwLabel(h), rate: Number(h.sellingRate) || 0 }))
        .filter((o) => o.name)
        .map((o) => [o.name, o] as const),
    ).values(),
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <QuotationBuilder
      id={id}
      initial={{
        offerNo: q.offerNo ?? "",
        quoteDate: q.quoteDate ?? "",
        project: q.project ?? "",
        customer: q.customer ?? "",
        subject: q.subject ?? DEFAULT_SUBJECT,
        lines: (q.lines ?? []) as DoorLine[],
        notes: q.notes && q.notes.length ? q.notes : DEFAULT_NOTES,
      }}
      initialPiMeta={{ ...DEFAULT_PI_META, ...((q.piMeta ?? {}) as Partial<PiMeta>) }}
      productOptions={productOptions}
      hardwareOptions={hardwareOptions}
      doorOptions={doorOptions}
    />
  );
}
