import { v4 as uuidv4 } from 'uuid';
import { AgentContext, AgentResponse } from './types';
import { extractBusinessInfo } from './agents/extractor';
import { analyzeFinancials } from './agents/finance';
import { analyzeMarketing } from './agents/marketing';
import { strategicRecommendation } from './agents/strategy';

/**
 * Multi-Agent Orchestrator
 *
 * Coordinates the execution of all agents in sequence with context passing:
 * 1. Extractor → extracts structured data
 * 2. Finance → analyzes financial health (receives extractor context)
 * 3. Marketing → determines messaging fit (receives extractor + finance context)
 * 4. Strategy → synthesizes all agents and provides final recommendation
 *
 * Each agent:
 * - Receives context from previous agents
 * - Logs its reasoning and decision process
 * - Passes enriched context to the next agent
 */

export interface OrchestratorInput {
  leadId: string;
  workspaceId: string;
  rawText: string; // from scraper
  ourProduct: string; // workspace business context
}

export interface OrchestratorOutput {
  executionId: string;
  success: boolean;
  steps: {
    agentName: string;
    stepNumber: number;
    output: any;
    reasoning: string;
    confidence: number;
    durationMs: number;
    tokensUsed?: number;
    handoffFrom?: string;
    parallelGroup?: string;
  }[];
  finalRecommendation: {
    priorityScore: number;
    conversionProbability: number;
    estimatedDealValue: number;
    priorityTier: 'A' | 'B' | 'C' | 'D';
    recommendedAction: 'immediate_outreach' | 'nurture' | 'disqualify';
    strategicAlignmentScore: number;
    reasoning: string;
  };
  totalDurationMs: number;
  totalTokensUsed: number;
}

export async function runMultiAgentWorkflow(
  input: OrchestratorInput
): Promise<OrchestratorOutput> {
  const executionId = uuidv4();
  const startTime = Date.now();
  const steps: OrchestratorOutput['steps'] = [];

  // Initialize context
  const context: AgentContext = {
    executionId,
    leadId: input.leadId,
    workspaceId: input.workspaceId,
    stepNumber: 0,
  };

  console.log(`[Orchestrator] Starting execution ${executionId} for lead ${input.leadId}`);

  // Step 1: Extractor Agent
  console.log(`[Orchestrator] Step 1: Extractor Agent`);
  context.stepNumber = 1;
  const extractorResult = await extractBusinessInfo(input.rawText, context);

  steps.push({
    agentName: 'extractor',
    stepNumber: 1,
    output: extractorResult.output,
    reasoning: extractorResult.reasoning,
    confidence: extractorResult.confidence,
    durationMs: extractorResult.durationMs,
    tokensUsed: extractorResult.tokensUsed,
  });

  // Merge context
  context.extractedData = extractorResult.contextToShare.extractedData;

  // Step 2: Finance Agent
  console.log(`[Orchestrator] Step 2: Finance Agent (receives context from Extractor)`);
  context.stepNumber = 2;
  const financeResult = await analyzeFinancials(context);

  steps.push({
    agentName: 'finance',
    stepNumber: 2,
    output: financeResult.output,
    reasoning: financeResult.reasoning,
    confidence: financeResult.confidence,
    durationMs: financeResult.durationMs,
    tokensUsed: financeResult.tokensUsed,
  });

  // Merge context
  context.financialAnalysis = financeResult.contextToShare.financialAnalysis;

  // Step 3: Marketing Agent
  console.log(`[Orchestrator] Step 3: Marketing Agent (receives context from Extractor + Finance)`);
  context.stepNumber = 3;
  const marketingResult = await analyzeMarketing(context, input.ourProduct);

  steps.push({
    agentName: 'marketing',
    stepNumber: 3,
    output: marketingResult.output,
    reasoning: marketingResult.reasoning,
    confidence: marketingResult.confidence,
    durationMs: marketingResult.durationMs,
    tokensUsed: marketingResult.tokensUsed,
  });

  // Merge context
  context.marketingInsights = marketingResult.contextToShare.marketingInsights;

  // Step 4: Strategy Agent (Final Synthesis)
  console.log(`[Orchestrator] Step 4: Strategy Agent (synthesizes all agents)`);
  context.stepNumber = 4;
  const strategyResult = await strategicRecommendation(context);

  steps.push({
    agentName: 'strategy',
    stepNumber: 4,
    output: strategyResult.output,
    reasoning: strategyResult.reasoning,
    confidence: strategyResult.confidence,
    durationMs: strategyResult.durationMs,
    tokensUsed: strategyResult.tokensUsed,
  });

  const totalDurationMs = Date.now() - startTime;
  const totalTokensUsed = steps.reduce((sum, step) => sum + (step.tokensUsed || 0), 0);

  console.log(`[Orchestrator] Execution ${executionId} completed in ${totalDurationMs}ms`);
  console.log(`[Orchestrator] Total tokens used: ${totalTokensUsed}`);

  return {
    executionId,
    success: true,
    steps,
    finalRecommendation: {
      priorityScore: strategyResult.output.priority_score,
      conversionProbability: strategyResult.output.conversion_probability,
      estimatedDealValue: strategyResult.output.estimated_deal_value,
      priorityTier: strategyResult.output.priority_tier,
      recommendedAction: strategyResult.output.recommended_action,
      strategicAlignmentScore: strategyResult.output.strategic_alignment_score,
      reasoning: strategyResult.reasoning,
    },
    totalDurationMs,
    totalTokensUsed,
  };
}
