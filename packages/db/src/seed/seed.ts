import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import * as schema from '../schema';
import type {
  NewTransaction,
  SimulationScenarioParams,
  CashflowForecastPoint,
} from '../schema';

/**
 * Demo seed for hackathon.
 *
 * Populates a single demo workspace with realistic UMKM-scale data:
 *   • 1 workspace (DEV_WORKSPACE_ID)
 *   • ~40 transactions over 6 months
 *   • ~12 leads scattered around Jakarta
 *   • 2 completed simulations with full agent_logs reasoning trace
 *
 * Re-running is idempotent — it wipes existing rows for the demo workspace
 * before inserting fresh ones.
 */

const WORKSPACE_ID = '00000000-0000-0000-0000-000000000000';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const db = drizzle(pool, { schema });

async function main() {
  console.log('🌱 Seeding demo workspace…');

  await ensureWorkspace();
  await clearExisting();
  await seedTransactions();
  await seedLeads();
  await seedSimulations();

  console.log('✅ Seed complete');
  await pool.end();
  process.exit(0);
}

/* =============================================================
   Workspace
   ============================================================= */
async function ensureWorkspace() {
  await db
    .insert(schema.workspaces)
    .values({ id: WORKSPACE_ID, name: 'Demo Cofounder Workspace' })
    .onConflictDoNothing();
  console.log('  · workspace ready');
}

/* =============================================================
   Wipe — order matters because of FK constraints
   ============================================================= */
async function clearExisting() {
  // lead_scores → leads
  await db
    .delete(schema.leadScores)
    .where(
      // No workspaceId on lead_scores; cascade via parent leads delete in this workspace
      eq(schema.leadScores.priorityTier, '__sentinel__never_match__'),
    );
  // ai_insights → leads (no workspaceId column); same approach: rely on per-lead deletes below

  // agent_logs → workspace
  await db
    .delete(schema.agentLogs)
    .where(eq(schema.agentLogs.workspaceId, WORKSPACE_ID));

  // simulations → workspace
  await db
    .delete(schema.simulations)
    .where(eq(schema.simulations.workspaceId, WORKSPACE_ID));

  // transactions → workspace
  await db
    .delete(schema.transactions)
    .where(eq(schema.transactions.workspaceId, WORKSPACE_ID));

  // Delete dependents of leads first (cascade isn't declared on FKs in current schema)
  const ourLeads = await db
    .select({ id: schema.leads.id })
    .from(schema.leads)
    .where(eq(schema.leads.workspaceId, WORKSPACE_ID));
  for (const l of ourLeads) {
    await db.delete(schema.leadScores).where(eq(schema.leadScores.leadId, l.id));
    await db.delete(schema.aiInsights).where(eq(schema.aiInsights.leadId, l.id));
  }
  await db.delete(schema.leads).where(eq(schema.leads.workspaceId, WORKSPACE_ID));

  console.log('  · existing demo rows cleared');
}

/* =============================================================
   Transactions — UMKM coffee shop persona
   Mix: weekly walk-in sales, B2B catering, occasional workshops,
   monthly fixed costs (payroll, rent, utilities), variable materials.
   ============================================================= */
function tx(
  txDate: string,
  type: 'income' | 'expense' | 'invoice',
  category: string,
  amount: number,
  description?: string,
): NewTransaction {
  return {
    workspaceId: WORKSPACE_ID,
    type,
    category,
    description: description ?? null,
    amount: amount.toString(),
    currency: 'IDR',
    txDate,
    notes: null,
  };
}

