import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";

export const Command = forwardRef<ElementRef<typeof CommandPrimitive>, ComponentPropsWithoutRef<typeof CommandPrimitive>>(({ className = "", ...props }, ref) => <CommandPrimitive ref={ref} className={`shadcn-command ${className}`} {...props} />);
export const CommandInput = forwardRef<ElementRef<typeof CommandPrimitive.Input>, ComponentPropsWithoutRef<typeof CommandPrimitive.Input>>((props, ref) => <div className="shadcn-command-search"><Search size={17} aria-hidden="true" /><CommandPrimitive.Input ref={ref} autoComplete="off" {...props} /></div>);
export const CommandList = forwardRef<ElementRef<typeof CommandPrimitive.List>, ComponentPropsWithoutRef<typeof CommandPrimitive.List>>((props, ref) => <CommandPrimitive.List ref={ref} className="shadcn-command-list" {...props} />);
export const CommandEmpty = forwardRef<ElementRef<typeof CommandPrimitive.Empty>, ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>>((props, ref) => <CommandPrimitive.Empty ref={ref} className="shadcn-command-empty" {...props} />);
export const CommandItem = forwardRef<ElementRef<typeof CommandPrimitive.Item>, ComponentPropsWithoutRef<typeof CommandPrimitive.Item>>((props, ref) => <CommandPrimitive.Item ref={ref} className="shadcn-command-item" {...props} />);
Command.displayName = "Command";
CommandInput.displayName = "CommandInput";
CommandList.displayName = "CommandList";
CommandEmpty.displayName = "CommandEmpty";
CommandItem.displayName = "CommandItem";
