import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { convertCurrency, currencyNote, equivalentText, formatMoney, type Currency, type ExchangeRates } from "./currency";

export const reportDate = (value?: string, time = false) => {
  if (!value) return "—";
  const parsed = new Date(value.length === 10 ? `${value}T12:00:00-03:00` : value);
  return Number.isNaN(parsed.getTime()) ? "—" : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", ...(time ? { timeStyle: "short" as const } : {}), timeZone: "America/Sao_Paulo" }).format(parsed);
};
export type ReportSheet = { name: string; headers: string[]; rows: (string | number | null)[][]; moneyColumns?: Record<number, Currency>; rowMoneyColumns?: Record<number, Currency>[]; widths?: number[] };
export type ReportData = { title: string; metadata: string[][]; summary: { label: string; value: number; currency?: Currency; unit?: string }[]; sheets: ReportSheet[]; rates: ExchangeRates | null; notes: string[] };
export const moneyCell = (value: number, rates: ExchangeRates | null, currency: Currency = "BRL") => `${formatMoney(value, currency)}\n≈ ${equivalentText(value, currency, rates)}`;

/** Keep numeric cells usable in Excel. Equivalent rows reference the primary amount with cached results. */
export function addReportSheet(workbook: ExcelJS.Workbook, section: ReportSheet, rates: ExchangeRates | null) {
  const sheet = workbook.addWorksheet(section.name, { views: [{ state: "frozen", ySplit: 3 }], pageSetup: { orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
  const width = Math.max(section.headers.length, 2);
  sheet.mergeCells(1, 1, 1, width);
  sheet.getCell("A1").value = `EXPORTA BRASIL · ${section.name}`;
  sheet.getRow(1).height = 30;
  sheet.getCell("A1").font = { name: "Calibri", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0D1B2A" } };
  sheet.addRow([]);
  sheet.addRow(section.headers);
  sheet.getRow(3).height = 30;
  sheet.getRow(3).eachCell((cell) => { cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } }; cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF173451" } }; cell.alignment = { vertical: "middle", wrapText: true }; });
  section.rows.forEach((values, index) => {
    const moneyColumns = section.rowMoneyColumns?.[index] ?? section.moneyColumns;
    const row = sheet.addRow(values.map((value) => value ?? "—"));
    row.height = Math.max(30, ...values.map((value, col) => typeof value === "string" ? Math.ceil([...value].reduce((sum, char) => sum + (/\p{Script=Han}/u.test(char) ? 2 : 1), 0) / ((section.widths?.[col] ?? (col === 0 ? 38 : 24)) - 2)) * 15 : 30));
    row.eachCell((cell, column) => {
      cell.font = { name: "Calibri", size: 11, color: { argb: "FF1E293B" } };
      cell.alignment = { vertical: "middle", wrapText: true };
      if (index % 2 === 0) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F5FA" } };
      const currency = moneyColumns?.[column - 1];
      if (currency && typeof cell.value === "number") { cell.numFmt = `"${currency}" #,##0.00;"${currency}" -#,##0.00`; cell.alignment = { vertical: "middle", horizontal: "right" }; }
      if (typeof values[0] === "string" && values[0].startsWith("CUSTO TOTAL")) { cell.font = { name: "Calibri", size: column === 1 ? 12 : 16, bold: true, color: { argb: "FF173451" } }; cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2EEFA" } }; }
    });
    if (moneyColumns && Object.keys(moneyColumns).some((column) => typeof values[Number(column)] === "number")) {
      for (const target of ["CNY", "USD"] as const) {
        const equivalent = sheet.addRow([]); equivalent.height = 19;
        const labelColumn = values.findIndex((value, col) => typeof value === "string" && !moneyColumns?.[col]);
        if (labelColumn >= 0) equivalent.getCell(labelColumn + 1).value = `≈ ${target}`;
        Object.entries(moneyColumns).forEach(([column, currency]) => {
          const value = values[Number(column)];
          if (typeof value !== "number") return;
          const result = convertCurrency(value, currency, target, rates);
          const cell = equivalent.getCell(Number(column) + 1);
          if (result === null) cell.value = `${target} indisponível`;
          else {
            const primary = row.getCell(Number(column) + 1).address;
            const quote = (code: Currency) => code === "USD" ? "'Cotações e metodologia'!$B$4" : "'Cotações e metodologia'!$B$5";
            const formula = currency === target ? primary : `${primary}${currency === "BRL" ? "" : `*${quote(currency)}`}/${quote(target)}`;
            cell.value = { formula, result };
            cell.numFmt = `"${target}" #,##0.00;"${target}" -#,##0.00`;
          }
          cell.font = { name: "Calibri", size: 9, color: { argb: "FF64748B" } };
          cell.alignment = { horizontal: "right", vertical: "middle" };
        });
        equivalent.getCell(labelColumn >= 0 ? labelColumn + 1 : 1).font = { name: "Calibri", size: 9, color: { argb: "FF64748B" } };
      }
    }
  });
  sheet.columns.forEach((column, index) => { column.width = section.widths?.[index] ?? (index === 0 ? 38 : 24); });
  sheet.headerFooter.oddFooter = "Exporta Brasil · Página &P de &N";
  return sheet;
}
export function createReportWorkbook(data: ReportData) {
  const workbook = new ExcelJS.Workbook(); workbook.creator = "Exporta Brasil"; workbook.created = new Date(); workbook.calcProperties.fullCalcOnLoad = true;
  const summary = [...data.summary.filter((item) => item.label.startsWith("CUSTO TOTAL")), ...data.summary.filter((item) => !item.label.startsWith("CUSTO TOTAL"))];
  addReportSheet(workbook, { name: "Resumo de fechamento", headers: [data.title, "Valor"], rows: [...summary.map((item) => [item.label, item.currency ? item.value : `${item.value.toLocaleString("pt-BR")} ${item.unit ?? ""}`]), ...data.metadata], moneyColumns: { 1: "BRL" }, widths: [50, 50] }, data.rates);
  for (const section of data.sheets) addReportSheet(workbook, section, data.rates);
  addReportSheet(workbook, { name: "Cotações e metodologia", headers: ["Referência", "Informação"], rows: [["USD · BRL por USD", data.rates?.dollar.sell ?? "Indisponível"], ["CNY · BRL por CNY", data.rates?.yuan?.sell ?? "Indisponível"], ["Câmbio de referência", currencyNote(data.rates)], ["Fonte USD", "https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/documentacao"], ["Fonte CNY", "https://ptax.bcb.gov.br/ptax_internet/consultarTodasAsMoedas.do?method=consultaTodasMoedas"], ["Gerado em", reportDate(new Date().toISOString(), true)], ...data.notes.map((note) => ["Metodologia", note])], widths: [30, 110] }, data.rates);
  return workbook;
}
export async function downloadWorkbook(workbook: ExcelJS.Workbook, filename: string) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([new Uint8Array(buffer)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 60000);
}
let fontPromise: Promise<string> | undefined;
export async function reportFont() {
  fontPromise ??= fetch("/fonts/NotoSansSC-Regular.ttf").then(async (response) => {
    if (!response.ok) throw new Error("Não foi possível carregar a fonte do PDF. Tente novamente.");
    const bytes = new Uint8Array(await response.arrayBuffer()); let binary = "";
    for (let i = 0; i < bytes.length; i += 16384) binary += String.fromCharCode(...bytes.subarray(i, i + 16384));
    return btoa(binary);
  }).catch((error) => { fontPromise = undefined; throw error; });
  return fontPromise;
}
export async function createReportPdf(data: ReportData, fontBase64?: string) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  pdf.addFileToVFS("NotoSansSC.ttf", fontBase64 ?? await reportFont());
  pdf.addFont("NotoSansSC.ttf", "Noto", "normal"); pdf.addFont("NotoSansSC.ttf", "Noto", "bold"); pdf.setFont("Noto");
  const navy: [number, number, number] = [13, 27, 42];
  pdf.setFillColor(...navy); pdf.rect(0, 0, 210, 31, "F"); pdf.setTextColor(255); pdf.setFontSize(19); pdf.text("Exporta Brasil", 14, 14); pdf.setFontSize(10); pdf.text(data.title, 14, 24);
  const y = 37;
  autoTable(pdf, { startY: y, head: [["RESUMO FINANCEIRO", "VALOR / EQUIVALÊNCIAS"]], body: data.summary.map((item) => [item.label, item.currency ? moneyCell(item.value, data.rates, item.currency) : `${item.value.toLocaleString("pt-BR")} ${item.unit ?? ""}`]), theme: "striped", headStyles: { fillColor: navy }, styles: { font: "Noto", fontSize: 8.5, cellPadding: 2 }, columnStyles: { 0: { cellWidth: 86 }, 1: { halign: "right" } }, margin: { left: 14, right: 14, bottom: 23 },
    didParseCell: (hook) => { if (hook.section === "body" && data.summary[hook.row.index]?.label.startsWith("CUSTO TOTAL")) { hook.cell.styles.fillColor = [226, 238, 250]; hook.cell.styles.fontStyle = "bold"; } },
    willDrawCell: (hook) => { if (hook.section === "body" && hook.column.index === 1 && data.summary[hook.row.index]?.currency) hook.cell.text = []; },
    didDrawCell: (hook) => {
      const item = data.summary[hook.row.index];
      if (hook.section !== "body" || hook.column.index !== 1 || !item?.currency) return;
      const right = hook.cell.x + hook.cell.width - 2;
      pdf.setFontSize(9); pdf.setTextColor(30, 41, 59); pdf.text(formatMoney(item.value, item.currency), right, hook.cell.y + 5, { align: "right" });
      pdf.setFontSize(7); pdf.setTextColor(100, 116, 139); pdf.text(`≈ ${equivalentText(item.value, item.currency, data.rates)}`, right, hook.cell.y + 9, { align: "right" });
    }
  });
  const summaryEnd = (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  autoTable(pdf, { startY: summaryEnd + 5, body: data.metadata, styles: { font: "Noto", fontSize: 8, cellPadding: 1.5 }, theme: "plain", margin: { left: 14, right: 14, bottom: 20 } });
  for (const section of data.sheets) {
    pdf.addPage("a4", "landscape"); pdf.setTextColor(...navy); pdf.setFontSize(14); pdf.text(section.name, 12, 17);
    autoTable(pdf, { startY: 24, head: [section.headers], body: section.rows.length ? section.rows.map((row, index) => row.map((value, column) => { const currency = (section.rowMoneyColumns?.[index] ?? section.moneyColumns)?.[column]; return currency && typeof value === "number" ? moneyCell(value, data.rates, currency) : value === null || value === "" ? "—" : String(value); })) : [["Nenhum registro.", ...section.headers.slice(1).map(() => "")]], styles: { font: "Noto", fontSize: 8, cellPadding: 2.3, overflow: "linebreak" }, headStyles: { fillColor: navy }, theme: "striped", margin: { left: 12, right: 12, top: 24, bottom: 18 }, rowPageBreak: "avoid",
      willDrawCell: (hook) => {
        const currency = (section.rowMoneyColumns?.[hook.row.index] ?? section.moneyColumns)?.[hook.column.index];
        if (hook.section === "body" && currency && typeof section.rows[hook.row.index]?.[hook.column.index] === "number") hook.cell.text = [];
      },
      didDrawCell: (hook) => {
        const value = section.rows[hook.row.index]?.[hook.column.index];
        const currency = (section.rowMoneyColumns?.[hook.row.index] ?? section.moneyColumns)?.[hook.column.index];
        if (hook.section !== "body" || !currency || typeof value !== "number") return;
        const x = hook.cell.x + 2.3;
        pdf.setFontSize(8); pdf.setTextColor(30, 41, 59);
        const primary = pdf.splitTextToSize(formatMoney(value, currency), hook.cell.width - 4.6) as string[];
        pdf.text(primary, x, hook.cell.y + 5);
        pdf.setFontSize(6.8); pdf.setTextColor(100, 116, 139);
        const equivalents = pdf.splitTextToSize(`≈ ${equivalentText(value, currency, data.rates)}`, hook.cell.width - 4.6) as string[];
        pdf.text(equivalents, x, hook.cell.y + 5 + primary.length * 3.3);
      }
    });
  }
  pdf.addPage(); pdf.setTextColor(...navy); pdf.setFontSize(14); pdf.text("Cotações e metodologia", 14, 20);
  autoTable(pdf, { startY: 28, body: [[currencyNote(data.rates)], ...data.notes.map((note) => [note])], theme: "plain", styles: { font: "Noto", fontSize: 10, cellPadding: 4 }, margin: { left: 14, right: 14, bottom: 20 } });
  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page++) { pdf.setPage(page); const height = pdf.internal.pageSize.getHeight(); const width = pdf.internal.pageSize.getWidth(); pdf.setFontSize(7); pdf.setTextColor(100, 116, 139); pdf.text(`Exporta Brasil · ${reportDate(new Date().toISOString(), true)} · ${page}/${pages}`, 14, height - 9); pdf.text("Equivalências indicativas · BCB PTAX de venda", width - 14, height - 9, { align: "right" }); }
  return pdf;
}
