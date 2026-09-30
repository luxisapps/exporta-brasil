import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "@e965/xlsx";
import { calculateImport, customsChannelMeta, importStatusMeta, portStatusMeta, type ImportOperation, type OperationDocument, type OperationTask, type OperationTimelineEntry } from "@exporta/domain";

type ReportContext = { timeline: OperationTimelineEntry[]; tasks: OperationTask[]; documents: OperationDocument[] };
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" });
const safeDate = (value?: string) => {
  const parsed = value ? new Date(value) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};
const formatDate = (value?: string) => value ? date.format(safeDate(value)) : "—";
const statusDocument = (value: OperationDocument["status"]) => value === "available" ? "Disponível" : value === "expired" ? "Vencido" : "Pendente";
const filename = (reference: string, extension: string) => `fechamento-${reference.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/(^-|-$)/g, "") || "operacao"}.${extension}`;

function details(operation: ImportOperation, context: ReportContext) {
  const calculated = calculateImport(operation);
  return {
    calculated,
    opening: [
      ["Referência", operation.reference, "Cliente", operation.customer],
      ["Contêiner", operation.container || "—", "Responsável", operation.assigneeName || "—"],
      ["Porto de destino", operation.port, "ETA", formatDate(operation.eta)],
      ["Status", importStatusMeta[operation.status]?.label ?? operation.status, "Status portuário", portStatusMeta[operation.portStatus]?.label ?? operation.portStatus],
      ["Canal aduaneiro", customsChannelMeta[operation.customsChannel]?.label ?? operation.customsChannel, "Atualizado em", formatDate(operation.updatedAt)]
    ],
    summary: [
      ["Câmbio", `R$ ${operation.exchangeRate.toFixed(4)}`],
      ["FOB convertido", money.format(calculated.fobBrl)],
      ["Frete internacional", money.format(operation.freightBrl)],
      ["Seguro", money.format(operation.insuranceBrl)],
      ["Despesas portuárias", money.format(operation.portExpensesBrl)],
      ["Custos logísticos rateados", money.format(calculated.baseExpenses)],
      ["Imposto de importação (II)", money.format(calculated.items.reduce((sum, item) => sum + item.ii, 0))],
      ["IPI", money.format(calculated.items.reduce((sum, item) => sum + item.ipi, 0))],
      ["Total de tributos", money.format(calculated.taxes)],
      ["Custo total projetado", money.format(calculated.totalCost)],
      ["Peso bruto estimado", `${calculated.totalWeight.toLocaleString("pt-BR")} kg`]
    ]
  };
}

function styleSheet(sheet: XLSX.WorkSheet, title: string, lastColumn: string, widths: number[]) {
  sheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: widths.length - 1 } }];
  sheet["A1"] = { t: "s", v: title, s: { font: { bold: true, color: { rgb: "FFFFFF" }, sz: 15 }, fill: { fgColor: { rgb: "0D1B2A" } }, alignment: { vertical: "center" } } };
  sheet["!rows"] = [{ hpt: 28 }];
  sheet["!cols"] = widths.map((wch) => ({ wch }));
  const range = XLSX.utils.decode_range(sheet["!ref"] ?? `A1:${lastColumn}1`);
  for (let column = range.s.c; column <= range.e.c; column += 1) {
    const cell = sheet[XLSX.utils.encode_cell({ r: 1, c: column })];
    if (cell) cell.s = { font: { bold: true, color: { rgb: "DCEBFA" } }, fill: { fgColor: { rgb: "173451" } }, alignment: { vertical: "center", wrapText: true } };
  }
}