const TRANSACTIONS: NewTransaction[] = [
  // ───────── Dec 2025 ─────────
  tx('2025-12-03', 'income', 'Sales Revenue', 8_500_000, 'Weekly walk-in sales'),
  tx('2025-12-08', 'income', 'Service Fee', 2_400_000, 'Branding workshop — client PT Mitra'),
  tx('2025-12-10', 'expense', 'Raw Materials', 3_200_000, 'Coffee beans + packaging restock'),
  tx('2025-12-12', 'expense', 'Utilities', 850_000, 'PLN + water December'),
  tx('2025-12-15', 'expense', 'Payroll', 6_000_000, 'Monthly payroll (3 staff)'),
  tx('2025-12-20', 'expense', 'Rent', 4_500_000, 'December store rent'),
  tx('2025-12-22', 'invoice', 'Customer Invoice', 5_000_000, 'B2B catering — PT Mitra year-end event'),
  tx('2025-12-28', 'income', 'Sales Revenue', 4_200_000, 'End-of-year promo'),

  // ───────── Jan 2026 ─────────
  tx('2026-01-05', 'income', 'Sales Revenue', 7_800_000, 'Weekly walk-in sales'),
  tx('2026-01-08', 'expense', 'Marketing', 1_500_000, 'Instagram ads — Jan campaign'),
  tx('2026-01-10', 'expense', 'Raw Materials', 2_900_000, 'Beans + milk weekly'),
  tx('2026-01-12', 'income', 'Service Fee', 3_200_000, 'Latte art workshop (8 pax)'),
  tx('2026-01-15', 'expense', 'Payroll', 6_000_000, 'Monthly payroll'),
  tx('2026-01-18', 'expense', 'Utilities', 920_000, 'PLN + water January'),
  tx('2026-01-20', 'expense', 'Rent', 4_500_000, 'January store rent'),
  tx('2026-01-25', 'invoice', 'Pending Receivable', 3_500_000, 'Catering — corporate breakfast pending payment'),
  tx('2026-01-28', 'income', 'Sales Revenue', 8_100_000, 'Late-Jan walk-in'),

  // ───────── Feb 2026 ─────────
  tx('2026-02-03', 'income', 'Sales Revenue', 7_400_000, 'Weekly walk-in sales'),
  tx('2026-02-07', 'expense', 'Raw Materials', 3_400_000, 'Beans + syrups restock'),
  tx('2026-02-10', 'income', 'Service Fee', 1_800_000, 'Private cupping session'),
  tx('2026-02-13', 'expense', 'Marketing', 1_200_000, 'Valentine campaign'),
  tx('2026-02-14', 'income', 'Sales Revenue', 6_900_000, 'Valentine weekend rush'),
  tx('2026-02-15', 'expense', 'Payroll', 6_000_000, 'Monthly payroll'),
  tx('2026-02-20', 'expense', 'Rent', 4_500_000, 'February store rent'),
  tx('2026-02-25', 'expense', 'Tax', 2_100_000, 'PPN setor Q1 partial'),

  // ───────── Mar 2026 ─────────
  tx('2026-03-04', 'income', 'Sales Revenue', 9_200_000, 'Strong week — new menu launch'),
  tx('2026-03-08', 'expense', 'Raw Materials', 3_800_000, 'Specialty bean order'),
  tx('2026-03-12', 'invoice', 'Customer Invoice', 7_500_000, 'B2B office subscription — Bank Mandiri pilot'),
  tx('2026-03-15', 'expense', 'Payroll', 6_400_000, 'Payroll + bonus for new menu launch'),
  tx('2026-03-18', 'expense', 'Utilities', 980_000, 'PLN + water March'),
  tx('2026-03-20', 'expense', 'Rent', 4_500_000, 'March store rent'),
  tx('2026-03-25', 'income', 'Service Fee', 4_100_000, 'Corporate barista training (12 pax)'),

  // ───────── Apr 2026 ─────────
  tx('2026-04-02', 'income', 'Sales Revenue', 8_700_000, 'Weekly walk-in sales'),
  tx('2026-04-05', 'expense', 'Marketing', 2_200_000, 'Ramadan campaign creative'),
  tx('2026-04-08', 'expense', 'Raw Materials', 3_500_000, 'Beans + packaging Eid edition'),
  tx('2026-04-12', 'income', 'Sales Revenue', 10_100_000, 'Eid promo — strong week'),
  tx('2026-04-15', 'expense', 'Payroll', 7_200_000, 'Payroll + THR (religious bonus)'),
  tx('2026-04-20', 'expense', 'Rent', 4_500_000, 'April store rent'),
  tx('2026-04-25', 'income', 'Service Fee', 2_800_000, 'Customer appreciation event'),

  // ───────── May 2026 ─────────
  tx('2026-05-02', 'income', 'Sales Revenue', 7_900_000, 'First week May'),
  tx('2026-05-05', 'expense', 'Raw Materials', 3_100_000, 'Beans + milk weekly'),
  tx('2026-05-08', 'expense', 'Marketing', 1_400_000, 'IG reels + content collab'),
  tx('2026-05-10', 'income', 'Sales Revenue', 6_500_000, 'Mid-May walk-in'),
  tx('2026-05-12', 'invoice', 'Customer Invoice', 6_200_000, 'Office catering — PT Bukalapak'),
];

