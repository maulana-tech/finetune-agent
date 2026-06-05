import { Worker } from 'bullmq';
import { runMultiAgentWorkflow, runLeadScoringSwarm, type SwarmRunResult } from '@repo/ai';
import { db, agentLogs, leadScores, leads, swarmRuns } from '@repo/db';
import { eq } from 'drizzle-orm';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns true if the string looks like a JSON blob or junk value. */
function isJsonOrJunk(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length < 3) return true;
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return true;
  const junkSet = new Set(['json', 'null', 'undefined', 'n/a', 'na', 'loading', 'unknown', 'test']);
  if (junkSet.has(trimmed.toLowerCase())) return true;
  return false;
}

/** Clean a business name returned by the LLM — strip JSON, prefixes, quotes. */
function sanitizeName(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let name = raw.trim();

  // If it looks like JSON, try to extract a name field
  if (name.startsWith('{') || name.startsWith('[')) {
    try {
      const parsed = JSON.parse(name);
      name = parsed.name || parsed.business_name || parsed.company_name || '';
    } catch {
      return null;
    }
  }

  // Remove surrounding quotes
  name = name.replace(/^["']|["']$/g, '');

  // Remove common prefixes the LLM sometimes adds
  name = name.replace(/^(Name|Business|Company|Brand)\s*:\s*/i, '');

  name = name.trim();
  if (name.length < 3) return null;
  return name;
}

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
            confidence: Math.round((Number(step.confidence) || 0) * (Number(step.confidence) <= 1 ? 100 : 1)),
            contextFromPreviousAgent: contextFromPrevious,
            contextSharedToNextAgent: contextToNext,
            durationMs: Number(step.durationMs) || 0,
            tokensUsed: step.tokensUsed ? Number(step.tokensUsed) : null,
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
            qualityScore: Number(finalRec.priorityScore) || 0,
            conversionProbability: Number(finalRec.conversionProbability) || 0,
            estimatedValue: Number(finalRec.estimatedDealValue) || 0,
            priorityTier: finalRec.priorityTier,
            financialHealth: financeStep?.output.financial_health_score ? Number(financeStep.output.financial_health_score) : null,
            messagingFit: marketingStep?.output.messaging_fit_score ? Number(marketingStep.output.messaging_fit_score) : null,
            strategicAlignment: Number(finalRec.strategicAlignmentScore) || 0,
            recommendedAction: finalRec.recommendedAction,
            reasoning: finalRec.reasoning,
          })
          .onConflictDoUpdate({
            target: leadScores.leadId,
            set: {
              qualityScore: Number(finalRec.priorityScore) || 0,
              conversionProbability: Number(finalRec.conversionProbability) || 0,
              estimatedValue: Number(finalRec.estimatedDealValue) || 0,
              priorityTier: finalRec.priorityTier,
              financialHealth: financeStep?.output.financial_health_score ? Number(financeStep.output.financial_health_score) : null,
              messagingFit: marketingStep?.output.messaging_fit_score ? Number(marketingStep.output.messaging_fit_score) : null,
              strategicAlignment: Number(finalRec.strategicAlignmentScore) || 0,
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

        // Smart-merge extracted data — only fill empty/junk fields, preserve scraper data
        const extractorOutput = steps[0].output;
        const [current] = await db
          .select()
          .from(leads)
          .where(eq(leads.id, leadId))
          .limit(1);

        if (current) {
          const updateData: Record<string, unknown> = {};

          // Name: only update if current is empty, junk, or looks like JSON
          const sanitisedName = sanitizeName(extractorOutput.name);
          if (!current.name || isJsonOrJunk(current.name)) {
            if (sanitisedName) updateData.name = sanitisedName;
          }

          // Category: only update if current is empty
          if (!current.category && extractorOutput.category) {
            updateData.category = extractorOutput.category;
          }

          // Emails: MERGE — don't discard scraper emails
          const scrapedEmails = (current.emails as string[]) || [];
          const aiEmail = extractorOutput.contact_info?.email;
          if (aiEmail && !scrapedEmails.includes(aiEmail)) {
            updateData.emails = [...scrapedEmails, aiEmail];
          }

          // Phone: only update if current is empty
          if (!current.phone && extractorOutput.contact_info?.phone) {
            updateData.phone = extractorOutput.contact_info.phone;
          }

          if (Object.keys(updateData).length > 0) {
            await db
              .update(leads)
              .set(updateData)
              .where(eq(leads.id, leadId));
            console.log(`[OrchestratedAI] Merged fields for lead ${leadId}:`, Object.keys(updateData));
          } else {
            console.log(`[OrchestratedAI] No merge needed for lead ${leadId} — scraper data is good`);
          }
        }

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
