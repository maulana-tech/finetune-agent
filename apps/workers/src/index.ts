import { startScrapeWorker } from './queues/scrape.worker';
import { startAiWorker } from './queues/ai.worker';
import { startOrchestratedAiWorker } from './queues/orchestrated-ai.worker';
import { startFinanceSimulationWorker } from './queues/finance-simulation.worker';
import { startMarketAnalysisWorker } from './queues/market-analysis.worker';
import { startMarketScrapeWorker } from './queues/market-scrape.worker';

console.log("Starting BullMQ Workers...");
startScrapeWorker();
startAiWorker(); // Legacy - kept for backward compatibility
startOrchestratedAiWorker(); // Lead-scoring multi-agent (Extractor → Finance → Marketing → Strategy)
startFinanceSimulationWorker(); // Finance simulation multi-agent (Owner/Supplier/Customer/Bank ∥ → Synthesizer)
startMarketAnalysisWorker(); // Market analysis multi-agent (Competitor/Trend/Risk/Demand ∥ → Synthesizer)
startMarketScrapeWorker(); // Python scraper for competitor + trend + demand signals
