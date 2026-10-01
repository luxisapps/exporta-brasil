import { forwardRef, type ComponentPropsWithoutRef } from "react";

// shadcn Textarea, using the same form theme as Input.
export const Textarea = forwardRef<HTMLTextAreaElement, ComponentPropsWithoutRef<"textarea">>(
  ({ className = "", ...props }, ref) => (
    <textarea ref={ref} data-slot="textarea" className={`shadcn-textarea ${className}`} {...props} />
  )
);
Textarea.displayName = "Textarea";
