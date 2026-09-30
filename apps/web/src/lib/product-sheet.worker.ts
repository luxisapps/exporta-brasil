import { parseProductSheet } from "./product-sheet";
import type { ProductSheetWorkerResult } from "./product-sheet-loader";

// File is cloned into the worker; workbook parsing stays off the UI thread.
self.onmessage = async (event: MessageEvent<File>) => {
  let response: ProductSheetWorkerResult;
  try { response = { result: await parseProductSheet(event.data) }; }
  catch (error) { response = { error: error instanceof Error ? error.message : "Não foi possível ler a planilha." }; }
  self.postMessage(response);
};
