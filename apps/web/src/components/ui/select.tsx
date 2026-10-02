import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { createContext, useContext, forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import { FormControl, type FieldBinding } from "./form";
import { useFieldId } from "./field";

const BindingContext = createContext<FieldBinding | undefined>(undefined);
export function Select(props: ComponentPropsWithoutRef<typeof SelectPrimitive.Root>) {
  return <FormControl name={props.name} defaultValue={props.defaultValue} value={props.value}>{field => <BindingContext.Provider value={field}><SelectPrimitive.Root {...props} value={field ? field.value : props.value} onValueChange={value => { field?.onChange(value); props.onValueChange?.(value); }} /></BindingContext.Provider>}</FormControl>;
}
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = forwardRef<ElementRef<typeof SelectPrimitive.Trigger>, ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>>(({ children, className = "", ...props }, ref) => {
  const field = useContext(BindingContext);
  const fieldId = useFieldId();
  return <SelectPrimitive.Trigger id={field?.id ?? fieldId} aria-invalid={field?.["aria-invalid"]} aria-describedby={field?.["aria-describedby"]} onBlur={field?.onBlur} ref={element => { field?.ref(element); if (typeof ref === "function") ref(element); else if (ref) ref.current = element; }} className={`shadcn-select-trigger ${className}`} {...props}>
    {children}<SelectPrimitive.Icon asChild><ChevronDown className="shadcn-select-chevron" size={14} aria-hidden="true" /></SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>;
});
SelectTrigger.displayName = "SelectTrigger";

export const SelectContent = forwardRef<ElementRef<typeof SelectPrimitive.Content>, ComponentPropsWithoutRef<typeof SelectPrimitive.Content>>(({ children, className = "", position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content ref={ref} position={position} className={`shadcn-select-content ${className}`} {...props}>
      <SelectPrimitive.Viewport className="shadcn-select-viewport">{children}</SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = "SelectContent";

type SelectItemProps = ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & { hideIndicator?: boolean };
export const SelectItem = forwardRef<ElementRef<typeof SelectPrimitive.Item>, SelectItemProps>(({ children, className = "", hideIndicator = false, ...props }, ref) => (
  <SelectPrimitive.Item ref={ref} className={`shadcn-select-item ${className}`} {...props}>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    {!hideIndicator && <SelectPrimitive.ItemIndicator className="shadcn-select-indicator"><Check size={13} aria-hidden="true" /></SelectPrimitive.ItemIndicator>}
  </SelectPrimitive.Item>
));
SelectItem.displayName = "SelectItem";
