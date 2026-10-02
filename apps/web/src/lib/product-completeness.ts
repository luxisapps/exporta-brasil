import { netWeight, productFobUsd } from "@exporta/domain";
import type { ImportExpense, ImportItem } from "@exporta/domain";

export type ProductDataFilter = "all" | "incomplete" | "complete";
export type MissingProductField = "name" | "ncm" | "quantity" | "price" | "weight" | "volume" | "ii" | "ipi";
const positive = (value?: number) => typeof value === "number" && Number.isFinite(value) && value > 0;
const validRate = (value: number) => Number.isFinite(value) && value >= 0;

export function missingProductFields(item: ImportItem, expenses: ImportExpense[] = []): MissingProductField[] {
  const missing: MissingProductField[] = [];
  if (!item.name?.trim() || /\p{Script=Han}/u.test(item.name)) missing.push("name");
  if (!/^\d{4}\.?\d{2}\.?\d{2}$/.test(item.ncm?.trim() ?? "")) missing.push("ncm");
  if (!positive(item.quantity) || !Number.isInteger(item.quantity)) missing.push("quantity");
  if (!positive(item.pautaUsdPerKg === undefined ? item.unitPriceUsd : productFobUsd(item))) missing.push("price");
  if (!validRate(item.iiRate)) missing.push("ii");
  if (!validRate(item.ipiRate)) missing.push("ipi");
  const needsWeight = expenses.some((expense) => expense.amount > 0 && (expense.allocationMethod === "weight" || ["siscomex", "afrmm"].includes(expense.kind ?? "")));
  const needsVolume = expenses.some((expense) => expense.amount > 0 && expense.allocationMethod === "volume");
  const weight = netWeight(item);
  const volume = item.totalVolumeM3 ?? ((item.lengthCm || 0) * (item.widthCm || 0) * (item.heightCm || 0) * (item.boxCount || 0) / 1_000_000);
  if (needsWeight && !positive(weight)) missing.push("weight");
  if (needsVolume && !positive(volume)) missing.push("volume");
  return missing;
}

export function matchesProductDataFilter(item: ImportItem, filter: ProductDataFilter, expenses: ImportExpense[] = []) {
  return filter === "all" || (missingProductFields(item, expenses).length > 0) === (filter === "incomplete");
}
