import { forwardRef, type ComponentPropsWithoutRef } from "react";

export const Table = forwardRef<HTMLTableElement, ComponentPropsWithoutRef<"table">>((props, ref) => <table ref={ref} data-slot="table" {...props} />);
export const TableHeader = forwardRef<HTMLTableSectionElement, ComponentPropsWithoutRef<"thead">>((props, ref) => <thead ref={ref} data-slot="table-header" {...props} />);
export const TableBody = forwardRef<HTMLTableSectionElement, ComponentPropsWithoutRef<"tbody">>((props, ref) => <tbody ref={ref} data-slot="table-body" {...props} />);
export const TableFooter = forwardRef<HTMLTableSectionElement, ComponentPropsWithoutRef<"tfoot">>((props, ref) => <tfoot ref={ref} data-slot="table-footer" {...props} />);
export const TableRow = forwardRef<HTMLTableRowElement, ComponentPropsWithoutRef<"tr">>((props, ref) => <tr ref={ref} data-slot="table-row" {...props} />);
export const TableHead = forwardRef<HTMLTableCellElement, ComponentPropsWithoutRef<"th">>((props, ref) => <th ref={ref} data-slot="table-head" {...props} />);
export const TableCell = forwardRef<HTMLTableCellElement, ComponentPropsWithoutRef<"td">>((props, ref) => <td ref={ref} data-slot="table-cell" {...props} />);
export const TableCaption = forwardRef<HTMLTableCaptionElement, ComponentPropsWithoutRef<"caption">>((props, ref) => <caption ref={ref} data-slot="table-caption" {...props} />);

Table.displayName = "Table";
TableHeader.displayName = "TableHeader";
TableBody.displayName = "TableBody";
TableFooter.displayName = "TableFooter";
TableRow.displayName = "TableRow";
TableHead.displayName = "TableHead";
TableCell.displayName = "TableCell";
TableCaption.displayName = "TableCaption";
