/** New pricing fields are optional for compatibility with historical snapshots. */
export function validPricingFields(operation: { items: unknown[]; budgets?: unknown[] }) {
  const record = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === "object" && !Array.isArray(value));
  const finite = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0;
  const option = (value: unknown, allowed: string[]) => value === undefined || typeof value === "string" && allowed.includes(value);
  return operation.items.every(item => record(item)
    && (item.netWeightKg === undefined || finite(item.netWeightKg))
    && option(item.sourcePriceBasis, ["fob", "cif"]))
    && (operation.budgets ?? []).every(budget => record(budget)
      && option(budget.calculationModel, ["legacy", "worksheet"])
      && option(budget.priceBasis, ["fob", "cif"])
      && option(budget.marginMethod, ["markup", "sale_margin"])
      && Array.isArray(budget.expenses) && budget.expenses.every(expense => record(expense)
        && option(expense.kind, ["freight", "insurance", "siscomex", "afrmm", "other"])));
}
