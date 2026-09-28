import cors from "@fastify/cors";
import Fastify from "fastify";
import { calculateImport, type Customer, type ImportItem, type ImportOperation, type ImportStatus, type PortStatus } from "@exporta/domain";

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

const imports = new Map<string, ImportOperation>();
const customers = new Map<string, Customer>();
const now = new Date().toISOString();

const customerSeed: Customer[] = [
  { id: "customer-001", legalName: "Aurora Comércio e Importação Ltda.", tradeName: "Aurora Comércio", taxId: "12.345.678/0001-90", contactName: "Renata Prado", email: "renata@auroracomercio.com.br", phone: "+55 11 99999-1020", status: "active", createdAt: now },
  { id: "customer-002", legalName: "Casa Norte Utilidades Ltda.", tradeName: "Casa Norte", taxId: "45.678.901/0001-23", contactName: "Marcelo Lima", email: "marcelo@casanorte.com.br", phone: "+55 47 98888-2040", status: "active", createdAt: now }
];
customerSeed.forEach((customer) => customers.set(customer.id, customer));

const seed: ImportOperation = {
  id: "imp-001",
  reference: "EB-2026-001",
  customerId: "customer-001",
  customer: "Aurora Comércio",
  supplier: "Ningbo Horizon Co.",
  port: "Porto de Santos",
  container: "TGHU 812903-4",
  status: "customs",
  portStatus: "customs_clearance",
  eta: "2026-10-03",
  createdAt: "2026-09-12T10:00:00.000Z",
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

app.get("/api/customers", async () => [...customers.values()]);

app.post<{ Body: Omit<Customer, "id" | "createdAt" | "status"> & Partial<Pick<Customer, "status">> }>("/api/customers", async (request, reply) => {
  const customer: Customer = { id: `customer-${crypto.randomUUID()}`, ...request.body, status: request.body.status ?? "active", createdAt: new Date().toISOString() };
  customers.set(customer.id, customer);
  return reply.code(201).send(customer);
});

app.patch<{ Params: { id: string }; Body: Partial<Omit<Customer, "id" | "createdAt">> }>("/api/customers/:id", async (request, reply) => {
  const customer = customers.get(request.params.id);
  if (!customer) return reply.code(404).send({ message: "Cliente não encontrado" });
  Object.assign(customer, request.body);
  return customer;
});

app.get<{ Querystring: { page?: string; pageSize?: string; status?: ImportStatus; sort?: "createdAtAsc" | "createdAtDesc" | "updatedAtDesc"; query?: string } }>("/api/imports", async (request) => {
  const page = Math.max(1, Number(request.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(request.query.pageSize) || 20));
  const sort = request.query.sort ?? "createdAtAsc";
  const query = request.query.query?.toLocaleLowerCase("pt-BR").trim();
  const filtered = [...imports.values()].filter((operation) => (!request.query.status || operation.status === request.query.status) && (!query || `${operation.reference} ${operation.customer} ${operation.supplier}`.toLocaleLowerCase("pt-BR").includes(query)));
  const ordered = filtered.sort((a, b) => {
    const createdDifference = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sort === "createdAtDesc") return -createdDifference;
    if (sort === "updatedAtDesc") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    return createdDifference;
  });
  return { data: ordered.slice((page - 1) * pageSize, page * pageSize).map((operation) => ({ ...operation, summary: calculateImport(operation) })), page, pageSize, total: ordered.length, totalPages: Math.max(1, Math.ceil(ordered.length / pageSize)) };
});

app.get<{ Params: { id: string } }>("/api/imports/:id", async (request, reply) => {
  const operation = imports.get(request.params.id);
  if (!operation) return reply.code(404).send({ message: "Importação não encontrada" });
  return { ...operation, summary: calculateImport(operation) };
});

app.post<{ Body: Pick<ImportOperation, "reference" | "customer" | "customerId" | "supplier" | "port" | "container" | "eta"> }>("/api/imports", async (request, reply) => {
  const id = `imp-${crypto.randomUUID()}`;
  const timestamp = new Date().toISOString();
  const operation: ImportOperation = { id, ...request.body, status: "draft", portStatus: "awaiting_departure", createdAt: timestamp, updatedAt: timestamp, exchangeRate: 5.4, freightBrl: 0, insuranceBrl: 0, portExpensesBrl: 0, items: [] };
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
