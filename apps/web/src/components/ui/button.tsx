import { forwardRef, type ComponentPropsWithoutRef } from "react";

// shadcn Button with application CSS, retaining the native button semantics.
export const Button = forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<"button">>(
  ({ className = "", type = "button", ...props }, ref) => <button ref={ref} type={type} className={`shadcn-button ${className}`} {...props} />
);
Button.displayName = "Button";
