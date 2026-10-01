import test from "node:test";
import assert from "node:assert/strict";
import { apiFetch, watchSessionExpiration, SessionExpiredError } from "../src/lib/api-fetch.ts";

const auth = { headers: { authorization: "Bearer test-session" } };
const response = (status: number, message = "") => new Response(JSON.stringify({ message }), { status });

test("authenticated 401 expires the session only once across concurrent requests", async (context) => {
  const original = globalThis.fetch;
  let expirations = 0;
  const cleanup = watchSessionExpiration("test-session", () => { expirations++; });
  globalThis.fetch = async () => response(401, "Sessão inválida.");
  context.after(() => { globalThis.fetch = original; cleanup(); });
  const results = await Promise.allSettled([apiFetch("https://example.test/api/imports", auth), apiFetch("https://example.test/api/users", auth)]);
  assert.equal(expirations, 1);
  assert.ok(results.every((result) => result.status === "rejected" && result.reason instanceof SessionExpiredError));
});

test("invalid-session messages also expire the session, while permission errors do not", async (context) => {
  const original = globalThis.fetch;
  let expirations = 0;
  const cleanup = watchSessionExpiration("test-session", () => { expirations++; });
  context.after(() => { globalThis.fetch = original; cleanup(); });
  globalThis.fetch = async () => response(403, "Acesso restrito a administradores.");
  const forbidden = await apiFetch("https://example.test/api/users", auth);
  assert.equal((await forbidden.json()).message, "Acesso restrito a administradores.");
  assert.equal(expirations, 0);
  globalThis.fetch = async () => response(403, "Sessão inválida.");
  await assert.rejects(apiFetch("https://example.test/api/users", auth), SessionExpiredError);
  assert.equal(expirations, 1);
});

test("bad login credentials and network failures do not expire an existing session", async (context) => {
  const original = globalThis.fetch;
  let expirations = 0;
  const cleanup = watchSessionExpiration("test-session", () => { expirations++; });
  context.after(() => { globalThis.fetch = original; cleanup(); });
  globalThis.fetch = async () => response(401, "E-mail ou senha inválidos.");
  assert.equal((await apiFetch("https://example.test/api/auth/login")).status, 401);
  globalThis.fetch = async () => { throw new TypeError("Failed to fetch"); };
  await assert.rejects(apiFetch("https://example.test/api/users", auth), TypeError);
  assert.equal(expirations, 0);
});

test("late responses from an old login cannot affect a newer session", async (context) => {
  const original = globalThis.fetch;
  let expirations = 0;
  const oldCleanup = watchSessionExpiration("test-session", () => { expirations++; });
  let finish!: (value: Response) => void;
  globalThis.fetch = () => new Promise((resolve) => { finish = resolve; });
  const pending = apiFetch("https://example.test/api/me", auth);
  oldCleanup();
  const newCleanup = watchSessionExpiration("new-session", () => { expirations++; });
  context.after(() => { globalThis.fetch = original; newCleanup(); });
  finish(response(200));
  await assert.rejects(pending, SessionExpiredError);
  assert.equal(expirations, 0);
});
