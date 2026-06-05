/**
 * Quick test: Verify Indonesian responses work
 * Usage: cd /Users/em/web/finetune-agent && set -a && source .env && set +a && npx tsx packages/ai/src/test-response.ts
 */

const NVIDIA_KEY = process.env.NVIDIA_API_KEY || '';
const SUMOPOD_KEY = process.env.SUMOPOD_API_KEY || '';
const GOOGLE_KEY = process.env.GOOGLE_API_KEY || '';

const PROMPT = `Buat cold email 30 kata untuk Klinik Gigi Sehat. Produk: CRM. Bahasa Indonesia.`;

async function testModel(name: string, baseUrl: string, apiKey: string, modelId: string) {
  const start = Date.now();
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: 'user', content: PROMPT }],
        max_tokens: 150,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.log(`  ${name}: ✗ HTTP ${res.status} - ${err.slice(0, 80)}`);
      return;
    }

    const data = await res.json();
    const elapsed = Date.now() - start;
    const text = data.choices?.[0]?.message?.content || '';
    const tokens = data.usage?.completion_tokens || 0;
    
    console.log(`  ${name}: ✓ ${elapsed}ms, ${tokens} tokens`);
    console.log(`  Output: ${text.slice(0, 200)}`);
    console.log('');
  } catch (err: any) {
    console.log(`  ${name}: ✗ ${err.message?.slice(0, 100)}`);
  }
}

async function main() {
  console.log('🧪 Test Respons Bahasa Indonesia\n');

  // Test NVIDIA
  console.log('NVIDIA:');
  await testModel('llama-8b', 'https://integrate.api.nvidia.com/v1', NVIDIA_KEY, 'meta/llama-3.1-8b-instruct');

  // Test SumoPod
  console.log('SumoPod:');
  await testModel('gpt-4o-mini', 'https://ai.sumopod.com/v1', SUMOPOD_KEY, 'gpt-4o-mini');

  // Test Google
  console.log('Google:');
  await testModel('gemini-2.0-flash', 'https://generativelanguage.googleapis.com/v1beta/openai', GOOGLE_KEY, 'models/gemini-2.0-flash');
}

main().catch(console.error);
