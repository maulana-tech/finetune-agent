import { z } from 'zod';

/**
 * Shared context that flows between agents in the orchestration pipeline
 */
export interface AgentContext {
  executionId: string;
  leadId: string;
  workspaceId: string;
  stepNumber: number;

  // Accumulated data from previous agents
  extractedData?: {
    name: string;
    category: string;
    services: string[];
    contact_info: { email?: string; phone?: string };
    summary: string;
  };

  financialAnalysis?: {
    estimated_revenue_range: string;
    company_size: 'micro' | 'small' | 'medium' | 'large';
    budget_probability: number;
    reasoning: string;
  };

  marketingInsights?: {
    targetPersona: string;
    painPoints: string[];
    messagingAngle: string;
    coldEmailDraft: string;
    reasoning: string;
  };

  strategicRecommendation?: {
    priorityScore: number; // 0-100
    conversionProbability: number; // 0.0 - 1.0
    recommendedAction: 'immediate_outreach' | 'nurture' | 'disqualify';
    reasoning: string;
  };
}

/**
 * Standard agent response with reasoning transparency
 */
export interface AgentResponse<T = any> {
  output: T;
  reasoning: string; // explicit chain-of-thought
  confidence: number; // 0-100
  contextToShare: Record<string, any>; // what to pass to next agent
  durationMs: number;
  tokensUsed?: number;
}

/**
 * Zod schemas for agent outputs (for structured generation)
 */
export const ExtractorOutputSchema = z.object({
  name: z.string().describe('Name of the business'),
  category: z.string().describe('Primary business category/industry'),
  services: z.array(z.string()).describe('List of services offered'),
  contact_info: z.object({
    email: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
  }),
  summary: z.string().describe('A 1 sentence summary of the business'),
  reasoning: z.string().describe('Why these fields were extracted this way'),
  confidence: z.number().min(0).max(100).describe('Confidence in extraction quality'),
});

export const FinanceOutputSchema = z.object({
  estimated_revenue_range: z.string().describe('e.g. $10k - $50k / month'),
  company_size: z.enum(['micro', 'small', 'medium', 'large']),
  budget_probability: z.number().min(0).max(100).describe('Probability they have budget for B2B tools'),
  financial_health_score: z.number().min(0).max(100).describe('Overall financial health score'),
  reasoning: z.string().describe('Analytical reasoning for financial estimates. Clinical tone.'),
  confidence: z.number().min(0).max(100),
});

export const MarketingOutputSchema = z.object({
  target_persona: z.string().describe('Who would buy from this business'),
  pain_points: z.array(z.string()).describe('Top 3 pain points we can solve'),
  messaging_angle: z.string().describe('How to position our product to them'),
  messaging_fit_score: z.number().min(0).max(100).describe('How well our product fits their needs'),
  reasoning: z.string().describe('Why this messaging approach. No buzzwords.'),
  confidence: z.number().min(0).max(100),
});

export const StrategyOutputSchema = z.object({
  priority_score: z.number().min(0).max(100).describe('Overall lead quality score'),
  conversion_probability: z.number().min(0).max(1).describe('Probability of conversion (0.0 - 1.0)'),
  estimated_deal_value: z.number().describe('Predicted deal size in USD'),
  priority_tier: z.enum(['A', 'B', 'C', 'D']).describe('A=hot lead, D=disqualify'),
  recommended_action: z.enum(['immediate_outreach', 'nurture', 'disqualify']),
  strategic_alignment_score: z.number().min(0).max(100).describe('How well this lead aligns with our ICP'),
  reasoning: z.string().describe('Strategic synthesis across all agents. Why this recommendation?'),
  confidence: z.number().min(0).max(100),
});

/* =============================================================
   Finance Simulation Multi-Agent System
   -------------------------------------------------------------
   Stakeholder agents (Owner, Supplier, Customer, Bank) each
   produce an INDEPENDENT view of the same scenario. They run in
   parallel. The Synthesizer then merges their perspectives into
   a unified cashflow forecast and risk assessment.

   This differs from the lead-scoring pipeline (sequential,
   context-passing) because finance perspectives benefit from
   independent reasoning before reconciliation.
   ============================================================= */

/** Scenario knobs the user adjusts (mirrors fiswarm's 4 sliders) */
export const FinanceScenarioSchema = z.object({
  price_change_pct: z
    .number()
    .min(-30)
    .max(50)
    .describe('Price change percent applied to revenue lines'),
  hiring_delta: z
    .number()
    .int()
    .min(0)
    .max(10)
    .describe('Number of employees added (each adds payroll cost)'),
  inventory_budget_monthly: z
    .number()
    .min(0)
    .describe('Monthly inventory / raw material budget in IDR'),
  market_growth_pct: z
    .number()
    .min(-20)
    .max(30)
    .describe('Expected market growth percent over forecast window'),
});
export type FinanceScenario = z.infer<typeof FinanceScenarioSchema>;

