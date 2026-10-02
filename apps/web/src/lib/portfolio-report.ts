import { calculateImport, calculateActualExpenses, hasApprovedBudget, effectiveOperationStatus, customsChannelMeta, importStatusMeta, type CustomsSignal, type ImportOperation, type ImportStatus } from "@exporta/domain";

export type PortfolioReportKey = "executive" | "operations" | "costs" | "partners" | "compliance" | "market";
export type PortfolioReportFilters = { from: string; to: string; customer: string; port: string; status: ImportStatus | "all"; channel: CustomsSignal | "all"; phase?: "all" | "costs" | "approved"; customerLabel?: string };
export type ReportRow = { label: string; value: number; detail?: string };
export type ReportRisk = { operation: ImportOperation; reason: string; severity: "high" | "medium" | "low" };
export type PortfolioReport = {
  totalOperations: number;
  activeOperations: number;
  totalCost: number;
  approvedOperations: number;
  budgetOperations: number;
  approvedCost: number;
  budgetCost: number;
  actualExpenses: number;
  totalFob: number;
  totalLogistics: number;
  totalTaxes: number;
  totalWeight: number;
  averageCost: number;
  overdueEtas: number;
  nextSevenDays: number;
  openTasks: number;
  pendingDocuments: number;
  channelRows: ReportRow[];
  statusRows: ReportRow[];
  customerRows: ReportRow[];
  portRows: ReportRow[];
  ncmRows: ReportRow[];
  costRows: ReportRow[];
  risks: ReportRisk[];
  operations: ImportOperation[];
};

const day = (value: string) => new Date(`${value.slice(0, 10)}T12:00:00`);
const validTime = (value: string) => { const time = day(value).getTime(); return Number.isNaN(time) ? 0 : time; };
const expiredDocument = (document: NonNullable<ImportOperation["documents"]>[number]) => document.status === "expired" || Boolean(document.expiresAt && validTime(document.expiresAt) && validTime(document.expiresAt) < today());
const today = () => { const value = new Date(); value.setHours(0, 0, 0, 0); return value.getTime(); };
const inRange = (value: string, filters: PortfolioReportFilters) => (!filters.from || validTime(value) >= validTime(filters.from)) && (!filters.to || validTime(value) <= validTime(filters.to));
const top = (map: Map<string, number>, limit = 6): ReportRow[] => [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([label, value]) => ({ label, value }));
const add = (map: Map<string, number>, key: string, value: number) => map.set(key || "Não informado", (map.get(key || "Não informado") ?? 0) + value);

export function defaultPortfolioReportFilters(): PortfolioReportFilters {
  const now = new Date();
  return { from: `${now.getFullYear()}-01-01`, to: now.toISOString().slice(0, 10), customer: "all", port: "all", status: "all", channel: "all" };
}

export function buildPortfolioReport(source: ImportOperation[], filters: PortfolioReportFilters): PortfolioReport {
  const operations = source.filter((operation) => inRange(operation.createdAt, filters) && (filters.customer === "all" || operation.customerId === filters.customer) && (filters.port === "all" || operation.port === filters.port) && (filters.status === "all" || effectiveOperationStatus(operation) === filters.status) && (filters.channel === "all" || operation.customsChannel === filters.channel) && (!filters.phase || filters.phase === "all" || hasApprovedBudget(operation) === (filters.phase === "approved")));
  const customer = new Map<string, number>(); const port = new Map<string, number>(); const ncm = new Map<string, number>();
  const channel = new Map<string, number>(); const status = new Map<string, number>();
  let totalCost = 0; let totalFob = 0; let totalLogistics = 0; let totalTaxes = 0; let totalWeight = 0; let openTasks = 0; let pendingDocuments = 0;
  for (const operation of operations) {
    const calculated = calculateImport(operation); totalCost += calculated.totalCost; totalFob += calculated.fobBrl; totalLogistics += calculated.baseExpenses; totalTaxes += calculated.taxes; totalWeight += calculated.totalWeight;
    add(customer, operation.customer, calculated.totalCost); add(port, operation.port, calculated.totalCost);
    add(channel, customsChannelMeta[operation.customsChannel].label, 1); add(status, importStatusMeta[effectiveOperationStatus(operation)].label, 1);
    for (const item of calculated.items) add(ncm, item.ncm || "Sem NCM", item.totalCost);
    openTasks += (operation.tasks ?? []).filter((task) => !task.completed).length;
    pendingDocuments += (operation.documents ?? []).filter((document) => document.status !== "available" || expiredDocument(document)).length;
  }
  const now = today(); const week = now + 7 * 86400000;
  const active = operations.filter((operation) => !["cleared", "completed"].includes(effectiveOperationStatus(operation)));
  const awaitingArrival = active.filter((operation) => hasApprovedBudget(operation) && !["arrived", "closed"].includes(operation.shipmentStatus ?? "not_shipped"));
  const overdueEtas = awaitingArrival.filter((operation) => validTime(operation.eta) && validTime(operation.eta) < now).length;
  const nextSevenDays = awaitingArrival.filter((operation) => validTime(operation.eta) >= now && validTime(operation.eta) <= week).length;
  const risks: ReportRisk[] = active.flatMap((operation) => {
    const items: ReportRisk[] = []; const eta = validTime(operation.eta);
    if (awaitingArrival.includes(operation) && eta && eta < now) items.push({ operation, reason: "ETA vencido", severity: "high" });
    else if (awaitingArrival.includes(operation) && eta && eta <= week) items.push({ operation, reason: "ETA nos próximos 7 dias", severity: "medium" });
    if ((operation.tasks ?? []).some((task) => !task.completed && task.dueDate && validTime(task.dueDate) < now)) items.push({ operation, reason: "Pendência com prazo vencido", severity: "high" });
    if ((operation.documents ?? []).some((document) => expiredDocument(document))) items.push({ operation, reason: "Documento vencido", severity: "high" });
    else if ((operation.documents ?? []).some((document) => document.status === "pending")) items.push({ operation, reason: "Documento pendente", severity: "low" });
    if (operation.customsChannel === "unassigned" && ["at_port", "customs"].includes(effectiveOperationStatus(operation))) items.push({ operation, reason: "Canal aduaneiro ainda não informado", severity: "medium" });
    return items;
  }).sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.severity] - ({ high: 0, medium: 1, low: 2 }[b.severity])));
  const approved = operations.filter(hasApprovedBudget);
  return { approvedOperations: approved.length, budgetOperations: operations.length - approved.length, approvedCost: approved.reduce((sum, operation) => sum + calculateImport(operation).totalCost, 0), budgetCost: operations.filter((operation) => !hasApprovedBudget(operation)).reduce((sum, operation) => sum + calculateImport(operation).totalCost, 0), actualExpenses: operations.reduce((sum, operation) => sum + calculateActualExpenses(operation), 0), totalOperations: operations.length, activeOperations: active.length, totalCost, totalFob, totalLogistics, totalTaxes, totalWeight, averageCost: operations.length ? totalCost / operations.length : 0, overdueEtas, nextSevenDays, openTasks, pendingDocuments, channelRows: top(channel, 5), statusRows: top(status, 9), customerRows: top(customer, Infinity), portRows: top(port, Infinity), ncmRows: top(ncm, Infinity), costRows: [{ label: "Base dos produtos (FOB/CIF)", value: totalFob }, { label: "Logística", value: totalLogistics }, { label: "Tributos", value: totalTaxes }], risks, operations };
}