async function seedTransactions() {
  await db.insert(schema.transactions).values(TRANSACTIONS);
  console.log(`  · ${TRANSACTIONS.length} transactions inserted`);
}

/* =============================================================
   Leads — Jakarta-area UMKM for Map Explorer demo
   ============================================================= */
const LEADS = [
  {
    name: 'Toko Buah Segar Menteng',
    address: 'Jl. HOS Cokroaminoto, Menteng, Jakarta Pusat',
    lat: -6.1944,
    lng: 106.8319,
    category: 'Food Retail',
    phone: '+62-21-3192-4501',
    website: 'https://tokobuahsegar.id',
    emails: ['hello@tokobuahsegar.id'],
  },
  {
    name: 'Jaya Print Tanah Abang',
    address: 'Pasar Tanah Abang Blok A, Jakarta Pusat',
    lat: -6.1862,
    lng: 106.8128,
    category: 'Printing Service',
    phone: '+62-21-3500-7712',
    website: null,
    emails: ['jayaprint@gmail.com'],
  },
  {
    name: 'Cipta Konveksi',
    address: 'Jl. Pasar Baru No. 47, Jakarta Pusat',
    lat: -6.1670,
    lng: 106.8329,
    category: 'Garment Manufacturing',
    phone: '+62-21-3801-2245',
    website: 'https://ciptakonveksi.com',
    emails: ['order@ciptakonveksi.com'],
  },
  {
    name: 'Kopi Tubruk Bendungan Hilir',
    address: 'Jl. Bendungan Hilir No. 25, Jakarta Pusat',
    lat: -6.2089,
    lng: 106.8137,
    category: 'Coffee Shop',
    phone: '+62-878-1234-5678',
    website: 'https://kopitubruk.id',
    emails: ['halo@kopitubruk.id'],
  },
  {
    name: 'Bengkel Motor Cempaka',
    address: 'Jl. Cempaka Putih Tengah, Jakarta Pusat',
    lat: -6.1707,
    lng: 106.8694,
    category: 'Auto Service',
    phone: '+62-21-4280-9911',
    website: null,
    emails: [],
  },
  {
    name: 'Salon Anggrek',
    address: 'Jl. Senopati No. 12, Kebayoran Baru, Jakarta Selatan',
    lat: -6.2297,
    lng: 106.8131,
    category: 'Beauty Service',
    phone: '+62-21-7261-4400',
    website: null,
    emails: ['booking@salonanggrek.id'],
  },
  {
    name: 'Warung Sate Pak Karman',
    address: 'Jl. Sabang No. 18, Jakarta Pusat',
    lat: -6.1846,
    lng: 106.8261,
    category: 'Restaurant',
    phone: '+62-812-9988-7766',
    website: null,
    emails: [],
  },
  {
    name: 'Toko Buku Sumber Ilmu',
    address: 'Jl. Kwitang Raya No. 8, Jakarta Pusat',
    lat: -6.1819,
    lng: 106.8419,
    category: 'Book Retail',
    phone: '+62-21-3144-2200',
    website: 'https://sumberilmu.co.id',
    emails: ['info@sumberilmu.co.id'],
  },
  {
    name: 'Laundry Express Kemang',
    address: 'Jl. Kemang Raya No. 33, Jakarta Selatan',
    lat: -6.2607,
    lng: 106.8137,
    category: 'Laundry',
    phone: '+62-21-7194-2233',
    website: null,
    emails: ['cs@laundryexpress.id'],
  },
  {
    name: 'Roti Kukus Mama Lina',
    address: 'Jl. Mangga Besar Raya No. 56, Jakarta Barat',
    lat: -6.1442,
    lng: 106.8224,
    category: 'Bakery',
    phone: '+62-815-4567-8899',
    website: null,
    emails: ['order@rotimama.id'],
  },
  {
    name: 'Studio Foto Klasik',
    address: 'Jl. Sudirman Kav. 21, Jakarta Selatan',
    lat: -6.2253,
    lng: 106.8086,
    category: 'Photography Service',
    phone: '+62-21-5212-7700',
    website: 'https://studioklasik.id',
    emails: ['hello@studioklasik.id'],
  },
  {
    name: 'Furniture Kayu Jati Cipinang',
    address: 'Jl. Bekasi Timur Raya, Cipinang, Jakarta Timur',
    lat: -6.2298,
    lng: 106.8866,
    category: 'Furniture Retail',
    phone: '+62-21-8190-3344',
    website: 'https://furniturejati.com',
    emails: ['sales@furniturejati.com'],
  },
];

