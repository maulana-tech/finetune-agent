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
  Truck,
  Users,
  Banknote,
  GitMerge,
} from 'lucide-react';
import {
  db,
  simulations,
  agentLogs,
  type Simulation,
  type CashflowForecastPoint,
  type SimulationScenarioParams,
} from '@repo/db';
import { DEV_WORKSPACE_ID } from '@/lib/workspace';
import { SimulationPoller } from '@/features/finance/SimulationPoller';
import { ExportPdfButton } from '@/features/finance/ExportPdfButton';

const currency = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);

const compactCurrency = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n);

type AgentLog = typeof agentLogs.$inferSelect;

const AGENT_META: Record<
  string,
  { label: string; icon: typeof Briefcase; tagline: string }
> = {
  owner: {
    label: 'Owner',
    icon: Briefcase,
    tagline: 'Revenue, margin, hiring, growth',
  },
  supplier: {
    label: 'Supplier',
    icon: Truck,
    tagline: 'Supply chain, lead time, inventory',
  },
  customer: {
    label: 'Customer',
    icon: Users,
    tagline: 'Price sensitivity, demand',
  },
  bank: {
    label: 'Bank',
    icon: Banknote,
    tagline: 'Runway, debt service, credit',
  },
  synthesizer: {
    label: 'Synthesizer',
    icon: GitMerge,
    tagline: 'Reconciles all stakeholder views',
  },
};

