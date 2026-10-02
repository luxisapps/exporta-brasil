export type Currency = "BRL" | "USD" | "CNY";
export type CurrencyQuote = { buy: number; sell: number; quotedAt: string; source: string };
export type ExchangeRates = { dollar: CurrencyQuote; yuan?: CurrencyQuote | null };

export function convertCurrency(value: number, from: Currency, to: Currency, rates: ExchangeRates | null): number | null {
  if (!Number.isFinite(value)) return null;
  if (from === to) return value;
  const quote = (currency: Currency) => currency === "BRL" ? 1 : currency === "USD" ? rates?.dollar.sell : rates?.yuan?.sell;
  const origin = quote(from), target = quote(to);
  return origin && target && Number.isFinite(origin) && Number.isFinite(target) && origin > 0 && target > 0 ? value * origin / target : null;
}
export const formatMoney = (value: number, currency: Currency = "BRL", locale = "pt-BR") => new Intl.NumberFormat(locale, { style: "currency", currency, currencyDisplay: "code" }).format(value);
export const equivalentText = (value: number, currency: Currency, rates: ExchangeRates | null, locale = "pt-BR") => ((currency === "USD" ? ["BRL", "CNY"] : currency === "CNY" ? ["BRL", "USD"] : ["CNY", "USD"]) as Currency[]).map((target) => {
  const amount = convertCurrency(value, currency, target, rates);
  return amount === null ? `${target} —` : formatMoney(amount, target, locale);
}).join(" · ");
export const currencyNote = (rates: ExchangeRates | null) => `Equivalências indicativas pela PTAX de venda do BCB. USD: ${rates ? `${rates.dollar.sell} BRL/USD · ${rates.dollar.quotedAt}` : "indisponível"}. CNY: ${rates?.yuan ? `${rates.yuan.sell} BRL/CNY · ${rates.yuan.quotedAt}` : "indisponível"}. O câmbio do orçamento rege os cálculos da operação; as equivalências não alteram os totais.`;
