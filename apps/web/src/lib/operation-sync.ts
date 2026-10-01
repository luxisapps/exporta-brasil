import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { ImportOperation } from "@exporta/domain";
import { apiFetch } from "./api-fetch";

type Snapshot = { operation: ImportOperation; revision: number };
export function useOperationSync(apiUrl: string, token: string, operations: ImportOperation[], setOperations: Dispatch<SetStateAction<ImportOperation[]>>) {
  const latest = useRef(operations); latest.current = operations;
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [attempt, retry] = useState(0);
  const [kick, flushAgain] = useState(0);
  const known = useRef(new Map<string, { json: string; revision: number }>());
  const busy = useRef(false);
  const initialized = useRef(false);
  const refresh = useRef<() => Promise<void>>(async () => {});
  useEffect(() => {
    const controller = new AbortController(); let active = true;
    const request = async (path: string, init?: RequestInit) => {
      const response = await apiFetch(`${apiUrl}/api/operation-snapshots${path}`, { ...init, signal: controller.signal, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } });
      const data = await response.json(); if (!response.ok) throw new Error(data.message || "Não foi possível sincronizar as operações."); return data;
    };
    initialized.current = false; setReady(false); setError("");
    void request("/bootstrap", { method: "POST", body: JSON.stringify({ operations: latest.current }) }).then((data: { items: Snapshot[] }) => {
      if (!active) return;
      known.current = new Map(data.items.map(item => [item.operation.id, { json: JSON.stringify(item.operation), revision: item.revision }]));
      setOperations(data.items.map(item => item.operation)); initialized.current = true; setReady(true);
    }).catch(error => { if (active) setError(error.message); });
    refresh.current = async () => {
      if (!active || !initialized.current || busy.current) return;
      try {
        const data: { items: Snapshot[] } = await request(""); if (!active || busy.current) return;
        const changes = new Map<string, ImportOperation>();
        for (const item of data.items) {
          const previous = known.current.get(item.operation.id);
          if (previous && item.revision < previous.revision) continue;
          const local = latest.current.find(operation => operation.id === item.operation.id);
          // Keep unacknowledged edits. The revision check will resolve concurrent changes explicitly.
          if (local && (!previous || JSON.stringify(local) !== previous.json)) continue;
          known.current.set(item.operation.id, { json: JSON.stringify(item.operation), revision: item.revision });
          changes.set(item.operation.id, item.operation);
        }
        setOperations(current => [...current.map(operation => changes.get(operation.id) ?? operation), ...[...changes.values()].filter(operation => !current.some(item => item.id === operation.id))]);
      } catch { /* Save errors are surfaced separately; reconnect retries remote updates. */ }
    };
    const event = () => void refresh.current();
    window.addEventListener("exporta:operations", event);
    const timer = window.setInterval(event, 60000);
    return () => { active = false; controller.abort(); clearInterval(timer); window.removeEventListener("exporta:operations", event); };
  }, [apiUrl, token, attempt, setOperations]);
  useEffect(() => {
    if (!ready) return;
    let active = true;
    const timer = window.setTimeout(async () => {
      if (busy.current) return;
      busy.current = true; setSaving(true);
      let failed = false;
      try {
        // Serialize writes; edits made during a request are picked up on the next pass.
        for (;;) {
          const operation = latest.current.find(item => JSON.stringify(item) !== known.current.get(item.id)?.json);
          if (!operation || !active) break;
          const sent = JSON.stringify(operation);
          const response = await apiFetch(`${apiUrl}/api/operation-snapshots/${encodeURIComponent(operation.id)}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ operation, revision: known.current.get(operation.id)?.revision ?? 0 }) });
          const data = await response.json();
          if (response.status === 409 && data.operation) {
            localStorage.setItem(`exporta-conflict-${operation.id}`, sent);
            known.current.set(operation.id, { json: JSON.stringify(data.operation), revision: data.revision });
            setOperations(current => current.map(item => item.id === operation.id ? data.operation : item));
            throw new Error(data.message);
          }
          if (!response.ok) throw new Error(data.message || "Não foi possível salvar as alterações.");
          known.current.set(operation.id, { json: sent, revision: data.revision });
          setError("");
        }
      } catch (error) { failed = true; setError(error instanceof Error ? error.message : "Não foi possível salvar as alterações."); }
      finally { busy.current = false; setSaving(false); if (!failed && latest.current.some(item => JSON.stringify(item) !== known.current.get(item.id)?.json)) flushAgain(value => value + 1); }
    }, 500);
    // Let a request finish when the local state changes; cleanup only cancels a pending debounce.
    return () => { clearTimeout(timer); active = false; };
  }, [operations, ready, apiUrl, token, setOperations, kick]);
  return { ready, saving, error, retry: () => { setError(""); if (ready) flushAgain(value => value + 1); else retry(value => value + 1); } };
}
