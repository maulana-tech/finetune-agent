import { Injectable, BadRequestException } from '@nestjs/common';
import { sql, eq, and } from 'drizzle-orm';
import { db, leads } from '@repo/db';
import { generateLeadsSearchSql } from '@repo/ai';

@Injectable()
export class LeadsService {
  /**
   * Natural-language search over the leads table.
   * Uses a SQL agent (8B model in @repo/ai) to convert the query to SQL,
   * then executes it scoped to the workspaceId.
   */
  async search(workspaceId: string, q: string, limit = 20) {
    if (!q?.trim()) {
      return {
        results: await db
          .select()
          .from(leads)
          .where(eq(leads.workspaceId, workspaceId))
          .limit(limit),
        generatedSql: null,
        reasoning: null,
      };
    }

    let generatedSql: string | null = null;
    let reasoning: string | null = null;

    try {
      const agentResult = await generateLeadsSearchSql(q, limit);
      generatedSql = agentResult.sql;
      reasoning = agentResult.reasoning;

      if (!generatedSql) throw new Error('No SQL returned from agent');

      // Safety: reject any non-SELECT or suspicious SQL
      if (!generatedSql.trim().toUpperCase().startsWith('SELECT')) {
        throw new BadRequestException('SQL agent returned a non-SELECT query');
      }
      if (/\b(DELETE|UPDATE|INSERT|DROP|ALTER|TRUNCATE|EXEC|EXECUTE)\b/i.test(generatedSql)) {
        throw new BadRequestException('Unsafe SQL detected');
      }

      // Replace placeholder with the actual workspaceId (sanitised — UUID only)
      if (!/^[0-9a-f-]{36}$/i.test(workspaceId)) {
        throw new BadRequestException('Invalid workspaceId');
      }
      const execSql = generatedSql.replace(
        /':workspaceId'/g,
        `'${workspaceId}'`,
      );

      const rows = await db.execute(sql.raw(execSql));
      return { results: rows.rows, generatedSql, reasoning };
    } catch (err) {
      if (err instanceof BadRequestException) throw err;

      // SQL agent or execution failed — fall back to simple ILIKE
      const fallback = await db
        .select()
        .from(leads)
        .where(
          and(
            eq(leads.workspaceId, workspaceId),
            sql`(
              ${leads.name} ILIKE ${'%' + q + '%'} OR
              ${leads.category} ILIKE ${'%' + q + '%'} OR
              ${leads.address} ILIKE ${'%' + q + '%'}
            )`,
          ),
        )
        .limit(limit);

      return {
        results: fallback,
        generatedSql: null,
        reasoning: 'SQL agent failed; used fallback ILIKE search',
      };
    }
  }
}
