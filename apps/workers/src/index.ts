import { startScrapeWorker } from './queues/scrape.worker';
import { startAiWorker } from './queues/ai.worker';
import { startOrchestratedAiWorker } from './queues/orchestrated-ai.worker';
import { startFinanceSimulationWorker } from './queues/finance-simulation.worker';
import { startMarketAnalysisWorker } from './queues/market-analysis.worker';
import { startMarketScrapeWorker } from './queues/market-scrape.worker';
import { startScrapeScheduler } from './cron/scrape-scheduler';
import { run as startEmailScheduler } from './cron/email-scheduler';

console.log('Starting BullMQ Workers...');
startScrapeWorker();
startAiWorker(); // Legacy — kept for backward compat
startOrchestratedAiWorker();
startFinanceSimulationWorker();
startMarketAnalysisWorker();
startMarketScrapeWorker();
startScrapeScheduler();
startEmailScheduler();