async function seedLeads() {
  await db.insert(schema.leads).values(
    LEADS.map((l) => ({
      workspaceId: WORKSPACE_ID,
      name: l.name,
      address: l.address,
      lat: l.lat,
      lng: l.lng,
      category: l.category,
      phone: l.phone,
      website: l.website,
      emails: l.emails,
    })),
  );
  console.log(`  · ${LEADS.length} leads inserted`);
}

/* =============================================================
   Simulations — 2 completed with full agent_logs reasoning trace
   ============================================================= */

const AGENT_ROLES: Record<string, string> = {
  owner: 'Business owner perspective — revenue strategy, margin, hiring, growth ambition',
  supplier: 'Upstream supply chain — raw material cost, lead time, inventory adequacy',
  customer: 'Demand side — price sensitivity, willingness to pay, churn risk under scenario changes',
  bank: 'Lender / treasury — runway, debt service, credit recommendation',
  synthesizer: 'Synthesizer — reconciles 4 stakeholder views into a single cashflow forecast',
};

async function seedSimulations() {
  await seedSimQ1Pricing();
  await seedSimQ2Hiring();
  console.log('  · 2 simulations + 10 agent_logs inserted');
}

async function seedSimQ1Pricing() {
  const simId = randomUUID();
  const executionId = randomUUID();
  const scenarioParams: SimulationScenarioParams = {
    price_change_pct: 10,
    hiring_delta: 0,
    inventory_budget_monthly: 5_000_000,
    market_growth_pct: 5,
  };
  const forecast: CashflowForecastPoint[] = [
    { month: '2026-06', projectedIncome: 32_500_000, projectedExpense: 22_400_000, projectedNet: 10_100_000 },
    { month: '2026-07', projectedIncome: 33_200_000, projectedExpense: 22_800_000, projectedNet: 10_400_000 },
    { month: '2026-08', projectedIncome: 31_800_000, projectedExpense: 22_500_000, projectedNet: 9_300_000 },
  ];

  await db.insert(schema.simulations).values({
    id: simId,
    workspaceId: WORKSPACE_ID,
    title: 'Q3 2026 Pricing Test (+10%)',
    executionId,
    scenarioParams,
    forecastMonths: 3,
    dataSeedMonths: 6,
    status: 'completed',
    cashflowForecast: forecast,
    riskLevel: 'medium',
    summary:
      'A 10% price hike with stable hiring yields ~Rp 10M monthly net cashflow. ' +
      'Owner and bank views are positive on margin lift, but the customer agent flags ' +
      'medium price sensitivity that may dampen demand by month three. Recommend monitoring ' +
      'walk-in volume weekly and pulling the price back if churn signal emerges.',
    finalReasoning:
      'Owner outlook positive on margin expansion. Supplier neutral — inventory budget ' +
      'covers projected throughput. Customer flagged medium price sensitivity, with -3% ' +
      'demand by M3. Bank validates ~12 months runway under projected expense base. ' +
      'Reconciled forecast accepts owner-side income upside but applies customer haircut ' +
      'in M3. Risk classification medium because customer concern is real but bounded.',
    confidence: 78,
    totalDurationMs: 31_240,
    totalTokensUsed: 4_820,
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 - 60_000),
  });

  await insertAgentLogs(simId, executionId, {
    owner: {
      output: {
        outlook: 'positive',
        monthly_impact_pct: 8.5,
        key_risks: ['Demand erosion if competitor doesn\'t follow', 'Customer perception of value'],
        key_opportunities: ['Margin expansion', 'Premium positioning', 'Reinvest in product quality'],
        recommended_action: 'Pilot 10% price increase on premium menu items first, full rollout after 30 days',
        reasoning:
          'Historical data shows steady weekly sales averaging Rp 7-9M with healthy margin. ' +
          'A 10% price hike preserves brand premium and funds reinvestment in quality. Strongly supportive.',
        confidence: 82,
      },
      durationMs: 12_340,
      tokensUsed: 980,
    },
    supplier: {
      output: {
        outlook: 'neutral',
        monthly_impact_pct: 0,
        key_risks: ['Coffee bean price volatility in Q3', 'Lead time for specialty beans 2-3 weeks'],
        key_opportunities: ['Lock in supplier contract before harvest cycle'],
        expected_lead_time_change: 'no change',
        cost_pressure: 'low',
        reasoning:
          'Inventory budget of Rp 5M/month covers current throughput comfortably. No supply ' +
          'disruption signals in data seed. Pricing change is downstream and doesn\'t shift supplier risk.',
        confidence: 75,
      },
      durationMs: 14_200,
      tokensUsed: 1_010,
    },
    customer: {
      output: {
        outlook: 'neutral',
        monthly_impact_pct: -3,
        key_risks: ['Price sensitivity especially in walk-in segment', 'Competition within 1km radius'],
        key_opportunities: ['Loyalty program lock-in', 'Premium tier customers less price-sensitive'],
        price_sensitivity: 'medium',
        demand_change_pct: -3,
        reasoning:
          'Walk-in customers show moderate elasticity. 10% price hike likely causes ~3% volume drop ' +
          'in month 1-2, recoverable if service quality is maintained. B2B catering segment unaffected.',
        confidence: 80,
      },
      durationMs: 11_800,
      tokensUsed: 945,
    },
    bank: {
      output: {
        outlook: 'positive',
        monthly_impact_pct: 7,
        key_risks: ['One-time payroll bonus events impact monthly variance'],
        key_opportunities: ['Improved net margin enables credit line for expansion'],
        runway_months_estimate: 12,
        credit_recommendation: 'no_action',
        reasoning:
          'Projected net Rp 9-10M/month provides comfortable runway. Operating cash position ' +
          'strengthens under this scenario. No immediate credit need; could consider expansion ' +
          'line if pilot succeeds.',
        confidence: 70,
      },
      durationMs: 15_600,
      tokensUsed: 1_120,
    },
    synthesizer: {
      output: {
        risk_level: 'medium',
        summary:
          'A 10% price hike yields mild net cashflow improvement but customer price sensitivity ' +
          'caps the upside. Forecast assumes -3% demand drop in M3 per customer agent view.',
        monthly_forecast: forecast.map((f, i) => ({
          month_offset: i + 1,
          projected_income: f.projectedIncome,
          projected_expense: f.projectedExpense,
          projected_net: f.projectedNet,
        })),
        primary_drivers: [
          'Customer price sensitivity (-3% demand)',
          'Owner-validated margin uplift',
          'Stable supplier costs',
        ],
        reasoning:
          'Reconciled by accepting owner-side revenue lift (~+8.5%) but applying customer-flagged ' +
          'demand haircut. Bank perspective confirms runway. Supplier neutral. Risk medium because ' +
          'one stakeholder (customer) explicitly raised concern, but it is bounded and recoverable.',
        confidence: 78,
      },
      durationMs: 14_100,
      tokensUsed: 765,
    },
  });
}

