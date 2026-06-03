import { generateText } from 'ai';
import { fastModel } from '../provider';

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
  const { text } = await generateText({
    model: fastModel,
    maxTokens: 500,
    prompt: `You are a SQL query generator for a business leads database.

${LEADS_SCHEMA_HINT}

User query: "${q}"

Rules:
- Output ONLY a valid PostgreSQL SELECT * FROM leads WHERE ... query. Nothing else.
- No markdown, no explanation, no code blocks — just the raw SQL.
- ALWAYS include workspace_id = ':workspaceId' as a literal placeholder string.
- NEVER use UPDATE, DELETE, INSERT, DROP, or any DDL.
- For text columns use ILIKE '%value%' for partial matching.
- For "this week" or "minggu ini" use: created_at >= NOW() - INTERVAL '7 days'
- For "today" or "hari ini" use: created_at >= NOW() - INTERVAL '1 day'
- For location queries match against address ILIKE.
- End with LIMIT ${limit}.

SQL query:`,
  });

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
