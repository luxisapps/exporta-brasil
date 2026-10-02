export * from "./port-cities.js";
export { productQuantity, defaultNetWeightReductionRate, grossWeight, netWeight, productFobUsd, applyProductDefaults } from "./product-valuation.js";
import { calculateWorksheetImport, type ItemPricing, type PricingTotals } from "./item-pricing.js";
export { effectiveTaxRate } from "./item-pricing.js";
export type { ItemPricing, PricingTotals } from "./item-pricing.js";
export type ImportStatus = "draft" | "quotation" | "awaiting_approval" | "awaiting_shipment" | "in_transit" | "at_port" | "customs" | "cleared" | "completed";
export type PortStatus = "awaiting_departure" | "in_transit" | "awaiting_berth" | "unloading" | "customs_clearance" | "released";
export type CustomsChannel = "green" | "yellow" | "red" | "gray";
/** `unassigned` representa uma operação sem parametrização aduaneira ainda. */
export type CustomsSignal = CustomsChannel | "unassigned";

export type TaxRateCode = "ii" | "ipi" | "pis_import" | "cofins_import" | "icms_import" | "siscomex" | "afrmm" | "pis_sale" | "cofins_sale" | "ipi_sale" | "icms_sale" | "csll" | "irpj" | "irpj_additional";
export const fixedTaxRateCodes: TaxRateCode[] = ["pis_import", "cofins_import", "pis_sale", "cofins_sale", "icms_sale", "csll", "irpj", "irpj_additional"];
export const productTaxRateCodes: TaxRateCode[] = ["ii", "ipi"];
export type TaxRateSource = "default" | "ncm" | "siscomex" | "manual";
export type TaxRate = { code: TaxRateCode; rate: number; source: TaxRateSource; overridden?: boolean; updatedAt?: string };
export type ExpenseAllocationMethod = "fob" | "weight" | "volume" | "quantity" | "fixed";
export type ExpenseStatus = "estimated" | "approved" | "contracted" | "invoiced" | "paid";
export type ExpenseKind = "freight" | "insurance" | "siscomex" | "afrmm" | "other";
export type ImportExpense = { defaultExpenseSource?: string; kind?: ExpenseKind; id: string; category: string; label: string; amount: number; currency: "BRL" | "USD"; exchangeRate?: number; allocationMethod: ExpenseAllocationMethod; status: ExpenseStatus; vendor?: string; document?: string; dueDate?: string; paidAt?: string; notes?: string };
export type BudgetStatus = "draft" | "approved" | "superseded";
export type ShipmentStatus = "not_shipped" | "purchase_confirmed" | "shipped" | "arrived" | "closed";
/** calculationModel and marginMethod are compatibility metadata; the engine always uses worksheet + markup. */
export type ImportBudget = { calculationModel?: "legacy" | "worksheet"; priceBasis?: "fob" | "cif"; freightWeightKg?: number; taxInputPolicy?: "per_product"; marginMethod?: "sale_margin" | "markup"; id: string; name: string; number: number; status: BudgetStatus; createdAt: string; approvedAt?: string; approvedBy?: string; exchangeRate: number; marginRate: number; taxRates: TaxRate[]; expenses: ImportExpense[]; notes?: string };

export type ImportItem = {
  id: string;
  name: string;
  ncm: string;
  quantity: number;
  unitPriceUsd: number;
  /** Peso por unidade, mantido por compatibilidade com as operações atuais. */
  grossWeightKg: number;
  /** Peso líquido TOTAL do produto, não por unidade. */
  netWeightKg?: number;
  netWeightReductionRate?: number;
  pautaUsdPerKg?: number;
  surplusUsdPerKg?: number;
  sourcePriceBasis?: "fob" | "cif";
  iiRate: number;
  ipiRate: number;
  chineseName?: string;
  englishName?: string;
  sku?: string;
  description?: string;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  boxWeightKg?: number;
  unitsPerBox?: number;
  boxCount?: number;
  totalVolumeM3?: number;
  leadTime?: string;
  taxRates?: TaxRate[];
};

export type OperationTimelineEntry = { id: string; title: string; description?: string; occurredAt: string; actorId?: string; actorName?: string; recordedAt?: string; type: "milestone" | "status" | "note" };
export type OperationTask = { id: string; title: string; assigneeId?: string; assignee?: string; dueDate?: string; completed: boolean; createdAt: string };
export type OperationDocument = { id: string; type: string; title: string; reference?: string; issuedAt?: string; expiresAt?: string; status: "pending" | "available" | "expired"; createdAt: string };

