import cors from "@fastify/cors";
import Fastify from "fastify";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import fastifyMultipart from "@fastify/multipart";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { Pool } from "pg";
import { getNcmCatalog, searchNcms, suggestNcms } from "./ncm.js";
import { calculateImport, type Customer, type CustomsSignal, type ImportItem, type ImportOperation, type ImportStatus, type PortFacility, type PortStatus } from "@exporta/domain";

const app = Fastify({ logger: true, bodyLimit: 2 * 1024 * 1024 });
await app.register(cors, { origin: true });
await app.register(fastifyMultipart, { limits: { fileSize: 1024 * 1024, files: 1 } });

const imports = new Map<string, ImportOperation>();
const customers = new Map<string, Customer>();
type UserRole = "admin" | "operator";
type PreferredLocale = "pt-BR" | "en-US" | "zh-CN";
type User = { id: string; name: string; email: string; role: UserRole; passwordHash: string; mustChangePassword: boolean; createdAt: string; phone?: string; jobTitle?: string; avatarUrl?: string; preferredLocale: PreferredLocale };
const users = new Map<string, User>();
const now = new Date().toISOString();
const hashPassword = (password: string) => { const salt = randomBytes(16).toString("hex"); return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`; };
const verifyPassword = (password: string, stored: string) => { const [salt, hash] = stored.split(":"); const candidate = scryptSync(password, salt, 64); return timingSafeEqual(candidate, Buffer.from(hash, "hex")); };
const safeUser = ({ passwordHash: _passwordHash, ...user }: User) => user;
const initialAdmin: User = { id: "user-admin", name: process.env.ADMIN_NAME || "Administrador", email: (process.env.ADMIN_EMAIL || "admin@exportabrasil.com").toLowerCase(), role: "admin", passwordHash: hashPassword(process.env.ADMIN_INITIAL_PASSWORD || "exporta123"), mustChangePassword: true, createdAt: now, preferredLocale: "pt-BR" };
const databaseUrl = process.env.DATABASE_URL;
let database: Pool | null = null;
const userFromRow = (row: Record<string, unknown>): User => ({ id: String(row.id), name: String(row.name), email: String(row.email), role: row.role === "admin" ? "admin" : "operator", passwordHash: String(row.password_hash), mustChangePassword: Boolean(row.must_change_password), createdAt: new Date(String(row.created_at)).toISOString(), phone: typeof row.phone === "string" ? row.phone : undefined, jobTitle: typeof row.job_title === "string" ? row.job_title : undefined, avatarUrl: typeof row.avatar_url === "string" ? row.avatar_url : undefined, preferredLocale: row.preferred_locale === "en-US" || row.preferred_locale === "zh-CN" ? row.preferred_locale : "pt-BR" });
async function persistUser(user: User) { if (!database) throw new Error("Banco de dados de usuários não está disponível."); await database.query(`INSERT INTO app_users (id, name, email, role, password_hash, must_change_password, created_at, phone, job_title, avatar_url, preferred_locale) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, email=EXCLUDED.email, role=EXCLUDED.role, password_hash=EXCLUDED.password_hash, must_change_password=EXCLUDED.must_change_password, phone=EXCLUDED.phone, job_title=EXCLUDED.job_title, avatar_url=EXCLUDED.avatar_url, preferred_locale=EXCLUDED.preferred_locale`, [user.id, user.name, user.email, user.role, user.passwordHash, user.mustChangePassword, user.createdAt, user.phone ?? null, user.jobTitle ?? null, user.avatarUrl ?? null, user.preferredLocale]); }
async function initializeUserStore() { if (!databaseUrl) throw new Error("DATABASE_URL é obrigatória para iniciar a API. Configure o PostgreSQL antes de executar o serviço."); database = new Pool({ connectionString: databaseUrl }); await database.query(`CREATE TABLE IF NOT EXISTS app_users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, role TEXT NOT NULL CHECK (role IN ('admin','operator')), password_hash TEXT NOT NULL, must_change_password BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), phone TEXT, job_title TEXT, avatar_url TEXT, preferred_locale TEXT NOT NULL DEFAULT 'pt-BR' CHECK (preferred_locale IN ('pt-BR','en-US','zh-CN')))`); await database.query(`ALTER TABLE app_users ADD COLUMN IF NOT EXISTS preferred_locale TEXT NOT NULL DEFAULT 'pt-BR'`); await database.query(`CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_by TEXT)`); const result = await database.query("SELECT id, name, email, role, password_hash, must_change_password, created_at, phone, job_title, avatar_url, preferred_locale FROM app_users"); if (result.rows.length === 0) { users.set(initialAdmin.id, initialAdmin); await persistUser(initialAdmin); return; } result.rows.forEach((row) => { const user = userFromRow(row); users.set(user.id, user); }); }
const authSecret = process.env.AUTH_SECRET || process.env.ADMIN_INITIAL_PASSWORD || "exporta-brasil-local-session-secret";
const sessionDurationMs = 8 * 60 * 60 * 1000;
const sessionSignature = (payload: string) => createHmac("sha256", authSecret).update(payload).digest("base64url");
const createSessionToken = (userId: string) => { const expiresAt = Date.now() + sessionDurationMs; const payload = `${userId}.${expiresAt}.${randomBytes(12).toString("base64url")}`; return `${payload}.${sessionSignature(payload)}`; };
const sessionUser = (authorization?: string) => {
  const token = authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return undefined;
  const [userId, expiresAtRaw, nonce, signature] = token.split(".");
  if (!userId || !expiresAtRaw || !nonce || !signature || !/^\d+$/.test(expiresAtRaw)) return undefined;
  const payload = `${userId}.${expiresAtRaw}.${nonce}`;
  const expected = sessionSignature(payload);
  const received = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (received.length !== expectedBuffer.length || !timingSafeEqual(received, expectedBuffer) || Number(expiresAtRaw) <= Date.now()) return undefined;
  return users.get(userId);
};
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

type MarketNewsSource = "Siscomex" | "ANTAQ" | "MDIC";
type MarketNews = { title: string; url: string; publishedAt?: string; source: MarketNewsSource };
type MarketContext = {
  dollar: { buy: number; sell: number; quotedAt: string; source: "BCB PTAX" };
  news: MarketNews[];
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

const decodeXml = (value: string) => value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#8211;/g, "–").replace(/&#8217;/g, "’").trim();
const rssNewsSources: Array<{ source: MarketNewsSource; url: string; relevance: RegExp }> = [
  { source: "MDIC", url: "https://www.gov.br/mdic/pt-br/assuntos/noticias/rss.xml", relevance: /comércio exterior|importa|exporta|tarifa|mercosul|acordo comercial|comex/i }
];
const officialPageNewsSources: Array<{ source: Extract<MarketNewsSource, "Siscomex" | "ANTAQ">; url: string; relevance: RegExp }> = [
  { source: "Siscomex", url: "https://www.gov.br/siscomex/pt-br/noticias/noticias-siscomex-importacao", relevance: /importa|aduana|duimp|licen|tratamento|tribut|inmetro|portal único|siscomex/i },
  { source: "ANTAQ", url: "https://www.gov.br/antaq/pt-br/noticias", relevance: /porto|portu|terminal|conten|navega|hidrovia|carga|atraca/i }
];
const stripMarkup = (value: string) => decodeXml(value.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const toIsoBrazilianDate = (value: string) => {
  const match = value.match(/(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2})h?(\d{2})?)?/);
  return match ? `${match[3]}-${match[2]}-${match[1]}T${match[4] ?? "00"}:${match[5] ?? "00"}:00-03:00` : undefined;
};
async function getRssNews(source: typeof rssNewsSources[number]) {
  const response = await fetch(source.url, { headers: { accept: "application/rss+xml, application/xml, text/xml" }, signal: AbortSignal.timeout(8_000) });
  if (!response.ok) throw new Error(`${source.source} respondeu ${response.status}`);
  const xml = await response.text();
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((match) => {
    const item = match[1];
    const field = (name: string) => decodeXml(item.match(new RegExp(`<${name}>([\s\S]*?)<\/${name}>`))?.[1] ?? "");
    return { title: field("title"), url: field("link") || field("guid"), publishedAt: field("pubDate") || field("dc:date") || undefined, source: source.source } satisfies MarketNews;
  }).filter((item) => item.title && item.url);
  const relevant = items.filter((item) => source.relevance.test(item.title));
  return (relevant.length ? relevant : items).slice(0, 6);
}
async function getOfficialPageNews(source: typeof officialPageNewsSources[number]) {
  const response = await fetch(source.url, { headers: { accept: "text/html" }, signal: AbortSignal.timeout(8_000) });
  if (!response.ok) throw new Error(`${source.source} respondeu ${response.status}`);
  const html = await response.text();
  const items = source.source === "Siscomex"
    ? [...html.matchAll(/<article[^>]*>([\s\S]*?)<\/article>/g)].map((match) => {
      const article = match[1];
      const link = article.match(/<h2 class="tileHeadline">[\s\S]*?<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
      const description = article.match(/<span class="description">([\s\S]*?)<\/span>/)?.[1] ?? "";
      const date = article.match(/(\d{2}\/\d{2}\/\d{4}(?:\s*\d{2}h\d{2})?)/)?.[1] ?? "";
      return { title: [link?.[2] ? stripMarkup(link[2]) : "", stripMarkup(description)].filter(Boolean).join(" — "), url: link?.[1] ?? "", publishedAt: toIsoBrazilianDate(date), source: source.source } satisfies MarketNews;
    })
    : [...html.matchAll(/<h2 class="titulo">[\s\S]*?<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<span class="data">\s*([^<]+)[\s\S]*?<\/span>/g)].map((match) => ({ title: stripMarkup(match[2]), url: match[1], publishedAt: toIsoBrazilianDate(match[3]), source: source.source } satisfies MarketNews));
  const valid = items.filter((item) => item.title && item.url);
  const relevant = valid.filter((item) => source.relevance.test(item.title));
  return (relevant.length ? relevant : valid).slice(0, 6);
}
async function getMarketNews() {
  const results = await Promise.allSettled([...rssNewsSources.map(getRssNews), ...officialPageNewsSources.map(getOfficialPageNews)]);
  const news = results.flatMap((result) => result.status === "fulfilled" ? result.value : []);
  const unique = [...new Map(news.map((item) => [`${item.url}|${item.title}`, item])).values()];
  return unique.sort((left, right) => Date.parse(right.publishedAt ?? "") - Date.parse(left.publishedAt ?? "")).slice(0, 9);
}
async function getMarketContext() {
  if (marketContextCache && marketContextCache.expiresAt > Date.now()) return marketContextCache.data;
  const [dollar, news] = await Promise.all([getPtaxDollar(), getMarketNews()]);
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
  const token = createSessionToken(user.id);
  return { token, user: safeUser(user) };
});
app.post<{ Body: { password: string } }>("/api/auth/change-password", async (request, reply) => {
  const user = sessionUser(request.headers.authorization); if (!user) return reply.code(401).send({ message: "Sessão inválida." });
  if (request.body.password.length < 8) return reply.code(400).send({ message: "A senha deve ter ao menos 8 caracteres." });
  user.passwordHash = hashPassword(request.body.password); user.mustChangePassword = false; await persistUser(user); return { user: safeUser(user) };
});
app.get("/api/me", async (request, reply) => { const user = sessionUser(request.headers.authorization); if (!user) return reply.code(401).send({ message: "Sessão inválida." }); return safeUser(user); });
app.patch<{ Body: { name?: string; phone?: string; jobTitle?: string; avatarUrl?: string | null; preferredLocale?: PreferredLocale } }>("/api/me", async (request, reply) => {
  const user = sessionUser(request.headers.authorization); if (!user) return reply.code(401).send({ message: "Sessão inválida." });
  const { name, phone, jobTitle, avatarUrl, preferredLocale } = request.body;
  if (typeof name === "string") { const value = name.trim(); if (!value) return reply.code(400).send({ message: "Informe seu nome." }); user.name = value; }
  if (typeof phone === "string") user.phone = phone.trim() || undefined;
  if (typeof jobTitle === "string") user.jobTitle = jobTitle.trim() || undefined;
  if (avatarUrl !== undefined) { if (avatarUrl !== null && (!r2PublicUrl || !avatarUrl.startsWith(`${r2PublicUrl}/profiles/${user.id}/`))) return reply.code(400).send({ message: "A imagem de perfil deve ser enviada pelo armazenamento autorizado." }); user.avatarUrl = avatarUrl || undefined; }
  if (preferredLocale !== undefined) { if (!["pt-BR", "en-US", "zh-CN"].includes(preferredLocale)) return reply.code(400).send({ message: "Idioma inválido." }); user.preferredLocale = preferredLocale; }
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
app.get<{ Params: { key: string } }>("/api/settings/:key", async (request, reply) => { const user = sessionUser(request.headers.authorization); if (!user) return reply.code(401).send({ message: "Sess\u00e3o inv\u00e1lida." }); if (!database) return reply.code(503).send({ message: "Banco de dados indispon\u00edvel." }); const result = await database.query("SELECT value, updated_at FROM app_settings WHERE key = $1", [request.params.key]); if (!result.rowCount) return reply.code(404).send({ message: "Parametriza\u00e7\u00e3o ainda n\u00e3o definida." }); return { value: result.rows[0].value, updatedAt: result.rows[0].updated_at }; });
app.put<{ Params: { key: string }; Body: { value: unknown } }>("/api/settings/:key", async (request, reply) => { const user = sessionUser(request.headers.authorization); if (!user || user.role !== "admin") return reply.code(403).send({ message: "Acesso restrito a administradores." }); if (!database) return reply.code(503).send({ message: "Banco de dados indispon\u00edvel." }); await database.query("INSERT INTO app_settings (key, value, updated_at, updated_by) VALUES ($1, $2::jsonb, NOW(), $3) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW(), updated_by = EXCLUDED.updated_by", [request.params.key, JSON.stringify(request.body.value), user.id]); return { value: request.body.value }; });
app.post<{ Body: { name: string; email: string; role: UserRole; initialPassword: string } }>("/api/users", async (request, reply) => { const admin = sessionUser(request.headers.authorization); if (!admin || admin.role !== "admin") return reply.code(403).send({ message: "Acesso restrito a administradores." }); if (request.body.initialPassword.length < 8) return reply.code(400).send({ message: "A senha inicial deve ter ao menos 8 caracteres." }); if ([...users.values()].some((item) => item.email === request.body.email.trim().toLowerCase())) return reply.code(409).send({ message: "Este e-mail já está cadastrado." }); const user: User = { id: `user-${crypto.randomUUID()}`, name: request.body.name.trim(), email: request.body.email.trim().toLowerCase(), role: request.body.role, passwordHash: hashPassword(request.body.initialPassword), mustChangePassword: true, createdAt: new Date().toISOString(), preferredLocale: "pt-BR" }; users.set(user.id, user); await persistUser(user); return reply.code(201).send(safeUser(user)); });

app.get("/api/port-facilities", async (request, reply) => {
  try {
    const catalog = await getPortCatalog();
    return { data: catalog.facilities, total: catalog.facilities.length, source: "ANTAQ", syncedAt: catalog.syncedAt };
  } catch (error) {
    request.log.error(error, "Não foi possível consultar o catálogo da ANTAQ");
    return reply.code(503).send({ message: "O catálogo de instalações portuárias está indisponível no momento." });
  }
});

app.get<{ Querystring: { query?: string } }>("/api/ncm", async (request, reply) => {
  const query = String(request.query.query ?? "").trim().slice(0, 200);
  if (query.length < 2) return { entries: [], source: "Classif / Receita Federal" };
  try { const catalog = await getNcmCatalog(); return { entries: searchNcms(catalog.entries, query), source: "Classif / Receita Federal", updatedAt: catalog.updatedAt, fetchedAt: catalog.fetchedAt, stale: Date.now() - Date.parse(catalog.fetchedAt) >= 86_400_000 }; }
  catch { return reply.code(503).send({ message: "Não foi possível carregar o catálogo NCM oficial. Tente novamente." }); }
});
const ncmAiRequests = new Map<string, number>();
app.post<{ Body: { description?: string } }>("/api/ncm/suggestions", async (request, reply) => {
  const user = sessionUser(request.headers.authorization);
  if (!user) return reply.code(401).send({ message: "Sessão inválida. Entre novamente." });
  if (!process.env.OPENAI_API_KEY) return reply.code(503).send({ message: "A sugestão por IA ainda não foi configurada. Use a busca no catálogo oficial." });
  const description = request.body?.description;
  if (typeof description !== "string" || description.trim().length < 15 || description.length > 4000) return reply.code(400).send({ message: "Descreva material, função e características do produto (15 a 4000 caracteres)." });
  const last = ncmAiRequests.get(user.id) ?? 0;
  if (Date.now() - last < 15_000) return reply.code(429).send({ message: "Aguarde alguns segundos antes de solicitar outra análise." });
  ncmAiRequests.set(user.id, Date.now());
  try { const catalog = await getNcmCatalog(); return { ...await suggestNcms(description, catalog.entries), source: "Classif / Receita Federal", catalogUpdatedAt: catalog.updatedAt, generatedAt: new Date().toISOString() }; }
  catch (error) { return reply.code(503).send({ message: error instanceof Error ? error.message : "Não foi possível gerar sugestões." }); }
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
