import { apiFetch, SessionExpiredError } from "./api-fetch";
import type { ImportedProduct } from "./product-sheet";

type Translation = { original: string; translated: string | null };

export async function translateImportedProducts(items: ImportedProduct[], apiUrl: string, token: string, onProgress: (done: number, total: number) => void = () => {}) {
  const names = [...new Set(items.filter((item) => /\p{Script=Han}/u.test(item.name)).map((item) => item.chineseName ?? item.name))];
  const translations = new Map<string, string>();
  let done = 0;
  onProgress(0, names.length);
  while (done < names.length) {
    const batch: string[] = [];
    let characters = 0;
    let scanned = 0;
    for (const name of names.slice(done, done + 50)) {
      if (name.length > 1000) { scanned++; continue; }
      const count = Array.from(name).length;
      if (characters + count > 10000) break;
      characters += count;
      batch.push(name);
      scanned++;
    }
    try {
      if (batch.length) {
        const response = await apiFetch(`${apiUrl}/api/products/translate-names`, {
          method: "POST", headers: { "content-type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ names: batch })
        });
        if (response.status === 401) throw new SessionExpiredError();
        const payload = await response.json() as { translations?: Translation[]; message?: string };
        if (!response.ok) throw new Error(payload.message || "Não foi possível traduzir os produtos.");
        if (!Array.isArray(payload.translations)) throw new Error("Resposta de tradução inválida.");
        for (let index = 0; index < batch.length; index++) {
          const entry = payload.translations[index];
          if (!entry || entry.original !== batch[index] || typeof entry.translated !== "string" || !entry.translated.trim() || /\p{Script=Han}/u.test(entry.translated)) continue;
          translations.set(entry.original, entry.translated);
        }
      }
    } catch (error) {
      // Authentication failures still log out; translation failures preserve the products.
      if (error instanceof SessionExpiredError) throw error;
    }
    done += scanned;
    onProgress(done, names.length);
  }
  return items.map((item) => /\p{Script=Han}/u.test(item.name)
    ? { ...item, chineseName: item.chineseName ?? item.name, name: translations.get(item.chineseName ?? item.name) ?? "" }
    : item);
}
