import { Worker } from 'bullmq';
import { runMultiAgentWorkflow, runLeadScoringSwarm, type SwarmRunResult } from '@repo/ai';
import { db, agentLogs, leadScores, leads, swarmRuns } from '@repo/db';
import { eq } from 'drizzle-orm';

/**
 * Orchestrated AI Worker
 *
 * Runs the full multi-agent workflow for each lead:
 * 1. Extractor → Finance → Marketing → Strategy (orchestrator handles sequencing)
 * 2. Logs each agent's reasoning to agent_logs table
 * 3. Writes final scores to lead_scores table
 */

export const startOrchestratedAiWorker = () => {
  const worker = new Worker(
    'orchestrated-ai-queue',
    async (job) => {
      const { leadId, workspaceId, rawText, ourProduct } = job.data;

      console.log(`[OrchestratedAI] Processing lead ${leadId} in execution workflow`);

      try {
        // Run the full multi-agent orchestration (swarm or legacy)
        const useSwarm = process.env.USE_SWARM_AGENTS === 'true';
        const result = useSwarm
          ? await runLeadScoringSwarm({ leadId, workspaceId, rawText, ourProduct })
          : await runMultiAgentWorkflow({ leadId, workspaceId, rawText, ourProduct });

        const steps = useSwarm ? swarmStepsToOrchestratorSteps(result as SwarmRunResult) : (result as Awaited<ReturnType<typeof runMultiAgentWorkflow>>).steps;
        const finalRecommendation = useSwarm
          ? swarmOutputToFinalRec(result as SwarmRunResult)
          : (result as Awaited<ReturnType<typeof runMultiAgentWorkflow>>).finalRecommendation;
        const executionId = result.executionId;
        const totalDurationMs = result.totalDurationMs;
        const totalTokensUsed = result.totalTokensUsed;

        console.log(`[OrchestratedAI] Workflow completed. Execution ID: ${executionId}`);

        // Log each agent's execution to agent_logs
        for (const step of steps) {
          const contextFromPrevious =
            step.stepNumber > 1
              ? steps
                  .filter((s) => s.stepNumber < step.stepNumber)
                  .reduce((acc, s) => ({ ...acc, [s.agentName]: s.output }), {})
              : null;

          const contextToNext =
            step.stepNumber < steps.length
              ? { [step.agentName]: step.output }
              : null;

          await db.insert(agentLogs).values({
            workspaceId,
            leadId,
            agentName: step.agentName,
            agentRole: getAgentRole(step.agentName),
            executionId,
            stepNumber: step.stepNumber,
            input: { rawText: step.stepNumber === 1 ? rawText : null },
            output: step.output,
            reasoning: step.reasoning,
            confidence: step.confidence,
            contextFromPreviousAgent: contextFromPrevious,
            contextSharedToNextAgent: contextToNext,
            durationMs: step.durationMs,
            tokensUsed: step.tokensUsed,
            handoffFrom: step.handoffFrom ?? null,
            parallelGroup: step.parallelGroup ?? null,
          });

          console.log(
            `[OrchestratedAI] Logged ${step.agentName} (step ${step.stepNumber}) - confidence: ${step.confidence}%`
          );
        }

        // Write final scores to lead_scores table
        const finalRec = finalRecommendation;
        const financeStep = steps.find((s) => s.agentName === 'finance');
        const marketingStep = steps.find((s) => s.agentName === 'marketing');

        await db
          .insert(leadScores)
          .values({
            leadId,
            qualityScore: finalRec.priorityScore,
            conversionProbability: finalRec.conversionProbability,
            estimatedValue: finalRec.estimatedDealValue,
            priorityTier: finalRec.priorityTier,
            financialHealth: financeStep?.output.financial_health_score || null,
            messagingFit: marketingStep?.output.messaging_fit_score || null,
            strategicAlignment: finalRec.strategicAlignmentScore,
            recommendedAction: finalRec.recommendedAction,
            reasoning: finalRec.reasoning,
          })
          .onConflictDoUpdate({
            target: leadScores.leadId,
            set: {
              qualityScore: finalRec.priorityScore,
              conversionProbability: finalRec.conversionProbability,
              estimatedValue: finalRec.estimatedDealValue,
              priorityTier: finalRec.priorityTier,
              financialHealth: financeStep?.output.financial_health_score || null,
              messagingFit: marketingStep?.output.messaging_fit_score || null,
              strategicAlignment: finalRec.strategicAlignmentScore,
              recommendedAction: finalRec.recommendedAction,
              reasoning: finalRec.reasoning,
              updatedAt: new Date(),
            },
          });

        console.log(
          `[OrchestratedAI] Lead score saved: ${finalRec.priorityTier} tier, ${finalRec.priorityScore}/100, action: ${finalRec.recommendedAction}`
        );

        // Record the swarm run for observability
        if (useSwarm) {
          await db.insert(swarmRuns).values({
            workspaceId,
            executionId,
            workflowName: 'lead-scoring',
            entryAgent: 'extractor',
            leadId,
            totalSteps: steps.length,
            totalDurationMs,
            totalTokensUsed,
            status: 'completed',
          });
        }

        // Update lead with extracted data from Step 1
        const extractorOutput = steps[0].output;
        await db
          .update(leads)
          .set({
            name: extractorOutput.name,
            category: extractorOutput.category,
            emails: extractorOutput.contact_info.email
              ? [extractorOutput.contact_info.email]
              : [],
            phone: extractorOutput.contact_info.phone || null,
          })
          .where(eq(leads.id, leadId));

        return {
          success: true,
          executionId,
          recommendation: finalRec,
          totalDurationMs,
          totalTokensUsed,
        };
      } catch (error: any) {
        console.error(`[OrchestratedAI] Workflow failed for lead ${leadId}:`, error);
        throw error;
      }
    },
    {
      connection: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      },
    }
  );

  worker.on('completed', (job) => {
    console.log(`[OrchestratedAI] Job ${job.id} completed successfully.`);
  });

  worker.on('failed', (job, err) => {
    console.log(`[OrchestratedAI] Job ${job?.id} failed: ${err.message}`);
  });

  console.log('[OrchestratedAI] Worker started - listening to orchestrated-ai-queue');
};

