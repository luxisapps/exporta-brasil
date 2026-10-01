import { useEffect, useRef, useState, type ComponentPropsWithoutRef } from "react";
import { NumericFormat } from "react-number-format";
import { Input } from "./input";
import { useLocale } from "../../lib/locale-context";
import { numberSeparators } from "../../lib/form-values";

type Props = Omit<ComponentPropsWithoutRef<"input">, "value" | "defaultValue" | "onChange" | "type" | "prefix"> & {
  value?: number; defaultValue?: number; onValueChange?: (value: number) => void; currency?: "BRL" | "USD"; suffix?: string; prefix?: string; decimalScale?: number;
};

export function NumberInput({ value, defaultValue, onValueChange, currency, suffix, prefix, decimalScale = currency ? 2 : 0, name, min = 0, max, className = "", ...props }: Props) {
  const locale = useLocale();
  const { decimal, group } = numberSeparators(locale);
  const [draft, setDraft] = useState(() => value === undefined && defaultValue === undefined ? "" : String(value ?? defaultValue));
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (value !== undefined && Number(draft || 0) !== value) setDraft(String(value)); }, [value]);
  useEffect(() => {
    const numeric = Number(draft);
    const invalid = draft !== "" && (numeric < Number(min) || (max !== undefined && numeric > Number(max)));
    const message = locale === "pt-BR" ? `Informe um valor a partir de ${min}${max !== undefined ? ` e até ${max}` : ""}.` : locale === "en-US" ? `Enter a value from ${min}${max !== undefined ? ` to ${max}` : ""}.` : `请输入不小于 ${min}${max !== undefined ? ` 且不大于 ${max}` : ""} 的数值。`;
    input.current?.setCustomValidity(invalid ? message : "");
  }, [draft, min, max, locale]);
  const unit = currency ? (currency === "USD" ? "US$" : "R$") : prefix;
  return <div className={`formatted-number ${className}`} data-disabled={props.disabled || undefined}>
    {unit && <span className="formatted-number__unit" aria-hidden="true">{unit}</span>}
    <NumericFormat placeholder={currency ? new Intl.NumberFormat(locale, { minimumFractionDigits: 2 }).format(0) : undefined} spellCheck={false} {...props} customInput={Input} getInputRef={input} value={draft} valueIsNumericString thousandSeparator={group} decimalSeparator={decimal} allowedDecimalSeparators={[decimal]} decimalScale={decimalScale} fixedDecimalScale={Boolean(currency)} allowNegative={false} allowLeadingZeros={false} inputMode={decimalScale ? "decimal" : "numeric"} onValueChange={({ value: raw, floatValue }, { source }) => { if (source !== "event") return; setDraft(raw); onValueChange?.(floatValue ?? 0); }} />
    {suffix && <span className="formatted-number__unit" aria-hidden="true">{suffix}</span>}
    {name && <input autoComplete="off" type="hidden" name={name} value={draft} disabled={props.disabled} />}
  </div>;
}
