import { useState } from "react";
import { selectProducts } from "../lib/product-table";
import { calculateImport, taxRateLabels, type ImportBudget, type ImportItem, type ItemPricing, type TaxRateCode } from "@exporta/domain";
import { FieldSelect, SelectOption } from "./ui/field-select";
import { Input } from "./ui/input";
import { NumberInput } from "./ui/number-input";
import { Button } from "./ui/button";
import { Pagination } from "./ui/pagination";
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
export function ItemPricingPanel({ calculated, onEdit }: { calculated: ReturnType<typeof calculateImport>; onEdit: (item: ImportItem) => void }) {
  const locale = useLocale(), text = (value: string) => translateUiText(locale, value);
  const [group, setGroup] = useState("base"), [query, setQuery] = useState(""), [page, setPage] = useState(1);
  if (!calculated.pricingTotals) return null;
  const items = selectProducts(calculated.items, query, "original", locale);
  const pages = Math.max(1, Math.ceil(items.length / 10)), currentPage = Math.min(page, pages), visible = items.slice((currentPage - 1) * 10, currentPage * 10);
  const totals = calculated.pricingTotals;
  return <section className="panel item-pricing-panel" data-localized><div className="panel-header"><div><h2>{text("Preço por item")}</h2><p>{text("Bases, entrada, venda e saída calculadas pelo modelo da planilha.")}</p></div></div><div className="item-pricing-toolbar"><Input autoComplete="off" aria-label={text("Buscar produtos")} placeholder={text("Nome, SKU ou NCM")} value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /><FieldSelect label={text("Visão dos cálculos")} value={group} onValueChange={(value) => { setGroup(value); setPage(1); }}><SelectOption value="base">{text("Base e custos")}</SelectOption><SelectOption value="entry">{text("Impostos de entrada")}</SelectOption><SelectOption value="sale">{text("Venda")}</SelectOption><SelectOption value="exit">{text("Impostos de saída")}</SelectOption></FieldSelect></div><div className="table-scroll"><table><thead><tr><th>{text("Produto / NCM")}</th><th>{text("Qtd.")}</th><th>{text("Peso líquido total (kg)")}</th>{columns[group].map((column) => <th key={column.label}>{text(column.label)}</th>)}<th>{text("Alíquotas")}</th></tr></thead><tbody>{visible.map((item) => <tr key={item.id}><td><strong>{item.name || item.chineseName}</strong><small>{item.ncm || "—"}</small></td><td>{item.quantity}</td><td>{item.netWeightKg === undefined ? "—" : new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(item.netWeightKg)}</td>{columns[group].map((column) => { const amount = !calculated.calculationReady && ["sale", "exit"].includes(group) ? null : column.input ? item[column.input] : item.pricing?.[column.key!]; return <td key={column.label}>{amount === null || amount === undefined ? "—" : <MoneyAmount value={amount} currency={column.currency ?? "BRL"} />}</td>; })}<td><Button type="button" className="button button--secondary" onClick={() => onEdit(item)}>{text("Editar produto")}</Button></td></tr>)}{!visible.length && <tr><td colSpan={columns[group].length + 4}>{text("Nenhum produto encontrado.")}</td></tr>}</tbody></table></div><div className="item-pricing-footer"><span>{items.length} · {text("Produtos")}</span><Pagination label={text("Paginação dos produtos")} page={currentPage} pageCount={pages} onPageChange={setPage} previousLabel={text("Anterior")} nextLabel={text("Próxima")} pageLabel={`${currentPage} / ${pages}`} /></div><div className="item-pricing-totals"><div><span>{text("Venda total")}</span>{totals.saleTotal === null ? "—" : <MoneyAmount value={totals.saleTotal} />}</div><div><span>{text("Saída: saldo total")}</span>{calculated.calculationReady ? <MoneyAmount value={totals.outputTaxes} /> : "—"}</div><div><span>{text("Custo + saldo de saída")}</span>{calculated.calculationReady ? <MoneyAmount value={totals.costWithOutputTaxes} /> : "—"}</div></div><p className="item-pricing-note">{text("PIS, COFINS e IPI de saída descontam os créditos de entrada. Saldos negativos representam créditos no modelo da planilha.")}</p><p className="item-pricing-note">{text("CSLL, IRPJ e adicional são estimativas sobre o acréscimo, conforme a planilha da empresa. Confirme o enquadramento com o contador.")}</p></section>;
}
