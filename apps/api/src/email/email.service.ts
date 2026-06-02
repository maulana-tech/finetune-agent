import { Injectable, BadRequestException } from '@nestjs/common';
import { Resend } from 'resend';
import { eq, lt, and, sql } from 'drizzle-orm';
import { db, emailOutreach, leads } from '@repo/db';

interface SendEmailParams {
  leadId: string;
  workspaceId: string;
  toEmail: string;
  fromEmail: string;
  subject: string;
  body: string;
  scheduledFor?: Date;
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

    // 1. Save to database (status: queued or draft if scheduled)
    const [outreach] = await db
      .insert(emailOutreach)
      .values({
        workspaceId: params.workspaceId,
        leadId: params.leadId,
        fromEmail: params.fromEmail,
        toEmail: params.toEmail,
        subject: params.subject,
        body: params.body,
        status: params.scheduledFor ? 'draft' : 'queued',
        scheduledFor: params.scheduledFor,
      })
      .returning();

    // If scheduled, don't send now
    if (params.scheduledFor) {
      return { success: true, emailId: outreach.id, scheduled: true };
    }

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

  async updateEmailStatus(resendEmailId: string, status: string) {
    const result = await db
      .update(emailOutreach)
      .set({ status })
      .where(eq(emailOutreach.resendEmailId, resendEmailId))
      .returning();

    if (result.length === 0) {
      console.warn(`[EmailService] No email found with resendEmailId: ${resendEmailId}`);
    }

    return result[0];
  }

  async markEmailOpened(resendEmailId: string) {
    const result = await db
      .update(emailOutreach)
      .set({
        openedAt: new Date(),
        status: 'delivered', // Ensure status is at least 'delivered' if opened
      })
      .where(eq(emailOutreach.resendEmailId, resendEmailId))
      .returning();

    if (result.length > 0) {
      // Auto-update lead pipeline stage to "Engaged"
      const { db: dbInstance, leads } = await import('@repo/db');
      await dbInstance
        .update(leads)
        .set({ pipelineStage: 'Engaged' })
        .where(eq(leads.id, result[0].leadId));

      console.log(`[EmailService] Lead ${result[0].leadId} moved to "Engaged" stage`);
    }

    return result[0];
  }

  async markEmailClicked(resendEmailId: string) {
    const result = await db
      .update(emailOutreach)
      .set({ clickedAt: new Date() })
      .where(eq(emailOutreach.resendEmailId, resendEmailId))
      .returning();

    return result[0];
  }

  /**
   * Process scheduled emails (should be called by cron job)
   */
  async processScheduledEmails() {
    // Find emails scheduled for now or earlier
    const dueEmails = await db
      .select()
      .from(emailOutreach)
      .where(
        and(
          eq(emailOutreach.status, 'draft'),
          sql`${emailOutreach.scheduledFor} <= NOW()`,
        ),
      );

    const results = [];
    for (const email of dueEmails) {
      try {
        // Update status to queued
        await db
          .update(emailOutreach)
          .set({ status: 'queued' })
          .where(eq(emailOutreach.id, email.id));

        // Send via Resend
        if (!this.resend) continue;

        const { data, error } = await this.resend.emails.send({
          from: email.fromEmail,
          to: email.toEmail,
          subject: email.subject,
          html: email.body,
          tags: [
            { name: 'workspace_id', value: email.workspaceId },
            { name: 'lead_id', value: email.leadId },
          ],
        });

        if (error) throw new Error(error.message);

        // Update status to sent
        await db
          .update(emailOutreach)
          .set({
            status: 'sent',
            sentAt: new Date(),
            resendEmailId: data?.id,
          })
          .where(eq(emailOutreach.id, email.id));

        results.push({ emailId: email.id, success: true });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        await db
          .update(emailOutreach)
          .set({
            status: 'failed',
            errorMessage,
          })
          .where(eq(emailOutreach.id, email.id));

        results.push({ emailId: email.id, success: false, error: errorMessage });
      }
    }

    return { processed: results.length, results };
  }
}
