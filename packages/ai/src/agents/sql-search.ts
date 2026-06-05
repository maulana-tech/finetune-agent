import { generateText } from 'ai';
import { fastModel, fallbackModels } from '../provider';
import { generateTextWithFallback } from '../fallback';

const LEADS_SCHEMA_HINT = `
Table: leads
Columns:
  id            uuid
  workspace_id  uuid
  name          text        -- business name
  address       text
  lat           float
  lng           float
  phone         text
  website       text
  category      text        -- e.g. "Coffee Shop", "klinik", "bengkel"
  emails        jsonb       -- string array, e.g. ["info@cafe.com"]
  whatsapp      jsonb       -- string array, e.g. ["+6281234567890"]
  maps_url      text
  pipeline_stage text       -- e.g. "Prospecting", "Qualified", "Closed"
  created_at    timestamp
  updated_at    timestamp
`.trim();

export interface SqlQueryResult {
  sql: string;
  reasoning: string | null;
}

/**
 * Converts a natural-language leads search query into a PostgreSQL SELECT.
 * Uses generateText (not generateObject) so it works with any OpenAI-compatible model.
 */
export async function generateLeadsSearchSql(
  q: string,
  limit: number,
): Promise<SqlQueryResult> {
  const { text } = await generateTextWithFallback(
    fastModel,
    fallbackModels.fast,
    {
      maxTokens: 500,
      prompt: `Anda adalah generator query SQL untuk database leads bisnis.

${LEADS_SCHEMA_HINT}

Query pengguna: "${q}"

Aturan:
- Output HANYA query PostgreSQL SELECT * FROM leads WHERE ... yang valid. Tidak yang lain.
- Tidak ada markdown, tidak ada penjelasan, tidak ada code blocks — hanya SQL mentah.
- SELALU sertakan workspace_id = ':workspaceId' sebagai placeholder literal string.
- JANGAN PERNAH gunakan UPDATE, DELETE, INSERT, DROP, atau DDL apapun.
- Untuk kolom text gunakan ILIKE '%value%' untuk partial matching.
- Untuk "minggu ini" gunakan: created_at >= NOW() - INTERVAL '7 days'
- Untuk "hari ini" gunakan: created_at >= NOW() - INTERVAL '1 day'
- Untuk query lokasi matchagainst address ILIKE.
- Akhiri dengan LIMIT ${limit}.

SQL query:`,
    },
    'fast',
  );

  // Strip any accidental markdown fences the model might still add
  const cleaned = text
    .replace(/```sql\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  // Must start with SELECT
  if (!cleaned.toUpperCase().startsWith('SELECT')) {
    throw new Error(`Model returned non-SELECT output: ${cleaned.slice(0, 100)}`);
  }

  return { sql: cleaned, reasoning: null };
}