async function seedSimQ2Hiring() {
  const simId = randomUUID();
  const executionId = randomUUID();
  const scenarioParams: SimulationScenarioParams = {
    price_change_pct: 0,
    hiring_delta: 2,
    inventory_budget_monthly: 8_000_000,
    market_growth_pct: 15,
  };
  const forecast: CashflowForecastPoint[] = [
    { month: '2026-06', projectedIncome: 30_400_000, projectedExpense: 28_900_000, projectedNet: 1_500_000 },
    { month: '2026-07', projectedIncome: 32_100_000, projectedExpense: 28_400_000, projectedNet: 3_700_000 },
    { month: '2026-08', projectedIncome: 34_800_000, projectedExpense: 28_900_000, projectedNet: 5_900_000 },
    { month: '2026-09', projectedIncome: 36_500_000, projectedExpense: 29_200_000, projectedNet: 7_300_000 },
    { month: '2026-10', projectedIncome: 38_700_000, projectedExpense: 29_500_000, projectedNet: 9_200_000 },
    { month: '2026-11', projectedIncome: 40_200_000, projectedExpense: 29_900_000, projectedNet: 10_300_000 },
  ];

  await db.insert(schema.simulations).values({
    id: simId,
    workspaceId: WORKSPACE_ID,
    title: 'Q2-Q4 Hiring Expansion (2 baristas + +20% inventory)',
    executionId,
    scenarioParams,
    forecastMonths: 6,
    dataSeedMonths: 6,
    status: 'completed',
    cashflowForecast: forecast,
    riskLevel: 'high',
    summary:
      'Adding 2 baristas plus a 20% inventory budget bump to capture 15% market growth shows ' +
      'near-zero net cashflow for the first 2 months — high cash burn risk before throughput ' +
      'matches new capacity. Recommend phased hiring (1 now, 1 in M3) and securing a Rp 30M ' +
      'standby credit line before committing.',
    finalReasoning:
      'Owner sees growth opportunity but underestimates ramp time. Supplier confirms inventory ' +
      'budget sufficient for projected demand. Customer agent supports +15% market growth signal. ' +
      'Bank agent flags critical concern — only 1.5 months effective runway in M1 under new payroll ' +
      'base. Reconciled by accepting owner growth thesis but classifying overall risk high due to ' +
      'bank-side runway concern. Phased hiring strongly recommended.',
    confidence: 72,
    totalDurationMs: 36_800,
    totalTokensUsed: 5_640,
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6 - 60_000),
  });

  await insertAgentLogs(simId, executionId, {
    owner: {
      output: {
        outlook: 'positive',
        monthly_impact_pct: 25,
        key_risks: ['Hiring lead time vs revenue ramp', 'Quality consistency with new staff'],
        key_opportunities: ['Capture 15% market growth', 'Extend operating hours', 'Reduce owner burnout'],
        recommended_action: 'Phase hires: 1 barista now, 1 in month 3 when capacity proves out',
        reasoning:
          'Market growth signal of +15% is credible given competitor analysis. Current owner-led ' +
          'operation caps revenue. Adding capacity unlocks growth, but phasing reduces ramp risk.',
        confidence: 78,
      },
      durationMs: 13_200,
      tokensUsed: 1_020,
    },
    supplier: {
      output: {
        outlook: 'neutral',
        monthly_impact_pct: -2,
        key_risks: ['Bean lead time stretches if demand spikes', 'Volatile FX for imported beans'],
        key_opportunities: ['Volume discount tier if monthly order > Rp 10M'],
        expected_lead_time_change: '+1 week during ramp',
        cost_pressure: 'medium',
        reasoning:
          'Inventory budget bump to Rp 8M/month aligns with projected throughput. Some cost pressure ' +
          'from import volatility but manageable. Volume discount unlock at higher tier provides offset.',
        confidence: 72,
      },
      durationMs: 16_400,
      tokensUsed: 1_150,
    },
    customer: {
      output: {
        outlook: 'positive',
        monthly_impact_pct: 12,
        key_risks: ['Service quality drop with new staff perception risk', 'Competitor counter-move'],
        key_opportunities: ['Faster service captures lunch-hour rush', 'Better latte art retention'],
        price_sensitivity: 'low',
        demand_change_pct: 15,
        reasoning:
          'Market growth signal real — coffee category trending up in Jakarta. No price change means ' +
          'demand elasticity not tested. Customers reward shorter wait times in this segment.',
        confidence: 75,
      },
      durationMs: 12_900,
      tokensUsed: 980,
    },
    bank: {
      output: {
        outlook: 'negative',
        monthly_impact_pct: -10,
        key_risks: [
          'Near-zero net cashflow first 2 months',
          'Payroll commitment is fixed but revenue ramp uncertain',
          'No standby credit if shortfall occurs',
        ],
        key_opportunities: ['Improved cashflow from M4 onward', 'Bank financing easier post-ramp'],
        runway_months_estimate: 4,
        credit_recommendation: 'open_credit_line',
        reasoning:
          'Adding Rp 6M/month payroll commitment against current cash position drops runway to ~4 months ' +
          'in worst case. Strongly recommend securing Rp 30M standby line before hiring. Without it, ' +
          'one bad month creates serious cash strain.',
        confidence: 80,
      },
      durationMs: 17_300,
      tokensUsed: 1_280,
    },
    synthesizer: {
      output: {
        risk_level: 'high',
        summary:
          'Hiring expansion captures market growth but creates short-term cash burn risk. ' +
          'M1-M2 are critical — net cashflow near zero. From M3 onward, throughput catches up. ' +
          'Risk high due to bank agent flagging runway concern; mitigatable via phased hiring and standby credit.',
        monthly_forecast: forecast.map((f, i) => ({
          month_offset: i + 1,
          projected_income: f.projectedIncome,
          projected_expense: f.projectedExpense,
          projected_net: f.projectedNet,
        })),
        primary_drivers: [
          'Bank-flagged short-term runway concern',
          'Owner-validated market growth thesis',
          'Customer-confirmed +15% demand elasticity',
        ],
        reasoning:
          'Conflicting stakeholder views: owner+customer bullish on growth, bank bearish on cash. ' +
          'Reconciled by accepting growth path but classifying risk high — bank concern is concrete ' +
          '(4 months runway), not vague. Phased hiring + standby credit is the actionable mitigation.',
        confidence: 72,
      },
      durationMs: 16_900,
      tokensUsed: 1_210,
    },
  });
}

