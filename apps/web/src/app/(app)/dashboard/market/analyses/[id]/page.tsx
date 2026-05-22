import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq, and, asc } from 'drizzle-orm';
import {
  ChevronLeft,
  Sparkles,
  CheckCircle2,
  Loader2,
  CircleAlert,
  Briefcase,
  TrendingUp,
  ShieldAlert,
  Users,
  GitMerge,
} from 'lucide-react';
import {
  db,
  marketAnalyses,
  agentLogs,
  type MarketAnalysis,
  type MarketAnalysisScenarioParams,
} from '@repo/db';
import { getWorkspaceId } from '@/lib/get-workspace';
import { MarketAnalysisPoller } from '@/features/market/MarketAnalysisPoller';

type AgentLog = typeof agentLogs.$inferSelect;

const AGENT_META: Record<
  string,
  { label: string; icon: typeof Briefcase; tagline: string }
> = {
  competitor: {
    label: 'Competitor',
    icon: Briefcase,
    tagline: 'Pricing landscape, positioning gaps',
  },
  trend: {
    label: 'Trend',
    icon: TrendingUp,
    tagline: 'Industry direction, drivers',
  },
  risk: {
    label: 'Risk',
    icon: ShieldAlert,
    tagline: 'Regulatory, macro, supply chain',
  },
  demand: {
    label: 'Demand',
    icon: Users,
    tagline: 'Customer demand, WTP, triggers',
  },
  synthesizer: {
    label: 'Synthesizer',
    icon: GitMerge,
    tagline: 'Reconciles 4 lenses',
  },
};

export default async function MarketAnalysisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workspaceId = await getWorkspaceId();
  const [analysis] = await db
    .select()
    .from(marketAnalyses)
    .where(and(eq(marketAnalyses.id, id), eq(marketAnalyses.workspaceId, workspaceId)))
    .limit(1);

  if (!analysis) {
    notFound();
  }

  const logs = await db
    .select()
    .from(agentLogs)
    .where(eq(agentLogs.marketAnalysisId, id))
    .orderBy(asc(agentLogs.stepNumber), asc(agentLogs.createdAt));

  const perspectiveLogs = logs.filter((l: AgentLog) => l.stepNumber === 1);
  const synthesizerLog = logs.find((l: AgentLog) => l.agentName === 'synthesizer');
  const isWorking = analysis.status === 'pending' || analysis.status === 'running';
  const isFailed = analysis.status === 'failed';
  const isCompleted = analysis.status === 'completed';

  return (
    <div className="p-6 h-full flex flex-col gap-6 overflow-auto">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link
            href="/dashboard/market"
            className="w-10 h-10 border border-border bg-background hover:bg-accent flex items-center justify-center transition-colors shrink-0"
            aria-label="Back to Market"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
              Analysis · {analysis.id.slice(0, 8)}
            </div>
            <h1 className="text-2xl font-bold tracking-tight mt-1">{analysis.title}</h1>
            <div className="text-[11px] text-muted-foreground font-mono mt-1">
              Created {new Date(analysis.createdAt).toLocaleString('id-ID')}
              {analysis.completedAt && ` · Completed ${new Date(analysis.completedAt).toLocaleString('id-ID')}`}
            </div>
          </div>
        </div>
        <StatusBadge status={analysis.status} />
      </div>

      {/* POLLING */}
      {isWorking && <MarketAnalysisPoller analysisId={analysis.id} />}

      {/* FAILED */}
      {isFailed && (
        <div className="border border-destructive/40 bg-destructive/10 p-4 flex items-start gap-3">
          <CircleAlert className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold tracking-tight text-destructive">Analysis failed</div>
            <p className="text-[12px] text-destructive/80 mt-1 leading-relaxed">
              {analysis.errorMessage ?? 'Unknown error during multi-agent execution.'}
            </p>
          </div>
        </div>
      )}

      {/* SCENARIO + RESULT */}
      <div className="grid grid-cols-[1fr_1.5fr] gap-4">
        <ScenarioCard analysis={analysis} />
        <ResultCard analysis={analysis} />
      </div>

      {/* OPPORTUNITY + THREATS */}
      {isCompleted && analysis.result && (
        <div className="grid grid-cols-2 gap-4">
          <ListCard
            title="Top Opportunities"
            tone="positive"
            items={analysis.result.top_opportunities}
          />
          <ListCard
            title="Top Threats"
            tone="negative"
            items={analysis.result.top_threats}
          />
        </div>
      )}

      {/* AGENT TRACE */}
      {logs.length > 0 && (
        <div className="flex flex-col gap-4">
          <div>
            <div className="text-sm font-bold tracking-tight">Agent Reasoning Trace</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
              Per-agent output, confidence, and chain-of-thought
            </div>
          </div>

          {perspectiveLogs.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Perspectives · parallel phase
              </div>
              <div className="grid grid-cols-2 gap-3">
                {perspectiveLogs.map((log: AgentLog) => (
                  <AgentCard key={log.id} log={log} />
                ))}
              </div>
            </div>
          )}

          {synthesizerLog && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Synthesizer · final reconciliation
              </div>
              <AgentCard log={synthesizerLog} wide />
            </div>
          )}
        </div>
      )}

      {/* EXECUTION METRICS */}
      {(analysis.totalDurationMs || analysis.totalTokensUsed) && (
        <div className="grid grid-cols-3 gap-4">
          <Metric
            label="Total Duration"
            value={analysis.totalDurationMs ? `${(analysis.totalDurationMs / 1000).toFixed(1)}s` : '—'}
          />
          <Metric label="Total Tokens" value={analysis.totalTokensUsed?.toLocaleString('id-ID') ?? '—'} />
          <Metric label="Confidence" value={analysis.confidence != null ? `${analysis.confidence}%` : '—'} />
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Cards
   ============================================================ */
function ScenarioCard({ analysis }: { analysis: MarketAnalysis }) {
  const p = analysis.scenarioParams as MarketAnalysisScenarioParams;
  return (
    <div className="border border-border bg-background p-4 flex flex-col gap-3">
      <div className="text-sm font-bold tracking-tight">Scenario</div>
      <div className="grid grid-cols-2 gap-3 text-[12px]">
        <ScenarioField label="Industry" value={p.industry} />
        <ScenarioField label="Region" value={p.region} />
        <ScenarioField label="Target segment" value={p.target_segment} />
        <ScenarioField label="Competitor focus" value={p.competitor_focus} />
        <ScenarioField label="Time horizon" value={`${p.time_horizon_months} month(s)`} />
        <ScenarioField label="Data seed size" value={`${analysis.dataSeedSize} records`} />
      </div>
    </div>
  );
}

function ScenarioField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="font-mono mt-0.5">{value}</div>
    </div>
  );
}

