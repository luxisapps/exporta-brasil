import { Children, isValidElement, type ComponentProps, type ReactNode } from "react";
import { translateUiText } from "../../i18n";
import { useLocale } from "../../lib/locale-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

type OptionProps = { value?: string; children: string; disabled?: boolean };

// Option declarations are converted into Radix items by FieldSelect.
export function SelectOption(_props: OptionProps) { return null; }

type FieldSelectProps = ComponentProps<typeof Select> & {
  label: string;
  children: ReactNode;
  className?: string;
};

export function FieldSelect({ label, children, className = "", ...props }: FieldSelectProps) {
  const locale = useLocale();
  const options = Children.toArray(children).filter(isValidElement<OptionProps>);
  return (
    <Select {...props}>
      <SelectTrigger className={className} aria-label={translateUiText(locale, label)} data-localized>
        <SelectValue />
      </SelectTrigger>
      <SelectContent data-localized>
        {options.map(({ props: option }) => (
          <SelectItem key={option.value ?? option.children} value={option.value ?? option.children} disabled={option.disabled}>
            {translateUiText(locale, option.children)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