/* =============================================================
   Agent logs helper
   -------------------------------------------------------------
   Output shape varies per agent (stakeholders vs synthesizer)
   so we keep it loose — only `reasoning` and `confidence` are
   required, which agent_logs row needs.
   ============================================================= */
type AgentStepInput = {
  output: { reasoning: string; confidence: number } & Record<string, unknown>;
  durationMs: number;
  tokensUsed: number;
};

async function insertAgentLogs(
  simulationId: string,
  executionId: string,
  steps: {
    owner: AgentStepInput;
    supplier: AgentStepInput;
    customer: AgentStepInput;
    bank: AgentStepInput;
    synthesizer: AgentStepInput;
  },
) {
  const baseInput = { phase: 'demo-seed', seedMonthsCovered: 6 };
  const rows = [
    { name: 'owner', step: 1, data: steps.owner },
    { name: 'supplier', step: 1, data: steps.supplier },
    { name: 'customer', step: 1, data: steps.customer },
    { name: 'bank', step: 1, data: steps.bank },
    { name: 'synthesizer', step: 2, data: steps.synthesizer },
  ];
  await db.insert(schema.agentLogs).values(
    rows.map((r) => ({
      workspaceId: WORKSPACE_ID,
      simulationId,
      agentName: r.name,
      agentRole: AGENT_ROLES[r.name],
      executionId,
      stepNumber: r.step,
      input: baseInput,
      output: r.data.output as Record<string, unknown>,
      reasoning: r.data.output.reasoning,
      confidence: r.data.output.confidence,
      contextFromPreviousAgent:
        r.name === 'synthesizer' ? { phase: 'stakeholders complete' } : null,
      contextSharedToNextAgent: r.step === 1 ? { [r.name]: r.data.output } : null,
      durationMs: r.data.durationMs,
      tokensUsed: r.data.tokensUsed,
    })),
  );
}

/* =============================================================
   Entry point
   ============================================================= */
main().catch(async (e) => {
  console.error('❌ Seed failed:', e);
  await pool.end();
  process.exit(1);
});
