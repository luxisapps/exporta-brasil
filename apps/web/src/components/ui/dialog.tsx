import * as DialogPrimitive from "@radix-ui/react-dialog";
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type ReactNode } from "react";

export const DialogRoot = DialogPrimitive.Root;
export const DialogClose = DialogPrimitive.Close;
export const DialogTitle = DialogPrimitive.Title;

export const DialogOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => <DialogPrimitive.Overlay ref={ref} className={["dialog-backdrop", className].filter(Boolean).join(" ")} {...props} />);
DialogOverlay.displayName = "DialogOverlay";

export const DialogContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { children: ReactNode }
>(({ className, children, ...props }, ref) => <DialogPrimitive.Portal><DialogOverlay /><DialogPrimitive.Content ref={ref} className={["dialog", className].filter(Boolean).join(" ")} {...props}>{children}</DialogPrimitive.Content></DialogPrimitive.Portal>);
DialogContent.displayName = "DialogContent";
