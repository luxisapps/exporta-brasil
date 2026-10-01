import type { ImportItem } from "@exporta/domain";

export type ProductSort = "original" | "name_asc" | "name_desc" | "quantity_desc" | "quantity_asc" | "fob_desc" | "fob_asc" | "taxes_desc" | "taxes_asc" | "unit_cost_desc" | "unit_cost_asc";
type CalculatedProduct = ImportItem & { itemFob: number; ii: number; ipi: number; pis?: number; cofins?: number; unitCost: number };
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function selectProducts<T extends CalculatedProduct>(items: T[], query: string, sort: ProductSort, locale = "pt-BR"): T[] {
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  const filtered = items.filter((item) => {
    const text = normalize([item.name, item.chineseName, item.englishName, item.sku, item.ncm, item.ncm.replace(/\D/g, "")].filter(Boolean).join(" "));
    return terms.every((term) => text.includes(term) || /^\d[\d.]+$/.test(term) && text.includes(term.replaceAll(".", "")));
  });
  if (sort === "original") return filtered;
  const collator = new Intl.Collator(locale, { numeric: true, sensitivity: "base" });
  const direction = sort.endsWith("_desc") ? -1 : 1;
  return filtered.sort((a, b) => {
    let difference: number;
    if (sort.startsWith("name_")) difference = collator.compare(a.name || a.chineseName || a.englishName || "", b.name || b.chineseName || b.englishName || "");
    else if (sort.startsWith("quantity_")) difference = a.quantity - b.quantity;
    else if (sort.startsWith("fob_")) difference = a.itemFob - b.itemFob;
    else if (sort.startsWith("taxes_")) difference = (a.ii + a.ipi + (a.pis ?? 0) + (a.cofins ?? 0)) - (b.ii + b.ipi + (b.pis ?? 0) + (b.cofins ?? 0));
    else difference = a.unitCost - b.unitCost;
    return direction * difference;
  });
}
