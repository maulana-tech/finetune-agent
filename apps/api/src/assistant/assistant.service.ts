import { Injectable, BadRequestException } from '@nestjs/common';
import { sql, eq } from 'drizzle-orm';
import { db, leads } from '@repo/db';
import { generateLeadsSearchSql } from '@repo/ai';
import { generateText } from 'ai';
import { defaultModel } from '@repo/ai';

@Injectable()
export class AssistantService {
  async chat(question: string, workspaceId: string): Promise<{ answer: string; sql: string | null }> {
    if (!/^[0-9a-f-]{36}$/i.test(workspaceId)) {
      throw new BadRequestException('Invalid workspaceId');
    }

    // Step 1: NL → SQL
    let sqlQuery: string | null = null;
    let answer: string;

    try {
      const agentResult = await generateLeadsSearchSql(question, 20);
      sqlQuery = agentResult.sql;

      if (!sqlQuery) throw new Error('No SQL returned');

      // Safety checks
      if (!sqlQuery.trim().toUpperCase().startsWith('SELECT')) {
        throw new BadRequestException('Only SELECT queries allowed');
      }
      if (/\b(DELETE|UPDATE|INSERT|DROP|ALTER|TRUNCATE|EXEC|EXECUTE)\b/i.test(sqlQuery)) {
        throw new BadRequestException('Unsafe SQL detected');
      }

      // Replace workspaceId placeholder
      const execSql = sqlQuery.replace(/':workspaceId'/g, `'${workspaceId}'`);
      const rows = await db.execute(sql.raw(execSql));

      // Step 2: Summarize results
      if (rows.rows.length === 0) {
        answer = "I didn't find any leads matching your question. Try rephrasing or broadening your search.";
      } else {
        const { text } = await generateText({
          model: defaultModel,
          prompt: `You are a CRM assistant. The user asked: "${question}"

Here are the matching leads from the database:
${JSON.stringify(rows.rows.slice(0, 20), null, 2)}

Provide a concise, natural-language answer (2-4 sentences) summarizing what you found. 
Include specific numbers and key details. If there are many results, mention the total count.
Do NOT mention SQL or technical details.`,
        });
        answer = text;
      }
    } catch (err) {
      if (err instanceof BadRequestException) throw err;

      // Fallback: simple count query
      const [row] = await db
        .select({ count: sql<number>`count(*)` })
        .from(leads)
        .where(eq(leads.workspaceId, workspaceId));
      const total = row?.count ?? 0;
      answer = `I couldn't process that specific query. Your workspace has ${total} leads total. Try asking something like "show me coffee shops in Jakarta" or "how many leads have email addresses?"`;
    }

    return { answer, sql: sqlQuery };
  }
}
