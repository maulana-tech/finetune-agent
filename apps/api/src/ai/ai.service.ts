import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { db, leads } from '@repo/db';
import { eq } from 'drizzle-orm';

const ourProduct =
  'UTUNE AI — B2B lead intelligence platform. Kami menyediakan AI-powered lead scoring, financial simulation, market analysis, dan scraping otomatis untuk sales team B2B di Indonesia.';

@Injectable()
export class AiService {
  constructor(
    @InjectQueue('orchestrated-ai-queue') private aiQueue: Queue,
  ) {}

  async analyzeLead(leadId: string, workspaceId: string) {
    const [lead] = await db
      .select()
      .from(leads)
      .where(eq(leads.id, leadId));

    if (!lead) {
      throw new Error('Lead not found');
    }

    const rawText = [
      `Name: ${lead.name}`,
      lead.address && `Address: ${lead.address}`,
      lead.phone && `Phone: ${lead.phone}`,
      lead.website && `Website: ${lead.website}`,
      lead.category && `Category: ${lead.category}`,
      lead.lat && lead.lng && `Location: ${lead.lat}, ${lead.lng}`,
    ]
      .filter(Boolean)
      .join('\n');

    const job = await this.aiQueue.add('orchestrated-workflow', {
      leadId,
      workspaceId,
      rawText,
      ourProduct,
    });

    return { jobId: job.id, leadId, name: lead.name };
  }
}
