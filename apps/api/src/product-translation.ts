import { createHash } from "node:crypto";
import type { Pool } from "pg";

export const translationCacheSchema = `CREATE TABLE IF NOT EXISTS product_name_translations (
  cache_key TEXT PRIMARY KEY, source_text TEXT NOT NULL, source_language TEXT NOT NULL,
  target_language TEXT NOT NULL, translated_text TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'google-nmt', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`;

export const translationKey = (text: string) => createHash("sha256").update(`google-nmt\0zh\0pt\0${text}`).digest("hex");
export type NameTranslation = { original: string; translated: string | null; source: "cache" | "google" | "untranslated" };

export async function googleTranslateNames(names: string[], apiKey = process.env.GOOGLE_TRANSLATE_API_KEY, fetcher = fetch): Promise<string[]> {
  if (!apiKey) throw new Error("Configure GOOGLE_TRANSLATE_API_KEY na API para traduzir os produtos em chinês.");
  const response = await fetcher("https://translation.googleapis.com/language/translate/v2", {
    method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
    signal: AbortSignal.timeout(30_000),
    body: JSON.stringify({ q: names, source: "zh", target: "pt", format: "text", model: "nmt" })
  });
  if (!response.ok) {
    if ([401, 403].includes(response.status)) throw new Error("O Google não autorizou a tradução. Verifique a chave, a Cloud Translation API e o faturamento.");
    if (response.status === 429) throw new Error("O limite de tradução do Google foi atingido. Tente novamente mais tarde.");
    throw new Error("Não foi possível traduzir os produtos. Tente selecionar a planilha novamente.");
  }
  const payload = await response.json() as { data?: { translations?: { translatedText?: unknown }[] } };
  const results = payload.data?.translations;
  if (!Array.isArray(results) || results.length !== names.length || results.some((item) => typeof item.translatedText !== "string" || !item.translatedText.trim())) {
    throw new Error("O Google retornou uma tradução incompleta. Tente novamente.");
  }
  return results.map((item) => (item.translatedText as string).trim());
}

// Cache lives in PostgreSQL. A transaction lock prevents concurrent cache misses
// from paying for the same names twice, including across API instances.
export async function translateProductNames(database: Pool, names: string[], translate = googleTranslateNames): Promise<NameTranslation[]> {
  const unique = [...new Set(names)];
  const keys = unique.map(translationKey);
  const read = async (db: Pick<Pool, "query">) => {
    const result = await db.query<{ source_text: string; translated_text: string }>(
      "SELECT source_text, translated_text FROM product_name_translations WHERE cache_key = ANY($1::text[])", [keys]
    );
    return new Map(result.rows.map((row) => [row.source_text, row.translated_text]));
  };
  let cached = await read(database);
  const generated = new Set<string>();
  if (unique.some((name) => !cached.has(name))) {
    const client = await database.connect();
    try {
      await client.query("BEGIN");
      await client.query("SET LOCAL lock_timeout = '60s'");
      await client.query("SELECT pg_advisory_xact_lock(18421, 1)");
      cached = await read(client);
      const missing = unique.filter((name) => !cached.has(name));
      if (missing.length) {
        let translations: string[] = [];
        try { translations = await translate(missing); } catch { /* Keep cache hits even when Google is unavailable. */ }
        if (translations.length !== missing.length) translations = [];
        for (let index = 0; index < missing.length; index++) {
          const original = missing[index];
          const translated = translations[index];
          if (typeof translated !== "string" || !translated.trim() || /\p{Script=Han}/u.test(translated)) continue;
          await client.query("INSERT INTO product_name_translations (cache_key, source_text, source_language, target_language, translated_text) VALUES ($1,$2,'zh','pt',$3) ON CONFLICT (cache_key) DO NOTHING", [translationKey(original), original, translated]);
          cached.set(original, translated);
          generated.add(original);
        }
      }
      await client.query("COMMIT");
    } catch (error) { await client.query("ROLLBACK"); throw error; }
    finally { client.release(); }
  }
  return names.map((original) => ({ original, translated: cached.get(original) ?? null, source: generated.has(original) ? "google" : cached.has(original) ? "cache" : "untranslated" }));
}
