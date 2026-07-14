/**
 * Seed the Hardware Kit master + Installation master from the AA Tech sheets.
 * Replaces previous hardware rows. Amount = Units/Door × Rate.
 *
 * Run: pnpm exec tsx --env-file=.env.local scripts/seed-hardware-kit.ts
 */
import { db } from "../lib/db";
import { masterHardware, masterInstallation } from "../db/schema";

type HW = { hardwareType: string; make: string; description: string; model: string; quantity: number; uom: string; sellingRate: number; kit: boolean };

const HARDWARE: HW[] = [
  { hardwareType: "Hinges", make: "Kich", description: "SS 304 3mm thick Ball bearing Hinges", model: "100x75", quantity: 3, uom: "Nos", sellingRate: 250, kit: true },
  { hardwareType: "Lock", make: "Dorset", description: "Sash Lock", model: "ML 110", quantity: 1, uom: "Nos", sellingRate: 1500, kit: true },
  { hardwareType: "Cylinder", make: "Dorset", description: "70mm Euro profile Cyliner", model: "70mm Euro", quantity: 1, uom: "Nos", sellingRate: 500, kit: true },
  { hardwareType: "Handle", make: "Kich", description: "SS304 D tubular Handle", model: "Dia 19 x 300", quantity: 2, uom: "Nos", sellingRate: 750, kit: true },
  { hardwareType: "Vision Panel", make: "Dorset", description: "Double Glazed toughend", model: "450x600x6mm thick", quantity: 1, uom: "Nos", sellingRate: 1500, kit: true },
  { hardwareType: "Door closer", make: "Dorma", description: "Hyd door closer Std. Arm", model: "TS 68", quantity: 1, uom: "Nos", sellingRate: 2500, kit: true },
  { hardwareType: "Drop seal", make: "Enviornseal", description: "Automatic drop seal Al", model: "Cat-I", quantity: 0.8, uom: "Nos", sellingRate: 1600, kit: false },
  { hardwareType: "Kick Plate", make: "Dorplus", description: "SS 304 1mm thick", model: '"width of door" x 250mm', quantity: 0.8, uom: "RMT", sellingRate: 1500, kit: false },
  { hardwareType: "Louvers", make: "Dorplus", description: "Z Shaped Angle", model: "300x600", quantity: 1, uom: "Set", sellingRate: 1150, kit: false },
  { hardwareType: "Intumescent Seal", make: "Falcon", description: "Intumescent Seals", model: "12mmx1.5mm", quantity: 5, uom: "RMT", sellingRate: 300, kit: false },
  { hardwareType: "Door Seal", make: "Falcon", description: "Silicon self adhesive gasket", model: "S88", quantity: 5, uom: "RMT", sellingRate: 400, kit: false },
];

const INSTALLATION = [
  { scope: "For Building upto 1 floor", rate: 2000 },
  { scope: "For Building upto 10 floors", rate: 2500 },
  { scope: "For Building upto 25 floors", rate: 3000 },
  { scope: "For Building above 25 floors", rate: 3400 },
];

async function main() {
  const hwRows = HARDWARE.map((h) => ({
    hardwareType: h.hardwareType, make: h.make, description: h.description, model: h.model,
    quantity: String(h.quantity), uom: h.uom, sellingRate: String(h.sellingRate),
    amount: String(h.quantity * h.sellingRate), kit: h.kit, updatedAt: new Date(),
  }));
  await db.delete(masterHardware);
  await db.insert(masterHardware).values(hwRows);

  const instRows = INSTALLATION.map((i) => ({ scope: i.scope, rate: String(i.rate), amount: String(i.rate), updatedAt: new Date() }));
  await db.delete(masterInstallation);
  await db.insert(masterInstallation).values(instRows);

  console.log(`Seeded ${hwRows.length} hardware items (${HARDWARE.filter((h) => h.kit).length} kit) and ${instRows.length} installation rates.`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
