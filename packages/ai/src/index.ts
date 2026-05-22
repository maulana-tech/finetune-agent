export * from './provider';
export * from './types';
export * from './orchestrator';
export * from './agents/extractor';
export * from './agents/finance';
export * from './agents/marketing';
export * from './agents/strategy';

// Finance Simulation Multi-Agent System (Owner/Supplier/Customer/Bank + Synthesizer)
export * from './finance-orchestrator';
export { ownerAgent } from './agents/finance-sim/owner';
export { supplierAgent } from './agents/finance-sim/supplier';
export { customerAgent } from './agents/finance-sim/customer';
export { bankAgent } from './agents/finance-sim/bank';
export { synthesizerAgent } from './agents/finance-sim/synthesizer';

// Market Analysis Multi-Agent System (Competitor/Trend/Risk/Demand + Synthesizer)
export * from './market-orchestrator';
export { competitorAgent } from './agents/market-sim/competitor';
export { trendAgent } from './agents/market-sim/trend';
export { riskAgent } from './agents/market-sim/risk';
export { demandAgent } from './agents/market-sim/demand';
export { marketSynthesizerAgent } from './agents/market-sim/synthesizer';

// SQL search agent (natural-language → SQL for leads table)
export { generateLeadsSearchSql } from './agents/sql-search';

// Swarm AI Agent System (v2 — replaces old orchestrators)
export * from './swarm';
export { runLeadScoringSwarm } from './swarm/workflows/lead-scoring.workflow';
export { runFinanceSimulationSwarm } from './swarm/workflows/finance-simulation.workflow';
export { runMarketAnalysisSwarm } from './swarm/workflows/market-analysis.workflow';
