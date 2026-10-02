import test from "node:test";
import assert from "node:assert/strict";
import { cityFacilities,cityBudgetExpenses,changeBudgetCity,validPortCitySettings,calculateImport,effectiveTaxRate,productQuantity,type ImportOperation,type PortCitySettings } from "@exporta/domain";
import { manualProductSheet } from "../src/lib/product-sheet-loader";
import { equivalentText } from "../src/lib/currency";
import { formSchemas } from "../src/lib/form-schemas";
const settings:PortCitySettings={generalExpenses:[{id:"shared",label:"Taxa",amount:100}],cities:[{id:"santos",name:"Santos",state:"SP",expenses:[{id:"storage",label:"Armazenagem",amount:5500}]},{id:"rio",name:"Rio de Janeiro",state:"RJ",expenses:[{id:"fee",label:"Honorários",amount:0}]}]};
test("port city settings validate and filter terminals by municipality and state",()=>{
 assert.equal(validPortCitySettings(settings),true);assert.equal(validPortCitySettings({...settings,generalExpenses:[{id:"bad",label:"",amount:-1}]}),false);
 const terminals=[{id:1,name:"Terminal",municipality:"SANTOS",state:"SP"},{id:2,name:"Outro",municipality:"Santos",state:"RJ"},{id:3,name:"Rio",municipality:"Rio de Janeiro",state:"RJ"}];
 assert.equal(cityFacilities(settings.cities[0],terminals as any).length,1);
});
test("city defaults snapshot once and city changes preserve manual and approved expenses",()=>{
 const expenses=cityBudgetExpenses(settings,"santos");assert.equal(expenses.length,2);assert.equal(expenses[1].amount,5500);
 const budget={id:"b",name:"B",number:1,status:"draft",createdAt:"",exchangeRate:5,marginRate:0,taxRates:[],expenses:[...expenses,{...expenses[0],id:"manual",defaultExpenseSource:undefined,label:"Manual"}]} as const;
 const changed=changeBudgetCity([budget as any],settings,"rio")![0];assert.equal(changed.expenses.length,3);assert.equal(changed.expenses.find(item=>item.id==="manual")?.label,"Manual");assert.equal(changed.expenses.find(item=>item.label==="Honorários")?.amount,0);
 const approved={...budget,status:"approved"} as const;assert.deepEqual(changeBudgetCity([approved as any],settings,"rio")![0],approved);
});
test("creation needs no ETA and sheet launch discards monetary inputs, keeping physical data",()=>{
 assert.equal(formSchemas.import.safeParse({customerId:"c",port:""}).success,true);
 const result=manualProductSheet({items:[{name:"Produto",ncm:"",quantity:1,boxCount:3,unitsPerBox:5,unitPriceUsd:99,pautaUsdPerKg:20,surplusUsdPerKg:3,grossWeightKg:2,iiRate:0,ipiRate:0}],warnings:[],budget:{exchangeRate:8,marginRate:20,expenses:[]}} as any);
 assert.equal(result.items[0].unitPriceUsd,0);assert.equal(result.items[0].pautaUsdPerKg,undefined);assert.equal(result.items[0].quantity,15);assert.equal(result.items[0].grossWeightKg,2);assert.equal(result.budget,undefined);
});
test("IPI shares input rate and freight is allocated by net weight regardless of old FOB method",()=>{
 const item={id:"one",name:"Produto",ncm:"",quantity:1,unitPriceUsd:100,grossWeightKg:1,netWeightKg:10,iiRate:0,ipiRate:0,taxRates:[{code:"ipi",rate:5,source:"manual"},{code:"ipi_sale",rate:99,source:"manual"}]} as any;
 assert.equal(effectiveTaxRate(item,undefined,"ipi_sale"),5);assert.equal(productQuantity({...item,boxCount:4,unitsPerBox:6}),24);
 const operation:ImportOperation={id:"o",reference:"EB",customer:"C",port:"",eta:"",container:"",status:"draft",portStatus:"awaiting_departure",customsChannel:"unassigned",createdAt:"",updatedAt:"",exchangeRate:5,insuranceBrl:0,freightBrl:300,portExpensesBrl:0,items:[item,{...item,id:"two",unitPriceUsd:1,netWeightKg:20}]};
 const result=calculateImport(operation);assert.equal(result.items[0].pricing?.freight,100);assert.equal(result.items[1].pricing?.freight,200);assert.equal(result.items.reduce((sum,item)=>sum+(item.pricing?.freight??0),0),300);
});
test("USD equivalents show BRL and CNY without repeating USD",()=>{
 const rates={dollar:{buy:5,sell:5,source:"BCB",quotedAt:""},yuan:{buy:1,sell:1,source:"BCB",quotedAt:""}};
 const output=equivalentText(10,"USD",rates);assert.ok(output.includes("BRL"));assert.ok(output.includes("CNY"));assert.ok(!output.includes("USD"));
});
