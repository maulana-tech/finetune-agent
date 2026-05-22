import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { sql, eq, and, desc } from 'drizzle-orm';
import { db, leads, workspaces, aiInsights, leadNotes, leadScores } from '@repo/db';
import { generateLeadsSearchSql, analyzeLeadForSales, generateColdEmail } from '@repo/ai';

interface CreateLeadDto {
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  category?: string;
  emails?: string[];
  lat?: number;
  lng?: number;
  mapsUrl?: string;
}

interface UpdateLeadDto {
  name?: string;
  address?: string;
  phone?: string;
  website?: string;
  category?: string;
  emails?: string[];
  lat?: number;
  lng?: number;
  mapsUrl?: string;
}

@Injectable()
export class LeadsService {
  async scores(workspaceId: string) {
    return db
      .select({
        leadId: leads.id,
        name: leads.name,
        category: leads.category,
        address: leads.address,
        pipelineStage: leads.pipelineStage,
        qualityScore: leadScores.qualityScore,
        conversionProbability: leadScores.conversionProbability,
        estimatedValue: leadScores.estimatedValue,
        priorityTier: leadScores.priorityTier,
        recommendedAction: leadScores.recommendedAction,
        messagingFit: leadScores.messagingFit,
        financialHealth: leadScores.financialHealth,
        strategicAlignment: leadScores.strategicAlignment,
        computedAt: leadScores.computedAt,
      })
      .from(leadScores)
      .innerJoin(leads, eq(leadScores.leadId, leads.id))
      .where(eq(leads.workspaceId, workspaceId))
      .orderBy(desc(leadScores.qualityScore));
  }

  async list(workspaceId: string) {
    return db
      .select()
      .from(leads)
      .where(eq(leads.workspaceId, workspaceId))
      .orderBy(sql`${leads.createdAt} DESC`);
  }

  async getById(id: string, workspaceId: string) {
    const [lead] = await db
      .select()
      .from(leads)
      .where(and(eq(leads.id, id), eq(leads.workspaceId, workspaceId)))
      .limit(1);
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async getInsights(leadId: string) {
    return db
      .select()
      .from(aiInsights)
      .where(eq(aiInsights.leadId, leadId))
      .orderBy(desc(aiInsights.createdAt));
  }

  async getNotes(leadId: string) {
    return db
      .select()
      .from(leadNotes)
      .where(eq(leadNotes.leadId, leadId))
      .orderBy(desc(leadNotes.createdAt));
  }

  async analyze(leadId: string, workspaceId: string) {
    const [lead] = await db
      .select()
      .from(leads)
      .where(and(eq(leads.id, leadId), eq(leads.workspaceId, workspaceId)))
      .limit(1);
    if (!lead) throw new NotFoundException('Lead not found');

    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    const analysis = await analyzeLeadForSales(
      {
        name: lead.name,
        category: lead.category,
        address: lead.address,
        website: lead.website,
        emails: lead.emails,
        phone: lead.phone,
        mapsUrl: lead.mapsUrl,
      },
      workspace?.businessContext ?? '',
    );

    // Store as AI insight
    await db.insert(aiInsights).values({
      leadId,
      agentType: 'smart-sales',
      content: analysis as unknown as Record<string, unknown>,
    });

    return analysis;
  }

  async generateEmail(leadId: string, workspaceId: string) {
    const [lead] = await db
      .select()
      .from(leads)
      .where(and(eq(leads.id, leadId), eq(leads.workspaceId, workspaceId)))
      .limit(1);
    if (!lead) throw new NotFoundException('Lead not found');

    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    // Get latest sales analysis if available
    const [latestAnalysis] = await db
      .select()
      .from(aiInsights)
      .where(and(eq(aiInsights.leadId, leadId), eq(aiInsights.agentType, 'smart-sales')))
      .orderBy(desc(aiInsights.createdAt))
      .limit(1);

    const email = await generateColdEmail(
      {
        name: lead.name,
        category: lead.category,
        address: lead.address,
        website: lead.website,
      },
      workspace?.businessContext ?? '',
      latestAnalysis ? JSON.stringify(latestAnalysis.content) : null,
    );

    // Store as AI insight
    await db.insert(aiInsights).values({
      leadId,
      agentType: 'cold-email',
      content: email as unknown as Record<string, unknown>,
    });

    return email;
  }

  async addNote(leadId: string, workspaceId: string, content: string, author: string) {
    const [note] = await db
      .insert(leadNotes)
      .values({ leadId, workspaceId, content, author })
      .returning();
    return note;
  }

  async deleteNote(noteId: string, workspaceId: string) {
    const [note] = await db
      .delete(leadNotes)
      .where(and(eq(leadNotes.id, noteId), eq(leadNotes.workspaceId, workspaceId)))
      .returning();
    if (!note) throw new NotFoundException('Note not found');
    return note;
  }

  async create(dto: CreateLeadDto, workspaceId: string) {
    const [lead] = await db
      .insert(leads)
      .values({ ...dto, workspaceId })
      .returning();
    return lead;
  }

  async update(id: string, dto: UpdateLeadDto, workspaceId: string) {
    const [lead] = await db
      .update(leads)
      .set({ ...dto, updatedAt: new Date() })
      .where(and(eq(leads.id, id), eq(leads.workspaceId, workspaceId)))
      .returning();
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async delete(id: string, workspaceId: string) {
    const [lead] = await db
      .delete(leads)
      .where(and(eq(leads.id, id), eq(leads.workspaceId, workspaceId)))
      .returning();
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

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
