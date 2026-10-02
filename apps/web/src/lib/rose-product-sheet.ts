import type * as XLSX from "@e965/xlsx";
import type { ImportItem } from "@exporta/domain";
import type { SheetBudget } from "./final-cost-sheet";

/** Company's preparation sheet: original values remain separate from the customs FOB. */
export function readRoseProductSheet(workbook: XLSX.WorkBook) {
  const sheetName = workbook.SheetNames.find(name => String(workbook.Sheets[name].AB2?.v).trim().toUpperCase() === "PAUTA" && String(workbook.Sheets[name].AC2?.v).trim().toUpperCase() === "SOBRA");
  if (!sheetName) return null;
  const sheet = workbook.Sheets[sheetName];
  const value = (col: string, row: number) => Number(sheet[`${col}${row}`]?.v) || 0;
  const text = (col: string, row: number) => String(sheet[`${col}${row}`]?.v ?? "").trim();
  const items: Omit<ImportItem, "id">[] = [];
  for (let row = 3; row <= 137; row++) {
    const original = text("C", row), quantity = value("M", row);
    if (!original || quantity <= 0) continue;
    const gross = value("P", row), net = value("AA", row);
    const formulaRate = String(sheet[`AA${row}`]?.f ?? "").match(/\*\s*([\d.]+)\s*%/);
    items.push({ name: text("Y", row) || original, chineseName: original, englishName: text("D", row), sku: text("E", row), description: text("F", row), ncm: text("Z", row), quantity, unitPriceUsd: value("R", row), grossWeightKg: gross / quantity,
      netWeightKg: net, netWeightReductionRate: formulaRate ? Number(formulaRate[1]) : gross > 0 ? (1 - net / gross) * 100 : undefined,
      pautaUsdPerKg: value("AB", row), surplusUsdPerKg: value("AC", row), boxCount: value("O", row), boxWeightKg: value("L", row), unitsPerBox: value("N", row), lengthCm: value("H", row), widthCm: value("I", row), heightCm: value("J", row), totalVolumeM3: value("Q", row), iiRate: 0, ipiRate: 0 });
  }
  const budget: SheetBudget = { exchangeRate: 5.4, marginRate: 0, priceBasis: "fob", calculationModel: "worksheet", marginMethod: "markup", freightWeightKg: value("P", 144) || undefined,
    expenses: [{ id: "sheet-freight", label: "Frete internacional", category: "Logística", kind: "freight", amount: value("P", 143), currency: "USD", allocationMethod: "weight", status: "estimated" }] };
  return { items, budget, sheetName, warnings: ["Pauta e sobra foram importadas em USD/kg; o FOB é calculado pelo peso líquido.", "O frete em USD e o peso de referência foram trazidos de P143 e P144. Revise o câmbio da operação.", "Os subtotais foram excluídos: M141 e P141 incluem o subtotal da linha 138 e duplicam quantidade e peso bruto."] };
}
