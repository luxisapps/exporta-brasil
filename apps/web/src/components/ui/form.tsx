import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { FormProvider, useController, useForm, useFormContext, type FieldErrors, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { FormSchema, FormValues } from "../../lib/form-schemas";
import { FieldError, useFieldId } from "./field";
import { useLocale } from "../../lib/locale-context";
import { translateUiText } from "../../i18n";
import { Button } from "./button";
import { Spinner } from "./spinner";

export type FormSubmit = (values: FormValues, element: HTMLFormElement) => void | Promise<void>;
export function useSchemaForm(schema: FormSchema, defaultValues: FormValues = {}) {
  return useForm<FormValues>({ resolver: zodResolver(schema), defaultValues, mode: "onBlur", reValidateMode: "onChange", shouldUnregister: true, shouldFocusError: false });
}
type Props = Omit<ComponentPropsWithoutRef<"form">, "onSubmit" | "onInvalid"> & { schema: FormSchema; form?: UseFormReturn<FormValues>; onSubmit: FormSubmit; onInvalid?: (names: string[]) => void; };
export const Form = forwardRef<HTMLFormElement, Props>(({ schema, form, onSubmit, onInvalid, children, ...props }, ref) => {
  const internal = useSchemaForm(schema), methods = form ?? internal;
  const element = useRef<HTMLFormElement>(null);
  const summary = useRef<HTMLDivElement>(null), submitting = useRef(false);
  const [labels, setLabels] = useState<Record<string, string>>({});
  useImperativeHandle(ref, () => element.current!);
  const locale = useLocale();
  const focus = (names: string[]) => { if (!names.length) return; onInvalid?.(names); requestAnimationFrame(() => methods.setFocus(names[0])); };
  const invalid = (errors: FieldErrors<FormValues>) => {
    const names = Object.keys(errors);
    if (!names.length) return;
    setLabels(Object.fromEntries(names.map(name => { const control = element.current?.querySelector(`[name="${CSS.escape(name)}"]`); const label = control?.closest(".field")?.querySelector("[data-slot=field-label], span[id]")?.textContent; return [name, label ?? ""]; })));
    onInvalid?.(names);
    requestAnimationFrame(() => names.length > 1 ? summary.current?.focus() : methods.setFocus(names[0]));
  };
  const errors = Object.entries(methods.formState.errors).filter(([name]) => name !== "root");
  return <FormProvider {...methods}><form {...props} ref={element} noValidate aria-busy={props["aria-busy"] || methods.formState.isSubmitting} onReset={() => methods.reset()} onSubmit={event => {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    methods.clearErrors("root");
    void methods.handleSubmit(async values => { if (element.current) await onSubmit(values, element.current); }, invalid)(event).catch(() => methods.setError("root", { message: "Não foi possível salvar. Tente novamente." })).finally(() => { submitting.current = false; });
  }}>
    {methods.formState.errors.root?.message && <div className="full"><FieldError message={methods.formState.errors.root.message} /></div>}
    {methods.formState.submitCount > 0 && errors.length > 1 && <div ref={summary} tabIndex={-1} className="form-error-summary full" role="alert"><strong>{translateUiText(locale, "Revise os campos destacados antes de salvar.")}</strong><ul>{errors.map(([name, error]) => <li key={name}><Button type="button" onClick={() => focus([name])}>{labels[name] && `${translateUiText(locale, labels[name])}: `}{translateUiText(locale, error?.message || "Preencha este campo.")}</Button></li>)}</ul></div>}
    {children}
  </form></FormProvider>;
});
Form.displayName = "Form";

export function FormSubmitButton({ disabled, children, ...props }: ComponentPropsWithoutRef<typeof Button>) {
  const form = useFormContext<FormValues>();
  const busy = form?.formState.isSubmitting ?? false;
  return <Button {...props} type="submit" disabled={disabled || busy} aria-busy={busy}>{busy && <Spinner />}{children}</Button>;
}

export type FieldBinding = { value: string; onChange: (value: string) => void; onBlur: () => void; ref: (element: unknown) => void; id: string; "aria-invalid": boolean; "aria-describedby"?: string };
type ControlProps = { name?: string; defaultValue?: string; value?: string; children: (binding?: FieldBinding) => ReactNode; showError?: boolean };
/** Connects the shared shadcn controls; unnamed filters remain independent of forms. */
export function FormControl(props: ControlProps) {
  const form = useFormContext<FormValues>();
  return form && props.name ? <RegisteredControl {...props} name={props.name} form={form} /> : <>{props.children()}</>;
}
function RegisteredControl({ name, defaultValue = "", value, children, showError = true, form }: ControlProps & { name: string; form: UseFormReturn<FormValues> }) {
  const { field, fieldState } = useController({ name, control: form.control, defaultValue: value ?? defaultValue });
  const id = useId();
  const fieldId = useFieldId() ?? id;
  useEffect(() => { if (value !== undefined && form.getValues(name) !== value) form.setValue(name, value, { shouldValidate: fieldState.isTouched || form.formState.isSubmitted }); }, [value, name, form, fieldState.isTouched, form.formState.isSubmitted]);
  const errorId = `${id}-error`;
  return <>{children({ value: field.value ?? "", onChange: field.onChange, onBlur: field.onBlur, ref: field.ref, id: fieldId, "aria-invalid": fieldState.invalid, "aria-describedby": fieldState.invalid ? errorId : undefined })}{showError && <FieldError id={errorId} message={fieldState.error?.message} />}</>;
}
