import { useEffect, useState } from "react";
import * as flags from "country-flag-icons/react/3x2";
import { getCountryCallingCode, type CountryCode } from "libphonenumber-js/min";
import { countryName } from "../../lib/countries";
import { joinPhone, phoneCountries, phoneCountry, splitPhone } from "../../lib/phone";
import { useLocale } from "../../lib/locale-context";
import { FormControl, type FieldBinding } from "./form";
import { Input } from "./input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

export function PhoneInput({ name, country, defaultValue = "" }: { name: string; country: string; defaultValue?: string }) {
  return <FormControl name={name} defaultValue={defaultValue}>{field => field && <PhoneControl field={field} country={country} name={name} />}</FormControl>;
}
function PhoneControl({ field, country, name }: { field: FieldBinding; country: string; name: string }) {
  const locale = useLocale();
  const [selected, setSelected] = useState<CountryCode>(() => splitPhone(field.value, country).country);
  useEffect(() => { if (!field.value) setSelected(phoneCountry(country)); }, [country]);
  const parsed = splitPhone(field.value, selected);
  const number = parsed.number;
  const Flag = flags[selected as keyof typeof flags];
  const options = ["CN", "BR", ...phoneCountries.filter(code => code !== "CN" && code !== "BR").sort((a, b) => countryName(a, locale).localeCompare(countryName(b, locale))) ] as CountryCode[];
  const label = locale === "en-US" ? "Country calling code" : locale === "zh-CN" ? "国家电话区号" : "Código do país";
  return <div className="phone-input" data-localized>
    <Select value={selected} onValueChange={value => { const next = value as CountryCode; setSelected(next); field.onChange(joinPhone(next, number)); }}>
      <SelectTrigger id={`${field.id}-country`} aria-label={label} className="phone-input__country"><SelectValue><span className="phone-input__option"><Flag aria-hidden="true" />+{getCountryCallingCode(selected)}</span></SelectValue></SelectTrigger>
      <SelectContent className="phone-input__menu">{options.map(code => { const CountryFlag = flags[code as keyof typeof flags]; return <SelectItem key={code} value={code} textValue={`${countryName(code, locale)} +${getCountryCallingCode(code)}`}><span className="phone-input__option"><CountryFlag aria-hidden="true" /><span>{countryName(code, locale)}</span><small>+{getCountryCallingCode(code)}</small></span></SelectItem>; })}</SelectContent>
    </Select>
    <Input ref={field.ref} id={field.id} name={name} type="tel" inputMode="tel" value={number} placeholder={selected === "BR" ? "11 99999-9999" : selected === "CN" ? "138 0013 8000" : "202 555 0123"} aria-invalid={field["aria-invalid"]} aria-describedby={field["aria-describedby"]} onBlur={field.onBlur} onChange={event => { const value = event.target.value; if (value.startsWith("+")) { const next = splitPhone(value, selected); setSelected(next.country); field.onChange(joinPhone(next.country, next.number)); } else field.onChange(joinPhone(selected, value)); }} />
  </div>;
}
