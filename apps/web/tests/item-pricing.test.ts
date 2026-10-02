import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import * as XLSX from "@e965/xlsx";
import { calculateImport, approveOperationCosts, type ImportOperation, type ImportBudget } from "@exporta/domain";
import { readFinalCostSheet } from "../src/lib/final-cost-sheet";
import { operationReportData, createOperationWorkbook, createOperationPdf } from "../src/lib/operation-report";
import { validPricingFields } from "../../api/src/pricing-validation";
const fixture = JSON.parse(readFileSync("apps/web/tests/fixtures/item-pricing.json", "utf8"));
const book = XLSX.utils.book_new(), itemSheet: XLSX.WorkSheet = { "!ref": "A1:AH54", A8: { t: "s", v: "PRODUTO" }, C8: { t: "s", v: "QUANTIDADE" }, R8: { t: "n", v: fixture.margin } };
fixture.rows.forEach((row: Record<string, number>, index: number) => {
  itemSheet[`A${index + 9}`] = { t: "s", v: `Produto ${index + 1} - 39191090` };
  Object.entries(row).forEach(([key,value]) => { itemSheet[`${key}${index+9}`] = { t:"n", v:value }; });
});
const closing: XLSX.WorkSheet = Object.fromEntries(Object.entries(fixture.closing).map(([key,value])=>[key,{t:"n",v:value}]));
XLSX.utils.book_append_sheet(book, closing, "FECHAMENTO");
XLSX.utils.book_append_sheet(book, itemSheet, "PREÇO POR ITEM");
const imported = readFinalCostSheet(book)!;
const budget: ImportBudget = { id:"b", number:1, name:"Planilha", status:"draft", createdAt:"2026-10-01", taxRates:[], ...imported.budget };
const operation: ImportOperation = {id:"pricing",reference:"EB-2026-TEST",customer:"Empresa de teste",port:"Santos",container:"",eta:"",status:"draft",portStatus:"awaiting_departure",customsChannel:"unassigned",createdAt:"2026-10-01",updatedAt:"2026-10-01",exchangeRate:5,freightBrl:0,insuranceBrl:0,portExpensesBrl:0,budgets:[budget],items:imported.items.map((item,index)=>({...item,id:`p${index}`}))};
const close = (actual: number | null | undefined, expected: number, label: string) => assert.ok(actual !== null && actual !== undefined && Math.abs(actual-expected) <= .011, `${label}: ${actual} vs ${expected}`);
test("all cached intermediate formulas in 40 reference products reconcile",()=>{
  const calc=calculateImport(operation);assert.equal(calc.items.length,40);assert.equal(calc.calculationReady,true);
  const map: Record<string,string> = { E:"inputBrl",N:"siscomex",O:"afrmm",P:"otherExpenses",R:"markup",S:"saleUnit",T:"saleTotal",V:"pisNet",X:"cofinsNet",Z:"ipiNet",AB:"icmsSale",AD:"csll",AF:"irpj",AH:"irpjAdditional" };
  calc.items.forEach((item,index)=>{const row=fixture.rows[index];Object.entries(map).forEach(([column,key])=>{if(row[column]!==undefined)close((item.pricing as any)[key],row[column],`${column}${index+9}`);});Object.entries({G:item.ii,I:item.ipi,K:item.pis,M:item.cofins,Q:item.totalCost}).forEach(([column,value])=>close(value,row[column],`${column}${index+9}`));});
  close(calc.totalCost,fixture.totals.Q,"Total Q");close(calc.pricingTotals?.saleTotal,fixture.totals.T,"Total T");
  close(calc.pricingTotals?.markup,fixture.rows.reduce((sum: number,row: any)=>sum+(row.R??0),0),"Total R without erroneous header rate");
  assert.ok(Math.abs(fixture.totals.R - fixture.rows.reduce((sum: number,row: any)=>sum+(row.R??0),0) - .06) < .00001);
});
test("importer retains total net weight, converts total USD to unit USD, identifies CIF and rates",()=>{
 assert.equal(imported.budget.priceBasis,"cif");assert.equal(imported.items[0].netWeightKg,fixture.rows[0].B);close(imported.items[0].unitPriceUsd*imported.items[0].quantity,fixture.rows[0].D,"USD");assert.equal(imported.items[0].ncm,"39191090");assert.equal(imported.items[0].taxRates?.find(rate=>rate.code==="irpj_additional")?.rate,20);
});
test("FOB includes freight once in CIF; CIF excludes already included international expenses",()=>{
 const expense={id:"f",label:"Frete",category:"Frete",kind:"freight" as const,currency:"BRL" as const,amount:100,allocationMethod:"fob" as const,status:"estimated" as const};
 const base={...operation,items:[{...operation.items[0],quantity:1,unitPriceUsd:100,sourcePriceBasis:undefined,iiRate:10,ipiRate:0,taxRates:[]}],budgets:[{...budget,exchangeRate:1,priceBasis:"fob" as const,expenses:[expense]}]};
 const fob=calculateImport(base);assert.equal(fob.items[0].pricing?.cifBrl,200);assert.equal(fob.items[0].ii,20);assert.equal(fob.totalCost,220);
 const cif=calculateImport({...base,budgets:[{...base.budgets[0],priceBasis:"cif"}]});assert.equal(cif.items[0].pricing?.cifBrl,100);assert.equal(cif.totalCost,110);assert.equal(cif.calculationReady,true);
});
test("missing net weight, wrong CIF basis and invalid markup block approval",()=>{
 for(const changed of [ {...operation,items:operation.items.map((item,index)=>index===0?{...item,netWeightKg:undefined}:item)}, {...operation,budgets:[{...budget,priceBasis:"fob" as const}]}, {...operation,budgets:[{...budget,marginRate:-1}]} ]) { const calc=calculateImport(changed);assert.equal(calc.calculationReady,false);assert.equal(calc.suggestedSaleTotal,null);assert.throws(()=>approveOperationCosts(changed,budget,"Admin")); }
 const zero=calculateImport({...operation,items:[{...operation.items[0],quantity:0}]});assert.equal(zero.calculationReady,false);assert.equal(zero.items[0].unitCost,0);
});
test("fixed allocations are equal; one markup rule applies and negative credits remain visible",()=>{
 const simple={...operation,items:operation.items.slice(0,2).map((item,index)=>({...item,quantity:1,unitPriceUsd:100*(index+1),iiRate:0,ipiRate:0,taxRates:[{code:"pis_import" as const,rate:2,source:"manual" as const}]})),budgets:[{...budget,exchangeRate:1,marginRate:20,expenses:[{...budget.expenses[0],kind:"other" as const,allocationMethod:"fixed" as const,amount:100}]}]};
 const markup=calculateImport(simple);assert.equal(markup.items[0].allocatedExpenses,50);assert.equal(markup.items[1].allocatedExpenses,50);assert.equal(markup.items[0].pricing?.pisNet,-2);
 close(markup.suggestedSaleTotal,markup.totalCost*1.2,"markup");const margin=calculateImport({...simple,budgets:[{...simple.budgets[0],marginMethod:"sale_margin"}]});close(margin.suggestedSaleTotal,margin.totalCost*1.2,"old metadata must not change the rule");
});
test("new pricing fields survive JSON persistence and reject malformed optional data",()=>{
 const restored=JSON.parse(JSON.stringify(operation));assert.equal(validPricingFields(restored),true);assert.deepEqual(calculateImport(restored),calculateImport(operation));assert.equal(validPricingFields({...operation,items:[{...operation.items[0],netWeightKg:-1}]}),false);assert.equal(validPricingFields({...operation,budgets:[{...budget,priceBasis:"unknown"}]}),false);
});
test("reports export all rows and reconcile sales, credits and tax totals",()=>{
 const context={timeline:[],tasks:[],documents:[]};const data=operationReportData(operation,context),calc=calculateImport(operation);
 assert.equal(data.sheets.find(sheet=>sheet.name==="Venda por item")?.rows.length,40);assert.equal(data.summary.find(row=>row.label==="Tributos de saída líquidos")?.value,calc.pricingTotals?.outputTaxes);assert.equal(data.sheets.find(sheet=>sheet.name==="PIS de saída")?.rows[0][4],calc.items[0].pricing?.pisNet);
 const workbook=createOperationWorkbook(operation,context);assert.equal(workbook.worksheets[0].name,"Resumo de fechamento");assert.equal(workbook.getWorksheet("Venda por item")?.getCell("D4").value,calc.items[0].pricing?.saleTotal);assert.ok(data.notes.some(note=>note.includes("ICMS de importação")));
});
if(process.env.PRICING_QA==="1") {mkdirSync("output/item-pricing",{recursive:true});const context={timeline:[],tasks:[],documents:[]};const font=readFileSync("apps/web/public/fonts/NotoSansSC-Regular.ttf").toString("base64");const pdf=await createOperationPdf(operation,context,font);writeFileSync("output/item-pricing/operation.pdf",Buffer.from(pdf.output("arraybuffer")));await createOperationWorkbook(operation,context).xlsx.writeFile("output/item-pricing/operation.xlsx");writeFileSync("output/item-pricing/fixture.json",JSON.stringify(operation));console.log("QA PDF pages",pdf.getNumberOfPages());}

