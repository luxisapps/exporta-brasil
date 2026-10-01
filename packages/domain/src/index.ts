export type ImportStatus = "draft" | "quotation" | "awaiting_approval" | "awaiting_shipment" | "in_transit" | "at_port" | "customs" | "cleared" | "completed";
export type PortStatus = "awaiting_departure" | "in_transit" | "awaiting_berth" | "unloading" | "customs_clearance" | "released";
export type CustomsChannel = "green" | "yellow" | "red" | "gray";
/** `unassigned` representa uma operação sem parametrização aduaneira ainda. */
export type CustomsSignal = CustomsChannel | "unassigned";

export type TaxRateCode = "ii" | "ipi" | "pis_import" | "cofins_import" | "icms_import" | "siscomex" | "afrmm" | "pis_sale" | "cofins_sale" | "ipi_sale" | "icms_sale" | "csll" | "irpj" | "irpj_additional";
export type TaxRateSource = "default" | "ncm" | "siscomex" | "manual";
export type TaxRate = { code: TaxRateCode; rate: number; source: TaxRateSource; overridden?: boolean; updatedAt?: string };
export type ExpenseAllocationMethod = "fob" | "weight" | "volume" | "quantity" | "fixed";
export type ExpenseStatus = "estimated" | "approved" | "contracted" | "invoiced" | "paid";
export type ImportExpense = { id: string; category: string; label: string; amount: number; currency: "BRL" | "USD"; exchangeRate?: number; allocationMethod: ExpenseAllocationMethod; status: ExpenseStatus; vendor?: string; document?: string; dueDate?: string; paidAt?: string; notes?: string };
export type BudgetStatus = "draft" | "approved" | "superseded";
export type ShipmentStatus = "not_shipped" | "purchase_confirmed" | "shipped" | "arrived" | "closed";
export type ImportBudget = { id: string; name: string; number: number; status: BudgetStatus; createdAt: string; approvedAt?: string; approvedBy?: string; exchangeRate: number; marginRate: number; taxRates: TaxRate[]; expenses: ImportExpense[]; notes?: string };

