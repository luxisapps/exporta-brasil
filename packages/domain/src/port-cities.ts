import type { ImportExpense, ImportBudget, PortFacility } from "./index.js";
export type PortCityExpense = { id: string; label: string; amount: number };
export type PortCity = { id: string; name: string; state: string; expenses: PortCityExpense[] };
export type PortCitySettings = { cities: PortCity[]; generalExpenses: PortCityExpense[] };
export const emptyPortCitySettings = (): PortCitySettings => ({ cities: [], generalExpenses: [] });
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
export function cityFacilities(city: PortCity, facilities: PortFacility[]) {
  return facilities.filter(facility => normalize(facility.municipality) === normalize(city.name) && normalize(facility.state) === normalize(city.state));
}
export function cityBudgetExpenses(settings: PortCitySettings, cityId?: string): ImportExpense[] {
  const city = settings.cities.find(city => city.id === cityId);
  return [...settings.generalExpenses.map(expense => ({expense,source:`general:${expense.id}`})), ...(city?.expenses ?? []).map(expense => ({expense,source:`city:${city!.id}:${expense.id}`}))].map(({expense,source}) => ({id:crypto.randomUUID(),category:"Despesas portuárias",label:expense.label,amount:expense.amount,currency:"BRL",allocationMethod:"fob",status:"estimated",kind:"other",defaultExpenseSource:source}));
}
export function changeBudgetCity(budgets: ImportBudget[] | undefined, settings: PortCitySettings, cityId?: string) {
  return budgets?.map(budget => budget.status === "draft" ? {...budget, expenses:[...budget.expenses.filter(expense => !expense.defaultExpenseSource), ...cityBudgetExpenses(settings,cityId)]} : budget);
}
export function validPortCitySettings(value: unknown): value is PortCitySettings {
  const record = (item: unknown): item is Record<string,unknown> => Boolean(item && typeof item === "object" && !Array.isArray(item));
  const expenses = (items: unknown) => Array.isArray(items) && new Set(items.map(item => item?.id)).size === items.length && items.every(item => record(item) && typeof item.id === "string" && Boolean(item.id) && typeof item.label === "string" && Boolean(item.label.trim()) && typeof item.amount === "number" && Number.isFinite(item.amount) && item.amount >= 0);
  return record(value) && expenses(value.generalExpenses) && Array.isArray(value.cities) && new Set(value.cities.map(city => city?.id)).size === value.cities.length && value.cities.every(city => record(city) && typeof city.id === "string" && Boolean(city.id) && typeof city.name === "string" && Boolean(city.name.trim()) && typeof city.state === "string" && /^[A-Z]{2}$/.test(city.state) && expenses(city.expenses));
}
