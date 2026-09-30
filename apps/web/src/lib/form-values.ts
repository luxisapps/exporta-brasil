// Calendar dates must stay local: UTC conversion can shift a day in Brazil.
export function localDateValue(date: Date) {
  return `${date.getFullYear().toString().padStart(4, "0")}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
}
export function localDateTimeValue(date: Date) {
  return `${localDateValue(date)}T${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}
export function parseLocalDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return localDateValue(date) === value ? date : undefined;
}
export function numberSeparators(locale: string) {
  const parts = new Intl.NumberFormat(locale).formatToParts(1234.5);
  return { decimal: parts.find((part) => part.type === "decimal")!.value, group: parts.find((part) => part.type === "group")!.value };
}