/** Adapt SwarmRunResult steps to look like OrchestratorOutput steps (with stepNumber). */
function swarmStepsToOrchestratorSteps(
  result: SwarmRunResult,
): { agentName: string; stepNumber: number; output: any; reasoning: string; confidence: number; durationMs: number; tokensUsed?: number; handoffFrom?: string; parallelGroup?: string }[] {
  return result.steps.map((s, i) => ({
    agentName: s.agentName,
    stepNumber: i + 1,
    output: s.output as Record<string, unknown>,
    reasoning: s.reasoning,
    confidence: s.confidence,
    durationMs: s.durationMs,
    tokensUsed: s.tokensUsed,
    handoffFrom: s.handoffFrom,
    parallelGroup: s.parallelGroup,
  }));
}

/** Extract final recommendation from SwarmRunResult (strategy agent output). */
function swarmOutputToFinalRec(result: SwarmRunResult) {
  const out = (result.finalOutput ?? result.steps[result.steps.length - 1]?.output) as Record<string, unknown> | undefined;
  return {
    priorityScore: (out?.priority_score as number) ?? 0,
    conversionProbability: (out?.conversion_probability as number) ?? 0,
    estimatedDealValue: (out?.estimated_deal_value as number) ?? 0,
    priorityTier: (out?.priority_tier as 'A' | 'B' | 'C' | 'D') ?? 'D',
    recommendedAction: (out?.recommended_action as 'immediate_outreach' | 'nurture' | 'disqualify') ?? 'nurture',
    strategicAlignmentScore: (out?.strategic_alignment_score as number) ?? 0,
    reasoning: (out?.reasoning as string) ?? '',
  };
}

function getAgentRole(agentName: string): string {
  const roles: Record<string, string> = {
    extractor: 'Data extraction specialist - extracts structured business info from raw text',
    finance:
      'Financial analyst - estimates revenue, company size, and B2B budget capacity',
    marketing:
      'Marketing strategist - determines messaging fit and identifies pain points',
    strategy:
      'Strategic advisor - synthesizes all agents and provides final lead recommendation',
  };
  return roles[agentName] || 'Unknown agent role';
}
