import { createContext, useContext } from "react";
import type { Locale } from "../i18n";

export const LocaleContext = createContext<Locale>("pt-BR");
export const useLocale = () => useContext(LocaleContext);
