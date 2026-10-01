import { forwardRef, type ComponentPropsWithoutRef } from "react";

// shadcn Input, styled with the application's existing form tokens.
export const Input = forwardRef<HTMLInputElement, ComponentPropsWithoutRef<"input">>(
  ({ className = "", type = "text", autoComplete = "off", ...props }, ref) => <input ref={ref} type={type} autoComplete={autoComplete} className={`shadcn-input ${className}`} {...props} />
);
Input.displayName = "Input";