export type Customer = { country?: string; id: string; legalName: string; tradeName: string; taxId: string; contactName: string; email: string; phone: string; postalCode?: string; street?: string; number?: string; complement?: string; district?: string; city?: string; state?: string; registrationStatus?: string; status: "active" | "inactive"; createdAt: string };
export type PortFacility = { id: string; name: string; type: string; state: string; municipality: string; operationalStatus: string; management: string; waterway: string | null };

export type ImportOperation = { id: string; reference: string; portCityId?: string; portCityName?: string; customerId?: string; customer: string; assigneeId?: string; assigneeName?: string; port: string; container: string; status: ImportStatus; portStatus: PortStatus; customsChannel: CustomsSignal; eta: string; createdAt: string; updatedAt: string; exchangeRate: number; freightBrl: number; insuranceBrl: number; portExpensesBrl: number; items: ImportItem[]; shipmentStatus?: ShipmentStatus; budgets?: ImportBudget[]; actualExpenses?: ImportExpense[]; timeline?: OperationTimelineEntry[]; tasks?: OperationTask[]; documents?: OperationDocument[] };

/** Sequence follows the highest existing reference for the Brazilian business year. */
export function nextImportReference(operations: Iterable<Pick<ImportOperation, "reference">>, year = Number(new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "America/Sao_Paulo" }).format(new Date()))) {
  const pattern = new RegExp(`^EB-${year}-(\\d+)$`);
  let highest = 0;
  for (const operation of operations) {
    const match = pattern.exec(operation.reference);
    const sequence = match ? Number(match[1]) : 0;
    if (Number.isSafeInteger(sequence)) highest = Math.max(highest, sequence);
  }
  return `EB-${year}-${String(highest + 1).padStart(3, "0")}`;
}

export const importStatusMeta: Record<ImportStatus, { label: string; tone: "neutral" | "info" | "warning" | "success" }> = { draft:{label:"Rascunho",tone:"neutral"}, quotation:{label:"Estimando custos",tone:"info"}, awaiting_approval:{label:"Aguardando aprovação",tone:"warning"}, awaiting_shipment:{label:"Aguardando embarque",tone:"info"}, in_transit:{label:"Em trânsito",tone:"info"}, at_port:{label:"No porto",tone:"warning"}, customs:{label:"Em desembaraço",tone:"warning"}, cleared:{label:"Liberada",tone:"success"}, completed:{label:"Concluída",tone:"success"} };
export const portStatusMeta: Record<PortStatus, { label: string; detail: string }> = { awaiting_departure:{label:"Aguardando embarque",detail:"Documentação de origem em conferência"}, in_transit:{label:"Em trânsito marítimo",detail:"Navio a caminho do porto de destino"}, awaiting_berth:{label:"Aguardando atracação",detail:"Chegada confirmada; aguardando janela do terminal"}, unloading:{label:"Em descarga",detail:"Contêiner em movimentação no terminal"}, customs_clearance:{label:"Em desembaraço aduaneiro",detail:"Processo sob análise da alfândega"}, released:{label:"Carga liberada",detail:"Disponível para retirada programada"} };
export const customsChannelMeta: Record<CustomsSignal, { label: string; detail: string }> = { unassigned:{label:"Sem canal",detail:"Canal ainda não informado"}, green:{label:"Canal verde",detail:"Desembaraço automático"}, yellow:{label:"Canal amarelo",detail:"Exame documental"}, red:{label:"Canal vermelho",detail:"Exame documental e físico"}, gray:{label:"Canal cinza",detail:"Apuração de indícios de fraude"} };
export const shipmentStatusMeta: Record<ShipmentStatus, { label: string }> = { not_shipped:{label:"Não embarcado"}, purchase_confirmed:{label:"Compra confirmada"}, shipped:{label:"Embarcado"}, arrived:{label:"Chegou ao destino"}, closed:{label:"Fechada"} };
export const taxRateLabels: Record<TaxRateCode, string> = { ii:"II", ipi:"IPI", pis_import:"PIS-importação", cofins_import:"COFINS-importação", icms_import:"ICMS-importação", siscomex:"Taxa Siscomex", afrmm:"AFRMM", pis_sale:"PIS-saída", cofins_sale:"COFINS-saída", ipi_sale:"IPI-saída", icms_sale:"ICMS-saída", csll:"CSLL", irpj:"IRPJ", irpj_additional:"Adicional IRPJ" };