test("beta metadata cannot select another engine; all summaries and exports use the same formula",()=>{
 const previous = {...operation,budgets:[{...budget,calculationModel:"legacy" as const,marginMethod:"sale_margin" as const}]};
 assert.deepEqual(calculateImport(previous),calculateImport(operation));
 assert.deepEqual(operationReportData(previous,{timeline:[],tasks:[],documents:[]}),operationReportData(operation,{timeline:[],tasks:[],documents:[]}));
 assert.equal(previous.budgets[0].calculationModel,"legacy");
 const missing = {...operation,budgets:[{...budget,calculationModel:undefined,marginMethod:undefined}]};
 assert.deepEqual(calculateImport(missing),calculateImport(operation));
 const approved=approveOperationCosts(previous,budget,"Admin");
 assert.equal(approved.budgets?.[0].calculationModel,"worksheet");
 assert.equal(approved.budgets?.[0].marginMethod,"markup");
});

test("per-product variable taxes never inherit defaults and missing values block approval", () => {
 const next = { ...operation, items: [{ ...operation.items[0], iiRate:0, ipiRate:0, taxRates:[] }], budgets:[{ ...budget, taxInputPolicy:"per_product" as const, taxRates:[{code:"ii" as const,rate:80,source:"default" as const},{code:"ipi" as const,rate:90,source:"default" as const},{code:"ipi_sale" as const,rate:50,source:"default" as const}] }] };
 const missing = calculateImport(next); assert.equal(missing.items[0].ii,0); assert.equal(missing.items[0].ipi,0); assert.equal(missing.calculationReady,false);
 assert.throws(()=>approveOperationCosts(next,next.budgets[0],"Admin"));
 next.items[0].taxRates=["ii","ipi","ipi_sale"].map(code=>({code:code as "ii"|"ipi"|"ipi_sale",rate:0,source:"manual" as const}));
 assert.equal(calculateImport(next).calculationReady,true);
});
