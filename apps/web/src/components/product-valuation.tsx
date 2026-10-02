import { useState } from "react";
import { Pagination } from "./ui/pagination";
import { useFormContext } from "react-hook-form";
import { grossWeight, netWeight, productFobUsd, type ImportItem, type ImportOperation, calculateImport } from "@exporta/domain";
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

export function ProductValuationPanel({ operation, calculated }: { operation: ImportOperation; calculated: ReturnType<typeof calculateImport> }) {
  const locale = useLocale(), text = (label: string) => translateUiText(locale, label);
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(calculated.items.length / 10));
  const currentPage = Math.min(page, pageCount);
  const weight = calculated.pricingTotals?.netWeightKg ?? 0;
  const format = (value: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 6 }).format(value);
  return <section className="panel" data-localized><div className="panel-header"><div><h2>{text("Formação dos valores dos produtos")}</h2><p>{text("Do peso bruto ao CFR: valores calculados por produto, antes dos impostos.")}</p></div></div>
    <div className="valuation-totals"><span>{text("Quantidade total")}: <b>{format(operation.items.reduce((sum, item) => sum + item.quantity, 0))}</b></span><span>{text("Peso bruto total (kg)")}: <b>{format(calculated.totalWeight)}</b></span><span>{text("Peso líquido total (kg)")}: <b>{format(weight)}</b></span></div>
    <div className="table-scroll"><table><thead><tr>{["Produto", "Peso líquido total (kg)", "Desconto do peso bruto (%)", "Pauta (USD/kg)", "Sobra (USD/kg)", "Pauta + sobra (USD/kg)", calculated.budget?.priceBasis === "cif" ? "CIF" : "FOB", "FRETE", "CFR"].map(label => <th key={label}>{text(label)}</th>)}</tr></thead><tbody>{calculated.items.slice((currentPage - 1) * 10, currentPage * 10).map(item => <tr key={item.id}><td>{item.name || item.chineseName}</td><td>{format(item.netWeightKg ?? 0)}</td><td>{item.netWeightReductionRate ?? "—"}</td><td>{item.pautaUsdPerKg === undefined ? "—" : <MoneyAmount value={item.pautaUsdPerKg} currency="USD" />}</td><td>{item.surplusUsdPerKg === undefined ? "—" : <MoneyAmount value={item.surplusUsdPerKg} currency="USD" />}</td><td>{item.pautaUsdPerKg === undefined ? "—" : <MoneyAmount value={item.pautaUsdPerKg + (item.surplusUsdPerKg ?? 0)} currency="USD" />}</td><td><MoneyAmount value={item.pricing?.inputUsd ?? 0} currency="USD" /></td><td><MoneyAmount value={calculated.exchangeRate > 0 ? (item.pricing?.freight ?? 0) / calculated.exchangeRate : 0} currency="USD" /></td><td><MoneyAmount value={(item.pricing?.inputUsd ?? 0) + (calculated.exchangeRate > 0 ? (item.pricing?.freight ?? 0) / calculated.exchangeRate : 0)} currency="USD" /></td></tr>)}</tbody></table></div>
    <Pagination page={currentPage} pageCount={pageCount} onPageChange={setPage} label={text("Paginação dos produtos")} previousLabel={text("Anterior")} nextLabel={text("Próxima")} pageLabel={`${currentPage} / ${pageCount}`} />
    {calculated.budget?.priceBasis === "cif" && <p>{text("Os valores importados já incluem frete; não some o frete novamente.")}</p>}
  </section>;
}
