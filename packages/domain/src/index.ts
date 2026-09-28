export type ImportStatus = "draft" | "quotation" | "in_transit" | "at_port" | "customs" | "cleared" | "completed";

export type PortStatus = "awaiting_departure" | "in_transit" | "awaiting_berth" | "unloading" | "customs_clearance" | "released";

export type ImportItem = {
  id: string;
  name: string;
  ncm: string;
  quantity: number;
  unitPriceUsd: number;
  grossWeightKg: number;
  iiRate: number;
  ipiRate: number;
};

export type Customer = {
  id: string;
  legalName: string;
  tradeName: string;
  taxId: string;
  contactName: string;
  email: string;
  phone: string;
  status: "active" | "inactive";
  createdAt: string;
};

/** Registro de referência de uma instalação portuária publicada pela ANTAQ. */
export type PortFacility = {
  id: string;
  name: string;
  type: string;
  state: string;
  municipality: string;
  operationalStatus: string;
  management: string;
  waterway: string | null;
};

export type ImportOperation = {
  id: string;
  reference: string;
  customerId?: string;
  customer: string;
  supplier: string;
  port: string;
  container: string;
  status: ImportStatus;
  portStatus: PortStatus;
  eta: string;
  createdAt: string;
  updatedAt: string;
  exchangeRate: number;
  freightBrl: number;
  insuranceBrl: number;
  portExpensesBrl: number;
  items: ImportItem[];
};

export const importStatusMeta: Record<ImportStatus, { label: string; tone: "neutral" | "info" | "warning" | "success" }> = {
  draft: { label: "Rascunho", tone: "neutral" },
  quotation: { label: "Em cotação", tone: "info" },
  in_transit: { label: "Em trânsito", tone: "info" },
  at_port: { label: "No porto", tone: "warning" },
  customs: { label: "Em desembaraço", tone: "warning" },
  cleared: { label: "Liberada", tone: "success" },
  completed: { label: "Concluída", tone: "success" }
};

export const portStatusMeta: Record<PortStatus, { label: string; detail: string }> = {
  awaiting_departure: { label: "Aguardando embarque", detail: "Documentação de origem em conferência" },
  in_transit: { label: "Em trânsito marítimo", detail: "Navio a caminho do porto de destino" },
  awaiting_berth: { label: "Aguardando atracação", detail: "Chegada confirmada; aguardando janela do terminal" },
  unloading: { label: "Em descarga", detail: "Contêiner em movimentação no terminal" },
  customs_clearance: { label: "Em desembaraço aduaneiro", detail: "Processo sob análise da alfândega" },
  released: { label: "Carga liberada", detail: "Disponível para retirada programada" }
};

const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function calculateImport(operation: Pick<ImportOperation, "items" | "exchangeRate" | "freightBrl" | "insuranceBrl" | "portExpensesBrl">) {
  const fobBrl = operation.items.reduce((total, item) => total + item.quantity * item.unitPriceUsd * operation.exchangeRate, 0);
  const totalWeight = operation.items.reduce((total, item) => total + item.grossWeightKg * item.quantity, 0);
  const baseExpenses = operation.freightBrl + operation.insuranceBrl + operation.portExpensesBrl;
  const items = operation.items.map((item) => {
    const itemFob = item.quantity * item.unitPriceUsd * operation.exchangeRate;
    const allocatedExpenses = fobBrl === 0 ? 0 : baseExpenses * (itemFob / fobBrl);
    const ii = itemFob * (item.iiRate / 100);
    const ipi = (itemFob + ii) * (item.ipiRate / 100);
    const totalCost = itemFob + allocatedExpenses + ii + ipi;
    return { ...item, itemFob: round(itemFob), allocatedExpenses: round(allocatedExpenses), ii: round(ii), ipi: round(ipi), totalCost: round(totalCost), unitCost: item.quantity === 0 ? 0 : round(totalCost / item.quantity) };
  });
  const taxes = items.reduce((total, item) => total + item.ii + item.ipi, 0);
  return { fobBrl: round(fobBrl), totalWeight: round(totalWeight), baseExpenses: round(baseExpenses), taxes: round(taxes), totalCost: round(items.reduce((total, item) => total + item.totalCost, 0)), items };
}
