import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { FormControl } from "./form";

// shadcn Textarea, using the same form theme as Input.
export const Textarea = forwardRef<HTMLTextAreaElement, ComponentPropsWithoutRef<"textarea">>(
  ({ className = "", autoComplete = "off", name, defaultValue, value, onChange, onBlur, ...props }, ref) => (
    <FormControl name={name} defaultValue={String(defaultValue ?? "")} value={value === undefined ? undefined : String(value)}>{field => <textarea {...props} name={name} defaultValue={field ? undefined : defaultValue} value={field ? value ?? field.value : value} id={props.id ?? field?.id} aria-invalid={field?.["aria-invalid"]} aria-describedby={field?.["aria-describedby"]} ref={element => { field?.ref(element); if (typeof ref === "function") ref(element); else if (ref) ref.current = element; }} onChange={event => { onChange?.(event); field?.onChange(event.target.value); }} onBlur={event => { field?.onBlur(); onBlur?.(event); }} autoComplete={autoComplete} data-slot="textarea" className={`shadcn-textarea ${className}`} />}</FormControl>
  )
);
Textarea.displayName = "Textarea";
