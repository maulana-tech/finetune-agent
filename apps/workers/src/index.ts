import { startScrapeWorker } from './queues/scrape.worker';
import { startAiWorker } from './queues/ai.worker';
import { startOrchestratedAiWorker } from './queues/orchestrated-ai.worker';

console.log("Starting BullMQ Workers...");
startScrapeWorker();
startAiWorker(); // Legacy - kept for backward compatibility
startOrchestratedAiWorker(); // New multi-agent orchestrated workflow
