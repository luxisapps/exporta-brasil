import { useState, type ComponentProps } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from "./command";

type Option = { value: string; label: string };
type Props = Omit<ComponentProps<typeof Button>, "value" | "onChange" | "children"> & {
  value: string; options: Option[]; onValueChange: (value: string) => void;
  placeholder: string; searchPlaceholder: string; emptyMessage: string;
};
const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
/** shadcn combobox composition: Radix Popover and Command keyboard navigation. */
export function Combobox({ value, options, onValueChange, placeholder, searchPlaceholder, emptyMessage, ...props }: Props) {
  const [open, setOpen] = useState(false);
  return <Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><Button {...props} role="combobox" aria-expanded={open} className="shadcn-select-trigger shadcn-combobox-trigger"><span>{options.find(option => option.value === value)?.label ?? placeholder}</span><ChevronsUpDown size={15} aria-hidden="true" /></Button></PopoverTrigger>
    <PopoverContent className="shadcn-combobox-content"><Command filter={(value, search) => normalize(value).includes(normalize(search).trim()) ? 1 : 0}>
      <CommandInput aria-label={searchPlaceholder} placeholder={searchPlaceholder} />
      <CommandList><CommandEmpty>{emptyMessage}</CommandEmpty>{options.map(option => <CommandItem key={option.value} value={option.label} onSelect={() => { onValueChange(option.value); setOpen(false); }}><span>{option.label}</span>{value === option.value && <Check size={16} aria-hidden="true" />}</CommandItem>)}</CommandList>
    </Command></PopoverContent>
  </Popover>;
}
