import { useFormContext } from "react-hook-form";
import { grossWeight, netWeight, productFobUsd, type ImportItem } from "@exporta/domain";
import { Field, FieldLabel } from "./ui/field";
import { NumberInput } from "./ui/number-input";
import { FormInput } from "./ui/form-input";
import { MoneyAmount } from "./money-amount";
import { useLocale } from "../lib/locale-context";
import { translateUiText } from "../i18n";

export function ProductValuationFields({ item, defaultReduction }: { item: ImportItem | null; defaultReduction: number }) {
  const form = useFormContext();
  const values = form.watch();
  const locale = useLocale(), text = (label: string) => translateUiText(locale, label);
  const numeric = (key: string) => values[key] === "" || values[key] === undefined ? undefined : Number(values[key]);
  const draft = { ...item, quantity: numeric("quantity") ?? 0, grossWeightKg: numeric("grossWeightKg") ?? 0, boxWeightKg: numeric("boxWeightKg"), boxCount: numeric("boxCount"), unitPriceUsd: numeric("unitPriceUsd") ?? 0, netWeightKg: numeric("netWeightKg"), netWeightReductionRate: numeric("netWeightReductionRate"), pautaUsdPerKg: numeric("pautaUsdPerKg"), surplusUsdPerKg: numeric("surplusUsdPerKg") } as ImportItem;
  return <section className="product-valuation-fields full" data-localized>
    <h3>{text("Peso líquido e formação do FOB")}</h3>
    <p>{text("Peso líquido = peso bruto × (1 − desconto / 100). FOB = (pauta + sobra) × peso líquido. Sem pauta, usamos quantidade × preço unitário.")}</p>
    <div className="form-grid">
      <Field><FieldLabel>{text("Desconto do peso bruto (%)")}</FieldLabel><NumberInput name="netWeightReductionRate" defaultValue={item?.netWeightReductionRate ?? (item?.netWeightKg !== undefined ? undefined : defaultReduction)} decimalScale={4} suffix="%" max={100} /></Field>
      {draft.netWeightReductionRate === undefined ? <Field><FieldLabel>{text("Peso líquido informado (kg)")}</FieldLabel><NumberInput name="netWeightKg" defaultValue={item?.netWeightKg} decimalScale={6} suffix="kg" /></Field> : <div className="financial-readout"><FormInput type="hidden" name="netWeightKg" defaultValue={String(item?.netWeightKg ?? "")} /><span>{text("Peso líquido calculado (kg)")}</span><strong>{new Intl.NumberFormat(locale, { maximumFractionDigits: 6 }).format(netWeight(draft) ?? 0)}</strong><small>{text("Peso bruto total (kg)")}: {new Intl.NumberFormat(locale, { maximumFractionDigits: 6 }).format(grossWeight(draft))}</small></div>}
      <Field><FieldLabel>{text("Pauta (USD/kg)")}</FieldLabel><NumberInput name="pautaUsdPerKg" defaultValue={item?.pautaUsdPerKg} currency="USD" decimalScale={6} fixedDecimalScale={false} /></Field>
      <Field><FieldLabel>{text("Sobra (USD/kg)")}</FieldLabel><NumberInput name="surplusUsdPerKg" defaultValue={item?.surplusUsdPerKg} currency="USD" decimalScale={6} fixedDecimalScale={false} /></Field>
      <div className="financial-readout"><span>{text("Pauta + sobra (USD/kg)")}</span><MoneyAmount value={(draft.pautaUsdPerKg ?? 0) + (draft.surplusUsdPerKg ?? 0)} currency="USD" /></div>
      <div className="financial-readout"><span>{text("FOB calculado (USD)")}</span><MoneyAmount value={productFobUsd(draft)} currency="USD" /></div>
    </div>
  </section>;
}
