# Project instructions

## Interface components

Before adding or changing an interactive UI control, check whether the equivalent component exists in [shadcn/ui](https://ui.shadcn.com/docs/components). Use the shadcn component backed by Radix UI when it exists.

If the component is not yet in this repository, add its shadcn-compatible implementation under `apps/web/src/components/ui/` and install its Radix dependency when needed. Do not introduce a native interactive control or a bespoke replacement when shadcn provides the component.

Keep custom styling in the application theme, but preserve the component's accessibility and keyboard behavior.
