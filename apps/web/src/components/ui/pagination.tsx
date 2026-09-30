import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";

type PaginationProps = {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  label: string;
  previousLabel: string;
  nextLabel: string;
  pageLabel: string;
};

// shadcn pagination semantics, using buttons for this in-page data view.
export function Pagination({ page, pageCount, onPageChange, label, previousLabel, nextLabel, pageLabel }: PaginationProps) {
  return <nav aria-label={label} className="timeline-pagination">
    <ul className="timeline-pagination__controls">
      <li><Button className="button button--secondary" aria-label={previousLabel} disabled={page <= 1} onClick={() => onPageChange(page - 1)}><ChevronLeft size={16} /><span>{previousLabel}</span></Button></li>
      <li><span aria-live="polite" aria-atomic="true">{pageLabel}</span></li>
      <li><Button className="button button--secondary" aria-label={nextLabel} disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}><span>{nextLabel}</span><ChevronRight size={16} /></Button></li>
    </ul>
  </nav>;
}
