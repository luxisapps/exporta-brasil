import { createContext, useContext } from "react";
import { convertCurrency, equivalentText, type Currency, type ExchangeRates } from "../lib/currency";
import { useLocale } from "../lib/locale-context";

export const CurrencyContext = createContext<{ rates: ExchangeRates | null; loading: boolean }>({ rates: null, loading: true });
export const useCurrency = () => useContext(CurrencyContext);

export function CurrencyEquivalents({ value, currency = "BRL" }: { value: number; currency?: Currency }) {
  const { rates, loading } = useCurrency();
  const locale = useLocale();
  const unavailable = convertCurrency(value, currency, "CNY", rates) === null || convertCurrency(value, currency, currency === "USD" ? "BRL" : "USD", rates) === null;
  const title = locale === "en-US" ? "Indicative equivalents · BCB PTAX sell rate" : locale === "zh-CN" ? "参考金额 · 巴西央行 PTAX 卖出汇率" : "Equivalências indicativas · BCB PTAX de venda";
  const missing = locale === "en-US" ? "Exchange rate unavailable" : locale === "zh-CN" ? "汇率暂不可用" : "Cotação indisponível";
  return <small className="currency-equivalents" data-localized title={`${title}${unavailable && !loading ? ` · ${missing}` : ""}${rates ? ` · USD ${rates.dollar.quotedAt} · CNY ${rates.yuan?.quotedAt ?? "—"}` : ""}`} aria-busy={loading || undefined}>{loading ? <span className="skeleton currency-equivalents__loading" aria-label={title} /> : <>≈ {equivalentText(value, currency, rates, locale)}</>}</small>;
}
export function MoneyAmount({ value, currency = "BRL", decimals = 2 }: { value: number; currency?: Currency; decimals?: number }) {
  const locale = useLocale();
  return <span className="money-amount" data-localized><span className="money-amount__primary">{new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value)}</span><CurrencyEquivalents value={value} currency={currency} /></span>;
}
