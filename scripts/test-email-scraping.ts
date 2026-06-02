/**
 * Test email scraping functionality
 * Run: pnpm dotenv -e .env -- tsx scripts/test-email-scraping.ts
 */

import { spawn } from 'child_process';
import path from 'path';

async function testEmailScraping() {
  console.log('🧪 Testing Email Scraping from Maps Scraper\n');

  // Test with a query that should return businesses with websites
  const query = 'coffee shop jakarta';
  const limit = 3;

  console.log(`Query: "${query}"`);
  console.log(`Limit: ${limit}\n`);

  const scriptPath = path.resolve(__dirname, '../apps/workers/src/python/maps_scraper.py');
  const pythonExec = path.resolve(__dirname, '../apps/workers/.venv/bin/python');

  console.log(`Python: ${pythonExec}`);
  console.log(`Script: ${scriptPath}\n`);

  const proc = spawn(pythonExec, [scriptPath, query, String(limit)]);

  let stdout = '';
  let stderr = '';

  proc.stdout.on('data', (chunk: Buffer) => {
    stdout += chunk.toString();
  });

  proc.stderr.on('data', (chunk: Buffer) => {
    stderr += chunk.toString();
  });

  proc.on('close', (code) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (code !== 0) {
      console.error('❌ Scraper failed!');
      console.error('Exit code:', code);
      console.error('\nStderr:');
      console.error(stderr);
      process.exit(1);
    }

    try {
      const results = JSON.parse(stdout);
      console.log(`✅ Successfully scraped ${results.length} results\n`);

      results.forEach((result: any, index: number) => {
        console.log(`${index + 1}. ${result.name}`);
        console.log(`   Address: ${result.address || 'N/A'}`);
        console.log(`   Phone: ${result.phone || 'N/A'}`);
        console.log(`   Website: ${result.website || 'N/A'}`);

        if (result.emails && result.emails.length > 0) {
          console.log(`   📧 Emails: ${result.emails.join(', ')}`);
        } else {
          console.log(`   📧 Emails: None found`);
        }

        console.log(`   Maps URL: ${result.maps_url || 'N/A'}`);
        console.log(`   Coordinates: ${result.lat || 'N/A'}, ${result.lng || 'N/A'}`);
        console.log('');
      });

      // Statistics
      const withWebsite = results.filter((r: any) => r.website).length;
      const withEmails = results.filter((r: any) => r.emails && r.emails.length > 0).length;
      const totalEmails = results.reduce((sum: number, r: any) => sum + (r.emails?.length || 0), 0);

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 Statistics:');
      console.log(`   Total results: ${results.length}`);
      console.log(`   With website: ${withWebsite} (${((withWebsite / results.length) * 100).toFixed(1)}%)`);
      console.log(`   With emails: ${withEmails} (${((withEmails / results.length) * 100).toFixed(1)}%)`);
      console.log(`   Total emails found: ${totalEmails}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      if (withEmails === 0) {
        console.log('⚠️  No emails found. This could be because:');
        console.log('   1. Businesses don\'t have public contact pages');
        console.log('   2. Websites don\'t display emails prominently');
        console.log('   3. Email scraping function needs improvement');
        console.log('   4. Rate limiting or website blocking\n');
      } else {
        console.log('✅ Email scraping is working!\n');
      }

      process.exit(0);
    } catch (err: any) {
      console.error('❌ Failed to parse scraper output');
      console.error('Error:', err.message);
      console.error('\nRaw stdout:');
      console.error(stdout.slice(0, 500));
      process.exit(1);
    }
  });
}

testEmailScraping();
