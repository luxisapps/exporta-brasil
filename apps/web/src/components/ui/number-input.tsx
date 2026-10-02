import { useEffect, useRef, useState, type ComponentPropsWithoutRef } from "react";
import { NumericFormat } from "react-number-format";
import { Input } from "./input";
import { useLocale } from "../../lib/locale-context";
import { numberSeparators } from "../../lib/form-values";
import { CurrencyEquivalents } from "../money-amount";
import { FormControl, type FieldBinding } from "./form";
import { FieldError } from "./field";

type Props = Omit<ComponentPropsWithoutRef<"input">, "value" | "defaultValue" | "onChange" | "type" | "prefix"> & {
  value?: number; defaultValue?: number; onValueChange?: (value: number) => void; currency?: "BRL" | "USD"; suffix?: string; prefix?: string; decimalScale?: number; fixedDecimalScale?: boolean;
};

export function NumberInput(props: Props) {
  return <FormControl name={props.name} defaultValue={props.defaultValue === undefined ? "" : String(props.defaultValue)} value={props.value === undefined ? undefined : String(props.value)}>{field => <NumberInputControl {...props} field={field} />}</FormControl>;
}
function NumberInputControl({ value, defaultValue, onValueChange, currency, suffix, prefix, decimalScale = currency ? 2 : 0, fixedDecimalScale = Boolean(currency), name, min = 0, max, className = "", field, ...props }: Props & { field?: FieldBinding }) {
  const locale = useLocale();
  const { decimal, group } = numberSeparators(locale);
  const [draft, setDraft] = useState(() => value === undefined && defaultValue === undefined ? "" : String(value ?? defaultValue));
  const input = useRef<HTMLInputElement>(null);
  const [touched, setTouched] = useState(false);
  useEffect(() => { if (value !== undefined && Number(draft || 0) !== value) setDraft(String(value)); }, [value]);
  const current = field?.value ?? draft;
  const invalid = touched && current !== "" && (Number(current) < Number(min) || (max !== undefined && Number(current) > Number(max)));
  const message = locale === "pt-BR" ? `Informe um valor a partir de ${min}${max !== undefined ? ` e até ${max}` : ""}.` : locale === "en-US" ? `Enter a value from ${min}${max !== undefined ? ` to ${max}` : ""}.` : `请输入不小于 ${min}${max !== undefined ? ` 且不大于 ${max}` : ""} 的数值。`;
  const unit = currency ? (currency === "USD" ? "US$" : "R$") : prefix;
  return <div className={currency ? "currency-number-field" : undefined}><div className={`formatted-number ${className}`} data-disabled={props.disabled || undefined}>
    {unit && <span className="formatted-number__unit" aria-hidden="true">{unit}</span>}
    <NumericFormat placeholder={currency ? new Intl.NumberFormat(locale, { minimumFractionDigits: 2 }).format(0) : undefined} spellCheck={false} {...props} customInput={Input} id={props.id ?? field?.id} aria-invalid={field?.["aria-invalid"] || invalid} aria-describedby={field?.["aria-describedby"]} getInputRef={(element: HTMLInputElement) => { input.current = element; field?.ref(element); }} value={current} valueIsNumericString thousandSeparator={group} decimalSeparator={decimal} allowedDecimalSeparators={[decimal]} decimalScale={decimalScale} fixedDecimalScale={fixedDecimalScale} allowNegative={false} allowLeadingZeros={false} inputMode={decimalScale ? "decimal" : "numeric"} onBlur={event => { setTouched(true); field?.onBlur(); props.onBlur?.(event); }} onValueChange={({ value: raw, floatValue }, { source }) => { if (source !== "event") return; setDraft(raw); field?.onChange(raw); if (raw === "" || (floatValue !== undefined && floatValue >= Number(min) && (max === undefined || floatValue <= Number(max)))) onValueChange?.(floatValue ?? 0); }} />
    {suffix && <span className="formatted-number__unit" aria-hidden="true">{suffix}</span>}
    {name && <input autoComplete="off" type="hidden" name={name} value={current} disabled={props.disabled} />}
  </div>{!field && invalid && <FieldError message={message} />}{currency && current !== "" && Number.isFinite(Number(current)) && <CurrencyEquivalents value={Number(current)} currency={currency} />}</div>;
}
