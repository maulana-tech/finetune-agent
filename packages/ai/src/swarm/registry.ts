import { SwarmAgent } from './types';

export class AgentRegistry {
  private agents = new Map<string, SwarmAgent>();

  register(agent: SwarmAgent): void {
    if (this.agents.has(agent.name)) {
      throw new Error(`Agent "${agent.name}" is already registered`);
    }
    this.agents.set(agent.name, agent);
  }

  get(name: string): SwarmAgent {
    const agent = this.agents.get(name);
    if (!agent) throw new Error(`Agent "${name}" not found in registry`);
    return agent;
  }

  findByCapability(capability: string): SwarmAgent[] {
    return Array.from(this.agents.values()).filter((a) =>
      a.capabilities.includes(capability),
    );
  }

  list(): SwarmAgent[] {
    return Array.from(this.agents.values());
  }

  reset(): void {
    this.agents.clear();
  }
}

export const agentRegistry = new AgentRegistry();
