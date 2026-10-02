import type { ImportItem } from "./index.js";

export const defaultNetWeightReductionRate = 6;
export function productQuantity(item: Pick<ImportItem,"quantity"|"boxCount"|"unitsPerBox">) { return item.boxCount && item.boxCount > 0 && item.unitsPerBox && item.unitsPerBox > 0 ? item.boxCount*item.unitsPerBox : item.quantity; }
export function grossWeight(item: Pick<ImportItem, "boxWeightKg" | "boxCount" | "grossWeightKg" | "quantity">) {
  return item.boxWeightKg !== undefined && item.boxCount !== undefined ? item.boxWeightKg * item.boxCount : item.grossWeightKg * item.quantity;
}
export function netWeight(item: ImportItem) {
  return item.netWeightReductionRate !== undefined ? grossWeight(item) * (1 - item.netWeightReductionRate / 100) : item.netWeightKg;
}
export function productFobUsd(item: ImportItem) {
  return item.pautaUsdPerKg !== undefined ? (item.pautaUsdPerKg + (item.surplusUsdPerKg ?? 0)) * (netWeight(item) ?? 0) : item.quantity * item.unitPriceUsd;
}
/** Snapshot the default on new products; later setting changes never rewrite old costs. */
export function applyProductDefaults<T extends ImportItem | Omit<ImportItem, "id">>(item: T, rate = defaultNetWeightReductionRate): T {
  return item.netWeightKg === undefined && item.netWeightReductionRate === undefined ? { ...item, netWeightReductionRate: rate } : item;
}
