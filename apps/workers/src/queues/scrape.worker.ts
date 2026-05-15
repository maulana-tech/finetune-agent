import { Worker, Queue } from 'bullmq';
import { spawn } from 'child_process';
import path from 'path';
import { db, leads } from '@repo/db';

const aiQueue = new Queue('ai-agent-queue', {
  connection: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  }
});

const orchestratedAiQueue = new Queue('orchestrated-ai-queue', {
  connection: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  }
});

export const startScrapeWorker = () => {
  const worker = new Worker('scrape-map', async job => {
    const { query, limit, workspaceId } = job.data;
    
    const rawResults = await new Promise<any[]>((resolve, reject) => {
      const pythonScript = path.resolve(__dirname, '../python/maps_scraper.py');
      const pythonExec = path.resolve(__dirname, '../../.venv/bin/python');
      
      const process = spawn(pythonExec, [pythonScript, query, String(limit)]);
      
      let data = '';
      let error = '';
      
      process.stdout.on('data', chunk => { data += chunk.toString(); });
      process.stderr.on('data', chunk => { error += chunk.toString(); });
      
      process.on('close', code => {
        if (code !== 0) {
          console.error(`Python script failed: ${error}`);
          return reject(new Error(`Python script failed with code ${code}`));
        }
        
        try {
          const results = JSON.parse(data);
          resolve(results);
        } catch (e) {
          reject(new Error(`Failed to parse Python output: ${data}`));
        }
      });
    });

    console.log(`Scraped ${rawResults.length} leads for query: ${query}`);

    for (const res of rawResults) {
      // Save to database
      const [newLead] = await db.insert(leads).values({
        workspaceId,
        name: res.name,
        address: res.address,
        phone: res.phone,
        website: res.website,
        lat: res.lat,
        lng: res.lng,
        category: res.category || query,
      }).returning();

      // Trigger ORCHESTRATED multi-agent workflow for each lead
      await orchestratedAiQueue.add('orchestrated-workflow', {
        leadId: newLead.id,
        workspaceId,
        rawText: JSON.stringify(res),
        ourProduct: 'B2B business finder and CRM platform', // TODO: get from workspace.businessContext
      });

      console.log(`Queued orchestrated AI workflow for lead: ${newLead.id}`);
    }

    return { count: rawResults.length };
  }, {
    connection: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    }
  });

  worker.on('completed', job => {
    console.log(`${job.id} has completed!`);
  });

  worker.on('failed', (job, err) => {
    console.log(`${job?.id} has failed with ${err.message}`);
  });
};
