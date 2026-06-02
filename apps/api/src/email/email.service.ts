import { Injectable, BadRequestException } from '@nestjs/common';
import { Resend } from 'resend';
import { eq } from 'drizzle-orm';
import { db, emailOutreach } from '@repo/db';

interface SendEmailParams {
  leadId: string;
  workspaceId: string;
  toEmail: string;
  fromEmail: string;
  subject: string;
  body: string;
}

@Injectable()
export class EmailService {
  private resend: Resend | null = null;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      this.resend = new Resend(apiKey);
    }
  }

  async sendEmail(params: SendEmailParams) {
    if (!this.resend) {
      throw new BadRequestException('Email service not configured. Set RESEND_API_KEY environment variable.');
    }

    if (!process.env.RESEND_FROM_EMAIL) {
      throw new BadRequestException('RESEND_FROM_EMAIL environment variable not set');
    }

    // 1. Save to database (status: queued)
    const [outreach] = await db
      .insert(emailOutreach)
      .values({
        workspaceId: params.workspaceId,
        leadId: params.leadId,
        fromEmail: params.fromEmail,
        toEmail: params.toEmail,
        subject: params.subject,
        body: params.body,
        status: 'queued',
      })
      .returning();

    try {
      // 2. Send via Resend
      const { data, error } = await this.resend.emails.send({
        from: params.fromEmail,
        to: params.toEmail,
        subject: params.subject,
        html: params.body,
        tags: [
          { name: 'workspace_id', value: params.workspaceId },
          { name: 'lead_id', value: params.leadId },
        ],
      });

      if (error) throw new Error(error.message);

      // 3. Update status (sent)
      await db
        .update(emailOutreach)
        .set({
          status: 'sent',
          sentAt: new Date(),
          resendEmailId: data?.id,
        })
        .where(eq(emailOutreach.id, outreach.id));

      return { success: true, emailId: outreach.id };
    } catch (err: unknown) {
      // 4. Mark as failed
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      await db
        .update(emailOutreach)
        .set({
          status: 'failed',
          errorMessage,
        })
        .where(eq(emailOutreach.id, outreach.id));

      throw new BadRequestException(`Failed to send email: ${errorMessage}`);
    }
  }

  async getEmailHistory(leadId: string) {
    return db
      .select()
      .from(emailOutreach)
      .where(eq(emailOutreach.leadId, leadId))
      .orderBy(emailOutreach.createdAt);
  }
}
