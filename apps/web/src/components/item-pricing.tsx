import { useState } from "react";
import { calculateImport, grossWeight, netWeight, effectiveTaxRate, taxRateLabels, type ImportBudget, type ImportItem, type ItemPricing, type TaxRateCode } from "@exporta/domain";
import { FieldSelect, SelectOption } from "./ui/field-select";
import { NumberInput } from "./ui/number-input";
import { Button } from "./ui/button";
import { MoneyAmount } from "./money-amount";
import { useLocale } from "../lib/locale-context";
import { translateUiText } from "../i18n";

export function ProductTaxFields({ item, budget }: { item: ImportItem | null; budget?: ImportBudget }) {
  const locale = useLocale(), text = (value: string) => translateUiText(locale, value);
  const groups: [string, TaxRateCode[]][] = [["Impostos de entrada", ["ii", "ipi", "pis_import", "cofins_import"]], ["Impostos de saída", ["pis_sale", "cofins_sale", "ipi_sale", "icms_sale", "csll", "irpj", "irpj_additional"]]];
  return <>{groups.map(([title, codes]) => <fieldset className="product-tax-fields full" key={title} data-localized><legend>{text(title)}</legend><div>{codes.map((code) => <ProductTaxField key={code} code={code} item={item} budget={budget} />)}</div></fieldset>)}</>;
}
function ProductTaxField({ code, item, budget }: { code: TaxRateCode; item: ImportItem | null; budget?: ImportBudget }) {
  const locale = useLocale(), text = (value: string) => translateUiText(locale, value);
  const explicit = item?.taxRates?.find((rate) => rate.code === code), legacy = code === "ii" ? item?.iiRate : code === "ipi" ? item?.ipiRate : undefined;
  const [mode, setMode] = useState(explicit || legacy && legacy > 0 ? "custom" : "inherit");
  const defaultRate = budget?.taxRates.find((rate) => rate.code === code)?.rate ?? 0;
  return <div className="product-tax-field" data-localized><span>{text(taxRateLabels[code])}</span><FieldSelect label={`${text(taxRateLabels[code])}: ${text("Origem da alíquota")}`} value={mode} onValueChange={setMode}><SelectOption value="inherit">{`${text("Usar parametrização")} (${new Intl.NumberFormat(locale, { maximumFractionDigits: 4 }).format(defaultRate)}%)`}</SelectOption><SelectOption value="custom">{text("Definir no produto")}</SelectOption></FieldSelect>{mode === "custom" && <NumberInput name={`tax_${code}`} aria-label={text(taxRateLabels[code])} min="0" defaultValue={explicit?.rate ?? legacy ?? defaultRate} decimalScale={4} suffix="%" />}</div>;
}
type Column = { label: string; key?: keyof ItemPricing; input?: "ii" | "ipi" | "pis" | "cofins" | "taxes" | "totalCost" | "unitCost"; currency?: "BRL" | "USD" };
const columns: Record<string, Column[]> = {
  base: [{ label: "Valor total USD", key: "inputUsd", currency: "USD" }, { label: "Valor convertido", key: "inputBrl" }, { label: "Base CIF", key: "cifBrl" }, { label: "Custo total", input: "totalCost" }, { label: "Custo unitário", input: "unitCost" }],
  entry: [{ label: "II", input: "ii" }, { label: "IPI", input: "ipi" }, { label: "PIS-importação", input: "pis" }, { label: "COFINS-importação", input: "cofins" }, { label: "Taxa Siscomex", key: "siscomex" }, { label: "AFRMM", key: "afrmm" }, { label: "Despesas", key: "otherExpenses" }, { label: "Custo total", input: "totalCost" }],
  sale: [{ label: "Custo total", input: "totalCost" }, { label: "Acréscimo para venda", key: "markup" }, { label: "Venda total", key: "saleTotal" }, { label: "Venda unitária", key: "saleUnit" }],
  exit: [{ label: "PIS: débito", key: "pisDebit" }, { label: "PIS: crédito", key: "pisCredit" }, { label: "PIS: saldo", key: "pisNet" }, { label: "COFINS: débito", key: "cofinsDebit" }, { label: "COFINS: crédito", key: "cofinsCredit" }, { label: "COFINS: saldo", key: "cofinsNet" }, { label: "IPI: débito", key: "ipiDebit" }, { label: "IPI: crédito", key: "ipiCredit" }, { label: "IPI: saldo", key: "ipiNet" }, { label: "ICMS-saída", key: "icmsSale" }, { label: "CSLL", key: "csll" }, { label: "IRPJ", key: "irpj" }, { label: "Adicional IRPJ", key: "irpjAdditional" }, { label: "Saída: saldo total", key: "outputTaxes" }]
};
export function ItemCalculation({ item, calculated }: { item: ReturnType<typeof calculateImport>["items"][number]; calculated: ReturnType<typeof calculateImport> }) {
  const locale = useLocale(), text = (value: string) => translateUiText(locale, value);
  const [group, setGroup] = useState("base");
  const amount = (column: Column) => !calculated.calculationReady && ["sale", "exit"].includes(group) ? null : column.input ? item[column.input] : item.pricing?.[column.key!];
  const weight = (value: number | undefined) => value === undefined ? "—" : new Intl.NumberFormat(locale, { maximumFractionDigits: 6 }).format(value);
  const rateCodes: TaxRateCode[] = group === "entry" ? ["ii", "ipi", "pis_import", "cofins_import"] : group === "exit" ? ["pis_sale", "cofins_sale", "ipi_sale", "icms_sale", "csll", "irpj", "irpj_additional"] : [];
  return <div className="item-calculation" data-localized>
    <p className="muted"><strong>{item.name || item.chineseName}</strong> · {item.ncm || "—"} · {item.quantity} {text("unidades")}</p>
    <FieldSelect label={text("Visão dos cálculos")} value={group} onValueChange={setGroup}><SelectOption value="base">{text("Base e custos")}</SelectOption><SelectOption value="entry">{text("Impostos de entrada")}</SelectOption><SelectOption value="sale">{text("Venda")}</SelectOption><SelectOption value="exit">{text("Impostos de saída")}</SelectOption></FieldSelect>
    {group === "base" && <><div className="item-calculation-grid">{[["Peso bruto total (kg)",weight(grossWeight(item))],["Desconto do peso bruto (%)",item.netWeightReductionRate ?? "—"],["Peso líquido total (kg)",weight(netWeight(item))]].map(([label,value]) => <div className="financial-readout" key={label}><span>{text(String(label))}</span><strong>{value}</strong></div>)}{item.pautaUsdPerKg !== undefined && [["Pauta (USD/kg)",item.pautaUsdPerKg],["Sobra (USD/kg)",item.surplusUsdPerKg ?? 0],["Pauta + sobra (USD/kg)",item.pautaUsdPerKg + (item.surplusUsdPerKg ?? 0)]].map(([label,value]) => <div className="financial-readout" key={label}><span>{text(String(label))}</span><MoneyAmount value={Number(value)} currency="USD" /></div>)}</div>
      <p className="item-pricing-note">{text("Peso líquido = peso bruto × (1 − desconto / 100). FOB = (pauta + sobra) × peso líquido. Sem pauta, usamos quantidade × preço unitário.")}</p>
      <div className="item-calculation-grid"><div className="financial-readout"><span>{text(calculated.budget?.priceBasis === "cif" ? "CIF" : "FOB")}</span><MoneyAmount value={item.pricing?.inputUsd ?? 0} currency="USD" /></div><div className="financial-readout"><span>{text("Frete internacional")}</span><MoneyAmount value={calculated.exchangeRate > 0 ? (item.pricing?.freight ?? 0) / calculated.exchangeRate : 0} currency="USD" /></div><div className="financial-readout"><span>{text(calculated.budget?.priceBasis === "cif" ? "CIF" : "CFR")}</span><MoneyAmount value={(item.pricing?.inputUsd ?? 0) + (calculated.exchangeRate > 0 ? (item.pricing?.freight ?? 0) / calculated.exchangeRate : 0)} currency="USD" /></div></div>
      <p className="item-pricing-note">{text(calculated.budget?.priceBasis === "cif" ? "Os valores importados já incluem frete; não some o frete novamente." : "CFR = FOB + frete internacional. Seguro é somado à base CIF quando informado.")}</p></>}
    <div className="item-calculation-grid">{columns[group].filter(column => group !== "base" || column.key !== "inputUsd").map(column => <div className="financial-readout" key={column.label}><span>{text(column.label)}</span>{amount(column) === null || amount(column) === undefined ? "—" : <MoneyAmount value={amount(column)!} currency={column.currency ?? "BRL"} />}</div>)}</div>
    {rateCodes.length > 0 && <p className="item-pricing-note">{rateCodes.map(code => `${text(taxRateLabels[code])}: ${weight(effectiveTaxRate(item, calculated.budget, code))}%`).join(" · ")}</p>}
    {group === "entry" && <p className="item-pricing-note">{text("II = CIF × alíquota; IPI = (CIF + II) × alíquota; PIS e COFINS = CIF × alíquota. Despesas são rateadas conforme a operação.")}</p>}
    {group === "sale" && <p className="item-pricing-note">{text("Custo total × (1 + acréscimo / 100).")}</p>}
    {group === "exit" && <><p className="item-pricing-note">{text("PIS, COFINS e IPI de saída descontam os créditos de entrada. Saldos negativos representam créditos no modelo da planilha.")}</p><p className="item-pricing-note">{text("CSLL, IRPJ e adicional são estimativas sobre o acréscimo, conforme a planilha da empresa. Confirme o enquadramento com o contador.")}</p></>}
    {!calculated.calculationReady && <ul className="calculation-alerts">{calculated.calculationWarnings.map(warning => <li key={warning}>{text(warning)}</li>)}</ul>}
  </div>;
}
