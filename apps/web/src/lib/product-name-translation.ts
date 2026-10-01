import { apiFetch } from "./api-fetch";
import type { ImportedProduct } from "./product-sheet";

type Translation = { original: string; translated: string };

export async function translateImportedProducts(items: ImportedProduct[], apiUrl: string, token: string, onProgress: (done: number, total: number) => void = () => {}) {
  const names = [...new Set(items.filter((item) => /\p{Script=Han}/u.test(item.name)).map((item) => item.chineseName ?? item.name))];
  const translations = new Map<string, string>();
  let done = 0;
  onProgress(0, names.length);
  while (done < names.length) {
    const batch: string[] = [];
    let characters = 0;
    for (const name of names.slice(done, done + 50)) {
      if (name.length > 1000) throw new Error("Um nome de produto excede 1.000 caracteres. Revise a coluna de nomes da planilha.");
      const count = Array.from(name).length;
      if (characters + count > 10000) break;
      characters += count;
      batch.push(name);
    }
    const response = await apiFetch(`${apiUrl}/api/products/translate-names`, {
      method: "POST", headers: { "content-type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ names: batch })
    });
    const payload = await response.json() as { translations?: Translation[]; message?: string };
    if (!response.ok) throw new Error(payload.message || "Não foi possível traduzir os produtos. Tente novamente.");
    if (!Array.isArray(payload.translations) || payload.translations.length !== batch.length) throw new Error("A tradução retornou uma lista incompleta de produtos.");
    for (let index = 0; index < batch.length; index++) {
      const entry = payload.translations[index];
      if (entry.original !== batch[index] || typeof entry.translated !== "string" || !entry.translated.trim()) throw new Error("A tradução retornou um produto inválido.");
      translations.set(entry.original, entry.translated);
    }
    done += batch.length;
    onProgress(done, names.length);
  }
  return items.map((item) => /\p{Script=Han}/u.test(item.name)
    ? { ...item, chineseName: item.chineseName ?? item.name, name: translations.get(item.chineseName ?? item.name)! }
    : item);
}
