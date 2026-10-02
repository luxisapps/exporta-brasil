import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { useFieldId } from "./field";

// shadcn Input, styled with the application's existing form tokens.
export const Input = forwardRef<HTMLInputElement, ComponentPropsWithoutRef<"input">>(
  ({ className = "", type = "text", autoComplete = "off", id, ...props }, ref) => { const fieldId = useFieldId(); return <input ref={ref} id={id ?? fieldId} type={type} autoComplete={autoComplete} className={`shadcn-input ${className}`} {...props} />; }
);
Input.displayName = "Input";
