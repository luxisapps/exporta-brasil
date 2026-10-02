import { taxRateLabels, fixedTaxRateCodes, type TaxRate, type TaxRateCode } from "@exporta/domain";

export function canWriteSetting(role: "admin" | "operator", key: string) {
  return role === "admin" || ["tax-rates", "product-defaults", "port-cities"].includes(key);
}

export function manualTaxRates(value: unknown, updatedAt = new Date().toISOString()): TaxRate[] | null {
  const codes = Object.keys(taxRateLabels);
  if (!Array.isArray(value) || value.length !== codes.length && value.length !== fixedTaxRateCodes.length) return null;
  const seen = new Set<string>();
  const rates: TaxRate[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || !codes.includes(item.code) || seen.has(item.code) || typeof item.rate !== "number" || !Number.isFinite(item.rate) || item.rate < 0) return null;
    seen.add(item.code);
    rates.push({ code: item.code as TaxRateCode, rate: item.rate, source: "manual", updatedAt });
  }
  return fixedTaxRateCodes.every(code => seen.has(code)) ? rates.filter(rate => fixedTaxRateCodes.includes(rate.code)) : null;
}

export function manualProductDefaults(value: unknown) {
  if (!value || typeof value !== "object" || !("netWeightReductionRate" in value)) return null;
  const rate = value.netWeightReductionRate;
  return typeof rate === "number" && Number.isFinite(rate) && rate >= 0 && rate <= 100 ? { netWeightReductionRate: rate } : null;
}
