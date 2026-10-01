type SessionHandler = { token: string; onExpired: () => void };
let activeSession: SessionHandler | null = null;

export function watchSessionExpiration(token: string, onExpired: () => void) {
  const handler = { token, onExpired };
  activeSession = handler;
  return () => { if (activeSession === handler) activeSession = null; };
}

export class SessionExpiredError extends Error {
  constructor() { super("Sua sessão expirou. Entre novamente."); this.name = "SessionExpiredError"; }
}

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
  const token = headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const startedSession = activeSession;
  const response = await fetch(input, init);
  // A response from the previous login must not restore its session or profile.
  if (token && startedSession?.token === token && activeSession !== startedSession) throw new SessionExpiredError();
  if (!token || activeSession?.token !== token || response.ok) return response;
  let invalidSession = response.status === 401;
  if (!invalidSession && !response.ok) {
    const payload = await response.clone().json().catch(() => null) as { message?: string } | null;
    const message = typeof payload?.message === "string" ? payload.message.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";
    invalidSession = /sessao (invalida|expirou|expirada)|invalid session|session expired/.test(message);
  }
  if (invalidSession) {
    const handler = activeSession;
    activeSession = null;
    handler.onExpired();
    throw new SessionExpiredError();
  }
  return response;
}
