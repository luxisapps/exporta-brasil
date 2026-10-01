import { forwardRef, type ComponentPropsWithoutRef } from "react";

// shadcn Textarea, using the same form theme as Input.
export const Textarea = forwardRef<HTMLTextAreaElement, ComponentPropsWithoutRef<"textarea">>(
  ({ className = "", autoComplete = "off", ...props }, ref) => (
    <textarea ref={ref} autoComplete={autoComplete} data-slot="textarea" className={`shadcn-textarea ${className}`} {...props} />
  )
);
Textarea.displayName = "Textarea";