export function createOperationWorkbook(operation: ImportOperation, context: ReportContext) {
  const { calculated, opening, summary } = details(operation, context);
  const workbook = XLSX.utils.book_new();
  const summarySheet = XLSX.utils.aoa_to_sheet([[`Exporta Brasil · Fechamento da operação ${operation.reference}`], [], ["DADOS DA OPERAÇÃO", "", "", ""], ...opening, [], ["RESUMO FINANCEIRO", ""], ["Componente", "Valor"], ...summary]);
  styleSheet(summarySheet, `Exporta Brasil · Fechamento da operação ${operation.reference}`, "D", [29, 25, 26, 25]);
  summarySheet["A3"].s = { font: { bold: true, color: { rgb: "1D4ED8" } } };
  summarySheet["A10"].s = { font: { bold: true, color: { rgb: "1D4ED8" } } };
  summarySheet["A21"].s = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "1D4ED8" } } };
  summarySheet["B21"].s = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "1D4ED8" } } };
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumo de fechamento");

  const itemsSheet = XLSX.utils.aoa_to_sheet([[`Exporta Brasil · Detalhes por item · ${operation.reference}`], [], ["Produto", "NCM", "Quantidade", "Peso bruto (kg)", "Valor unit. USD", "FOB convertido", "Rateio", "II", "IPI", "Tributos", "Custo total", "Custo unitário"], ...calculated.items.map((item) => [item.name, item.ncm, item.quantity, item.grossWeightKg * item.quantity, item.unitPriceUsd, item.itemFob, item.allocatedExpenses, item.ii, item.ipi, item.ii + item.ipi, item.totalCost, item.unitCost]), [], ["TOTAL", "", calculated.items.reduce((sum, item) => sum + item.quantity, 0), calculated.totalWeight, "", calculated.fobBrl, calculated.baseExpenses, calculated.items.reduce((sum, item) => sum + item.ii, 0), calculated.items.reduce((sum, item) => sum + item.ipi, 0), calculated.taxes, calculated.totalCost, ""]]);
  styleSheet(itemsSheet, `Exporta Brasil · Detalhes por item · ${operation.reference}`, "L", [31, 14, 12, 16, 17, 18, 16, 15, 15, 15, 18, 18]);
  const itemTotalRow = 4 + calculated.items.length;
  for (let column = 0; column < 12; column += 1) {
    const cell = itemsSheet[XLSX.utils.encode_cell({ r: itemTotalRow, c: column })];
    if (cell) cell.s = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "1D4ED8" } } };
  }
  XLSX.utils.book_append_sheet(workbook, itemsSheet, "Itens e custos");

  const operationRows: (string | boolean)[][] = [[`Exporta Brasil · Dados operacionais · ${operation.reference}`], [], ["LINHA DO TEMPO", "Data", "Descrição"]];
  context.timeline.forEach((entry) => operationRows.push([entry.title, formatDate(entry.occurredAt), entry.description ?? "—"]));
  operationRows.push([], ["PENDÊNCIAS", "Prazo", "Situação"]);
  context.tasks.forEach((task) => operationRows.push([task.title, formatDate(task.dueDate), task.completed ? "Concluída" : "Aberta"]));
  operationRows.push([], ["DOCUMENTOS", "Referência", "Situação"]);
  context.documents.forEach((document) => operationRows.push([`${document.type} · ${document.title}`, document.reference ?? "—", statusDocument(document.status)]));
  const operationSheet = XLSX.utils.aoa_to_sheet(operationRows);
  styleSheet(operationSheet, `Exporta Brasil · Dados operacionais · ${operation.reference}`, "C", [38, 20, 58]);
  XLSX.utils.book_append_sheet(workbook, operationSheet, "Dados operacionais");
  return workbook;
}

export function downloadOperationXlsx(operation: ImportOperation, context: ReportContext) {
  XLSX.writeFile(createOperationWorkbook(operation, context), filename(operation.reference, "xlsx"), { compression: true });
}