const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const amountBrl = (expense: ImportExpense, exchangeRate: number) => expense.currency === "USD" ? expense.amount * (expense.exchangeRate || exchangeRate) : expense.amount;
export function activeBudget(operation: Pick<ImportOperation, "budgets">) { return operation.budgets?.find((budget) => budget.status === "approved") ?? operation.budgets?.find((budget) => budget.status === "draft"); }
export function hasApprovedBudget(operation: Pick<ImportOperation, "budgets">) { return operation.budgets?.some((budget) => budget.status === "approved") ?? false; }
export const costOperationStatuses: ImportStatus[] = ["draft", "quotation", "awaiting_approval"];
export const approvedOperationStatuses: ImportStatus[] = ["awaiting_shipment", "in_transit", "at_port", "customs", "cleared", "completed"];
export function operationStatusOptions(operation: Pick<ImportOperation, "budgets">): ImportStatus[] { return hasApprovedBudget(operation) ? approvedOperationStatuses : costOperationStatuses; }
/** Keeps legacy status values in storage while presenting only states valid for the current phase. */
export function effectiveOperationStatus(operation: Pick<ImportOperation, "budgets" | "status">): ImportStatus {
  const options = operationStatusOptions(operation);
  return options.includes(operation.status) ? operation.status : hasApprovedBudget(operation) ? "awaiting_shipment" : "quotation";
}
export function approveOperationCosts(operation: ImportOperation, fallbackBudget: ImportBudget, actorName: string, approvedAt = new Date().toISOString()): Partial<ImportOperation> {
  if (!calculateImport(operation).calculationReady) throw new Error("Revise os alertas da estimativa antes de aprovar.");
  // Persist the same premises used in the preview, including unstructured beta estimates.
  const resolved = pricingBudget(operation);
  const current = activeBudget(operation) ? resolved : { ...resolved, id:fallbackBudget.id, createdAt:fallbackBudget.createdAt };
  const approved = { ...current, status: "approved" as const, approvedAt, approvedBy: actorName };
  const budgets = operation.budgets?.some((budget) => budget.id === current.id) ? operation.budgets.map((budget) => budget.id === current.id ? approved : budget) : [...(operation.budgets ?? []), approved];
  return { budgets, status: approvedOperationStatuses.includes(operation.status) ? operation.status : "awaiting_shipment", shipmentStatus: operation.shipmentStatus ?? "not_shipped" };
}
/** The company's spreadsheet is the only calculation engine, including beta records. */
export function pricingBudget(operation: Pick<ImportOperation, "items" | "exchangeRate" | "freightBrl" | "insuranceBrl" | "portExpensesBrl" | "budgets">): ImportBudget {
  const current = activeBudget(operation);
  const expenses: ImportExpense[] = current?.expenses ?? [
    { id:"initial-freight",category:"Frete internacional",label:"Frete internacional",kind:"freight",amount:operation.freightBrl,currency:"BRL",allocationMethod:"fob",status:"estimated" },
    { id:"initial-insurance",category:"Seguro",label:"Seguro",kind:"insurance",amount:operation.insuranceBrl,currency:"BRL",allocationMethod:"fob",status:"estimated" },
    { id:"initial-port",category:"Despesas portuárias",label:"Despesas portuárias",kind:"other",amount:operation.portExpensesBrl,currency:"BRL",allocationMethod:"fob",status:"estimated" }
  ];
  return { id:"initial-budget",name:"Orçamento inicial",number:1,status:"draft",createdAt:"",exchangeRate:operation.exchangeRate,marginRate:0,taxRates:[], ...current,
    calculationModel:"worksheet",marginMethod:"markup",priceBasis:current?.priceBasis ?? "fob",
    expenses:expenses.map(expense => {
      // Restore the types of the old beta seed's named international expenses.
      const category = expense.category.toLowerCase(), label = expense.label.toLowerCase();
      const kind = expense.kind ?? (["frete", "frete internacional", "freight"].includes(category) || label === "frete internacional" ? "freight" : ["seguro", "seguro internacional", "insurance"].includes(category) || label === "seguro internacional" ? "insurance" : "other");
      return { ...expense, kind };
    }) };
}
export function calculateImport(operation: Pick<ImportOperation, "items" | "exchangeRate" | "freightBrl" | "insuranceBrl" | "portExpensesBrl" | "budgets">) {
  const calculated = calculateWorksheetImport(operation, pricingBudget(operation));
  return { ...calculated, budget:activeBudget(operation) ? calculated.budget : undefined };
}
export function calculateActualExpenses(operation: Pick<ImportOperation, "actualExpenses" | "exchangeRate" | "budgets">) { const budget = activeBudget(operation); const rateValue = budget?.exchangeRate ?? operation.exchangeRate; return round((operation.actualExpenses ?? []).reduce((sum, expense) => sum + amountBrl(expense, rateValue), 0)); }
