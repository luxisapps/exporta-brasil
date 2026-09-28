import cors from "@fastify/cors";
import Fastify from "fastify";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import fastifyMultipart from "@fastify/multipart";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { Pool } from "pg";
import { calculateImport, type Customer, type CustomsSignal, type ImportItem, type ImportOperation, type ImportStatus, type PortFacility, type PortStatus } from "@exporta/domain";

const app = Fastify({ logger: true, bodyLimit: 2 * 1024 * 1024 });
await app.register(cors, { origin: true });
await app.register(fastifyMultipart, { limits: { fileSize: 1024 * 1024, files: 1 } });

const imports = new Map<string, ImportOperation>();
const customers = new Map<string, Customer>();
type UserRole = "admin" | "operator";
type User = { id: string; name: string; email: string; role: UserRole; passwordHash: string; mustChangePassword: boolean; createdAt: string; phone?: string; jobTitle?: string; avatarUrl?: string };
type Session = { userId: string; expiresAt: number };
const users = new Map<string, User>();
const sessions = new Map<string, Session>();
const now = new Date().toISOString();
const hashPassword = (password: string) => { const salt = randomBytes(16).toString("hex"); return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`; };
const verifyPassword = (password: string, stored: string) => { const [salt, hash] = stored.split(":"); const candidate = scryptSync(password, salt, 64); return timingSafeEqual(candidate, Buffer.from(hash, "hex")); };
const safeUser = ({ passwordHash: _passwordHash, ...user }: User) => user;
const initialAdmin: User = { id: "user-admin", name: process.env.ADMIN_NAME || "Administrador", email: (process.env.ADMIN_EMAIL || "admin@exportabrasil.com").toLowerCase(), role: "admin", passwordHash: hashPassword(process.env.ADMIN_INITIAL_PASSWORD || "exporta123"), mustChangePassword: true, createdAt: now };
const databaseUrl = process.env.DATABASE_URL;
let database: Pool | null = null;
const userFromRow = (row: Record<string, unknown>): User => ({ id: String(row.id), name: String(row.name), email: String(row.email), role: row.role === "admin" ? "admin" : "operator", passwordHash: String(row.password_hash), mustChangePassword: Boolean(row.must_change_password), createdAt: new Date(String(row.created_at)).toISOString(), phone: typeof row.phone === "string" ? row.phone : undefined, jobTitle: typeof row.job_title === "string" ? row.job_title : undefined, avatarUrl: typeof row.avatar_url === "string" ? row.avatar_url : undefined });
async function persistUser(user: User) { if (!database) return; await database.query(`INSERT INTO app_users (id, name, email, role, password_hash, must_change_password, created_at, phone, job_title, avatar_url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, email=EXCLUDED.email, role=EXCLUDED.role, password_hash=EXCLUDED.password_hash, must_change_password=EXCLUDED.must_change_password, phone=EXCLUDED.phone, job_title=EXCLUDED.job_title, avatar_url=EXCLUDED.avatar_url`, [user.id, user.name, user.email, user.role, user.passwordHash, user.mustChangePassword, user.createdAt, user.phone ?? null, user.jobTitle ?? null, user.avatarUrl ?? null]); }
async function initializeUserStore() { if (!databaseUrl) { users.set(initialAdmin.id, initialAdmin); app.log.warn("DATABASE_URL ausente; usuários serão mantidos apenas em memória."); return; } database = new Pool({ connectionString: databaseUrl }); await database.query(`CREATE TABLE IF NOT EXISTS app_users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, role TEXT NOT NULL CHECK (role IN ('admin','operator')), password_hash TEXT NOT NULL, must_change_password BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), phone TEXT, job_title TEXT, avatar_url TEXT)`); const result = await database.query("SELECT id, name, email, role, password_hash, must_change_password, created_at, phone, job_title, avatar_url FROM app_users"); if (result.rows.length === 0) { users.set(initialAdmin.id, initialAdmin); await persistUser(initialAdmin); return; } result.rows.forEach((row) => { const user = userFromRow(row); users.set(user.id, user); }); }
const sessionUser = (authorization?: string) => { const token = authorization?.replace(/^Bearer\s+/i, ""); const session = token ? sessions.get(token) : undefined; return session && session.expiresAt > Date.now() ? users.get(session.userId) : undefined; };
const antaqFacilitiesUrl = "https://geo.infrasa.gov.br/server/rest/services/Hosted/Instala%C3%A7%C3%B5es_portu%C3%A1rias/FeatureServer/0/query";
const portCatalogCacheTtlMs = 24 * 60 * 60 * 1000;
let portCatalogCache: { facilities: PortFacility[]; syncedAt: string; expiresAt: number } | null = null;
const marketContextCacheTtlMs = 15 * 60 * 1000;
let marketContextCache: { data: MarketContext; expiresAt: number } | null = null;
const receitaCnpjApiUrl = process.env.RFB_CNPJ_API_URL?.replace(/\/$/, "");
const receitaCnpjApiToken = process.env.RFB_CNPJ_API_TOKEN;
const r2Endpoint = process.env.R2_ENDPOINT;
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const r2Bucket = process.env.R2_BUCKET;
const r2PublicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
const r2Enabled = Boolean(r2Endpoint && r2AccessKeyId && r2SecretAccessKey && r2Bucket && r2PublicUrl);
const r2Client = r2Enabled ? new S3Client({ region: "auto", endpoint: r2Endpoint, forcePathStyle: true, credentials: { accessKeyId: r2AccessKeyId!, secretAccessKey: r2SecretAccessKey! } }) : null;
const avatarContentTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

type MarketContext = {
  dollar: { buy: number; sell: number; quotedAt: string; source: "BCB PTAX" };
  news: Array<{ title: string; url: string; publishedAt?: string; source: "Siscomex" }>;
  updatedAt: string;
};

type AntaqFeature = {
  attributes: {
    objectid: number;
    nome: string;
    tipo: string;
    uf: string;
    municipio: string;
    situacao: string;
    gestao: string;
    hidrovia: string | null;
  };
};

async function getPortCatalog() {
  if (portCatalogCache && portCatalogCache.expiresAt > Date.now()) return portCatalogCache;
  const params = new URLSearchParams({
    f: "json", where: "1=1", outFields: "objectid,nome,tipo,uf,municipio,situacao,gestao,hidrovia",
    returnGeometry: "false", resultRecordCount: "2000", orderByFields: "nome ASC"
  });
  const response = await fetch(`${antaqFacilitiesUrl}?${params}`);
  if (!response.ok) throw new Error(`ANTAQ respondeu ${response.status}`);
  const payload = await response.json() as { features?: AntaqFeature[] };
  const facilities = (payload.features ?? []).map(({ attributes }) => ({
    id: String(attributes.objectid), name: attributes.nome, type: attributes.tipo, state: attributes.uf,
    municipality: attributes.municipio, operationalStatus: attributes.situacao, management: attributes.gestao,
    waterway: attributes.hidrovia
  }));
  const syncedAt = new Date().toISOString();
  portCatalogCache = { facilities, syncedAt, expiresAt: Date.now() + portCatalogCacheTtlMs };
  return portCatalogCache;
}

const cnpjRaw = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 14);
const cnpjDigit = (value: string) => {
  const weights = value.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const remainder = [...value].reduce((sum, character, index) => sum + (character.charCodeAt(0) - 48) * weights[index], 0) % 11;
  return remainder < 2 ? 0 : 11 - remainder;
};
const isValidCnpj = (value: string) => {
  const raw = cnpjRaw(value);
  if (raw.length !== 14 || (/^\d+$/.test(raw) && /^(\d)\1+$/.test(raw))) return false;
  const base = raw.slice(0, 12);
  const first = cnpjDigit(base);
  return Number(raw[12]) === first && Number(raw[13]) === cnpjDigit(`${base}${first}`);
};
const textValue = (...values: unknown[]) => values.find((value) => typeof value === "string" && value.trim()) as string | undefined;
const objectValue = (value: unknown) => value && typeof value === "object" ? value as Record<string, unknown> : {};

function companyFromReceita(payload: Record<string, unknown>) {
  const establishment = objectValue(payload.estabelecimento);
  const company = objectValue(payload.empresa);
  const phone = [textValue(establishment.ddd1, payload.ddd1), textValue(establishment.telefone1, payload.telefone1)].filter(Boolean).join(" ");
  const street = [textValue(establishment.tipo_logradouro, payload.tipo_logradouro), textValue(establishment.logradouro, payload.logradouro)].filter(Boolean).join(" ");
  return {
    legalName: textValue(company.razao_social, payload.razao_social, payload.nome_empresarial, payload.nome),
    tradeName: textValue(establishment.nome_fantasia, payload.nome_fantasia),
    email: textValue(establishment.email, payload.email), phone: phone || undefined,
    postalCode: textValue(establishment.cep, payload.cep), street: street || undefined,
    number: textValue(establishment.numero, payload.numero), complement: textValue(establishment.complemento, payload.complemento),
    district: textValue(establishment.bairro, payload.bairro),
    city: textValue(establishment.municipio, payload.municipio), state: textValue(establishment.uf, payload.uf),
    registrationStatus: textValue(establishment.situacao_cadastral, payload.situacao_cadastral)
  };
}

async function getPtaxDollar() {
  for (let daysAgo = 0; daysAgo < 10; daysAgo += 1) {
    const date = new Date(); date.setUTCDate(date.getUTCDate() - daysAgo);
    const value = `${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}-${date.getUTCFullYear()}`;
    const params = new URLSearchParams({ "@moeda": "'USD'", "@dataCotacao": `'${value}'`, "$top": "1", "$format": "json" });
    const response = await fetch(`https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaDia(moeda=@moeda,dataCotacao=@dataCotacao)?${params}`);
    if (!response.ok) continue;
    const payload = await response.json() as { value?: Array<{ cotacaoCompra: number; cotacaoVenda: number; dataHoraCotacao: string }> };
    const quote = payload.value?.at(-1);
    if (quote) return { buy: quote.cotacaoCompra, sell: quote.cotacaoVenda, quotedAt: quote.dataHoraCotacao, source: "BCB PTAX" as const };
  }
  throw new Error("A PTAX não retornou uma cotação recente.");
}

const decodeXml = (value: string) => value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#8211;/g, "–").trim();
async function getSiscomexNews() {
  const response = await fetch("https://www.gov.br/siscomex/pt-br/noticias/rss.xml", { headers: { accept: "application/rss+xml, application/xml" } });
  if (!response.ok) throw new Error(`Siscomex respondeu ${response.status}`);
  const xml = await response.text();
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((match) => {
    const item = match[1];
    const field = (name: string) => decodeXml(item.match(new RegExp(`<${name}>([\\s\\S]*?)<\\/${name}>`))?.[1] ?? "");
    return { title: field("title"), url: field("link") || field("guid"), publishedAt: field("pubDate") || undefined, source: "Siscomex" as const };
  }).filter((item) => item.title && item.url);
  return [...items.filter((item) => /importa|aduana|duimp/i.test(item.title)), ...items.filter((item) => !/importa|aduana|duimp/i.test(item.title))].slice(0, 3);
}
async function getMarketContext() {
  if (marketContextCache && marketContextCache.expiresAt > Date.now()) return marketContextCache.data;
  const [dollar, news] = await Promise.all([getPtaxDollar(), getSiscomexNews().catch(() => [])]);
  const data: MarketContext = { dollar, news, updatedAt: new Date().toISOString() };
  marketContextCache = { data, expiresAt: Date.now() + marketContextCacheTtlMs };
  return data;
}

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
  customsChannel: "yellow",
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

app.get("/api/market-context", async (request, reply) => {
  try {
    return await getMarketContext();
  } catch (error) {
    request.log.error(error, "Não foi possível consultar o contexto operacional");
    return reply.code(503).send({ message: "A cotação oficial está indisponível no momento." });
  }
});

app.get<{ Params: { cep: string } }>("/api/addresses/:cep", async (request, reply) => {
  const cep = request.params.cep.replace(/\D/g, "");
  if (cep.length !== 8) return reply.code(400).send({ message: "Informe um CEP com 8 dígitos." });
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { headers: { accept: "application/json" } });
    if (!response.ok) return reply.code(502).send({ message: "A consulta de CEP está indisponível no momento." });
    const address = await response.json() as { erro?: boolean; cep?: string; logradouro?: string; complemento?: string; bairro?: string; localidade?: string; uf?: string };
    if (address.erro) return reply.code(404).send({ message: "CEP não encontrado." });
    return { postalCode: address.cep, street: address.logradouro, complement: address.complemento, district: address.bairro, city: address.localidade, state: address.uf };
  } catch (error) {
    request.log.error(error, "Falha na consulta ViaCEP");
    return reply.code(503).send({ message: "A consulta de CEP está indisponível no momento." });
  }
});

app.get<{ Params: { cnpj: string } }>("/api/companies/:cnpj", async (request, reply) => {
  const cnpj = cnpjRaw(request.params.cnpj);
  if (!isValidCnpj(cnpj)) return reply.code(400).send({ message: "CNPJ inválido." });
  if (!receitaCnpjApiUrl) return reply.code(503).send({ message: "A consulta oficial da Receita Federal ainda não foi configurada neste ambiente." });
  try {
    const response = await fetch(`${receitaCnpjApiUrl}/${encodeURIComponent(cnpj)}`, {
      headers: { accept: "application/json", ...(receitaCnpjApiToken ? { authorization: `Bearer ${receitaCnpjApiToken}` } : {}) }
    });
    if (!response.ok) {
      request.log.warn({ statusCode: response.status }, "Consulta oficial de CNPJ falhou");
      return reply.code(response.status === 404 ? 404 : 502).send({ message: response.status === 404 ? "CNPJ não encontrado na Receita Federal." : "A consulta da Receita Federal está indisponível no momento." });
    }
    const company = companyFromReceita(await response.json() as Record<string, unknown>);
    if (!company.legalName) return reply.code(502).send({ message: "A Receita Federal não retornou uma razão social para este CNPJ." });
    return company;
  } catch (error) {
    request.log.error(error, "Falha na consulta oficial de CNPJ");
    return reply.code(503).send({ message: "A consulta da Receita Federal está indisponível no momento." });
  }
});

app.post<{ Body: { email: string; password: string } }>("/api/auth/login", async (request, reply) => {
  const user = [...users.values()].find((item) => item.email === request.body.email.trim().toLowerCase());
  if (!user || !verifyPassword(request.body.password, user.passwordHash)) return reply.code(401).send({ message: "E-mail ou senha inválidos." });
  const token = randomBytes(32).toString("base64url"); sessions.set(token, { userId: user.id, expiresAt: Date.now() + 8 * 60 * 60 * 1000 });
  return { token, user: safeUser(user) };
});
app.post<{ Body: { password: string } }>("/api/auth/change-password", async (request, reply) => {
  const user = sessionUser(request.headers.authorization); if (!user) return reply.code(401).send({ message: "Sessão inválida." });
  if (request.body.password.length < 8) return reply.code(400).send({ message: "A senha deve ter ao menos 8 caracteres." });
  user.passwordHash = hashPassword(request.body.password); user.mustChangePassword = false; await persistUser(user); return { user: safeUser(user) };
});
app.get("/api/me", async (request, reply) => { const user = sessionUser(request.headers.authorization); if (!user) return reply.code(401).send({ message: "Sessão inválida." }); return safeUser(user); });
app.patch<{ Body: { name?: string; phone?: string; jobTitle?: string; avatarUrl?: string | null } }>("/api/me", async (request, reply) => {
  const user = sessionUser(request.headers.authorization); if (!user) return reply.code(401).send({ message: "Sessão inválida." });
  const { name, phone, jobTitle, avatarUrl } = request.body;
  if (typeof name === "string") { const value = name.trim(); if (!value) return reply.code(400).send({ message: "Informe seu nome." }); user.name = value; }
  if (typeof phone === "string") user.phone = phone.trim() || undefined;
  if (typeof jobTitle === "string") user.jobTitle = jobTitle.trim() || undefined;
  if (avatarUrl !== undefined) { if (avatarUrl !== null && (!r2PublicUrl || !avatarUrl.startsWith(`${r2PublicUrl}/profiles/${user.id}/`))) return reply.code(400).send({ message: "A imagem de perfil deve ser enviada pelo armazenamento autorizado." }); user.avatarUrl = avatarUrl || undefined; }
  await persistUser(user);
  return safeUser(user);
});
app.post("/api/me/avatar", async (request, reply) => {
  const user = sessionUser(request.headers.authorization); if (!user) return reply.code(401).send({ message: "Sessão inválida." });
  if (!r2Enabled || !r2Client || !r2Bucket || !r2PublicUrl) return reply.code(503).send({ message: "O armazenamento de arquivos ainda não foi configurado." });
  const file = await (request as typeof request & { file: () => Promise<{ mimetype: string; toBuffer: () => Promise<Buffer>; file: { truncated: boolean } } | undefined> }).file();
  if (!file) return reply.code(400).send({ message: "Selecione uma imagem para enviar." });
  if (!avatarContentTypes.has(file.mimetype)) return reply.code(400).send({ message: "Envie uma imagem JPG, PNG ou WebP." });
  const buffer = await file.toBuffer();
  if (file.file.truncated || buffer.length > 1024 * 1024) return reply.code(413).send({ message: "A imagem deve ter no máximo 1 MB." });
  const extension = file.mimetype === "image/jpeg" ? "jpg" : file.mimetype.split("/")[1];
  const key = `profiles/${user.id}/${crypto.randomUUID()}.${extension}`;
  try { await r2Client.send(new PutObjectCommand({ Bucket: r2Bucket, Key: key, Body: buffer, ContentType: file.mimetype, CacheControl: "public, max-age=31536000, immutable" })); }
  catch (error) { request.log.error(error, "Falha no envio da foto ao R2"); return reply.code(502).send({ message: "Não foi possível enviar a imagem ao armazenamento." }); }
  user.avatarUrl = `${r2PublicUrl}/${key}`;
  await persistUser(user);
  return safeUser(user);
});

app.get("/api/users", async (request, reply) => { const user = sessionUser(request.headers.authorization); if (!user) return reply.code(401).send({ message: "Sessão inválida." }); return [...users.values()].map(safeUser); });
app.post<{ Body: { name: string; email: string; role: UserRole; initialPassword: string } }>("/api/users", async (request, reply) => { const admin = sessionUser(request.headers.authorization); if (!admin || admin.role !== "admin") return reply.code(403).send({ message: "Acesso restrito a administradores." }); if (request.body.initialPassword.length < 8) return reply.code(400).send({ message: "A senha inicial deve ter ao menos 8 caracteres." }); if ([...users.values()].some((item) => item.email === request.body.email.trim().toLowerCase())) return reply.code(409).send({ message: "Este e-mail já está cadastrado." }); const user: User = { id: `user-${crypto.randomUUID()}`, name: request.body.name.trim(), email: request.body.email.trim().toLowerCase(), role: request.body.role, passwordHash: hashPassword(request.body.initialPassword), mustChangePassword: true, createdAt: new Date().toISOString() }; users.set(user.id, user); await persistUser(user); return reply.code(201).send(safeUser(user)); });

app.get("/api/port-facilities", async (request, reply) => {
  try {
    const catalog = await getPortCatalog();
    return { data: catalog.facilities, total: catalog.facilities.length, source: "ANTAQ", syncedAt: catalog.syncedAt };
  } catch (error) {
    request.log.error(error, "Não foi possível consultar o catálogo da ANTAQ");
    return reply.code(503).send({ message: "O catálogo de instalações portuárias está indisponível no momento." });
  }
});

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
  const operation: ImportOperation = { id, ...request.body, status: "draft", portStatus: "awaiting_departure", customsChannel: "unassigned", createdAt: timestamp, updatedAt: timestamp, exchangeRate: 5.4, freightBrl: 0, insuranceBrl: 0, portExpensesBrl: 0, items: [] };
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

app.patch<{ Params: { id: string }; Body: Partial<Pick<ImportOperation, "exchangeRate" | "freightBrl" | "insuranceBrl" | "portExpensesBrl" | "status" | "portStatus" | "customsChannel">> }>("/api/imports/:id", async (request, reply) => {
  const operation = imports.get(request.params.id);
  if (!operation) return reply.code(404).send({ message: "Importação não encontrada" });
  Object.assign(operation, request.body as { status?: ImportStatus; portStatus?: PortStatus; customsChannel?: CustomsSignal });
  operation.updatedAt = new Date().toISOString();
  return { ...operation, summary: calculateImport(operation) };
});

await initializeUserStore();
await app.listen({ port: Number(process.env.PORT || 3171), host: "0.0.0.0" });
