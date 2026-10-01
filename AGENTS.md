# Project instructions

## Interface components

Before adding or changing an interactive UI control, check whether the equivalent component exists in [shadcn/ui](https://ui.shadcn.com/docs/components). Use the shadcn component backed by Radix UI when it exists.

If the component is not yet in this repository, add its shadcn-compatible implementation under `apps/web/src/components/ui/` and install its Radix dependency when needed. Do not introduce a native interactive control or a bespoke replacement when shadcn provides the component.

Keep custom styling in the application theme, but preserve the component's accessibility and keyboard behavior.

Selection fields must use the shared shadcn/Radix Select (`FieldSelect` for text options), never a visible native select. Use the shared 44px trigger height, padding, borders, and focus styles; keep custom avatar content in the assignee selector. The compact language flag control is the deliberate exception.

## Monetary amounts

Use the shared `MoneyAmount` / `CurrencyEquivalents` components for every monetary display. Show subdued, smaller CNY and USD equivalents below the primary amount, including currency inputs via `NumberInput`. Counts, physical measures and percentages must not be converted.

Use the current BCB PTAX sell rates from the shared currency context for indicative equivalents. Preserve the operation's budget exchange rate for accounting calculations. Never invent missing exchange rates. Exports must freeze and disclose the reference rates and quote dates, include the same equivalents, and use the current domain calculator.

The header exchange quote is the deliberate inline exception: `USD 1 = R$ x = CNY x`, always on one line. Source and quote time belong in its tooltip.
