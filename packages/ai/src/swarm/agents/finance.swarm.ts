import { z } from 'zod';
import { defineAgent } from '../agent';
import { agentRegistry } from '../registry';
import { models } from '../../provider';

export const financeSwarmSchema = z.object({
  estimated_revenue_range: z.string().describe('e.g. $10k - $50k / month'),
  company_size: z.enum(['micro', 'small', 'medium', 'large']),
  budget_probability: z.number().min(0).max(100).describe('Probability they have budget for B2B tools'),
  financial_health_score: z.number().min(0).max(100).describe('Overall financial health score'),
  reasoning: z.string().describe('Analytical reasoning for financial estimates'),
  confidence: z.number().min(0).max(100),
});

export const financeSwarmAgent = defineAgent({
  name: 'finance',
  instructions: `You are a financial analyst specializing in B2B lead qualification.

Estimate the business's financial health and capacity to purchase B2B tools.
Use strictly clinical and analytical tone.
Base estimates on tangible signals (company size, category, services offered).`,
  model: models.standard,
  schema: financeSwarmSchema,
  handoffs: [
    { agentName: 'coordinator', description: 'Routing coordinator that decides next steps' },
  ],
  tools: [],
  capabilities: ['analysis', 'financial-scoring'],
});

agentRegistry.register(financeSwarmAgent);
