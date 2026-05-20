import Link from 'next/link';
import { eq, desc } from 'drizzle-orm';
import {
  Briefcase,
  TrendingUp,
  AlertTriangle,
  Users,
  Sparkles,
  CheckCircle2,
  Loader2,
  CircleAlert,
  Database,
} from 'lucide-react';
import {
  db,
  marketData,
  marketAnalyses,
  type MarketAnalysis,
  type MarketData,
} from '@repo/db';
import { DEV_WORKSPACE_ID } from '@/lib/workspace';
import {
  RunMarketAnalysisButton,
  RunMarketScrapeButton,
} from '@/features/market/RunMarketAnalysisDialog';

export const dynamic = 'force-dynamic';

export default async function MarketPage() {
  const [dataRows, analyses] = await Promise.all([
    db
      .select()
      .from(marketData)
      .where(eq(marketData.workspaceId, DEV_WORKSPACE_ID))
      .orderBy(desc(marketData.scrapedAt)),
    db
      .select()
      .from(marketAnalyses)
      .where(eq(marketAnalyses.workspaceId, DEV_WORKSPACE_ID))
      .orderBy(desc(marketAnalyses.createdAt)),
  ]);

  const stats = computeStats(dataRows);
  const latestAnalysis = analyses[0];

  return (
    <div className="p-6 h-full flex flex-col gap-6 overflow-auto">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Market Analysis</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Competitor, trend, risk, and demand intelligence reasoned by a multi-agent pipeline.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RunMarketScrapeButton />
          <RunMarketAnalysisButton />
        </div>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-4 gap-4">
        <Kpi label="Competitors" value={stats.competitor} icon={Briefcase} />
        <Kpi label="Trend Signals" value={stats.trend} icon={TrendingUp} />
        <Kpi label="Risk Flags" value={stats.risk} icon={AlertTriangle} />
        <Kpi label="Demand Signals" value={stats.demand} icon={Users} />
      </div>

      {/* LATEST ANALYSIS + DATA OVERVIEW */}
      <div className="grid grid-cols-[1fr_1.4fr] gap-4">
        <LatestAnalysisCard analysis={latestAnalysis} />
        <MarketDataOverview rows={dataRows.slice(0, 8)} />
      </div>

      {/* ANALYSIS HISTORY */}
      {analyses.length > 0 && (
        <div className="border border-border bg-background flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="text-sm font-bold tracking-tight">Analysis History</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
              Last {analyses.length} multi-agent runs
            </div>
          </div>
          <div className="grid grid-cols-[1fr_120px_100px_120px_100px] gap-4 px-4 py-2 border-b border-border text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <div>Title</div>
            <div>Opportunity</div>
            <div>Risk</div>
            <div>Status</div>
            <div className="text-right">Action</div>
          </div>
          {analyses.map((a: MarketAnalysis) => (
            <AnalysisRow key={a.id} analysis={a} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Compute
   ============================================================ */
function computeStats(rows: MarketData[]) {
  let competitor = 0;
  let trend = 0;
  let risk = 0;
  let demand = 0;
  for (const r of rows) {
    if (r.dataType === 'competitor_listing') competitor += 1;
    else if (r.dataType === 'trend_signal' || r.dataType === 'industry_news') trend += 1;
    else if (r.dataType === 'regulatory') risk += 1;
    else if (r.dataType === 'demand_signal' || r.dataType === 'pricing_signal') demand += 1;
  }
  return { competitor, trend, risk, demand };
}

/* ============================================================
   Components
   ============================================================ */
function Kpi({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Briefcase;
}) {
  return (
    <div className="border border-border bg-background p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
          {label}
        </div>
        <div className="w-8 h-8 border border-border bg-accent/50 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
      <div className="text-2xl font-bold tabular-nums">{value === 0 ? '—' : value}</div>
      <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
        records
      </div>
    </div>
  );
}

function LatestAnalysisCard({ analysis }: { analysis?: MarketAnalysis }) {
  if (!analysis) {
    return (
      <div className="border border-border bg-background p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-bold tracking-tight">Latest Analysis</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
              Market multi-agent
            </div>
          </div>
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 flex items-center justify-center border border-dashed border-border bg-accent/10 p-6 min-h-[180px]">
          <div className="text-center max-w-[260px]">
            <Database className="w-8 h-8 mx-auto text-muted-foreground/40 mb-3" />
            <div className="font-bold text-xs mb-1">No Analyses Yet</div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Scrape market data first, then run an analysis. The 4 agents (Competitor / Trend / Risk / Demand) will produce an opportunity score and positioning recommendation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border bg-background p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
            Latest Analysis
          </div>
          <div className="text-sm font-bold tracking-tight mt-1 line-clamp-1">{analysis.title}</div>
        </div>
        <StatusBadge status={analysis.status} />
      </div>

      {analysis.status === 'completed' && analysis.result && (
        <>
          <div className="flex items-center gap-2">
            {analysis.riskLevel && <RiskBadge level={analysis.riskLevel} />}
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
              opp {analysis.result.opportunity_score}/100 · conf {analysis.confidence ?? '—'}%
            </div>
          </div>
          {analysis.summary && (
            <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-4">
              {analysis.summary}
            </p>
          )}
        </>
      )}

      <Link
        href={`/dashboard/market/analyses/${analysis.id}`}
        className="mt-auto h-10 border border-border bg-background text-[10px] font-bold uppercase tracking-widest hover:bg-accent transition-colors flex items-center justify-center gap-2"
      >
        View Full Report →
      </Link>
    </div>
  );
}

function MarketDataOverview({ rows }: { rows: MarketData[] }) {
  return (
    <div className="border border-border bg-background flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="text-sm font-bold tracking-tight">Recent Market Data</div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
          Top {rows.length} scraped records
        </div>
      </div>
      {rows.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-10 min-h-[180px]">
          <div className="text-center max-w-[320px]">
            <Database className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <div className="font-bold text-xs mb-1">No Market Data</div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Use <strong>Scrape Market Data</strong> to fetch competitor + trend signals.
              The agents will use these as their seed.
            </p>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {rows.map((r) => (
            <div key={r.id} className="px-4 py-3 grid grid-cols-[120px_1fr_120px] gap-3 items-center text-[12px]">
              <span className="inline-block px-1.5 py-0.5 border border-border text-[10px] font-bold uppercase tracking-widest bg-accent w-fit">
                {r.dataType.replace('_', ' ')}
              </span>
              <div className="truncate">
                <span className="font-medium">{r.title ?? '(untitled)'}</span>
                {r.region && (
                  <span className="text-muted-foreground"> · {r.region}</span>
                )}
              </div>
              <div className="text-right font-mono text-[10px] text-muted-foreground">
                {new Date(r.scrapedAt).toLocaleDateString('id-ID')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AnalysisRow({ analysis }: { analysis: MarketAnalysis }) {
  return (
    <div className="grid grid-cols-[1fr_120px_100px_120px_100px] gap-4 px-4 py-3 border-b border-border last:border-b-0 text-[12px] items-center">
      <div className="truncate">
        <div className="font-medium">{analysis.title}</div>
        <div className="text-[10px] text-muted-foreground font-mono">
          {new Date(analysis.createdAt).toLocaleString('id-ID')}
        </div>
      </div>
      <div className="font-mono text-[11px] text-muted-foreground">
        {analysis.result?.opportunity_score != null
          ? `${analysis.result.opportunity_score}/100`
          : '—'}
      </div>
      <div>{analysis.riskLevel ? <RiskBadge level={analysis.riskLevel} /> : <span className="text-muted-foreground">—</span>}</div>
      <div>
        <StatusBadge status={analysis.status} />
      </div>
      <div className="text-right">
        <Link
          href={`/dashboard/market/analyses/${analysis.id}`}
          className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          Open →
        </Link>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: MarketAnalysis['status'] }) {
  const map = {
    pending: { Icon: Loader2, text: 'Pending', cls: 'bg-accent text-foreground', spin: true },
    running: { Icon: Loader2, text: 'Running', cls: 'bg-primary text-primary-foreground', spin: true },
    completed: { Icon: CheckCircle2, text: 'Completed', cls: 'bg-accent text-primary', spin: false },
    failed: { Icon: CircleAlert, text: 'Failed', cls: 'bg-destructive text-destructive-foreground', spin: false },
  } as const;
  const cfg = map[status as keyof typeof map];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-widest border border-border ${cfg.cls}`}
    >
      <cfg.Icon className={`w-3 h-3 ${cfg.spin ? 'animate-spin' : ''}`} />
      {cfg.text}
    </span>
  );
}

function RiskBadge({ level }: { level: NonNullable<MarketAnalysis['riskLevel']> }) {
  const map = {
    low: 'bg-accent text-primary',
    medium: 'bg-accent text-foreground',
    high: 'bg-destructive/20 text-destructive',
    critical: 'bg-destructive text-destructive-foreground',
  } as const;
  return (
    <span
      className={`inline-flex items-center px-2 py-1 text-[10px] font-bold uppercase tracking-widest border border-border ${map[level as keyof typeof map]}`}
    >
      Risk: {level}
    </span>
  );
}