/** Summary of recent transaction history used as the seed */
export interface FinanceDataSeed {
  monthsCovered: number;
  totalIncome: number;
  totalExpense: number;
  averageMonthlyIncome: number;
  averageMonthlyExpense: number;
  topIncomeCategories: { category: string; total: number }[];
  topExpenseCategories: { category: string; total: number }[];
  transactionCount: number;
}

/** Shared context fed to every finance-sim agent */
export interface FinanceSimulationContext {
  executionId: string;
  simulationId: string;
  workspaceId: string;
  scenario: FinanceScenario;
  forecastMonths: number;
  seed: FinanceDataSeed;
}

/** Stakeholder output — shared structure across the 4 stakeholder agents */
const stakeholderBase = {
  outlook: z
    .enum(['negative', 'neutral', 'positive'])
    .describe('This stakeholder’s overall outlook under the scenario'),
  monthly_impact_pct: z
    .number()
    .describe(
      'Estimated percent change to monthly net cashflow attributable to this stakeholder lens (e.g. +12 means +12% net per month)'
    ),
  key_risks: z
    .array(z.string())
    .min(1)
    .max(5)
    .describe('Top concrete risks identified from this perspective'),
  key_opportunities: z
    .array(z.string())
    .min(1)
    .max(5)
    .describe('Top concrete opportunities from this perspective'),
  reasoning: z
    .string()
    .describe('Analytical reasoning, 2-4 sentences, clinical tone, no buzzwords'),
  confidence: z.number().min(0).max(100),
};

export const OwnerOutputSchema = z.object({
  ...stakeholderBase,
  recommended_action: z
    .string()
    .describe('Top recommended action the owner should take given the scenario'),
});

export const SupplierOutputSchema = z.object({
  ...stakeholderBase,
  expected_lead_time_change: z
    .string()
    .describe('Expected change in supplier lead time, e.g. "+2 weeks" or "no change"'),
  cost_pressure: z
    .enum(['low', 'medium', 'high'])
    .describe('Upstream cost pressure on raw materials / inputs'),
});

export const CustomerOutputSchema = z.object({
  ...stakeholderBase,
  price_sensitivity: z
    .enum(['low', 'medium', 'high'])
    .describe('Expected customer price sensitivity to scenario changes'),
  demand_change_pct: z
    .number()
    .describe('Expected percent change in demand under this scenario'),
});

export const BankOutputSchema = z.object({
  ...stakeholderBase,
  runway_months_estimate: z
    .number()
    .describe('Estimated number of months of runway under the scenario'),
  credit_recommendation: z
    .enum(['no_action', 'open_credit_line', 'restructure_debt', 'urgent_intervention'])
    .describe('Bank-side recommendation regarding credit'),
});

/** Synthesizer aggregates the 4 stakeholder views into a final forecast */
export const SynthesizerOutputSchema = z.object({
  risk_level: z
    .enum(['low', 'medium', 'high', 'critical'])
    .describe('Overall risk classification for the scenario'),
  summary: z
    .string()
    .describe(
      'One-paragraph executive summary that reconciles all 4 stakeholder views'
    ),
  monthly_forecast: z
    .array(
      z.object({
        month_offset: z.number().int().min(1).describe('1 = first month after now'),
        projected_income: z.number().describe('Projected income in IDR'),
        projected_expense: z.number().describe('Projected expense in IDR'),
        projected_net: z.number().describe('Projected net cashflow in IDR'),
      })
    )
    .describe('Forecast points covering forecastMonths'),
  primary_drivers: z
    .array(z.string())
    .min(1)
    .max(5)
    .describe('Which stakeholder concerns most shaped the final forecast'),
  reasoning: z
    .string()
    .describe(
      'How the synthesizer reconciled conflicting stakeholder views. 3-5 sentences.'
    ),
  confidence: z.number().min(0).max(100),
});

export type OwnerOutput = z.infer<typeof OwnerOutputSchema>;
export type SupplierOutput = z.infer<typeof SupplierOutputSchema>;
export type CustomerOutput = z.infer<typeof CustomerOutputSchema>;
export type BankOutput = z.infer<typeof BankOutputSchema>;
export type SynthesizerOutput = z.infer<typeof SynthesizerOutputSchema>;

/* =============================================================
   Market Analysis Multi-Agent System
   -------------------------------------------------------------
   4 perspective agents (Competitor, Trend, Risk, Demand) run in
   parallel over the same market data seed, then a Synthesizer
   reconciles their views into an opportunity score and
   positioning recommendation.

   Topology mirrors the finance-simulation pipeline.
   ============================================================= */

