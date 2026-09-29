import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = forwardRef<ElementRef<typeof SelectPrimitive.Trigger>, ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>>(({ children, className = "", ...props }, ref) => (
  <SelectPrimitive.Trigger ref={ref} className={`shadcn-select-trigger ${className}`} {...props}>
    {children}<SelectPrimitive.Icon asChild><ChevronDown className="shadcn-select-chevron" size={14} aria-hidden="true" /></SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
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
