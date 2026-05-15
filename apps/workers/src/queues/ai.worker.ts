import { Worker } from 'bullmq';
import { extractBusinessInfo, analyzeFinancials, generateColdEmail, generateMarketReport } from '@repo/ai';
import { db, aiInsights, marketReports, leads } from '@repo/db';
import { eq } from 'drizzle-orm';

export const startAiWorker = () => {
  const worker = new Worker('ai-agent-queue', async job => {
    const { taskType, payload, leadId, workspaceId } = job.data;
    console.log(`Processing AI Task: ${taskType} for lead: ${leadId}`);

    try {
      let result;
      switch (taskType) {
        case 'extract':
          result = await extractBusinessInfo(payload.rawText);
          if (leadId) {
            await db.update(leads).set({
              category: result.category,
              // We store email in jsonb array per schema
              emails: result.contact_info.email ? [result.contact_info.email] : [],
              phone: result.contact_info.phone || undefined,
            }).where(eq(leads.id, leadId));
          }
          return result;

        case 'finance':
          result = await analyzeFinancials(payload.businessContext);
          if (leadId) {
            await db.insert(aiInsights).values({
              leadId,
              agentType: 'finance',
              content: result,
            });
          }
          return result;

        case 'marketing':
          result = await generateColdEmail(payload.businessContext, payload.ourProduct);
          if (leadId) {
            await db.insert(aiInsights).values({
              leadId,
              agentType: 'marketing',
              content: { email: result },
            });
          }
          return result;

        case 'strategy':
          result = await generateMarketReport(payload.leads);
          if (workspaceId) {
            await db.insert(marketReports).values({
              workspaceId,
              query: payload.query || 'Market Analysis',
              content: result,
            });
          }
          return result;

        default:
          throw new Error(`Unknown AI task type: ${taskType}`);
      }
    } catch (error: any) {
      console.error(`AI Task ${taskType} Failed:`, error);
      throw error;
    }
  }, {
    connection: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    }
  });

  worker.on('completed', job => {
    console.log(`AI Job ${job.id} completed successfully.`);
  });
  
  worker.on('failed', (job, err) => {
    console.log(`AI Job ${job?.id} failed with ${err.message}`);
  });
};
