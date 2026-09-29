import * as XLSX from "@e965/xlsx";
import type { ImportItem } from "@exporta/domain";

export type ImportedProduct = Omit<ImportItem, "id">;
export type ProductSheetResult = { items: ImportedProduct[]; warnings: string[]; sheetName: string };

const headerAliases: Record<keyof ImportedProduct, string[]> = {
  name: ["produto", "nome", "descricao", "descricao comercial", "item"],
  ncm: ["ncm", "codigo ncm"],
  quantity: ["quantidade", "qtd", "qty"],
  unitPriceUsd: ["valor unitario usd", "preco unitario usd", "preco unitario us", "unit price usd", "valor unit usd", "preco usd"],
  grossWeightKg: ["peso bruto unitario kg", "peso bruto kg", "peso unitario kg", "peso kg", "peso"],
  iiRate: ["ii", "aliquota ii", "ii percent", "ii %"],
  ipiRate: ["ipi", "aliquota ipi", "ipi percent", "ipi %"]
};

const normalizeHeader = (value: unknown) => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const toNumber = (value: unknown) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const text = String(value ?? "").trim().replace(/\s/g, "");
  if (!text) return 0;
  const normalized = text.includes(",") ? text.replace(/\./g, "").replace(",", ".") : text.replace(/[^0-9.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export async function parseProductSheet(file: File): Promise<ProductSheetResult> {
  if (file.size > 5 * 1024 * 1024) throw new Error("A planilha deve ter no máximo 5 MB.");
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("A planilha não possui uma aba para importar.");
  const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], { header: 1, defval: "", raw: false });
  const headerRowIndex = rows.findIndex((row) => row.some((cell) => headerAliases.name.includes(normalizeHeader(cell))));
  if (headerRowIndex < 0) throw new Error("Não encontramos a coluna Produto, Nome ou Descrição na planilha.");
  const headers = rows[headerRowIndex].map(normalizeHeader);
  const column = (field: keyof ImportedProduct) => headers.findIndex((header) => headerAliases[field].includes(header));
  const nameColumn = column("name");
  const quantityColumn = column("quantity");
  if (nameColumn < 0 || quantityColumn < 0) throw new Error("A planilha precisa ter as colunas Produto (ou Nome) e Quantidade.");
  const warnings: string[] = [];
  const items = rows.slice(headerRowIndex + 1).flatMap((row, index) => {
    const name = String(row[nameColumn] ?? "").trim();
    if (!name) return [];
    const quantity = toNumber(row[quantityColumn]);
    if (quantity <= 0) { warnings.push(`Linha ${headerRowIndex + index + 2}: quantidade inválida para ${name}.`); return []; }
    const value = (field: keyof ImportedProduct) => { const index = column(field); return index < 0 ? 0 : toNumber(row[index]); };
    const text = (field: keyof ImportedProduct) => { const index = column(field); return index < 0 ? "" : String(row[index] ?? "").trim(); };
    return [{ name, quantity, ncm: text("ncm"), unitPriceUsd: value("unitPriceUsd"), grossWeightKg: value("grossWeightKg"), iiRate: value("iiRate"), ipiRate: value("ipiRate") }];
  });
  if (!items.length) throw new Error("Nenhum produto válido foi encontrado na planilha.");
  return { items, warnings, sheetName };
}
