import * as XLSX from "@e965/xlsx";
import type { ImportItem } from "@exporta/domain";

export type ImportedProduct = Omit<ImportItem, "id">;
export type ProductSheetResult = { items: ImportedProduct[]; warnings: string[]; sheetName: string };

type Field = keyof ImportedProduct;
const headerAliases: Partial<Record<Field, string[]>> = {
  name: ["produto", "descricao", "descricao comercial", "nome", "item", "产品名称", "品名", "中文品名", "product name"],
  englishName: ["英文品名", "english product name", "english name", "nome em ingles"],
  sku: ["sku", "产品sku", "product sku"],
  description: ["详细描述", "descricao detalhada", "description"],
  ncm: ["ncm", "codigo ncm", "海关hs编码", "hs code", "customs hs code"],
  lengthCm: ["长 cm", "comprimento cm", "length cm"], widthCm: ["宽 cm", "largura cm", "width cm"], heightCm: ["高 cm", "altura cm", "height cm"],
  quantity: ["quantidade", "qtd", "qty", "ttl qty", "total qty", "total quantidade", "总数量", "total quantity"],
  unitsPerBox: ["每箱个数", "unidades por caixa", "units per box"], boxCount: ["总箱数", "total caixas", "total boxes"],
  unitPriceUsd: ["valor unitario usd", "preco unitario usd", "preco unitario us", "unit price usd", "valor unit usd", "preco usd", "cfr unitario", "cfr unit", "单品货值 usd", "unit value usd"],
  grossWeightKg: ["peso bruto unitario kg", "peso bruto kg", "peso unitario kg", "peso kg", "g w", "g w kg", "peso", "总重量 kg", "total weight kg"],
  boxWeightKg: ["单箱重量 kg", "peso por caixa kg", "weight per box kg"], totalVolumeM3: ["总体积 m3", "total volume", "total volume m3"],
  iiRate: ["ii", "aliquota ii", "ii percent", "ii %"], ipiRate: ["ipi", "aliquota ipi", "ipi percent", "ipi %"], leadTime: ["货期", "prazo", "lead time"]
};

const normalizeHeader = (value: unknown) => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const toNumber = (value: unknown) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const text = String(value ?? "").trim().replace(/\s/g, "");
  if (!text) return 0;
  const normalized = text.includes(",") ? text.replace(/\./g, "").replace(",", ".") : text.replace(/[^0-9.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};
const aliases = (field: Field) => headerAliases[field]?.map(normalizeHeader) ?? [];
const findHeader = (rows: unknown[][]) => rows.findIndex((row) => row.some((cell) => aliases("name").includes(normalizeHeader(cell))));

export async function parseProductSheet(file: File): Promise<ProductSheetResult> {
  if (file.size > 5 * 1024 * 1024) throw new Error("A planilha deve ter no máximo 5 MB.");
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
  const candidates = workbook.SheetNames.map((sheetName) => ({ sheetName, rows: XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], { header: 1, defval: "", raw: false }) })).map((candidate) => ({ ...candidate, headerRowIndex: findHeader(candidate.rows) })).filter((candidate) => candidate.headerRowIndex >= 0);
  const selected = candidates.sort((left, right) => right.rows.length - left.rows.length)[0];
  if (!selected) throw new Error("Não encontramos uma aba com a coluna Produto, Nome ou Descrição.");
  const headers = selected.rows[selected.headerRowIndex].map(normalizeHeader);
  const column = (field: Field) => aliases(field).map((alias) => headers.indexOf(alias)).find((index) => index >= 0) ?? -1;
  const nameColumn = column("name"); const quantityColumn = column("quantity");
  if (nameColumn < 0 || quantityColumn < 0) throw new Error("A planilha precisa ter as colunas Produto (ou Nome) e Quantidade.");
  const warnings: string[] = [];
  const items = selected.rows.slice(selected.headerRowIndex + 1).flatMap((row, index) => {
    const name = String(row[nameColumn] ?? "").trim();
    if (!name) return [];
    const quantity = toNumber(row[quantityColumn]);
    if (quantity <= 0) { warnings.push(`Linha ${selected.headerRowIndex + index + 2}: quantidade inválida para ${name}.`); return []; }
    const value = (field: Field) => { const position = column(field); return position < 0 ? 0 : toNumber(row[position]); };
    const text = (field: Field) => { const position = column(field); return position < 0 ? "" : String(row[position] ?? "").trim(); };
    const boxWeightKg = value("boxWeightKg"); const boxCount = value("boxCount");
    return [{ name, englishName:text("englishName") || undefined, sku:text("sku") || undefined, description:text("description") || undefined, leadTime:text("leadTime") || undefined, quantity, ncm:text("ncm"), unitPriceUsd:value("unitPriceUsd"), grossWeightKg: boxWeightKg && boxCount ? boxWeightKg * boxCount / quantity : value("grossWeightKg"), boxWeightKg:boxWeightKg || undefined, boxCount:boxCount || undefined, unitsPerBox:value("unitsPerBox") || undefined, lengthCm:value("lengthCm") || undefined, widthCm:value("widthCm") || undefined, heightCm:value("heightCm") || undefined, totalVolumeM3:value("totalVolumeM3") || undefined, iiRate:value("iiRate"), ipiRate:value("ipiRate") }];
  });
  if (!items.length) throw new Error("Nenhum produto válido foi encontrado na planilha.");
  if (candidates.length > 1) warnings.push(`Aba “${selected.sheetName}” selecionada automaticamente por conter a maior lista de produtos.`);
  return { items, warnings, sheetName: selected.sheetName };
}