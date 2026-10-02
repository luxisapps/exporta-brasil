import { getCountries, getCountryCallingCode, type CountryCode } from "libphonenumber-js/min";

export const phoneCountries = getCountries();
export function phoneCountry(country: string): CountryCode {
  return phoneCountries.includes(country as CountryCode) ? country as CountryCode : "CN";
}
export function splitPhone(value: string, preferred: string) {
  const fallback = phoneCountry(preferred);
  if (!value.startsWith("+")) return { country: fallback, number: value };
  const digits = value.slice(1);
  const candidates = phoneCountries.filter(code => digits.startsWith(getCountryCallingCode(code)))
    .sort((a, b) => getCountryCallingCode(b).length - getCountryCallingCode(a).length);
  const country = candidates.includes(fallback) ? fallback : candidates[0] ?? fallback;
  return { country, number: candidates.length ? digits.slice(getCountryCallingCode(country).length).trim() : value };
}
export function joinPhone(country: CountryCode, number: string) {
  return number.trim() ? `+${getCountryCallingCode(country)} ${number.trim()}` : "";
}
