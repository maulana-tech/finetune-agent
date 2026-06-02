import { Injectable, BadRequestException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { eq, and, sql } from 'drizzle-orm';
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
export class SmtpService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const host = process.env.SUMOPOD_SMTP_HOST;
    const port = process.env.SUMOPOD_SMTP_PORT;
    const user = process.env.SUMOPOD_SMTP_USER;
    const pass = process.env.SUMOPOD_SMTP_PASS;

    if (host && port && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(port, 10),
        secure: true, // SSL: True
        auth: {
          user,
          pass,
        },
      });
    }
  }

  async sendEmail(params: SendEmailParams) {
    if (!this.transporter) {
      throw new BadRequestException('SMTP service not configured. Set SUMOPOD_SMTP_* environment variables.');
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
      // 2. Send via SMTP
      const info = await this.transporter.sendMail({
        from: params.fromEmail,
        to: params.toEmail,
        subject: params.subject,
        html: params.body,
      });

      console.log('[SMTP] Email sent:', info.messageId);

      // 3. Update status (sent)
      await db
        .update(emailOutreach)
        .set({
          status: 'sent',
          sentAt: new Date(),
          resendEmailId: info.messageId, // Store SMTP message ID
        })
        .where(eq(emailOutreach.id, outreach.id));

      return { success: true, emailId: outreach.id, messageId: info.messageId };
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

  /**
   * Process scheduled emails (should be called by cron job)
   */
  async processScheduledEmails() {
    if (!this.transporter) {
      console.warn('[SMTP] Transporter not configured, skipping scheduled emails');
      return { processed: 0, results: [] };
    }

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

        // Send via SMTP
        const info = await this.transporter.sendMail({
          from: email.fromEmail,
          to: email.toEmail,
          subject: email.subject,
          html: email.body,
        });

        // Update status to sent
        await db
          .update(emailOutreach)
          .set({
            status: 'sent',
            sentAt: new Date(),
            resendEmailId: info.messageId,
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
