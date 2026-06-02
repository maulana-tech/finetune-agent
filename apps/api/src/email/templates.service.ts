import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { db, emailTemplates, leads } from '@repo/db';

interface CreateTemplateDto {
  name: string;
  subject: string;
  body: string;
  variables?: string[];
}

@Injectable()
export class TemplatesService {
  async list(workspaceId: string) {
    return db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.workspaceId, workspaceId))
      .orderBy(emailTemplates.createdAt);
  }

  async getById(id: string, workspaceId: string) {
    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(and(eq(emailTemplates.id, id), eq(emailTemplates.workspaceId, workspaceId)))
      .limit(1);

    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async create(dto: CreateTemplateDto, workspaceId: string) {
    const [template] = await db
      .insert(emailTemplates)
      .values({
        workspaceId,
        name: dto.name,
        subject: dto.subject,
        body: dto.body,
        variables: dto.variables || [],
      })
      .returning();

    return template;
  }

  async update(id: string, dto: Partial<CreateTemplateDto>, workspaceId: string) {
    const [template] = await db
      .update(emailTemplates)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(and(eq(emailTemplates.id, id), eq(emailTemplates.workspaceId, workspaceId)))
      .returning();

    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async delete(id: string, workspaceId: string) {
    const [template] = await db
      .delete(emailTemplates)
      .where(and(eq(emailTemplates.id, id), eq(emailTemplates.workspaceId, workspaceId)))
      .returning();

    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  /**
   * Render template with lead data
   */
  async renderTemplate(templateId: string, leadId: string, workspaceId: string) {
    const template = await this.getById(templateId, workspaceId);
    const [lead] = await db
      .select()
      .from(leads)
      .where(and(eq(leads.id, leadId), eq(leads.workspaceId, workspaceId)))
      .limit(1);

    if (!lead) throw new NotFoundException('Lead not found');

    // Simple variable replacement
    let subject = template.subject;
    let body = template.body;

    const replacements: Record<string, string> = {
      company_name: lead.name || '',
      business_name: lead.name || '',
      address: lead.address || '',
      category: lead.category || '',
      phone: lead.phone || '',
      email: lead.emails?.[0] || '',
    };

    for (const [key, value] of Object.entries(replacements)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
      subject = subject.replace(regex, value);
      body = body.replace(regex, value);
    }

    return { subject, body };
  }
}
