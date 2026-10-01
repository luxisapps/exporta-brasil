import { translateUiText, type Locale } from "../i18n";

export type LocalizedText = { source: string; rendered: string };
/** React may replace the value of an existing text node after a calculation. */
export function localizeLiveText(locale: Locale, current: string, previous?: LocalizedText): LocalizedText {
  const source = previous && current === previous.rendered ? previous.source : current;
  const leading = source.match(/^\s*/)?.[0] ?? "";
  const trailing = source.match(/\s*$/)?.[0] ?? "";
  return { source, rendered: `${leading}${translateUiText(locale, source.trim())}${trailing}` };
}
