import { z } from 'zod';
import { defineAgent } from '../agent';
import { agentRegistry } from '../registry';
import { models } from '../../provider';

export const extractorSwarmSchema = z.object({
  name: z.string().describe('Name of the business'),
  category: z.string().describe('Primary business category/industry'),
  services: z.array(z.string()).describe('List of services offered'),
  contact_info: z.object({
    email: z.string().optional(),
    phone: z.string().optional(),
  }),
  summary: z.string().describe('A 1-sentence summary of the business'),
  reasoning: z.string().describe('Why these fields were extracted this way'),
  confidence: z.number().min(0).max(100).describe('Confidence in extraction quality'),
});

export const extractorSwarmAgent = defineAgent({
  name: 'extractor',
  instructions: `You are a data extraction specialist. Extract structured business information from raw scraper text.

CRITICAL RULES:
1. Be precise - only extract what is explicitly stated
2. If data is missing, omit the field rather than guessing
3. Rate confidence based on data quality (clear text = high, sparse/vague = low)`,
  model: models.fast,
  schema: extractorSwarmSchema,
  handoffs: [
    { agentName: 'coordinator', description: 'Routing coordinator that decides next steps' },
  ],
  tools: [],
  capabilities: ['extraction', 'parsing'],
});

agentRegistry.register(extractorSwarmAgent);