export default async function SimulationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [sim] = await db
    .select()
    .from(simulations)
    .where(and(eq(simulations.id, id), eq(simulations.workspaceId, DEV_WORKSPACE_ID)))
    .limit(1);

  if (!sim) {
    notFound();
  }

  const logs = await db
    .select()
    .from(agentLogs)
    .where(eq(agentLogs.simulationId, id))
    .orderBy(asc(agentLogs.stepNumber), asc(agentLogs.createdAt));

  const stakeholderLogs = logs.filter((l: AgentLog) => l.stepNumber === 1);
  const synthesizerLog = logs.find((l: AgentLog) => l.agentName === 'synthesizer');
  const isWorking = sim.status === 'pending' || sim.status === 'running';
  const isFailed = sim.status === 'failed';
  const isCompleted = sim.status === 'completed';

  return (
    <div className="p-6 h-full flex flex-col gap-6 overflow-auto">
      {/* ============ HEADER ============ */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link
            href="/dashboard/finance"
            className="w-10 h-10 border border-border bg-background hover:bg-accent flex items-center justify-center transition-colors shrink-0"
            aria-label="Back to Finance"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
              Simulation · {sim.id.slice(0, 8)}
            </div>
            <h1 className="text-2xl font-bold tracking-tight mt-1">{sim.title}</h1>
            <div className="text-[11px] text-muted-foreground font-mono mt-1">
              Created {new Date(sim.createdAt).toLocaleString('id-ID')}
              {sim.completedAt && ` · Completed ${new Date(sim.completedAt).toLocaleString('id-ID')}`}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isCompleted && (
            <ExportPdfButton
              payload={{ kind: 'simulation', simulation: sim, agentLogs: logs }}
              label="Export PDF"
            />
          )}
          <StatusBadge status={sim.status} />
        </div>
      </div>

      {/* ============ POLLING (while running) ============ */}
      {isWorking && <SimulationPoller simulationId={sim.id} />}

      {/* ============ FAILED ERROR ============ */}
      {isFailed && (
        <div className="border border-destructive/40 bg-destructive/10 p-4 flex items-start gap-3">
          <CircleAlert className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold tracking-tight text-destructive">Simulation failed</div>
            <p className="text-[12px] text-destructive/80 mt-1 leading-relaxed">
              {sim.errorMessage ?? 'Unknown error during multi-agent execution.'}
            </p>
          </div>
        </div>
      )}

      {/* ============ SCENARIO + RESULT SUMMARY ============ */}
      <div className="grid grid-cols-[1fr_1.5fr] gap-4">
        <ScenarioCard sim={sim} />
        <ResultSummaryCard sim={sim} />
      </div>

      {/* ============ FORECAST CHART ============ */}
      {isCompleted && sim.cashflowForecast && sim.cashflowForecast.length > 0 && (
        <ForecastCard forecast={sim.cashflowForecast} />
      )}

      {/* ============ AGENT REASONING TRACE ============ */}
      {logs.length > 0 && (
        <div className="flex flex-col gap-4">
          <div>
            <div className="text-sm font-bold tracking-tight">Agent Reasoning Trace</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
              Per-agent output, confidence, and chain-of-thought
            </div>
          </div>

          {/* Stakeholders — parallel row */}
          {stakeholderLogs.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Stakeholders · parallel phase
              </div>
              <div className="grid grid-cols-2 gap-3">
                {stakeholderLogs.map((log: AgentLog) => (
                  <AgentCard key={log.id} log={log} />
                ))}
              </div>
            </div>
          )}

          {/* Synthesizer — wide */}
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

      {/* ============ EXECUTION METRICS ============ */}
      {(sim.totalDurationMs || sim.totalTokensUsed) && (
        <div className="grid grid-cols-3 gap-4">
          <Metric
            label="Total Duration"
            value={sim.totalDurationMs ? `${(sim.totalDurationMs / 1000).toFixed(1)}s` : '—'}
          />
          <Metric label="Total Tokens" value={sim.totalTokensUsed?.toLocaleString('id-ID') ?? '—'} />
          <Metric label="Confidence" value={sim.confidence != null ? `${sim.confidence}%` : '—'} />
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Scenario card
   ============================================================ */
function ScenarioCard({ sim }: { sim: Simulation }) {
  const p = sim.scenarioParams as SimulationScenarioParams;
  return (
    <div className="border border-border bg-background p-4 flex flex-col gap-3">
      <div className="text-sm font-bold tracking-tight">Scenario Parameters</div>
      <div className="grid grid-cols-2 gap-3 text-[12px]">
        <ScenarioField label="Price change" value={`${signed(p.price_change_pct)}%`} />
        <ScenarioField label="Hiring" value={`${p.hiring_delta} employee(s)`} />
        <ScenarioField
          label="Inventory budget"
          value={`IDR ${p.inventory_budget_monthly.toLocaleString('id-ID')}/mo`}
        />
        <ScenarioField label="Market growth" value={`${signed(p.market_growth_pct)}%`} />
        <ScenarioField label="Forecast window" value={`${sim.forecastMonths} month(s)`} />
        <ScenarioField label="Data seed" value={`${sim.dataSeedMonths} month(s)`} />
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

function signed(n: number) {
  return n > 0 ? `+${n}` : `${n}`;
}

/* ============================================================
   Result summary card
   ============================================================ */
function ResultSummaryCard({ sim }: { sim: Simulation }) {
  if (sim.status !== 'completed') {
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
        {sim.riskLevel && <RiskBadge level={sim.riskLevel} />}
      </div>
      {sim.summary && (
        <p className="text-[13px] leading-relaxed">{sim.summary}</p>
      )}
      {sim.finalReasoning && (
        <div className="border-l-2 border-primary pl-3 mt-1">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
            Synthesizer reasoning
          </div>
          <p className="text-[12px] text-muted-foreground leading-relaxed">{sim.finalReasoning}</p>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Forecast card with SVG chart
   ============================================================ */
function ForecastCard({ forecast }: { forecast: CashflowForecastPoint[] }) {
  return (
    <div className="border border-border bg-background p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-bold tracking-tight">Projected Cashflow</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
            {forecast.length} month forecast · IDR
          </div>
        </div>
      </div>

      <ForecastChart points={forecast} />

      <div className="grid grid-cols-[80px_1fr_1fr_1fr] gap-3 px-2 py-2 border-t border-border text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        <div>Month</div>
        <div className="text-right">Income</div>
        <div className="text-right">Expense</div>
        <div className="text-right">Net</div>
      </div>
      <div className="divide-y divide-border -mt-4">
        {forecast.map((p) => (
          <div
            key={p.month}
            className="grid grid-cols-[80px_1fr_1fr_1fr] gap-3 px-2 py-2 text-[12px] font-mono items-center"
          >
            <div>{p.month}</div>
            <div className="text-right text-primary">{currency(p.projectedIncome)}</div>
            <div className="text-right text-destructive">{currency(p.projectedExpense)}</div>
            <div
              className={`text-right font-bold ${
                p.projectedNet >= 0 ? 'text-primary' : 'text-destructive'
              }`}
            >
              {currency(p.projectedNet)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ForecastChart({ points }: { points: CashflowForecastPoint[] }) {
  const W = 800;
  const H = 220;
  const padL = 60;
  const padR = 12;
  const padT = 12;
  const padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const values = points.flatMap((p) => [p.projectedIncome, p.projectedExpense, p.projectedNet]);
  const maxAbs = Math.max(1, ...values.map(Math.abs));
  const midY = padT + innerH / 2;

  const stepX = points.length > 1 ? innerW / (points.length - 1) : innerW;
  const yFor = (n: number) => midY - (n / maxAbs) * (innerH / 2);

  const seriesPath = (key: 'projectedIncome' | 'projectedExpense' | 'projectedNet') =>
    points
      .map((p, i) => {
        const x = padL + i * stepX;
        const y = yFor(p[key]);
        return `${i === 0 ? 'M' : 'L'}${x},${y}`;
      })
      .join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[220px]">
      {/* zero baseline */}
      <line
        x1={padL}
        y1={midY}
        x2={W - padR}
        y2={midY}
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="3 3"
        className="text-border"
      />

      {/* y axis ticks */}
      {[-1, -0.5, 0, 0.5, 1].map((t) => {
        const y = midY - t * (innerH / 2);
        const v = t * maxAbs;
        return (
          <g key={t}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="currentColor" strokeWidth="0.5" className="text-border" />
            <text
              x={padL - 4}
              y={y + 3}
              textAnchor="end"
              className="fill-muted-foreground"
              fontSize="9"
              fontFamily="ui-monospace, monospace"
            >
              {compactCurrency(v)}
            </text>
          </g>
        );
      })}

      <path d={seriesPath('projectedIncome')} fill="none" stroke="currentColor" strokeWidth="2" className="text-primary" />
      <path d={seriesPath('projectedExpense')} fill="none" stroke="currentColor" strokeWidth="2" className="text-destructive" />
      <path
        d={seriesPath('projectedNet')}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeDasharray="0"
        className="text-foreground"
      />

      {points.map((p, i) => {
        const x = padL + i * stepX;
        return (
          <g key={p.month}>
            <rect x={x - 2} y={yFor(p.projectedIncome) - 2} width="4" height="4" className="fill-primary" />
            <rect x={x - 2} y={yFor(p.projectedExpense) - 2} width="4" height="4" className="fill-destructive" />
            <rect x={x - 2} y={yFor(p.projectedNet) - 2} width="4" height="4" className="fill-foreground" />
            <text
              x={x}
              y={H - 10}
              textAnchor="middle"
              className="fill-muted-foreground"
              fontSize="10"
              fontFamily="ui-monospace, monospace"
            >
              {p.month}
            </text>
          </g>
        );
      })}

      {/* legend */}
      <g transform={`translate(${padL},${padT})`}>
        <rect x="0" y="0" width="8" height="8" className="fill-primary" />
        <text x="12" y="8" fontSize="9" className="fill-muted-foreground" fontFamily="ui-monospace, monospace">
          Income
        </text>
        <rect x="62" y="0" width="8" height="8" className="fill-destructive" />
        <text x="74" y="8" fontSize="9" className="fill-muted-foreground" fontFamily="ui-monospace, monospace">
          Expense
        </text>
        <rect x="130" y="0" width="8" height="8" className="fill-foreground" />
        <text x="142" y="8" fontSize="9" className="fill-muted-foreground" fontFamily="ui-monospace, monospace">
          Net
        </text>
      </g>
    </svg>
  );
}

/* ============================================================
   Agent reasoning card
   ============================================================ */
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
          {log.confidence != null && <ConfidenceBadge confidence={log.confidence} />}
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

      {/* Structured output */}
      <div className={`grid ${wide ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'} gap-2 text-[11px]`}>
        {Object.entries(output)
          .filter(([k]) => k !== 'reasoning' && k !== 'confidence' && k !== 'monthly_forecast')
          .map(([k, v]) => (
            <OutputField key={k} k={k} v={v} />
          ))}
      </div>
    </div>
  );
}

function OutputField({ k, v }: { k: string; v: unknown }) {
  return (
    <div className="border border-border bg-accent/20 px-2 py-1.5">
      <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
        {k.replace(/_/g, ' ')}
      </div>
      <div className="font-mono mt-0.5 break-words">{renderValue(v)}</div>
    </div>
  );
}

function renderValue(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (Array.isArray(v)) return v.map((x) => String(x)).join(' · ');
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const tone = confidence >= 70 ? 'text-primary' : confidence >= 40 ? 'text-foreground' : 'text-destructive';
  return (
    <span
      className={`inline-flex items-center px-2 py-1 text-[10px] font-bold uppercase tracking-widest border border-border bg-background font-mono ${tone}`}
    >
      conf {confidence}%
    </span>
  );
}

/* ============================================================
   Status + Risk badges + Metric
   ============================================================ */
function StatusBadge({ status }: { status: Simulation['status'] }) {
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

function RiskBadge({ level }: { level: NonNullable<Simulation['riskLevel']> }) {
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
