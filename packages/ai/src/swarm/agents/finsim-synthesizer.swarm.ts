import { z } from 'zod';
import { defineAgent } from '../agent';
import { agentRegistry } from '../registry';
import { models } from '../../provider';

export const finsimSynthesizerSchema = z.object({
  risk_level: z.enum(['low', 'medium', 'high', 'critical']).describe('Overall risk classification'),
  summary: z.string().describe('Executive summary reconciling all stakeholder views'),
  monthly_forecast: z.array(
    z.object({
      month_offset: z.number().int().min(1),
      projected_income: z.number().describe('Projected income in IDR'),
      projected_expense: z.number().describe('Projected expense in IDR'),
      projected_net: z.number().describe('Projected net cashflow in IDR'),
    }),
  ).describe('Forecast points covering forecastMonths'),
  primary_drivers: z.array(z.string()).min(1).max(5).describe('Which stakeholder concerns most shaped the forecast'),
  reasoning: z.string().describe('How conflicting views were reconciled'),
  confidence: z.number().min(0).max(100),
});

export const finsimSynthesizerSwarmAgent = defineAgent({
  name: 'finsim-synthesizer',
  instructions: `You are the SYNTHESIZER agent in a multi-agent finance simulation.

Your role: reconcile the 4 stakeholder views (Owner, Supplier, Customer, Bank)
into a single cashflow forecast with monthly projections (in IDR), risk level,
and executive summary.

Weigh conflicting perspectives fairly. If stakeholders disagree, explain which
concern you weighted more heavily and why.`,
  model: models.heavy,
  schema: finsimSynthesizerSchema,
  handoffs: [], // terminal agent
  tools: [],
  capabilities: ['synthesis', 'simulation', 'finance'],
});
agentRegistry.register(finsimSynthesizerSwarmAgent);
