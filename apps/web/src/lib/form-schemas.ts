import { z } from "zod";
import { isValidCnpj } from "./company-fields";
import { parseLocalDate } from "./form-values";

export type FormValues = Record<string, string>;
export type FormSchema = z.ZodType<FormValues, FormValues>;
const object = <T extends z.ZodRawShape>(shape: T) => z.object(shape).catchall(z.string());
const text = z.string();
const required = text.refine(value => Boolean(value.trim()), "Preencha este campo.");
const email = text.refine(value => !value.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()), "Informe um e-mail válido.");
const password = z.string().min(8, "A senha deve ter pelo menos 8 caracteres.");
const date = (mandatory = false, time = false) => text.refine(value => {
  if (!value) return !mandatory;
  const [day, hour] = value.split("T");
  return Boolean(parseLocalDate(day)) && (!time || /^([01]\d|2[0-3]):[0-5]\d$/.test(hour ?? ""));
}, time ? "Informe uma data e um horário válidos." : "Selecione uma data válida.");
const numeric = (mandatory = false, integer = false, minimum = 0) => text.superRefine((value, context) => {
  if (!value.trim()) { if (mandatory) context.addIssue({ code: "custom", message: "Preencha este campo." }); return; }
  const number = Number(value);
  if (!Number.isFinite(number)) context.addIssue({ code: "custom", message: "Informe um número válido." });
  else if (number < minimum) context.addIssue({ code: "custom", message: minimum === 0 ? "O valor não pode ser negativo." : "Informe uma quantidade maior que zero." });
  else if (integer && !Number.isInteger(number)) context.addIssue({ code: "custom", message: "Informe um número inteiro." });
});

// Only essential fields block saving. An incomplete product can be completed later.
export const formSchemas = {
  login: object({ email: required.pipe(email), password: z.string().min(1, "Preencha este campo.") }),
  initialPassword: object({ password, confirmation: required }).refine(values => values.password === values.confirmation, { path: ["confirmation"], message: "As senhas não coincidem." }),
  userCreate: object({ name: required, email: required.pipe(email), role: required, initialPassword: password }),
  userEdit: object({ name: required, email: required.pipe(email), role: required }),
  profile: object({ name: required }),
  import: object({ customerId: text.refine(value => Boolean(value), "Selecione um cliente."), eta: date(true), port: text }),
  customer: object({ legalName: required, country: required, taxId: text, email }).superRefine((values, context) => {
    if (values.country === "BR" && values.taxId.trim() && !isValidCnpj(values.taxId)) context.addIssue({ code: "custom", path: ["taxId"], message: "Informe um CNPJ válido." });
  }),
  item: object({ name: required, ncm: text.refine(value => !value || /^\d{8}$/.test(value), "O NCM deve ter 8 dígitos."), quantity: numeric(true, true, 1), unitPriceUsd: numeric(), grossWeightKg: numeric(), netWeightKg: numeric(), netWeightReductionRate: numeric().default("").refine(value => !value || Number(value) <= 100, "Informe um percentual entre 0 e 100."), pautaUsdPerKg: numeric().default(""), surplusUsdPerKg: numeric().default(""), boxCount: numeric(), boxWeightKg: numeric(), unitsPerBox: numeric(false, true), totalVolumeM3: numeric() }).superRefine((values, context) => {
    for (const [name, value] of Object.entries(values)) if (name.startsWith("tax_") && value !== "" && (!Number.isFinite(Number(value)) || Number(value) < 0)) context.addIssue({ code: "custom", path: [name], message: "Informe uma alíquota válida, igual ou maior que zero." });
  }),
  timeline: object({ title: required, occurredAt: date(true, true), type: required }),
  task: object({ title: required, dueDate: date() }),
  document: object({ title: required, type: required, status: required, issuedAt: date(), expiresAt: date() }),
  container: object({ container: text }),
  taxSettings: z.record(z.string(), numeric(true)).superRefine((values, context) => { if (Number(values.netWeightReductionRate) > 100) context.addIssue({ code: "custom", path: ["netWeightReductionRate"], message: "Informe um percentual entre 0 e 100." }); })
} satisfies Record<string, FormSchema>;

/** Preserve the existing serializers while the source of values is React Hook Form. */
export const formValues = (values: FormValues) => ({ get: (name: string) => values[name] ?? null, has: (name: string) => Object.hasOwn(values, name) });
