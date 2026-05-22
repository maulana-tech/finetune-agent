import Link from 'next/link';
import { eq, desc, count, avg } from 'drizzle-orm';
import {
  PieChart,
  TrendingUp,
  MapPin,
  Calendar,
  Sparkles,
  CheckCircle2,
  Loader2,
  CircleAlert,
  AlertTriangle,
} from 'lucide-react';
import {
  db,
  marketAnalyses,
  leads,
  agentLogs,
  type MarketAnalysis,
} from '@repo/db';
import { getWorkspaceId } from '@/lib/get-workspace';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const workspaceId = await getWorkspaceId();
  const [
    [leadCountRow],
    [analysisCountRow],
    [avgScoreRow],
    completedAnalyses,
  ] = await Promise.all([
    db
      .select({ value: count() })
      .from(leads)
      .where(eq(leads.workspaceId, workspaceId)),
    db
      .select({ value: count() })
      .from(marketAnalyses)
      .where(eq(marketAnalyses.workspaceId, workspaceId)),
    // avg opportunity_score is inside jsonb — we fetch completed rows and compute in JS
    // (drizzle can't avg a jsonb sub-field directly)
    db
      .select({ value: count() })
      .from(marketAnalyses)
      .where(eq(marketAnalyses.workspaceId, workspaceId)),
    db
      .select()
      .from(marketAnalyses)
      .where(eq(marketAnalyses.workspaceId, workspaceId))
      .orderBy(desc(marketAnalyses.createdAt)),
  ]);

  const totalLeads = Number(leadCountRow?.value ?? 0);
  const totalAnalyses = Number(analysisCountRow?.value ?? 0);

  const completedOnly = completedAnalyses.filter(
    (a: MarketAnalysis) => a.status === 'completed' && a.result?.opportunity_score != null,
  );
  const avgOpportunityScore =
    completedOnly.length > 0
      ? Math.round(
          completedOnly.reduce(
            (sum: number, a: MarketAnalysis) => sum + (a.result?.opportunity_score ?? 0),
            0,
          ) / completedOnly.length,
        )
      : null;

  return (
    <div className="p-6 h-full flex flex-col gap-6 overflow-auto">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Market Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          AI-powered market analysis from your leads
        </p>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Leads" value={totalLeads === 0 ? '—' : String(totalLeads)} icon={MapPin} />
        <KpiCard label="Analyses Run" value={totalAnalyses === 0 ? '—' : String(totalAnalyses)} icon={PieChart} />
        <KpiCard
          label="Avg Opportunity Score"
          value={avgOpportunityScore != null ? `${avgOpportunityScore}/100` : '—'}
          icon={TrendingUp}
        />
        <KpiCard label="Active Schedules" value="—" icon={Calendar} note="Coming soon" />
      </div>

      {/* ANALYSIS LIST */}
      {completedAnalyses.length === 0 ? (
        <div className="flex-1 flex items-center justify-center border border-dashed border-border bg-accent/10 min-h-[300px]">
          <div className="text-center max-w-sm">
            <PieChart className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="font-bold text-sm mb-2">No Reports Yet</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Scrape market data first, then run a market analysis. The 4 agents (Competitor / Trend / Risk /
              Demand) will generate opportunity scores and positioning recommendations.
            </p>
            <Link
              href="/dashboard/market"
              className="inline-flex items-center gap-2 border border-border bg-background px-4 h-9 text-[10px] font-bold uppercase tracking-widest hover:bg-accent transition-colors"
            >
              Go to Market Analysis →
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {completedAnalyses.map((analysis: MarketAnalysis) => (
            <AnalysisCard key={analysis.id} analysis={analysis} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Components
   ============================================================ */

function KpiCard({
  label,
  value,
  icon: Icon,
  note,
}: {
  label: string;
  value: string;
  icon: typeof MapPin;
  note?: string;
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
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      {note && (
        <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
          {note}
        </div>
      )}
    </div>
  );
}

function AnalysisCard({ analysis }: { analysis: MarketAnalysis }) {
  const score = analysis.result?.opportunity_score;
  const opportunities = analysis.result?.top_opportunities ?? [];

  return (
    <div className="border border-border bg-background flex flex-col">
      {/* Card header */}
      <div className="p-4 border-b border-border flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm truncate">{analysis.title}</span>
            {analysis.scenarioParams?.industry && (
              <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 border border-border bg-accent/20 shrink-0">
                {analysis.scenarioParams.industry}
              </span>
            )}
            {analysis.scenarioParams?.region && (
              <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                {analysis.scenarioParams.region}
              </span>
            )}
          </div>
          <div className="text-[10px] text-muted-foreground font-mono mt-1">
            {new Date(analysis.createdAt).toLocaleString('id-ID')}
            {analysis.completedAt && (
              <> · completed {new Date(analysis.completedAt).toLocaleString('id-ID')}</>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {analysis.riskLevel && <RiskBadge level={analysis.riskLevel} />}
          <StatusBadge status={analysis.status} />
        </div>
      </div>

      {/* Score + summary */}
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center gap-4">
          {score != null && (
            <div className="flex items-center gap-2">
              <ScoreBadge score={score} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                Opportunity Score
              </span>
            </div>
          )}
          {analysis.confidence != null && (
            <div className="text-[10px] font-mono text-muted-foreground">
              conf {analysis.confidence}%
            </div>
          )}
        </div>

        {analysis.summary && (
          <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-3">
            {analysis.summary}
          </p>
        )}

        {opportunities.length > 0 && (
          <div className="flex flex-col gap-1">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Top Opportunities
            </div>
            <ul className="flex flex-col gap-0.5">
              {opportunities.slice(0, 3).map((opp: string, i: number) => (
                <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                  <span className="mt-0.5 w-3 h-3 shrink-0 text-primary">›</span>
                  <span className="leading-relaxed">{opp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-4 py-3 flex items-center justify-between">
        <div className="text-[10px] text-muted-foreground font-mono">
          {analysis.dataSeedSize > 0
            ? `${analysis.dataSeedSize} data points`
            : 'no seed data recorded'}
          {analysis.totalDurationMs != null && (
            <> · {(analysis.totalDurationMs / 1000).toFixed(1)}s</>
          )}
        </div>
        <Link
          href={`/dashboard/market/analyses/${analysis.id}`}
          className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
        >
          View Full Report →
        </Link>
      </div>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const cls =
    score >= 75
      ? 'bg-accent text-primary border-border'
      : score >= 50
        ? 'bg-accent/50 text-foreground border-border'
        : score >= 25
          ? 'bg-destructive/10 text-destructive border-border'
          : 'bg-destructive/20 text-destructive border-border';

  return (
    <span
      className={`inline-flex items-center px-2 py-1 text-[11px] font-bold tabular-nums border ${cls}`}
    >
      {score}/100
    </span>
  );
}

function RiskBadge({ level }: { level: NonNullable<MarketAnalysis['riskLevel']> }) {
  const map = {
    low: 'bg-accent text-primary',
    medium: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
    high: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
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
