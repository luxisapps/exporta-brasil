import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "@e965/xlsx";
import { calculateImport } from "@exporta/domain";
import type { PortfolioReport, PortfolioReportFilters, PortfolioReportKey } from "./portfolio-report";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const reportTitle: Record<PortfolioReportKey, string> = { executive: "Visão executiva", operations: "Operação e riscos", costs: "Custos e fechamento", partners: "Clientes e portos", compliance: "Conformidade documental", market: "Mercado e benchmark" };
const filename = (key: PortfolioReportKey, extension: string) => `relatorio-${key}-${new Date().toISOString().slice(0, 10)}.${extension}`;
const filtersText = (filters: PortfolioReportFilters) => `${filters.from || "início"} a ${filters.to || "hoje"}`;
const summaryRows = (report: PortfolioReport) => [["Operações no período", String(report.totalOperations)], ["Operações abertas", String(report.activeOperations)], ["Custo projetado", money.format(report.totalCost)], ["FOB convertido", money.format(report.totalFob)], ["Logística", money.format(report.totalLogistics)], ["Tributos", money.format(report.totalTaxes)], ["Peso estimado", `${report.totalWeight.toLocaleString("pt-BR")} kg`], ["ETA vencido", String(report.overdueEtas)], ["Pendências abertas", String(report.openTasks)], ["Documentos pendentes", String(report.pendingDocuments)]];
const tableRows = (rows: { label: string; value: number }[]) => rows.map((row) => [row.label, money.format(row.value)]);

export function downloadPortfolioReportXlsx(key: PortfolioReportKey, report: PortfolioReport, filters: PortfolioReportFilters) {
  const workbook = XLSX.utils.book_new();
  const summary = XLSX.utils.aoa_to_sheet([["Exporta Brasil", reportTitle[key]], ["Período", filtersText(filters)], [], ["Indicador", "Valor"], ...summaryRows(report)]);
  summary["!cols"] = [{ wch: 32 }, { wch: 24 }]; XLSX.utils.book_append_sheet(workbook, summary, "Resumo");
  const operations = XLSX.utils.aoa_to_sheet([["Referência", "Cliente", "Porto", "ETA", "Status", "Canal", "Custo projetado"], ...report.operations.map((operation) => [operation.reference, operation.customer, operation.port, operation.eta, operation.status, operation.customsChannel, calculateCost(operation)])]);
  operations["!cols"] = [{ wch: 17 }, { wch: 28 }, { wch: 26 }, { wch: 13 }, { wch: 18 }, { wch: 14 }, { wch: 18 }]; XLSX.utils.book_append_sheet(workbook, operations, "Operações");
  const costs = XLSX.utils.aoa_to_sheet([["Componente", "Valor"], ...tableRows(report.costRows), [], ["Cliente", "Custo projetado"], ...tableRows(report.customerRows), [], ["Porto", "Custo projetado"], ...tableRows(report.portRows), [], ["NCM", "Custo projetado"], ...tableRows(report.ncmRows)]);
  costs["!cols"] = [{ wch: 34 }, { wch: 20 }]; XLSX.utils.book_append_sheet(workbook, costs, "Custos e dimensões");
  const risks = XLSX.utils.aoa_to_sheet([["Prioridade", "Referência", "Cliente", "Motivo", "ETA"], ...report.risks.map((risk) => [risk.severity, risk.operation.reference, risk.operation.customer, risk.reason, risk.operation.eta])]);
  risks["!cols"] = [{ wch: 13 }, { wch: 17 }, { wch: 28 }, { wch: 36 }, { wch: 13 }]; XLSX.utils.book_append_sheet(workbook, risks, "Riscos");
  const methodology = XLSX.utils.aoa_to_sheet([["Metodologia"], ["Custo projetado = FOB convertido + despesas rateadas + II + IPI."], ["Os valores refletem os dados disponíveis no sistema no momento da geração."], ["Benchmark externo requer sincronização mensal da base Comex Stat."]]); methodology["!cols"] = [{ wch: 100 }]; XLSX.utils.book_append_sheet(workbook, methodology, "Metodologia");
  XLSX.writeFile(workbook, filename(key, "xlsx"), { compression: true });
}
function calculateCost(operation: PortfolioReport["operations"][number]) { return calculateImport(operation).totalCost; }

export function downloadPortfolioReportPdf(key: PortfolioReportKey, report: PortfolioReport, filters: PortfolioReportFilters) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" }); const navy: [number, number, number] = [7, 26, 51]; const blue: [number, number, number] = [14, 165, 233];
  pdf.setFillColor(...navy); pdf.rect(0, 0, 210, 37, "F"); pdf.setTextColor(255, 255, 255); pdf.setFont("helvetica", "bold"); pdf.setFontSize(19); pdf.text("Exporta Brasil", 15, 16); pdf.setFont("helvetica", "normal"); pdf.setFontSize(9); pdf.text(reportTitle[key], 15, 23); pdf.text(`Período: ${filtersText(filters)} · Gerado em ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date())}`, 15, 30);
  pdf.setTextColor(...navy); pdf.setFont("helvetica", "bold"); pdf.setFontSize(15); pdf.text("Resumo operacional e financeiro", 15, 49);
  autoTable(pdf, { startY: 54, head: [["Indicador", "Valor"]], body: summaryRows(report), theme: "striped", headStyles: { fillColor: navy }, styles: { fontSize: 8.8, cellPadding: 3 }, columnStyles: { 1: { halign: "right", fontStyle: "bold" } }, margin: { left: 15, right: 15 } });
  let y = (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10; pdf.setTextColor(...blue); pdf.setFontSize(12); pdf.text("Principais alertas", 15, y);
  autoTable(pdf, { startY: y + 4, head: [["Prioridade", "Operação", "Motivo", "ETA"]], body: report.risks.length ? report.risks.map((risk) => [risk.severity === "high" ? "Alta" : risk.severity === "medium" ? "Média" : "Baixa", risk.operation.reference, risk.reason, risk.operation.eta]) : [["—", "—", "Nenhum alerta no recorte selecionado", "—"]], theme: "grid", headStyles: { fillColor: navy }, styles: { fontSize: 8, cellPadding: 2.5 }, margin: { left: 15, right: 15 } });
  pdf.addPage(); pdf.setTextColor(...navy); pdf.setFont("helvetica", "bold"); pdf.setFontSize(15); pdf.text("Detalhamento por operação", 15, 18);
  autoTable(pdf, { startY: 24, head: [["Referência", "Cliente", "Porto", "ETA", "Status", "Canal"]], body: report.operations.map((operation) => [operation.reference, operation.customer, operation.port, operation.eta, operation.status, operation.customsChannel]), theme: "striped", headStyles: { fillColor: navy }, styles: { fontSize: 7.8, cellPadding: 2.5 }, margin: { left: 10, right: 10 } });
  pdf.save(filename(key, "pdf"));
}
