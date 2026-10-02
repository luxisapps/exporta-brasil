import { createContext, useContext, useId, type ComponentProps } from "react";
import { CircleAlert } from "lucide-react";
import { useLocale } from "../../lib/locale-context";
import { translateUiText } from "../../i18n";

const FieldContext = createContext<string | undefined>(undefined);
export const useFieldId = () => useContext(FieldContext);
export function Field({ className = "", children, ...props }: ComponentProps<"div">) { const id = useId(); return <FieldContext.Provider value={id}><div data-slot="field" className={`field ${className}`} {...props}>{children}</div></FieldContext.Provider>; }
export function FieldLabel(props: ComponentProps<"label">) { const id = useFieldId(); return <label data-slot="field-label" htmlFor={id} {...props} />; }
export function FieldDescription(props: ComponentProps<"small">) { return <small data-slot="field-description" className="field-help" {...props} />; }
export function FieldError({ message, ...props }: ComponentProps<"small"> & { message?: string }) {
  const locale = useLocale();
  return message ? <small data-slot="field-error" className="form-field-error" role="alert" {...props}><CircleAlert size={14} aria-hidden="true" /><span>{translateUiText(locale, message)}</span></small> : null;
}
