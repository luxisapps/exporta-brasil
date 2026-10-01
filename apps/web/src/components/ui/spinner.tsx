import { LoaderCircle } from "lucide-react";

export function Spinner({ className = "" }: { className?: string }) {
  return <LoaderCircle className={`ui-spinner ${className}`} size={18} aria-hidden="true" />;
}