export const MarketScenarioSchema = z.object({
  industry: z.string().describe('Industry / vertical of the workspace business'),
  region: z.string().describe('Geographic region of interest'),
  target_segment: z
    .string()
    .describe('Customer segment being analysed (e.g. "UMKM coffee shops, Jakarta CBD")'),
  competitor_focus: z
    .enum(['pricing', 'product', 'positioning', 'all'])
    .describe('Which competitor dimension to weight heaviest'),
  time_horizon_months: z
    .number()
    .int()
    .min(1)
    .max(24)
    .describe('Forecast horizon in months for the synthesised view'),
});
export type MarketScenario = z.infer<typeof MarketScenarioSchema>;

/** Compact summary of available market_data records fed to each agent. */
export interface MarketSeed {
  totalRecords: number;
  competitorCount: number;
  pricingSignalCount: number;
  industryNewsCount: number;
  trendSignalCount: number;
  demandSignalCount: number;
  topCompetitors: { name: string; category: string; signal?: string }[];
  recentHeadlines: { title: string; source: string }[];
  regions: string[];
}

export interface MarketAnalysisContext {
  executionId: string;
  marketAnalysisId: string;
  workspaceId: string;
  scenario: MarketScenario;
  seed: MarketSeed;
}

/** Shared structure across the 4 perspective agents */
const marketStakeholderBase = {
  outlook: z
    .enum(['negative', 'neutral', 'positive'])
    .describe('Overall outlook for the scenario from this lens'),
  signal_strength: z
    .number()
    .min(0)
    .max(100)
    .describe('How strongly the data supports this lens\'s conclusion'),
  key_findings: z
    .array(z.string())
    .min(1)
    .max(5)
    .describe('Top concrete observations from this perspective'),
  reasoning: z
    .string()
    .describe('Analytical reasoning, 2-4 sentences, clinical tone, no buzzwords'),
  confidence: z.number().min(0).max(100),
};

export const CompetitorOutputSchema = z.object({
  ...marketStakeholderBase,
  competitive_intensity: z.enum(['low', 'medium', 'high']),
  price_position: z
    .enum(['budget', 'mid-market', 'premium'])
    .describe('Where competitors sit in pricing landscape'),
  differentiation_gaps: z
    .array(z.string())
    .min(1)
    .max(5)
    .describe('Underserved positions our workspace could occupy'),
});

export const TrendOutputSchema = z.object({
  ...marketStakeholderBase,
  trend_direction: z
    .enum(['declining', 'flat', 'growing', 'accelerating'])
    .describe('Direction of the industry / category'),
  trend_drivers: z
    .array(z.string())
    .min(1)
    .max(5)
    .describe('What is causing the trend'),
});

export const RiskOutputSchema = z.object({
  ...marketStakeholderBase,
  regulatory_risk: z.enum(['low', 'medium', 'high']),
  macro_risk: z.enum(['low', 'medium', 'high']),
  supply_chain_risk: z.enum(['low', 'medium', 'high']),
  mitigations: z
    .array(z.string())
    .min(1)
    .max(5)
    .describe('Concrete mitigations the workspace could adopt'),
});

export const DemandOutputSchema = z.object({
  ...marketStakeholderBase,
  demand_trajectory: z
    .enum(['shrinking', 'stable', 'growing'])
    .describe('Volume direction in target segment'),
  willingness_to_pay: z
    .enum(['weak', 'moderate', 'strong'])
    .describe('Customer willingness to pay in this segment'),
  buying_triggers: z
    .array(z.string())
    .min(1)
    .max(5)
    .describe('What pushes target customers to buy'),
});

export const MarketSynthesizerOutputSchema = z.object({
  risk_level: z
    .enum(['low', 'medium', 'high', 'critical'])
    .describe('Overall risk classification for entering / staying in this market'),
  opportunity_score: z
    .number()
    .min(0)
    .max(100)
    .describe('Aggregated opportunity score 0-100'),
  positioning_recommendation: z
    .string()
    .describe('One-sentence positioning recommendation for the workspace'),
  summary: z
    .string()
    .describe('Executive summary, 1 paragraph, reconciling the 4 lenses'),
  top_opportunities: z.array(z.string()).min(1).max(5),
  top_threats: z.array(z.string()).min(1).max(5),
  primary_drivers: z
    .array(z.string())
    .min(1)
    .max(5)
    .describe('Which stakeholder concerns most shaped the conclusion'),
  reasoning: z
    .string()
    .describe('How the synthesizer reconciled conflicting views. 3-5 sentences.'),
  confidence: z.number().min(0).max(100),
});

export type CompetitorOutput = z.infer<typeof CompetitorOutputSchema>;
export type TrendOutput = z.infer<typeof TrendOutputSchema>;
export type RiskOutput = z.infer<typeof RiskOutputSchema>;
export type DemandOutput = z.infer<typeof DemandOutputSchema>;
export type MarketSynthesizerOutput = z.infer<typeof MarketSynthesizerOutputSchema>;
