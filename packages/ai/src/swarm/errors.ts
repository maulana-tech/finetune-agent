export class SwarmError extends Error {
  constructor(message: string) {
    super(`[Swarm] ${message}`);
    this.name = 'SwarmError';
  }
}

export class AgentNotFoundError extends SwarmError {
  constructor(agentName: string) {
    super(`Agent "${agentName}" not found`);
    this.name = 'AgentNotFoundError';
  }
}

export class MaxIterationsError extends SwarmError {
  constructor(agentName: string, max: number) {
    super(`Agent "${agentName}" reached max iterations (${max})`);
    this.name = 'MaxIterationsError';
  }
}
