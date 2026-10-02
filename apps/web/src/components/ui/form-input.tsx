import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { Input } from "./input";
import { FormControl } from "./form";

export const FormInput = forwardRef<HTMLInputElement, ComponentPropsWithoutRef<"input">>(({ name, defaultValue, value, onChange, onBlur, ...props }, ref) => (
  <FormControl name={props.type === "file" ? undefined : name} defaultValue={String(defaultValue ?? "")} value={value === undefined ? undefined : String(value)} showError={props.type !== "hidden"}>
    {field => <Input {...props} name={name} defaultValue={field ? undefined : defaultValue} value={field ? value ?? field.value : value} id={props.id ?? field?.id} aria-invalid={field?.["aria-invalid"] || props["aria-invalid"]} aria-describedby={[props["aria-describedby"], field?.["aria-describedby"]].filter(Boolean).join(" ") || undefined} ref={element => { field?.ref(element); if (typeof ref === "function") ref(element); else if (ref) ref.current = element; }} onChange={event => { onChange?.(event); field?.onChange(event.target.value); }} onBlur={event => { field?.onBlur(); onBlur?.(event); }} />}
  </FormControl>
));
FormInput.displayName = "FormInput";
