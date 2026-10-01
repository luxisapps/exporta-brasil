import { randomUUID } from "node:crypto";
import type { ServerResponse } from "node:http";
import type { FastifyInstance } from "fastify";
import type { Pool, PoolClient } from "pg";
import { importStatusMeta, portStatusMeta, customsChannelMeta, shipmentStatusMeta, type ImportOperation } from "@exporta/domain";
import { dueNotices, operationNotices, type Notice } from "./notification-rules.js";

type Identity = { id: string; name: string; mustChangePassword: boolean };
export async function registerNotifications(app: FastifyInstance, pool: Pool, authenticate: (authorization?: string) => Identity | undefined) {
  await pool.query(`CREATE TABLE IF NOT EXISTS app_operation_snapshots (
    id TEXT PRIMARY KEY, value JSONB NOT NULL, revision INTEGER NOT NULL DEFAULT 1, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS app_notifications (
    id UUID PRIMARY KEY, user_id TEXT NOT NULL REFERENCES app_users(id), operation_id TEXT NOT NULL,
    reference TEXT NOT NULL, kind TEXT NOT NULL, detail TEXT NOT NULL DEFAULT '', value TEXT,
    section TEXT NOT NULL, critical BOOLEAN NOT NULL DEFAULT FALSE, actor_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), read_at TIMESTAMPTZ, dedupe_key TEXT NOT NULL,
    UNIQUE(user_id,dedupe_key));
    CREATE INDEX IF NOT EXISTS app_notifications_user_created ON app_notifications(user_id,created_at DESC,id DESC);`);
  const streams = new Map<string, Set<ServerResponse>>();
  const send = (id: string, type: string) => {
    for (const response of streams.get(id) ?? []) if (!response.destroyed) response.write(`event: ${type}\ndata: {}\n\n`);
  };
  const broadcast = async (client: PoolClient | Pool, users: string[], type = "notifications") => {
    await client.query("SELECT pg_notify('exporta_notifications',$1)", [JSON.stringify({ users, type })]);
  };
  let listening: PoolClient | undefined;
  let stopped = false;
  let retry: ReturnType<typeof setTimeout> | undefined;
  async function listen() {
    try {
      const client = await pool.connect();
      if (stopped) { client.release(); return; }
      listening = client;
      client.on("notification", message => {
        try {
          const payload = JSON.parse(message.payload ?? "{}");
          if (payload.type === "operations") for (const id of streams.keys()) send(id, "operations");
          else for (const id of payload.users ?? []) send(id, "notifications");
        } catch { /* Invalid database messages do not terminate streams. */ }
      });
      client.on("error", error => {
        app.log.error(error, "Notification listener disconnected");
        if (listening === client) { listening = undefined; client.release(true); if (!stopped) retry = setTimeout(() => void listen(), 5000); }
      });
      await client.query("LISTEN exporta_notifications");
    } catch (error) { app.log.error(error); if (!stopped) retry = setTimeout(() => void listen(), 5000); }
  }
  await listen();
  async function insertNotices(client: PoolClient | Pool, operation: ImportOperation, notices: Notice[], prefix: string, actorName: string | null) {
    const targets = new Set<string>();
    for (const notice of notices) for (const id of notice.recipients) {
      const result = await client.query(`INSERT INTO app_notifications
        (id,user_id,operation_id,reference,kind,detail,value,section,critical,actor_name,dedupe_key)
        SELECT $1,id,$3,$4,$5,$6,$7,$8,$9,$10,$11 FROM app_users WHERE id=$2
        ON CONFLICT(user_id,dedupe_key) DO NOTHING RETURNING user_id`,
      [randomUUID(), id, operation.id, operation.reference, notice.kind, notice.detail, notice.value ?? null, notice.section, notice.critical ?? false, actorName, `${operation.id}:${prefix}:${notice.key}`]);
      if (result.rowCount) targets.add(id);
    }
    if (targets.size) await broadcast(client, [...targets]);
  }
  const user = (authorization?: string) => { const identity = authenticate(authorization); return identity && !identity.mustChangePassword ? identity : undefined; };
  app.get("/api/notifications/stream", async (request, reply) => {
    const identity = user(request.headers.authorization);
    if (!identity) return reply.code(401).send({ message: "Sessão inválida." });
    reply.hijack();
    const response = reply.raw;
    response.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no", "Access-Control-Allow-Origin": request.headers.origin ?? "*", Vary: "Origin" });
    response.write("event: connected\ndata: {}\n\n");
    const group = streams.get(identity.id) ?? new Set<ServerResponse>(); group.add(response); streams.set(identity.id, group);
    const heartbeat = setInterval(() => {
      if (!user(request.headers.authorization)) { response.write("event: expired\ndata: {}\n\n"); response.end(); }
      else response.write(": heartbeat\n\n");
    }, 20000);
    response.on("close", () => { clearInterval(heartbeat); group.delete(response); if (!group.size) streams.delete(identity.id); });
  });
  app.get<{ Querystring: { before?: string; unread?: string } }>("/api/notifications", async (request, reply) => {
    const identity = user(request.headers.authorization);
    if (!identity) return reply.code(401).send({ message: "Sessão inválida." });
    const cursor = request.query.before;
    if (cursor && !/^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/.test(cursor)) return reply.code(400).send({ message: "Paginação inválida." });
    const result = await pool.query(`SELECT * FROM app_notifications WHERE user_id=$1
      AND ($2::boolean=FALSE OR read_at IS NULL) AND ($3::uuid IS NULL OR (created_at,id)<(SELECT created_at,id FROM app_notifications WHERE id=$3 AND user_id=$1))
      ORDER BY created_at DESC,id DESC LIMIT 31`, [identity.id, request.query.unread === "true", cursor ?? null]);
    const count = await pool.query("SELECT COUNT(*)::int AS count FROM app_notifications WHERE user_id=$1 AND read_at IS NULL", [identity.id]);
    const items = result.rows.slice(0, 30).map(row => ({ id: row.id, operationId: row.operation_id, reference: row.reference, kind: row.kind, detail: row.detail, value: row.value, section: row.section, critical: row.critical, actorName: row.actor_name, createdAt: row.created_at.toISOString(), readAt: row.read_at?.toISOString() ?? null }));
    const last = items.at(-1);
    return { items, unreadCount: count.rows[0].count, nextCursor: result.rows.length > 30 && last ? last.id : null };
  });
  app.patch<{ Params: { id: string } }>("/api/notifications/:id/read", async (request, reply) => {
    const identity = user(request.headers.authorization);
    if (!identity) return reply.code(401).send({ message: "Sessão inválida." });
    if (!/^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/.test(request.params.id)) return reply.code(400).send({ message: "Notificação inválida." });
    const result = await pool.query("UPDATE app_notifications SET read_at=COALESCE(read_at,NOW()) WHERE id=$1 AND user_id=$2 RETURNING id", [request.params.id, identity.id]);
    if (!result.rowCount) return reply.code(404).send({ message: "Notificação não encontrada." });
    await broadcast(pool, [identity.id]); return { ok: true };
  });
  app.post("/api/notifications/read-all", async (request, reply) => {
    const identity = user(request.headers.authorization);
    if (!identity) return reply.code(401).send({ message: "Sessão inválida." });
    await pool.query("UPDATE app_notifications SET read_at=NOW() WHERE user_id=$1 AND read_at IS NULL", [identity.id]);
    await broadcast(pool, [identity.id]); return { ok: true };
  });
  const validOperation = (value: unknown): value is ImportOperation => {
    if (!value || typeof value !== "object") return false;
    const operation = value as ImportOperation;
    const record = (item: unknown): item is Record<string, unknown> => Boolean(item && typeof item === "object" && !Array.isArray(item));
    const named = (item: unknown) => record(item) && typeof item.id === "string" && typeof item.title === "string";
    return typeof operation.id === "string" && operation.id.length > 0 && operation.id.length < 150 && typeof operation.reference === "string" && typeof operation.customer === "string"
      && Object.hasOwn(importStatusMeta, operation.status) && Object.hasOwn(portStatusMeta, operation.portStatus) && Object.hasOwn(customsChannelMeta, operation.customsChannel)
      && (operation.shipmentStatus === undefined || Object.hasOwn(shipmentStatusMeta, operation.shipmentStatus))
      && (operation.assigneeId === undefined || typeof operation.assigneeId === "string") && typeof operation.eta === "string"
      && Array.isArray(operation.items) && operation.items.every(item => record(item) && typeof item.id === "string" && typeof item.name === "string")
      && [operation.tasks, operation.documents, operation.timeline, operation.budgets].every(items => items === undefined || Array.isArray(items))
      && (operation.tasks ?? []).every(item => named(item) && typeof item.completed === "boolean" && (item.assigneeId === undefined || typeof item.assigneeId === "string"))
      && (operation.documents ?? []).every(item => named(item) && ["pending", "available", "expired"].includes(item.status))
      && (operation.timeline ?? []).every(item => named(item) && typeof item.occurredAt === "string")
      && (operation.budgets ?? []).every(item => record(item) && typeof item.id === "string" && Array.isArray(item.expenses) && Array.isArray(item.taxRates));
  };
  app.get("/api/operation-snapshots", async (request, reply) => {
    if (!user(request.headers.authorization)) return reply.code(401).send({ message: "Sessão inválida." });
    return { items: (await pool.query("SELECT value AS operation,revision FROM app_operation_snapshots ORDER BY updated_at DESC")).rows };
  });
  // Copies existing browser data once per operation; never overwrites a persisted version or sends historical notices.
  app.post<{ Body: { operations: ImportOperation[] } }>("/api/operation-snapshots/bootstrap", { bodyLimit: 16 * 1024 * 1024 }, async (request, reply) => {
    if (!user(request.headers.authorization)) return reply.code(401).send({ message: "Sessão inválida." });
    if (!Array.isArray(request.body?.operations) || request.body.operations.length > 1000 || !request.body.operations.every(validOperation)) return reply.code(400).send({ message: "Operações inválidas." });
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const operation of request.body.operations) await client.query("INSERT INTO app_operation_snapshots(id,value) VALUES($1,$2) ON CONFLICT(id) DO NOTHING", [operation.id, operation]);
      await broadcast(client, [], "operations"); await client.query("COMMIT");
      return { items: (await pool.query("SELECT value AS operation,revision FROM app_operation_snapshots ORDER BY updated_at DESC")).rows };
    } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
  });
  app.put<{ Params: { id: string }; Body: { operation: ImportOperation; revision: number } }>("/api/operation-snapshots/:id", { bodyLimit: 16 * 1024 * 1024 }, async (request, reply) => {
    const identity = user(request.headers.authorization);
    if (!identity) return reply.code(401).send({ message: "Sessão inválida." });
    const { operation, revision } = request.body ?? {};
    if (!validOperation(operation) || operation.id !== request.params.id || !Number.isInteger(revision) || revision < 0) return reply.code(400).send({ message: "Operação inválida." });
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [operation.id]);
      const row = (await client.query("SELECT value,revision FROM app_operation_snapshots WHERE id=$1 FOR UPDATE", [operation.id])).rows[0];
      if ((row?.revision ?? 0) !== revision) { await client.query("ROLLBACK"); return reply.code(409).send({ message: "Outra pessoa atualizou esta operação. A versão atual foi carregada; revise e tente novamente.", operation: row?.value, revision: row?.revision }); }
      const nextRevision = revision + 1;
      await client.query("INSERT INTO app_operation_snapshots(id,value,revision) VALUES($1,$2,$3) ON CONFLICT(id) DO UPDATE SET value=EXCLUDED.value,revision=EXCLUDED.revision,updated_at=NOW()", [operation.id, operation, nextRevision]);
      await insertNotices(client, operation, operationNotices(row?.value ?? null, operation, identity.id), String(nextRevision), identity.name);
      await broadcast(client, [], "operations"); await client.query("COMMIT");
      return { operation, revision: nextRevision };
    } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
  });
  let checking = false;
  const reminders = async () => {
    if (checking || stopped) return; checking = true;
    try {
      const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
      for (const row of (await pool.query("SELECT value FROM app_operation_snapshots")).rows) await insertNotices(pool, row.value, dueNotices(row.value, today), "reminder", null);
    } catch (error) { app.log.error(error, "Notification reminders failed"); } finally { checking = false; }
  };
  const timer = setInterval(() => void reminders(), 60000); timer.unref();
  app.addHook("onClose", async () => { stopped = true; clearInterval(timer); clearTimeout(retry); for (const group of streams.values()) for (const response of group) response.end(); if (listening) { await listening.query("UNLISTEN exporta_notifications"); listening.release(); } });
}