export type ImportItem = {
  id: string;
  name: string;
  ncm: string;
  quantity: number;
  unitPriceUsd: number;
  /** Peso por unidade, mantido por compatibilidade com as operações atuais. */
  grossWeightKg: number;
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

export type Customer = { id: string; legalName: string; tradeName: string; taxId: string; contactName: string; email: string; phone: string; postalCode?: string; street?: string; number?: string; complement?: string; district?: string; city?: string; state?: string; registrationStatus?: string; status: "active" | "inactive"; createdAt: string };
export type PortFacility = { id: string; name: string; type: string; state: string; municipality: string; operationalStatus: string; management: string; waterway: string | null };

export type ImportOperation = { id: string; reference: string; customerId?: string; customer: string; assigneeId?: string; assigneeName?: string; port: string; container: string; status: ImportStatus; portStatus: PortStatus; customsChannel: CustomsSignal; eta: string; createdAt: string; updatedAt: string; exchangeRate: number; freightBrl: number; insuranceBrl: number; portExpensesBrl: number; items: ImportItem[]; shipmentStatus?: ShipmentStatus; budgets?: ImportBudget[]; actualExpenses?: ImportExpense[]; timeline?: OperationTimelineEntry[]; tasks?: OperationTask[]; documents?: OperationDocument[] };

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
const rate = (item: ImportItem, budget: ImportBudget | undefined, code: TaxRateCode, legacy: number) => { const override = item.taxRates?.find((entry) => entry.code === code)?.rate; if (override !== undefined) return override; if ((code === "ii" || code === "ipi") && legacy > 0) return legacy; return budget?.taxRates.find((entry) => entry.code === code)?.rate ?? legacy; };
const itemWeight = (item: ImportItem) => item.boxWeightKg && item.boxCount ? item.boxWeightKg * item.boxCount : item.grossWeightKg * item.quantity;
const itemVolume = (item: ImportItem) => item.totalVolumeM3 ?? ((item.lengthCm || 0) * (item.widthCm || 0) * (item.heightCm || 0) * (item.boxCount || 0) / 1_000_000);

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
  // Legacy estimates have no budget-wide rates; approval must preserve their current calculation.
  const current = activeBudget(operation) ?? { ...fallbackBudget, taxRates: [], marginRate: 0 };
  const approved = { ...current, status: "approved" as const, approvedAt, approvedBy: actorName };
  const budgets = operation.budgets?.some((budget) => budget.id === current.id) ? operation.budgets.map((budget) => budget.id === current.id ? approved : budget) : [...(operation.budgets ?? []), approved];
  return { budgets, status: approvedOperationStatuses.includes(operation.status) ? operation.status : "awaiting_shipment", shipmentStatus: operation.shipmentStatus ?? "not_shipped" };
}
export function calculateImport(operation: Pick<ImportOperation, "items" | "exchangeRate" | "freightBrl" | "insuranceBrl" | "portExpensesBrl" | "budgets">) {
  const budget = activeBudget(operation);
  const exchangeRate = budget?.exchangeRate ?? operation.exchangeRate;
  const fobBrl = operation.items.reduce((total, item) => total + item.quantity * item.unitPriceUsd * exchangeRate, 0);
  const totalWeight = operation.items.reduce((total, item) => total + itemWeight(item), 0);
  const totalVolume = operation.items.reduce((total, item) => total + itemVolume(item), 0);
  const expenses = budget ? budget.expenses : [
    { id:"legacy-freight",category:"Frete internacional",label:"Frete internacional",amount:operation.freightBrl,currency:"BRL" as const,allocationMethod:"fob" as const,status:"estimated" as const },
    { id:"legacy-insurance",category:"Seguro",label:"Seguro",amount:operation.insuranceBrl,currency:"BRL" as const,allocationMethod:"fob" as const,status:"estimated" as const },
    { id:"legacy-port",category:"Despesas portuárias",label:"Despesas portuárias",amount:operation.portExpensesBrl,currency:"BRL" as const,allocationMethod:"fob" as const,status:"estimated" as const }
  ];
  const baseExpenses = expenses.reduce((sum, expense) => sum + amountBrl(expense, exchangeRate), 0);
  const allocated = (item: ImportItem) => expenses.reduce((sum, expense) => {
    const total = expense.allocationMethod === "weight" ? totalWeight : expense.allocationMethod === "volume" ? totalVolume : expense.allocationMethod === "quantity" ? operation.items.reduce((qty, candidate) => qty + candidate.quantity, 0) : fobBrl;
    const numerator = expense.allocationMethod === "weight" ? itemWeight(item) : expense.allocationMethod === "volume" ? itemVolume(item) : expense.allocationMethod === "quantity" ? item.quantity : item.quantity * item.unitPriceUsd * exchangeRate;
    return sum + (total > 0 ? amountBrl(expense, exchangeRate) * numerator / total : 0);
  }, 0);
  const items = operation.items.map((item) => {
    const itemFob = item.quantity * item.unitPriceUsd * exchangeRate;
    const allocatedExpenses = allocated(item);
    const ii = itemFob * rate(item, budget, "ii", item.iiRate) / 100;
    const ipi = (itemFob + ii) * rate(item, budget, "ipi", item.ipiRate) / 100;
    const pis = itemFob * rate(item, budget, "pis_import", 0) / 100;
    const cofins = itemFob * rate(item, budget, "cofins_import", 0) / 100;
    const totalCost = itemFob + allocatedExpenses + ii + ipi + pis + cofins;
    return { ...item, itemFob:round(itemFob), allocatedExpenses:round(allocatedExpenses), ii:round(ii), ipi:round(ipi), pis:round(pis), cofins:round(cofins), taxes:round(ii + ipi + pis + cofins), totalCost:round(totalCost), unitCost:item.quantity === 0 ? 0 : round(totalCost / item.quantity) };
  });
  const taxes = items.reduce((total, item) => total + item.ii + item.ipi + item.pis + item.cofins, 0);
  const totalCost = round(fobBrl + baseExpenses + taxes);
  const marginRate = budget?.marginRate ?? 0;
  const suggestedSaleTotal = marginRate >= 0 && marginRate < 100 ? round(totalCost / (1 - marginRate / 100)) : null;
  return { budget, exchangeRate, fobBrl:round(fobBrl), totalWeight:round(totalWeight), totalVolume:round(totalVolume), baseExpenses:round(baseExpenses), taxes:round(taxes), totalCost, suggestedSaleTotal, items };
}
export function calculateActualExpenses(operation: Pick<ImportOperation, "actualExpenses" | "exchangeRate" | "budgets">) { const budget = activeBudget(operation); const rateValue = budget?.exchangeRate ?? operation.exchangeRate; return round((operation.actualExpenses ?? []).reduce((sum, expense) => sum + amountBrl(expense, rateValue), 0)); }
