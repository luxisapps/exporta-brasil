import type { Pool } from "pg";
import { nextImportReference } from "@exporta/domain";

export async function allocateImportReference(database: Pool, knownReferences: Iterable<{ reference: string }>, year = Number(new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "America/Sao_Paulo" }).format(new Date()))) {
  const minimum = Number(nextImportReference(knownReferences, year).split("-").at(-1));
  const result = await database.query<{ sequence: string }>(`
    INSERT INTO import_reference_counters (year, sequence) VALUES ($1, $2)
    ON CONFLICT (year) DO UPDATE
      SET sequence = GREATEST(import_reference_counters.sequence + 1, EXCLUDED.sequence)
    RETURNING sequence
  `, [year, minimum]);
  return `EB-${year}-${String(result.rows[0].sequence).padStart(3, "0")}`;
}
