import { SwarmAgent } from './types';

export function defineAgent(config: SwarmAgent): SwarmAgent {
  return {
    maxIterations: 1,
    ...config,
  };
}
