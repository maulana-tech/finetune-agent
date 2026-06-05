/**
 * Email Scheduler Cron
 *
 * Runs every 15 minutes to:
 * 1. Process scheduled emails (send emails with scheduledFor <= now)
 * 2. Process email sequence steps (check enrollments and send due emails)
 */

import * as nodemailer from 'nodemailer';
import { eq, and, sql } from 'drizzle-orm';
import { db, emailOutreach } from '@repo/db';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SUMOPOD_SMTP_HOST;
  const port = process.env.SUMOPOD_SMTP_PORT;
  const user = process.env.SUMOPOD_SMTP_USER;
  const pass = process.env.SUMOPOD_SMTP_PASS;

  if (host && port && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port: parseInt(port, 10),
      secure: true,
      auth: { user, pass },
    });
    console.log('[Email Scheduler] SMTP transporter initialized');
  } else {
    console.warn('[Email Scheduler] SMTP not configured — skipping');
  }

  return transporter;
}

async function processScheduledEmails() {
  const smtp = getTransporter();
  if (!smtp) return { processed: 0 };

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

  if (dueEmails.length === 0) return { processed: 0 };

  console.log(`[Email Scheduler] Processing ${dueEmails.length} scheduled email(s)`);

  let processed = 0;
  for (const email of dueEmails) {
    try {
      // Update status to queued
      await db
        .update(emailOutreach)
        .set({ status: 'queued' })
        .where(eq(emailOutreach.id, email.id));

      // Send via SMTP
      const info = await smtp.sendMail({
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

      console.log(`[Email Scheduler] Sent email ${email.id} to ${email.toEmail}`);
      processed++;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      await db
        .update(emailOutreach)
        .set({ status: 'failed', errorMessage })
        .where(eq(emailOutreach.id, email.id));

      console.error(`[Email Scheduler] Failed to send email ${email.id}: ${errorMessage}`);
    }
  }

  return { processed };
}

async function run() {
  try {
    console.log('[Email Scheduler] Running...');
    const result = await processScheduledEmails();
    if (result.processed > 0) {
      console.log(`[Email Scheduler] Processed ${result.processed} email(s)`);
    }
  } catch (error) {
    console.error('[Email Scheduler] Error:', error);
  }
}

// Run every 15 minutes
setInterval(run, 15 * 60 * 1000);

// Run immediately on start
run();

export { run };
