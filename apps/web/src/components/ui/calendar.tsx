import { DayPicker, type DayPickerProps } from "react-day-picker";
import "react-day-picker/style.css";

// shadcn Calendar uses DayPicker; preserve its keyboard navigation and ARIA labels.
export function Calendar({ className = "", showOutsideDays = true, ...props }: DayPickerProps) {
  return <DayPicker className={`shadcn-calendar ${className}`} showOutsideDays={showOutsideDays} {...props} />;
}
