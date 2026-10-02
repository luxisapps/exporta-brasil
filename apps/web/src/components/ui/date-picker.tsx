import { useId, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import { ptBR, enUS, zhCN } from "react-day-picker/locale";
import { PatternFormat } from "react-number-format";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Input } from "./input";
import { Button } from "./button";
import { useLocale } from "../../lib/locale-context";
import { localDateValue, parseLocalDate } from "../../lib/form-values";
import { translateUiText } from "../../i18n";
import { FormControl, type FieldBinding } from "./form";
import { useFieldId } from "./field";

type Props = { name?: string; label: string; value?: string; defaultValue?: string; onChange?: (value: string) => void; required?: boolean; disabled?: boolean; withTime?: boolean; min?: string; max?: string };
const copy = {
  "pt-BR": { choose: "Selecionar data", today: "Hoje", clear: "Limpar", time: "Horário", required: "Selecione uma data.", invalidTime: "Informe um horário válido (00:00 a 23:59)." },
  "en-US": { choose: "Select date", today: "Today", clear: "Clear", time: "Time", required: "Select a date.", invalidTime: "Enter a valid time (00:00 to 23:59)." },
  "zh-CN": { choose: "选择日期", today: "今天", clear: "清除", time: "时间", required: "请选择日期。", invalidTime: "请输入有效时间（00:00 至 23:59）。" }
};

export function DatePicker(props: Props) {
  return <FormControl name={props.name} defaultValue={props.defaultValue} value={props.value}>{field => <DatePickerControl {...props} field={field} />}</FormControl>;
}
function DatePickerControl({ name, label, value, defaultValue = "", onChange, required, disabled, withTime, min, max, field }: Props & { field?: FieldBinding }) {
  const generatedId = useId(), fieldId = useFieldId(), id = field?.id ?? fieldId ?? generatedId;
  const locale = useLocale();
  const text = copy[locale];
  const [internal, setInternal] = useState(defaultValue);
  const current = value ?? field?.value ?? internal;
  const [datePart, timePart = "00:00"] = current.split("T");
  const selected = parseLocalDate(datePart);
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const timeInput = useRef<HTMLInputElement>(null);
  const update = (next: string) => { setInternal(next); field?.onChange(next); onChange?.(next); };
  const select = (date: Date | undefined) => {
    if (!date) { update(""); return; }
    update(`${localDateValue(date)}${withTime ? `T${timePart}` : ""}`);
    setOpen(false);
  };
  const minDate = min ? parseLocalDate(min.slice(0, 10)) : undefined;
  const maxDate = max ? parseLocalDate(max.slice(0, 10)) : undefined;
  const dateDisabled = [ ...(minDate ? [{ before: minDate }] : []), ...(maxDate ? [{ after: maxDate }] : []) ];
  return <div data-localized className={`date-picker${withTime ? " date-picker--time" : ""}`}>
    <Popover open={open} onOpenChange={next => { setOpen(next); if (!next) field?.onBlur(); }}>
      <PopoverTrigger asChild><Button ref={element => { trigger.current = element; field?.ref(element); }} id={id} disabled={disabled} className="date-picker__trigger" aria-label={`${translateUiText(locale, label)}: ${selected ? new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(selected) : text.choose}`} aria-describedby={field?.["aria-describedby"]} aria-required={required} aria-invalid={field?.["aria-invalid"]}><CalendarDays size={17} aria-hidden="true" /><span data-empty={!selected}>{selected ? new Intl.DateTimeFormat(locale).format(selected) : text.choose}</span></Button></PopoverTrigger>
      <PopoverContent data-localized aria-label={translateUiText(locale, label)}>
        <Calendar mode="single" selected={selected} defaultMonth={selected} onSelect={select} locale={{ "pt-BR": ptBR, "en-US": enUS, "zh-CN": zhCN }[locale]} disabled={dateDisabled} autoFocus />
        <div className="date-picker__actions"><Button onClick={() => select(new Date())} disabled={Boolean((minDate && new Date() < minDate) || (maxDate && localDateValue(new Date()) > localDateValue(maxDate)))}>{text.today}</Button>{!required && <Button onClick={() => { update(""); setOpen(false); }}>{text.clear}</Button>}</div>
      </PopoverContent>
    </Popover>
    <input type="hidden" name={name} value={current} disabled={disabled} />
    {withTime && <PatternFormat customInput={Input} id={`${id}-time`} getInputRef={timeInput} format="##:##" mask="_" value={timePart.replace(":", "")} inputMode="numeric" aria-label={`${translateUiText(locale, label)} — ${text.time}`} aria-invalid={field?.["aria-invalid"]} aria-describedby={field?.["aria-describedby"]} disabled={disabled} onBlur={field?.onBlur} onValueChange={({ formattedValue }, { source }) => { if (source === "event") update(`${datePart}T${formattedValue}`); }} />}
  </div>;
}