function ResultCard({ analysis }: { analysis: MarketAnalysis }) {
  if (analysis.status !== 'completed') {
    return (
      <div className="border border-border bg-background p-4 flex flex-col gap-2">
        <div className="text-sm font-bold tracking-tight">Final Result</div>
        <div className="flex-1 flex items-center justify-center min-h-[120px] text-[12px] text-muted-foreground">
          Synthesis will appear once all agents complete.
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border bg-background p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold tracking-tight">Final Result</div>
        <div className="flex items-center gap-2">
          {analysis.result?.opportunity_score != null && (
            <span className="inline-flex items-center px-2 py-1 text-[10px] font-bold uppercase tracking-widest border border-border bg-accent">
              Opp: {analysis.result.opportunity_score}/100
            </span>
          )}
          {analysis.riskLevel && <RiskBadge level={analysis.riskLevel} />}
        </div>
      </div>
      {analysis.result?.positioning_recommendation && (
        <div className="border-l-2 border-primary pl-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
            Positioning recommendation
          </div>
          <p className="text-[13px] font-medium leading-relaxed">
            {analysis.result.positioning_recommendation}
          </p>
        </div>
      )}
      {analysis.summary && (
        <p className="text-[13px] leading-relaxed">{analysis.summary}</p>
      )}
      {analysis.finalReasoning && (
        <div className="border-l-2 border-muted-foreground pl-3 mt-1">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
            Synthesizer reasoning
          </div>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            {analysis.finalReasoning}
          </p>
        </div>
      )}
    </div>
  );
}

function ListCard({
  title,
  tone,
  items,
}: {
  title: string;
  tone: 'positive' | 'negative';
  items: string[];
}) {
  return (
    <div className="border border-border bg-background p-4 flex flex-col gap-2">
      <div className="text-sm font-bold tracking-tight">{title}</div>
      <ul className="flex flex-col gap-1.5 mt-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-[12px]">
            <span className={`mt-0.5 ${tone === 'positive' ? 'text-primary' : 'text-destructive'}`}>
              {tone === 'positive' ? '+' : '−'}
            </span>
            <span className="flex-1">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AgentCard({ log, wide = false }: { log: AgentLog; wide?: boolean }) {
  const meta =
    AGENT_META[log.agentName] ?? {
      label: log.agentName,
      icon: Sparkles,
      tagline: log.agentRole,
    };
  const Icon = meta.icon;
  const output = log.output as Record<string, unknown>;

  return (
    <div className="border border-border bg-background p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 border border-border bg-accent/50 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight">{meta.label}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-0.5">
              {meta.tagline}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {log.confidence != null && (
            <span className="inline-flex items-center px-2 py-1 text-[10px] font-bold uppercase tracking-widest border border-border bg-background font-mono">
              conf {log.confidence}%
            </span>
          )}
          {log.durationMs != null && (
            <div className="text-[10px] text-muted-foreground font-mono">
              {(log.durationMs / 1000).toFixed(1)}s
              {log.tokensUsed != null && ` · ${log.tokensUsed} tok`}
            </div>
          )}
        </div>
      </div>

      {log.reasoning && (
        <div className="border-l-2 border-primary/40 pl-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
            Reasoning
          </div>
          <p className="text-[12px] leading-relaxed">{log.reasoning}</p>
        </div>
      )}

      <div className={`grid ${wide ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'} gap-2 text-[11px]`}>
        {Object.entries(output)
          .filter(([k]) => k !== 'reasoning' && k !== 'confidence' && k !== 'monthly_forecast')
          .map(([k, v]) => (
            <div key={k} className="border border-border bg-accent/20 px-2 py-1.5">
              <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                {k.replace(/_/g, ' ')}
              </div>
              <div className="font-mono mt-0.5 break-words">{renderValue(v)}</div>
            </div>
          ))}
      </div>
    </div>
  );
}

function renderValue(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (Array.isArray(v)) return v.map((x) => String(x)).join(' · ');
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
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
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border border-border ${cfg.cls}`}
    >
      <cfg.Icon className={`w-3.5 h-3.5 ${cfg.spin ? 'animate-spin' : ''}`} />
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-background p-4">
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="text-xl font-bold tabular-nums mt-1">{value}</div>
    </div>
  );
}
