import { useFormContext, useWatch } from "react-hook-form";
import { useEffect } from "react";
import { NumberInput } from "./ui/number-input";
import { Field, FieldLabel } from "./ui/field";
import type { ImportItem } from "@exporta/domain";
export function ProductQuantity({item}:{item:ImportItem|null}){
 const form=useFormContext(),[boxes,units]=useWatch({control:form.control,name:["boxCount","unitsPerBox"]});
 const total=Number(boxes)>0&&Number(units)>0?Number(boxes)*Number(units):undefined;
 useEffect(()=>{if(total!==undefined && form.getValues("quantity")!==String(total))form.setValue("quantity",String(total),{shouldValidate:true});},[total,form]);
 return <Field><FieldLabel>Quantidade</FieldLabel><NumberInput name="quantity" value={total} defaultValue={item?.quantity} readOnly={total!==undefined}/>{total!==undefined&&<small>Caixas × unidades por caixa</small>}</Field>;
}
