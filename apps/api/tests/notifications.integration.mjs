// Runs against an isolated, disposable PostgreSQL schema; never touches application rows.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import Fastify from "fastify";
import { Pool } from "pg";
import { registerNotifications } from "../dist/notifications.js";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for integration tests");
const schema = `notification_test_${randomUUID().replaceAll("-", "")}`;
const adminPool = new Pool({ connectionString: process.env.DATABASE_URL });
await adminPool.query(`CREATE SCHEMA ${schema}`);
const pool = new Pool({ connectionString: process.env.DATABASE_URL, options: `-c search_path=${schema}` });
const first = Fastify(); const second = Fastify();
const identity = token => ["owner", "worker", "actor"].includes(token) ? { id: token, name: token, mustChangePassword: false } : undefined;
const streams = [];
try {
  await pool.query("CREATE TABLE app_users(id TEXT PRIMARY KEY); INSERT INTO app_users VALUES('owner'),('worker'),('actor')");
  await registerNotifications(first, pool, identity); await registerNotifications(second, pool, identity);
  const address = await first.listen({ port: 0, host: "127.0.0.1" });
  const secondAddress = await second.listen({ port: 0, host: "127.0.0.1" });
  const request = (path, user, method = "GET", body) => first.inject({ method, url: path, headers: user ? { authorization: user } : {}, payload: body });
  assert.equal((await request("/api/notifications")).statusCode, 401);
  const abort = new AbortController(); streams.push(abort);
  const connection = await fetch(`${secondAddress}/api/notifications/stream`, { headers: { authorization: "worker" }, signal: abort.signal });
  assert.equal(connection.status, 200);
  const reader = connection.body.getReader(); const decoder = new TextDecoder();
  assert.match(decoder.decode((await reader.read()).value), /connected/);
  const operation = { id: "test-operation", reference: "EB-2026-999", customer: "Test", assigneeId: "owner", status: "draft", portStatus: "awaiting_departure", customsChannel: "unassigned", eta: "2026-10-15", items: [], tasks: [], documents: [], timeline: [] };
  assert.equal((await request("/api/operation-snapshots/bootstrap", "actor", "POST", { operations: [operation] })).statusCode, 200);
  assert.equal((await request("/api/notifications", "owner")).json().unreadCount, 0);
  const next = { ...operation, tasks: [{ id: "task", title: "Conferir invoice", assigneeId: "worker", completed: false, createdAt: "2026-10-01" }] };
  assert.equal((await request(`/api/operation-snapshots/${operation.id}`, "actor", "PUT", { operation: next, revision: 1 })).statusCode, 200);
  let event = "";
  const timeout = setTimeout(() => abort.abort(), 10000);
  while (!event.includes("event: notifications")) event += decoder.decode((await reader.read()).value);
  clearTimeout(timeout);
  assert.match(event, /notifications/);
  const worker = (await request("/api/notifications", "worker")).json();
  assert.equal(worker.unreadCount, 1); assert.equal(worker.items[0].section, "tasks");
  assert.equal((await request("/api/notifications", "actor")).json().unreadCount, 0);
  assert.equal((await request(`/api/notifications/${worker.items[0].id}/read`, "owner", "PATCH")).statusCode, 404);
  assert.equal((await request(`/api/notifications/${worker.items[0].id}/read`, "worker", "PATCH")).statusCode, 200);
  assert.equal((await request("/api/notifications", "worker")).json().unreadCount, 0);
  const conflict = await request(`/api/operation-snapshots/${operation.id}`, "actor", "PUT", { operation: next, revision: 1 });
  assert.equal(conflict.statusCode, 409); assert.equal(conflict.json().revision, 2);
  assert.equal((await request(`/api/operation-snapshots/${operation.id}`, "actor", "PUT", { operation: next, revision: 2 })).statusCode, 200);
  assert.equal((await request("/api/notifications", "worker")).json().items.length, 1);
  // Identical timestamps still paginate without missing or duplicating notifications.
  for (let index = 0; index < 35; index++) await pool.query("INSERT INTO app_notifications(id,user_id,operation_id,reference,kind,section,dedupe_key,created_at) VALUES($1,'worker','test-operation','EB-2026-999','test','tasks',$2,'2026-10-01T12:00:00.123456Z')", [randomUUID(), `test-${index}`]);
  const page1 = (await request("/api/notifications", "worker")).json();
  const page2 = (await request(`/api/notifications?before=${page1.nextCursor}`, "worker")).json();
  assert.equal(new Set([...page1.items, ...page2.items].map(item => item.id)).size, 36);
  assert.equal((await request("/api/notifications/read-all", "worker", "POST")).statusCode, 200);
  assert.equal((await request("/api/notifications", "worker")).json().unreadCount, 0);
  assert.equal((await request("/api/notifications", "owner")).json().unreadCount, 1);
  await reader.cancel(); abort.abort();
  console.log("PASS: authentication, recipient isolation, atomic notices, cross-instance SSE, read persistence, revision conflicts, duplicate prevention and cursor pagination");
} finally {
  for (const stream of streams) stream.abort();
  await Promise.all([first.close(), second.close()]); await pool.end();
  await adminPool.query(`DROP SCHEMA ${schema} CASCADE`); await adminPool.end();
}
