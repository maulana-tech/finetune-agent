import { generateObject } from 'ai';
import { z } from 'zod';
import { nvidia } from '../provider';

const fastModel = nvidia('meta/llama-3.1-8b-instruct');

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
  whatsapp      jsonb       -- string array of WA numbers, e.g. ["+6281234567890"]
  maps_url      text
  pipeline_stage text       -- e.g. "Prospecting", "Qualified", "Closed"
  created_at    timestamp
  updated_at    timestamp
`.trim();

export const SqlQuerySchema = z.object({
  sql: z.string().describe('Valid PostgreSQL SELECT query. Must include WHERE workspace_id = :workspaceId.'),
  reasoning: z.string(),
});

export type SqlQueryResult = z.infer<typeof SqlQuerySchema>;

/**
 * Converts a natural-language leads search query into a PostgreSQL SELECT.
 * The caller is responsible for sanitising the workspaceId and executing safely.
 */
export async function generateLeadsSearchSql(
  q: string,
  limit: number,
): Promise<SqlQueryResult> {
  const { object } = await generateObject({
    model: fastModel,
    schema: SqlQuerySchema,
    prompt: `You are a SQL query generator for a business leads database.

${LEADS_SCHEMA_HINT}

User query: "${q}"
LIMIT: ${limit}

Rules:
- Output a valid PostgreSQL SELECT * FROM leads WHERE ... query.
- ALWAYS include workspace_id = ':workspaceId' as a literal placeholder string — the caller replaces it.
- NEVER use UPDATE, DELETE, INSERT, DROP, or any DDL.
- For text columns use ILIKE '%value%' for partial matching.
- For category search use ILIKE.
- For location queries (e.g. "Jakarta Selatan", "Kemang") match against address ILIKE.
- End with LIMIT ${limit}.`,
  });

  return object;
}
