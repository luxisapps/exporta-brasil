import * as XLSX from "@e965/xlsx";
import type { ImportBudget, ImportItem, TaxRateCode } from "@exporta/domain";

export type SheetBudget = Pick<ImportBudget, "exchangeRate" | "marginRate" | "calculationModel" | "priceBasis" | "marginMethod" | "expenses" | "freightWeightKg">;
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
export function readFinalCostSheet(workbook: XLSX.WorkBook) {
  const sheetName = workbook.SheetNames.find((name) => normalize(name).includes("por item"));
  const closingName = workbook.SheetNames.find((name) => normalize(name).includes("fechamento"));
  if (!sheetName || !closingName) return null;
  const sheet = workbook.Sheets[sheetName], closing = workbook.Sheets[closingName];
  const number = (cell: XLSX.CellObject | undefined) => { const value = Number(cell?.v); return Number.isFinite(value) ? value : 0; };
  if (!normalize(String(sheet.A8?.v ?? "")).includes("produto") || !normalize(String(sheet.C8?.v ?? "")).includes("quantidade")) return null;
  const rates: [TaxRateCode, string][] = [["ii", "F"], ["ipi", "H"], ["pis_import", "J"], ["cofins_import", "L"], ["pis_sale", "U"], ["cofins_sale", "W"], ["ipi_sale", "Y"], ["icms_sale", "AA"], ["csll", "AC"], ["irpj", "AE"], ["irpj_additional", "AG"]];
  const items: Omit<ImportItem, "id">[] = [];
  const end = XLSX.utils.decode_range(sheet["!ref"] ?? "A1:AH54").e.r + 1;
  for (let row = 9; row <= end; row++) {
    const original = String(sheet[`A${row}`]?.v ?? "").trim(), quantity = number(sheet[`C${row}`]);
    if (!original || quantity <= 0 || /^(total|soma)/i.test(original)) continue;
    const ncm = original.match(/(\d{8})\s*$/)?.[1] ?? "";
    items.push({ name: original.replace(/\s*[-–]\s*\d{8}\s*$/, "").trim(), ncm, quantity, unitPriceUsd: number(sheet[`D${row}`]) / quantity, sourcePriceBasis: "cif", netWeightKg: number(sheet[`B${row}`]), grossWeightKg: 0, iiRate: number(sheet[`F${row}`]) * 100, ipiRate: number(sheet[`H${row}`]) * 100,
      taxRates: rates.map(([code, column]) => ({ code, rate: Math.round(number(sheet[`${column}${row}`]) * 100000000) / 1000000, source: "manual" as const, overridden: true })) });
  }
  if (!items.length) return null;
  const expenses: ImportBudget["expenses"] = [
    { id: "sheet-siscomex", label: "Taxa Siscomex", category: "Tributos", kind: "siscomex", amount: number(closing.B17), currency: "BRL", allocationMethod: "weight", status: "estimated" },
    { id: "sheet-afrmm", label: "AFRMM", category: "Tributos", kind: "afrmm", amount: number(closing.B30), currency: "BRL", allocationMethod: "weight", status: "estimated" },
    { id: "sheet-other", label: "Despesas de desembaraço e operação", category: "Logística", kind: "other", amount: number(closing.B45) + number(closing.B28), currency: "BRL", allocationMethod: "weight", status: "estimated" }
  ];
  const budget: SheetBudget = { exchangeRate: number(closing.B4), marginRate: number(sheet.R8) * 100, calculationModel: "worksheet", priceBasis: "cif", marginMethod: "markup", expenses };
  return { items, budget, sheetName, warnings: ["Os valores USD da aba são totais por produto e foram convertidos para preços unitários.", "Os valores dos produtos incluem frete (CIF). Revise as premissas antes de aplicar.", "Na planilha de referência, B45 já inclui AFRMM e a aba por item o soma novamente. O rateio foi preservado para comparação; revise essa duplicação antes da aprovação.", "As alíquotas e fórmulas foram trazidas da planilha da empresa; revise o adicional de IRPJ com o contador."] };
}
