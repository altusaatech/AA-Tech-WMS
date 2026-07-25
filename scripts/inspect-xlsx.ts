import * as XLSX from "xlsx";

const path = "C:/Users/sayye/Downloads/Anant Avinya Technologies System (1).xlsx";
const wb = XLSX.readFile(path, { cellDates: true });

console.log("=== SHEETS ===");
for (const name of wb.SheetNames) {
  const ws = wb.Sheets[name]!;
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "", blankrows: false });
  const rows = aoa.length;
  let headerIdx = 0, best = -1;
  for (let i = 0; i < Math.min(12, rows); i++) {
    const nonEmpty = (aoa[i] as unknown[]).filter((c) => String(c).trim() !== "").length;
    if (nonEmpty > best) { best = nonEmpty; headerIdx = i; }
  }
  console.log(`\n### "${name}"  — ${rows} rows`);
  console.log(`  header@row${headerIdx}: ${JSON.stringify((aoa[headerIdx] as unknown[]).slice(0, 26))}`);
  for (let i = 0; i < Math.min(headerIdx, 8); i++) {
    const r = (aoa[i] as unknown[]).filter((c) => String(c).trim() !== "");
    if (r.length) console.log(`  pre[${i}]: ${JSON.stringify((aoa[i] as unknown[]).slice(0, 14))}`);
  }
  for (let i = headerIdx + 1; i < Math.min(headerIdx + 3, rows); i++) {
    console.log(`  data[${i}]: ${JSON.stringify((aoa[i] as unknown[]).slice(0, 26))}`);
  }
}
