import { calculateImport, customsChannelMeta, importStatusMeta, type CustomsSignal, type ImportOperation, type ImportStatus } from "@exporta/domain";

export type PortfolioReportKey = "executive" | "operations" | "costs" | "partners" | "compliance" | "market";
export type PortfolioReportFilters = { from: string; to: string; customer: string; port: string; status: ImportStatus | "all"; channel: CustomsSignal | "all" };
export type ReportRow = { label: string; value: number; detail?: string };
export type ReportRisk = { operation: ImportOperation; reason: string; severity: "high" | "medium" | "low" };
export type PortfolioReport = {
  totalOperations: number;
  activeOperations: number;
  totalCost: number;
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
  supplierRows: ReportRow[];
  portRows: ReportRow[];
  ncmRows: ReportRow[];
  costRows: ReportRow[];
  risks: ReportRisk[];
  operations: ImportOperation[];
};

const day = (value: string) => new Date(`${value.slice(0, 10)}T12:00:00`);
const validTime = (value: string) => { const time = day(value).getTime(); return Number.isNaN(time) ? 0 : time; };
const today = () => { const value = new Date(); value.setHours(0, 0, 0, 0); return value.getTime(); };
const inRange = (value: string, filters: PortfolioReportFilters) => (!filters.from || validTime(value) >= validTime(filters.from)) && (!filters.to || validTime(value) <= validTime(filters.to));
const top = (map: Map<string, number>, limit = 6): ReportRow[] => [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([label, value]) => ({ label, value }));
const add = (map: Map<string, number>, key: string, value: number) => map.set(key || "Não informado", (map.get(key || "Não informado") ?? 0) + value);

export function defaultPortfolioReportFilters(): PortfolioReportFilters {
  const now = new Date();
  return { from: `${now.getFullYear()}-01-01`, to: now.toISOString().slice(0, 10), customer: "all", port: "all", status: "all", channel: "all" };
}

export function buildPortfolioReport(source: ImportOperation[], filters: PortfolioReportFilters): PortfolioReport {
  const operations = source.filter((operation) => inRange(operation.createdAt, filters) && (filters.customer === "all" || operation.customerId === filters.customer) && (filters.port === "all" || operation.port === filters.port) && (filters.status === "all" || operation.status === filters.status) && (filters.channel === "all" || operation.customsChannel === filters.channel));
  const customer = new Map<string, number>(); const supplier = new Map<string, number>(); const port = new Map<string, number>(); const ncm = new Map<string, number>();
  const channel = new Map<string, number>(); const status = new Map<string, number>();
  let totalCost = 0; let totalFob = 0; let totalLogistics = 0; let totalTaxes = 0; let totalWeight = 0; let openTasks = 0; let pendingDocuments = 0;
  for (const operation of operations) {
    const calculated = calculateImport(operation); totalCost += calculated.totalCost; totalFob += calculated.fobBrl; totalLogistics += calculated.baseExpenses; totalTaxes += calculated.taxes; totalWeight += calculated.totalWeight;
    add(customer, operation.customer, calculated.totalCost); add(supplier, operation.supplier, calculated.totalCost); add(port, operation.port, calculated.totalCost);
    add(channel, customsChannelMeta[operation.customsChannel].label, 1); add(status, importStatusMeta[operation.status].label, 1);
    for (const item of calculated.items) add(ncm, item.ncm || "Sem NCM", item.totalCost);
    openTasks += (operation.tasks ?? []).filter((task) => !task.completed).length;
    pendingDocuments += (operation.documents ?? []).filter((document) => document.status !== "available").length;
  }
  const now = today(); const week = now + 7 * 86400000;
  const active = operations.filter((operation) => !["cleared", "completed"].includes(operation.status));
  const overdueEtas = active.filter((operation) => validTime(operation.eta) && validTime(operation.eta) < now).length;
  const nextSevenDays = active.filter((operation) => validTime(operation.eta) >= now && validTime(operation.eta) <= week).length;
  const risks: ReportRisk[] = active.flatMap((operation) => {
    const items: ReportRisk[] = []; const eta = validTime(operation.eta);
    if (eta && eta < now) items.push({ operation, reason: "ETA vencido", severity: "high" });
    else if (eta && eta <= week) items.push({ operation, reason: "ETA nos próximos 7 dias", severity: "medium" });
    if ((operation.tasks ?? []).some((task) => !task.completed && task.dueDate && validTime(task.dueDate) < now)) items.push({ operation, reason: "Pendência com prazo vencido", severity: "high" });
    if ((operation.documents ?? []).some((document) => document.status === "expired")) items.push({ operation, reason: "Documento vencido", severity: "high" });
    else if ((operation.documents ?? []).some((document) => document.status === "pending")) items.push({ operation, reason: "Documento pendente", severity: "low" });
    if (operation.customsChannel === "unassigned" && ["at_port", "customs"].includes(operation.status)) items.push({ operation, reason: "Canal aduaneiro ainda não informado", severity: "medium" });
    return items;
  }).sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.severity] - ({ high: 0, medium: 1, low: 2 }[b.severity]))).slice(0, 12);
  return { totalOperations: operations.length, activeOperations: active.length, totalCost, totalFob, totalLogistics, totalTaxes, totalWeight, averageCost: operations.length ? totalCost / operations.length : 0, overdueEtas, nextSevenDays, openTasks, pendingDocuments, channelRows: top(channel, 5), statusRows: top(status, 7), customerRows: top(customer), supplierRows: top(supplier), portRows: top(port), ncmRows: top(ncm), costRows: [{ label: "FOB convertido", value: totalFob }, { label: "Logística", value: totalLogistics }, { label: "Tributos", value: totalTaxes }], risks, operations };
}
