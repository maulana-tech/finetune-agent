import { Worker } from 'bullmq';
import { extractBusinessInfo, type AgentContext } from '@repo/ai';
import { db, aiInsights, leads } from '@repo/db';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

/**
 * Legacy AI worker — handles individual single-agent tasks on ai-agent-queue.
 * New code should use orchestrated-ai-queue (full pipeline) instead.
 * Kept for backward compatibility with any jobs still in flight.
 */
export const startAiWorker = () => {
  const worker = new Worker(
    'ai-agent-queue',
    async (job) => {
      const { taskType, payload, leadId, workspaceId } = job.data;
      console.log(`[AI] Processing task ${taskType} for lead ${leadId}`);

      const baseContext: AgentContext = {
        executionId: randomUUID(),
        leadId: leadId ?? '',
        workspaceId: workspaceId ?? '',
        stepNumber: 1,
      };

      try {
        switch (taskType) {
          case 'extract': {
            const result = await extractBusinessInfo(payload.rawText as string, baseContext);
            if (leadId) {
              await db
                .update(leads)
                .set({
                  category: (result.output as any).category ?? null,
                  emails: (result.output as any).contact_info?.email
                    ? [(result.output as any).contact_info.email as string]
                    : [],
                  phone: (result.output as any).contact_info?.phone ?? null,
                })
                .where(eq(leads.id, leadId));
            }
            return result;
          }

          case 'finance':
          case 'marketing':
          case 'strategy':
            // These agents require the full pipeline context. Use orchestrated-ai-queue instead.
            console.warn(
              `[AI] Task type "${taskType}" requires full pipeline context — ` +
                'enqueue to orchestrated-ai-queue instead. Skipping.',
            );
            if (leadId) {
              await db.insert(aiInsights).values({
                leadId,
                agentType: taskType,
                content: { skipped: true, reason: 'Use orchestrated-ai-queue for full pipeline' },
              });
            }
            return { skipped: true };

          default:
            throw new Error(`Unknown AI task type: ${taskType}`);
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[AI] Task ${taskType} failed:`, message);
        throw error;
      }
    },
    {
      connection: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      },
    },
  );

  worker.on('completed', (job) => console.log(`[AI] Job ${job.id} completed`));
  worker.on('failed', (job, err) =>
    console.log(`[AI] Job ${job?.id} failed: ${err.message}`),
  );
};
