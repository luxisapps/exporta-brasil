import type { ProductSheetResult } from "./product-sheet";

export type ProductSheetWorkerResult = { result: ProductSheetResult } | { error: string };

export function parseProductSheet(file: File): Promise<ProductSheetResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./product-sheet.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (event: MessageEvent<ProductSheetWorkerResult>) => {
      worker.terminate();
      if ("error" in event.data) reject(new Error(event.data.error));
      else resolve(event.data.result);
    };
    worker.onerror = () => {
      worker.terminate();
      reject(new Error("Não foi possível ler a planilha."));
    };
    worker.onmessageerror = () => {
      worker.terminate();
      reject(new Error("Não foi possível ler a planilha."));
    };
    try { worker.postMessage(file); }
    catch (error) { worker.terminate(); reject(error); }
  });
}
