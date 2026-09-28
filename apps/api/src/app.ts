import cors from "@fastify/cors";
import Fastify from "fastify";
import { calculateImport, type ImportItem, type ImportOperation, type ImportStatus, type PortStatus } from "@exporta/domain";

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

const imports = new Map<string, ImportOperation>();
const now = new Date().toISOString();

const seed: ImportOperation = {
  id: "imp-001",
  reference: "EB-2026-001",
  customer: "Aurora Comércio",
  supplier: "Ningbo Horizon Co.",
  port: "Porto de Santos",
  container: "TGHU 812903-4",
  status: "customs",
  portStatus: "customs_clearance",
  eta: "2026-10-03",
  updatedAt: now,
  exchangeRate: 5.42,
  freightBrl: 18400,
  insuranceBrl: 1850,
  portExpensesBrl: 12680,
  items: [
    { id: "item-001", name: "Mala de viagem rígida", ncm: "42021220", quantity: 480, unitPriceUsd: 18.4, grossWeightKg: 3.2, iiRate: 18, ipiRate: 15 },
    { id: "item-002", name: "Mochila executiva", ncm: "42029200", quantity: 720, unitPriceUsd: 11.7, grossWeightKg: 1.1, iiRate: 20, ipiRate: 10 }
  ]
};
imports.set(seed.id, seed);

app.get("/health", async () => ({ status: "ok", service: "exporta-brasil-api" }));

app.get("/api/imports", async () => [...imports.values()].map((operation) => ({ ...operation, summary: calculateImport(operation) })));

app.get<{ Params: { id: string } }>("/api/imports/:id", async (request, reply) => {
  const operation = imports.get(request.params.id);
  if (!operation) return reply.code(404).send({ message: "Importação não encontrada" });
  return { ...operation, summary: calculateImport(operation) };
});

app.post<{ Body: Pick<ImportOperation, "reference" | "customer" | "supplier" | "port" | "container" | "eta"> }>("/api/imports", async (request, reply) => {
  const id = `imp-${crypto.randomUUID()}`;
  const operation: ImportOperation = { id, ...request.body, status: "draft", portStatus: "awaiting_departure", updatedAt: new Date().toISOString(), exchangeRate: 5.4, freightBrl: 0, insuranceBrl: 0, portExpensesBrl: 0, items: [] };
  imports.set(id, operation);
  return reply.code(201).send({ ...operation, summary: calculateImport(operation) });
});

app.post<{ Params: { id: string }; Body: Omit<ImportItem, "id"> }>("/api/imports/:id/items", async (request, reply) => {
  const operation = imports.get(request.params.id);
  if (!operation) return reply.code(404).send({ message: "Importação não encontrada" });
  operation.items.push({ id: crypto.randomUUID(), ...request.body });
  operation.updatedAt = new Date().toISOString();
  return { ...operation, summary: calculateImport(operation) };
});

app.patch<{ Params: { id: string }; Body: Partial<Pick<ImportOperation, "exchangeRate" | "freightBrl" | "insuranceBrl" | "portExpensesBrl" | "status" | "portStatus">> }>("/api/imports/:id", async (request, reply) => {
  const operation = imports.get(request.params.id);
  if (!operation) return reply.code(404).send({ message: "Importação não encontrada" });
  Object.assign(operation, request.body as { status?: ImportStatus; portStatus?: PortStatus });
  operation.updatedAt = new Date().toISOString();
  return { ...operation, summary: calculateImport(operation) };
});

await app.listen({ port: Number(process.env.PORT || 3171), host: "0.0.0.0" });
