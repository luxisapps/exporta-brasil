import { Button } from "./ui/button";
import { FormInput as Input } from "./ui/form-input";
import { Field, FieldLabel } from "./ui/field";
import { apiFetch } from "../lib/api-fetch";
import { useEffect, useRef, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

type Entry = { code: string; description: string; fullDescription: string; reason?: string };
const formatCode = (code: string) => `${code.slice(0, 4)}.${code.slice(4, 6)}.${code.slice(6)}`;
export function NcmField({ initialCode = "", apiUrl, token }: { initialCode?: string; apiUrl: string; token: string }) {
  const [code, setCode] = useState(initialCode.replace(/\D/g, ""));
  const [query, setQuery] = useState(initialCode);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selected, setSelected] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState<Entry[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const currentCode = useRef(code); currentCode.current = code;
  const choose = (entry: Entry) => { setCode(entry.code); setSelected(entry); setError(""); };
  useEffect(() => {
    setLoading(query.trim().length >= 2);
    if (query.trim().length < 2) { setEntries([]); return; }
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      setLoading(true); setError("");
      void apiFetch(`${apiUrl}/api/ncm?query=${encodeURIComponent(query)}`, { signal: controller.signal }).then(async (response) => {
        const payload = await response.json() as { entries?: Entry[]; message?: string };
        if (!response.ok) throw new Error(payload.message || "Não foi possível consultar NCMs.");
        if (controller.signal.aborted) return;
        setEntries(payload.entries ?? []);
        const exact = payload.entries?.find((entry) => entry.code === currentCode.current);
        if (exact) setSelected(exact);
      }).catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Falha na consulta."); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 350);
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [apiUrl, query]);
  async function suggest() {
    const form = input.current?.closest("form");
    if (!form) return;
    const data = new FormData(form);
    const description = ["name", "englishName", "description"].map((key) => String(data.get(key) ?? "").trim()).filter(Boolean).join(". ");
    setAnalyzing(true); setError(""); setSuggestions([]); setQuestions([]);
    try {
      const response = await apiFetch(`${apiUrl}/api/ncm/suggestions`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify({ description }) });
      const payload = await response.json() as { suggestions?: Entry[]; missingInformation?: string[]; message?: string };
      if (!response.ok) throw new Error(payload.message || "Não foi possível consultar a IA.");
      setSuggestions(payload.suggestions ?? []); setQuestions(payload.missingInformation ?? []);
      if (!payload.suggestions?.length && !payload.missingInformation?.length) setError("Nenhum candidato identificado. Complete a descrição do produto.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Falha na sugestão."); }
    finally { setAnalyzing(false); }
  }
  return <div className="ncm-field full">
    <Field><FieldLabel>NCM</FieldLabel><Input autoComplete="off" ref={input} name="ncm" value={code} inputMode="numeric" pattern="[0-9]{8}" maxLength={8} placeholder="8 dígitos" onChange={(event) => { const value = event.target.value.replace(/\D/g, ""); setCode(value); setSelected(null); setQuery(value); }} /></Field>
    <div className="ncm-search"><Field><FieldLabel>Buscar no catálogo oficial</FieldLabel><div className="ncm-search-input"><Search size={16} aria-hidden="true" /><Input autoComplete="off" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Código, material ou tipo de produto" /></div></Field><Button type="button" className="button button--secondary" disabled={analyzing} onClick={() => void suggest()}><Sparkles size={16} />{analyzing ? "Analisando…" : "Sugerir NCM com IA"}</Button></div>
    {loading ? <div className="ncm-loading" role="status" aria-label="Consultando catálogo"><span className="skeleton" /><span className="skeleton" /></div> : entries.length > 0 ? <Select value={selected?.code ?? ""} onValueChange={(value) => { const entry = entries.find((entry) => entry.code === value); if (entry) choose(entry); }}><SelectTrigger aria-label="Resultados do catálogo NCM"><SelectValue><span className="ncm-selected-label">{selected ? `${formatCode(selected.code)} — ${selected.description}` : `${entries.length} ${entries.length === 1 ? "resultado" : "resultados"} — selecione um NCM`}</span></SelectValue></SelectTrigger><SelectContent>{entries.map((entry) => <SelectItem key={entry.code} value={entry.code}><span className="ncm-option"><strong>{formatCode(entry.code)}</strong><span>{entry.fullDescription}</span></span></SelectItem>)}</SelectContent></Select> : query.length >= 2 && !error ? <p className="muted">Nenhum NCM encontrado. Tente outro termo.</p> : null}
    {selected && <p className="ncm-description"><strong>{formatCode(selected.code)}</strong> {selected.fullDescription}<small>Descrição oficial · Classif / Receita Federal</small></p>}
    {error && <p role="alert" className="users-message">{error}</p>}
    {analyzing && <div className="ncm-loading" role="status" aria-label="Gerando sugestões"><span className="skeleton" /><span className="skeleton" /><span className="skeleton" /></div>}
    {suggestions.length > 0 && <div className="ncm-suggestions"><strong>Candidatos para sua revisão</strong>{suggestions.map((entry, index) => <div key={entry.code}><span>{index + 1}. <strong>{formatCode(entry.code)}</strong></span><p>{entry.fullDescription}</p><p className="muted">{entry.reason}</p><small>Tributos oficiais ainda não consultados.</small><Button type="button" className="button button--secondary" onClick={() => choose(entry)}>Usar este NCM</Button></div>)}</div>}
    {questions.length > 0 && <div className="ncm-questions"><strong>Complete a descrição antes de confirmar</strong><ul>{questions.map((question) => <li key={question}>{question}</li>)}</ul></div>}
  </div>;
}