export function downloadOperationPdf(operation: ImportOperation, context: ReportContext) {
  const { calculated, opening, summary } = details(operation, context);
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const navy: [number, number, number] = [13, 27, 42];
  const blue: [number, number, number] = [29, 78, 216];
  pdf.setFillColor(...navy); pdf.rect(0, 0, 210, 35, "F");
  pdf.setTextColor(255, 255, 255); pdf.setFont("helvetica", "bold"); pdf.setFontSize(19); pdf.text("Exporta Brasil", 15, 16);
  pdf.setFont("helvetica", "normal"); pdf.setFontSize(9); pdf.text("Relatório de fechamento da importação", 15, 23); pdf.text(`Gerado em ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date())}`, 15, 29);
  pdf.setTextColor(26, 38, 52); pdf.setFont("helvetica", "bold"); pdf.setFontSize(16); pdf.text(operation.reference, 15, 47);
  pdf.setFont("helvetica", "normal"); pdf.setFontSize(10); pdf.text(operation.customer, 15, 53);
  autoTable(pdf, { startY: 59, body: opening, theme: "grid", styles: { fontSize: 8.5, cellPadding: 3, textColor: [30, 41, 59] }, columnStyles: { 0: { fontStyle: "bold", fillColor: [239, 246, 255] }, 2: { fontStyle: "bold", fillColor: [239, 246, 255] } }, margin: { left: 15, right: 15 } });
  const summaryTop = (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  pdf.setTextColor(...blue); pdf.setFont("helvetica", "bold"); pdf.setFontSize(12); pdf.text("Resumo financeiro de fechamento", 15, summaryTop);
  autoTable(pdf, { startY: summaryTop + 4, head: [["Componente", "Valor"]], body: summary, theme: "striped", styles: { fontSize: 9, cellPadding: 3 }, headStyles: { fillColor: navy }, columnStyles: { 1: { halign: "right", fontStyle: "bold" } }, margin: { left: 15, right: 15 } });
  const finalY = (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  pdf.setFillColor(...blue); pdf.roundedRect(15, finalY + 8, 180, 16, 2, 2, "F"); pdf.setTextColor(255, 255, 255); pdf.setFontSize(9); pdf.text("CUSTO TOTAL PROJETADO", 20, finalY + 15); pdf.setFontSize(14); pdf.text(money.format(calculated.totalCost), 190, finalY + 16, { align: "right" });

  pdf.addPage(); pdf.setTextColor(...navy); pdf.setFont("helvetica", "bold"); pdf.setFontSize(16); pdf.text("Detalhamento por item", 15, 18);
  autoTable(pdf, { startY: 24, head: [["Produto / NCM", "Qtd.", "FOB", "Rateio", "Tributos", "Custo total", "Unitário"]], body: calculated.items.map((item) => [`${item.name}\n${item.ncm}`, item.quantity.toLocaleString("pt-BR"), money.format(item.itemFob), money.format(item.allocatedExpenses), money.format(item.ii + item.ipi), money.format(item.totalCost), money.format(item.unitCost)]), theme: "striped", styles: { fontSize: 7.5, cellPadding: 2.5 }, headStyles: { fillColor: navy }, columnStyles: { 0: { cellWidth: 48 }, 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right" } }, margin: { left: 10, right: 10 } });
  pdf.addPage(); pdf.setTextColor(...navy); pdf.setFont("helvetica", "bold"); pdf.setFontSize(16); pdf.text("Registros operacionais", 15, 18);
  autoTable(pdf, { startY: 24, head: [["Linha do tempo", "Data", "Descrição"]], body: context.timeline.map((entry) => [entry.title, formatDate(entry.occurredAt), entry.description ?? "—"]), theme: "grid", styles: { fontSize: 8, cellPadding: 2.5 }, headStyles: { fillColor: navy }, margin: { left: 15, right: 15 } });
  const timelineEnd = (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  autoTable(pdf, { startY: timelineEnd + 9, head: [["Pendência", "Responsável", "Prazo", "Situação"]], body: context.tasks.map((task) => [task.title, task.assignee ?? "—", formatDate(task.dueDate), task.completed ? "Concluída" : "Aberta"]), theme: "grid", styles: { fontSize: 8, cellPadding: 2.5 }, headStyles: { fillColor: navy }, margin: { left: 15, right: 15 } });
  const tasksEnd = (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  autoTable(pdf, { startY: tasksEnd + 9, head: [["Documento", "Referência", "Emissão", "Validade", "Situação"]], body: context.documents.map((document) => [`${document.type} · ${document.title}`, document.reference ?? "—", formatDate(document.issuedAt), formatDate(document.expiresAt), statusDocument(document.status)]), theme: "grid", styles: { fontSize: 8, cellPadding: 2.5 }, headStyles: { fillColor: navy }, margin: { left: 15, right: 15 } });
  pdf.save(filename(operation.reference, "pdf"));
}
