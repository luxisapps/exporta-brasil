import * as TogglePrimitive from "@radix-ui/react-toggle";
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";

export const Toggle = forwardRef<ElementRef<typeof TogglePrimitive.Root>, ComponentPropsWithoutRef<typeof TogglePrimitive.Root>>(({ className = "", ...props }, ref) => <TogglePrimitive.Root ref={ref} className={`shadcn-toggle ${className}`} {...props} />);
Toggle.displayName = "Toggle";
