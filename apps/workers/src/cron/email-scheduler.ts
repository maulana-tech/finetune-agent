/**
 * Email Scheduler Cron
 *
 * Runs every hour to:
 * 1. Process scheduled emails (send emails with scheduledFor <= now)
 * 2. Process email sequence steps (check enrollments and send due emails)
 */

async function processScheduledEmails() {
  try {
    const apiUrl = process.env.API_URL || 'http://localhost:3001';

    console.log('[Email Scheduler] Processing scheduled emails...');

    // This would call the API endpoint to process scheduled emails
    // In production, we'd import the service directly
    // For now, just log
    console.log('[Email Scheduler] Would process scheduled emails here');

  } catch (error) {
    console.error('[Email Scheduler] Error processing scheduled emails:', error);
  }
}

async function processSequenceSteps() {
  try {
    console.log('[Email Scheduler] Processing sequence steps...');

    // This would call the sequences service to process due steps
    console.log('[Email Scheduler] Would process sequence steps here');

  } catch (error) {
    console.error('[Email Scheduler] Error processing sequence steps:', error);
  }
}

async function run() {
  console.log('[Email Scheduler] Starting email scheduler cron...');

  await processScheduledEmails();
  await processSequenceSteps();

  console.log('[Email Scheduler] Email scheduler cron completed');
}

// Run every hour
setInterval(run, 60 * 60 * 1000);

// Run immediately on start
run();

export { run };
