/**
 * Benchmark: Compare model speed for generating outreach drafts
 * Usage: cd /Users/em/web/finetune-agent && export \$(grep -v '^#' .env | xargs) && npx tsx packages/ai/src/benchmark.ts
 */

const API_KEY = process.env.NVIDIA_API_KEY || '';
const SUMOPOD_KEY = process.env.SUMOPOD_API_KEY || '';

// Models to test
const MODELS: { name: string; modelId: string; provider: 'nvidia' | 'sumopod' }[] = [
  // NVIDIA
  { name: 'llama-3.2-3b (nvidia)', modelId: 'meta/llama-3.2-3b-instruct', provider: 'nvidia' },
  { name: 'llama-8b (nvidia)', modelId: 'meta/llama-3.1-8b-instruct', provider: 'nvidia' },
  // SumoPod
  { name: 'gpt-4o-mini (sumopod)', modelId: 'gpt-4o-mini', provider: 'sumopod' },
  { name: 'gemma-4-31b (sumopod)', modelId: 'gemma-4-31b-it', provider: 'sumopod' },
];

const PROMPT = `Buat cold email 50 kata untuk Klinik Gigi Sehat Jakarta. Produk: CRM klinik gigi. Bahasa Indonesia.`;

async function callModel(modelId: string, prompt: string, provider: 'nvidia' | 'sumopod'): Promise<{ text: string; tokens: number; elapsed: number }> {
  const start = Date.now();
  const apiKey = provider === 'sumopod' ? SUMOPOD_KEY : API_KEY;
  const baseUrl = provider === 'sumopod' ? 'https://ai.sumopod.com/v1' : 'https://integrate.api.nvidia.com/v1';
  
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      model: modelId,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HTTP ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const elapsed = Date.now() - start;
  const text = data.choices?.[0]?.message?.content || '';
  const tokens = data.usage?.completion_tokens || 0;

  return { text, tokens, elapsed };
}

async function benchmarkOne(m: typeof MODELS[0]) {
  try {
    const { text, tokens, elapsed } = await callModel(m.modelId, PROMPT, m.provider);
    const tokensPerSec = (tokens / (elapsed / 1000)).toFixed(1);

    return {
      name: m.name,
      elapsed,
      tokens,
      tokensPerSec,
      output: text.slice(0, 250),
      success: true,
    };
  } catch (err: any) {
    return {
      name: m.name,
      elapsed: 0,
      tokens: 0,
      tokensPerSec: '0',
      output: `ERROR: ${err.message?.slice(0, 200)}`,
      success: false,
    };
  }
}

async function main() {
  console.log('🔥 Outreach Draft Benchmark');
  console.log('━'.repeat(60));
  console.log(`Models: ${MODELS.length}`);
  console.log(`Prompt: Cold outreach email (dental clinic CRM)`);
  console.log('━'.repeat(60));

  // Run sequentially to avoid rate limits
  const results = [];
  for (const m of MODELS) {
    process.stdout.write(`Testing ${m.name}...`);
    const r = await benchmarkOne(m);
    results.push(r);
    console.log(` ${r.elapsed}ms ${r.success ? '✓' : '✗'} ${r.success ? '' : r.output.slice(0, 80)}`);
  }

  console.log('\n📊 Results (sorted by speed):\n');
  console.log(`${'Rank'.padEnd(5)} ${'Model'.padEnd(20)} ${'Time'.padEnd(10)} ${'Tok/s'.padEnd(8)} ${'Tokens'.padEnd(8)} Status`);
  console.log('─'.repeat(65));

  results.forEach((r, i) => {
    const rank = `${i + 1}.`.padEnd(5);
    const name = r.name.padEnd(20);
    const time = `${r.elapsed}ms`.padEnd(10);
    const tps = `${r.tokensPerSec}`.padEnd(8);
    const tok = `${r.tokens}`.padEnd(8);
    const status = r.success ? '✓' : '✗';
    console.log(`${rank} ${name} ${time} ${tps} ${tok} ${status}`);
  });

  // Show best output
  console.log('\n📝 Best Output Sample:\n');
  const best = results.find(r => r.success);
  if (best) {
    console.log(`[${best.name}]`);
    console.log(best.output);
  }

  // Show winner
  console.log('\n🏆 Winner:\n');
  const winner = results.find(r => r.success);
  if (winner) {
    console.log(`  ${winner.name} (${winner.elapsed}ms, ${winner.tokensPerSec} tok/s)`);
  }
}

main().catch(console.error);
