import type { ImportBudget, ImportExpense, ImportItem, ImportOperation, TaxRateCode } from "./index.js";

export type ItemPricing = {
  inputUsd: number; inputBrl: number; netWeightKg: number | null; cifBrl: number;
  freight: number; insurance: number; siscomex: number; afrmm: number; otherExpenses: number;
  markup: number; saleTotal: number | null; saleUnit: number | null;
  pisDebit: number; pisCredit: number; pisNet: number; cofinsDebit: number; cofinsCredit: number; cofinsNet: number;
  ipiDebit: number; ipiCredit: number; ipiNet: number; icmsSale: number; csll: number; irpj: number; irpjAdditional: number;
  outputTaxes: number; costWithOutputTaxes: number;
};
export type PricingTotals = Pick<ItemPricing, "markup" | "saleTotal" | "pisDebit" | "pisCredit" | "pisNet" | "cofinsDebit" | "cofinsCredit" | "cofinsNet" | "ipiDebit" | "ipiCredit" | "ipiNet" | "icmsSale" | "csll" | "irpj" | "irpjAdditional" | "outputTaxes" | "costWithOutputTaxes" | "siscomex" | "afrmm" | "otherExpenses"> & { cifBrl: number; netWeightKg: number };
const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
export function effectiveTaxRate(item: ImportItem, budget: ImportBudget | undefined, code: TaxRateCode) {
  const override = item.taxRates?.find((entry) => entry.code === code)?.rate;
  const legacy = code === "ii" ? item.iiRate : code === "ipi" ? item.ipiRate : 0;
  return override ?? (legacy > 0 ? legacy : budget?.taxRates.find((entry) => entry.code === code)?.rate ?? legacy);
}
export function calculateWorksheetImport(operation: Pick<ImportOperation, "items" | "exchangeRate" | "freightBrl" | "insuranceBrl" | "portExpensesBrl" | "budgets">, budget: ImportBudget) {
  const exchangeRate = budget.exchangeRate, cifInput = budget.priceBasis === "cif";
  const inputTotal = operation.items.reduce((sum, item) => sum + item.quantity * item.unitPriceUsd * exchangeRate, 0);
  const totalNetWeight = operation.items.reduce((sum, item) => sum + Math.max(0, item.netWeightKg ?? 0), 0);
  const totalWeight = operation.items.reduce((sum, item) => sum + (item.boxWeightKg && item.boxCount ? item.boxWeightKg * item.boxCount : item.grossWeightKg * item.quantity), 0);
  const volume = (item: ImportItem) => item.totalVolumeM3 ?? ((item.lengthCm || 0) * (item.widthCm || 0) * (item.heightCm || 0) * (item.boxCount || 0) / 1e6);
  const totalVolume = operation.items.reduce((sum, item) => sum + volume(item), 0);
  const totalQuantity = operation.items.reduce((sum, item) => sum + item.quantity, 0);
  const value = (expense: ImportExpense) => expense.currency === "USD" ? expense.amount * (expense.exchangeRate || exchangeRate) : expense.amount;
  const isInternational = (expense: ImportExpense) => expense.kind === "freight" || expense.kind === "insurance";
  const expenses = budget.expenses.filter((expense) => !(cifInput && isInternational(expense)));
  const baseExpenses = expenses.reduce((sum, expense) => sum + value(expense), 0);
  const warnings: string[] = [];
  if (!Number.isFinite(exchangeRate) || exchangeRate <= 0) warnings.push("Informe um câmbio positivo para concluir o cálculo.");
  if (!operation.items.length) warnings.push("Adicione produtos antes de aprovar os custos.");
  if (operation.items.some(item => item.quantity <= 0 || !Number.isFinite(item.quantity) || item.unitPriceUsd <= 0 || !Number.isFinite(item.unitPriceUsd))) warnings.push("Preencha quantidade e preço positivos em todos os produtos.");
  if (operation.items.some(item => item.sourcePriceBasis === "cif") && !cifInput) warnings.push("A planilha contém valores CIF. Selecione a base CIF antes de concluir o orçamento.");
  const eligibleWeight = expenses.some((expense) => expense.amount > 0 && (expense.allocationMethod === "weight" || expense.kind === "siscomex" || expense.kind === "afrmm"));
  if (eligibleWeight && operation.items.some((item) => !(item.netWeightKg && item.netWeightKg > 0))) warnings.push("Preencha o peso líquido total de todos os produtos para completar o rateio por peso.");
  if (expenses.some((expense) => expense.amount > 0 && expense.allocationMethod === "volume") && operation.items.some(item => !(volume(item) > 0))) warnings.push("Preencha o volume dos produtos para completar o rateio por volume.");
  if (!operation.items.length && baseExpenses) warnings.push("Adicione produtos para distribuir as despesas.");
  const hasIncludedInternational = cifInput && budget.expenses.some((expense) => value(expense) !== 0 && isInternational(expense));
  if (hasIncludedInternational) warnings.push("Frete e seguro classificados como internacionais já estão no CIF e foram excluídos das despesas somadas.");
  const allocation = (expense: ImportExpense, item: ImportItem) => {
    const method = expense.kind === "siscomex" || expense.kind === "afrmm" ? "weight" : expense.allocationMethod;
    const denominator = method === "weight" ? totalNetWeight : method === "volume" ? totalVolume : method === "quantity" ? totalQuantity : method === "fixed" ? operation.items.length : inputTotal;
    const numerator = method === "weight" ? Math.max(0, item.netWeightKg ?? 0) : method === "volume" ? volume(item) : method === "quantity" ? item.quantity : method === "fixed" ? 1 : item.quantity * item.unitPriceUsd * exchangeRate;
    return denominator > 0 ? value(expense) * numerator / denominator : 0;
  };
  const raw = operation.items.map((item) => {
    const inputUsd = item.quantity * item.unitPriceUsd, itemBase = inputUsd * exchangeRate;
    const part = (kind: NonNullable<ImportExpense["kind"]>) => expenses.filter((expense) => (expense.kind ?? "other") === kind).reduce((sum, expense) => sum + allocation(expense, item), 0);
    const freight = part("freight"), insurance = part("insurance"), siscomex = part("siscomex"), afrmm = part("afrmm"), otherExpenses = part("other");
    const allocatedExpenses = freight + insurance + siscomex + afrmm + otherExpenses;
    const cifBrl = cifInput ? itemBase : itemBase + freight + insurance;
    const tax = (code: TaxRateCode) => effectiveTaxRate(item, budget, code) / 100;
    const ii = cifBrl * tax("ii"), ipi = (cifBrl + ii) * tax("ipi"), pis = cifBrl * tax("pis_import"), cofins = cifBrl * tax("cofins_import");
    const taxes = ii + ipi + pis + cofins, totalCost = itemBase + allocatedExpenses + taxes;
    const margin = budget.marginRate;
    const saleTotal = margin < 0 || !Number.isFinite(margin) || (budget.marginMethod === "sale_margin" && margin >= 100) ? null : budget.marginMethod === "sale_margin" ? totalCost / (1 - margin / 100) : totalCost * (1 + margin / 100);
    const markup = saleTotal === null ? 0 : saleTotal - totalCost;
    const pisDebit = (saleTotal ?? 0) * tax("pis_sale"), cofinsDebit = (saleTotal ?? 0) * tax("cofins_sale"), ipiDebit = (saleTotal ?? 0) * tax("ipi_sale");
    const pisNet = pisDebit - pis, cofinsNet = cofinsDebit - cofins, ipiNet = ipiDebit - ipi;
    const icmsSale = (saleTotal ?? 0) * tax("icms_sale"), csll = markup * tax("csll"), irpj = markup * tax("irpj"), irpjAdditional = markup * tax("irpj_additional");
    const outputTaxes = pisNet + cofinsNet + ipiNet + icmsSale + csll + irpj + irpjAdditional;
    const pricing: ItemPricing = { inputUsd, inputBrl: itemBase, netWeightKg: item.netWeightKg ?? null, cifBrl, freight, insurance, siscomex, afrmm, otherExpenses, markup, saleTotal, saleUnit: saleTotal === null || item.quantity <= 0 ? null : saleTotal / item.quantity, pisDebit, pisCredit: pis, pisNet, cofinsDebit, cofinsCredit: cofins, cofinsNet, ipiDebit, ipiCredit: ipi, ipiNet, icmsSale, csll, irpj, irpjAdditional, outputTaxes, costWithOutputTaxes: totalCost + outputTaxes };
    return { ...item, itemFob: itemBase, allocatedExpenses, ii, ipi, pis, cofins, taxes, totalCost, unitCost: item.quantity <= 0 ? 0 : totalCost / item.quantity, pricing };
  });
  const sum = (key: keyof ItemPricing) => raw.reduce((total, item) => total + (item.pricing[key] ?? 0), 0);
  const validSale = Number.isFinite(budget.marginRate) && budget.marginRate >= 0 && !(budget.marginMethod === "sale_margin" && budget.marginRate >= 100) && raw.every((item) => item.pricing.saleTotal !== null);
  const totals = Object.fromEntries(["markup", "pisDebit", "pisCredit", "pisNet", "cofinsDebit", "cofinsCredit", "cofinsNet", "ipiDebit", "ipiCredit", "ipiNet", "icmsSale", "csll", "irpj", "irpjAdditional", "outputTaxes", "costWithOutputTaxes", "siscomex", "afrmm", "otherExpenses"].map((key) => [key, round(sum(key as keyof ItemPricing))])) as PricingTotals;
  totals.saleTotal = validSale ? round(sum("saleTotal")) : null; totals.cifBrl = round(sum("cifBrl")); totals.netWeightKg = totalNetWeight;
  const taxes = raw.reduce((sum, item) => sum + item.taxes, 0), totalCost = round(inputTotal + baseExpenses + taxes);
  const unallocatedExpenses = round(baseExpenses - raw.reduce((sum, item) => sum + item.allocatedExpenses, 0));
  if (Math.abs(unallocatedExpenses) > 0.01) warnings.push("Há despesas sem rateio completo; os valores por item ainda não fecham com o total da operação.");
  totals.costWithOutputTaxes = round(totalCost + totals.outputTaxes);
  if (!validSale) warnings.push("Informe uma margem válida para calcular os valores de venda e saída.");
  const calculationReady = warnings.length === (hasIncludedInternational ? 1 : 0);
  if (!calculationReady) totals.saleTotal = null;
  return { budget, exchangeRate, fobBrl: round(inputTotal), totalWeight: round(totalWeight), totalVolume: round(totalVolume), baseExpenses: round(baseExpenses), taxes: round(taxes), totalCost, suggestedSaleTotal: calculationReady ? totals.saleTotal : null,
    items: raw.map((item) => ({ ...item, itemFob: round(item.itemFob), allocatedExpenses: round(item.allocatedExpenses), ii: round(item.ii), ipi: round(item.ipi), pis: round(item.pis), cofins: round(item.cofins), taxes: round(item.taxes), totalCost: round(item.totalCost), unitCost: round(item.unitCost), pricing: Object.fromEntries(Object.entries(item.pricing).map(([key, value]) => [key, key === "netWeightKg" || value === null ? value : round(value)])) as ItemPricing })),
    pricingTotals: totals as PricingTotals | undefined, calculationWarnings: warnings, calculationReady, unallocatedExpenses };
}
