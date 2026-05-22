import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  FileText,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  CircleAlert,
} from 'lucide-react';
import { db, transactions, simulations, type Simulation, type Transaction } from '@repo/db';
import { eq, desc, gte, and } from 'drizzle-orm';
import { getWorkspaceId } from '@/lib/get-workspace';
import { AddTransactionButton } from '@/features/finance/AddTransactionDialog';
import { ImportTransactionsButton } from '@/features/finance/ImportTransactionsDialog';
import { RunSimulationButton } from '@/features/finance/RunSimulationDialog';
import { ExportPdfButton } from '@/features/finance/ExportPdfButton';

export const dynamic = 'force-dynamic';

type KpiTone = 'positive' | 'negative' | 'neutral';
type Trend = 'up' | 'down';

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

export default async function FinancePage() {
  const workspaceId = await getWorkspaceId();
  const now = new Date();
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const sinceStr = threeMonthsAgo.toISOString().slice(0, 10);

  const [txns, sims] = await Promise.all([
    db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.workspaceId, workspaceId),
          gte(transactions.txDate, sinceStr),
        ),
      )
      .orderBy(desc(transactions.txDate)),
    db
      .select()
      .from(simulations)
      .where(eq(simulations.workspaceId, workspaceId))
      .orderBy(desc(simulations.createdAt))
      .limit(5),
  ]);

  const kpis = computeKpis(txns);
  const monthlySeries = computeMonthlySeries(txns);
  const recentTxns = txns.slice(0, 8);
  const latestSim = sims[0];

  return (
    <div className="p-6 h-full flex flex-col gap-6 overflow-auto">
      {/* ============ HEADER ============ */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finance</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cashflow overview, transactions, and AI-powered multi-agent forecast simulations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportPdfButton
            payload={{ kind: 'summary', transactions: txns, latestSimulation: latestSim }}
            label="Export PDF"
          />
          <ImportTransactionsButton />
          <RunSimulationButton />
          <AddTransactionButton />
        </div>
      </div>

      {/* ============ KPI CARDS ============ */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Total Income"
          value={kpis.income}
          delta={kpis.incomeCount > 0 ? `${kpis.incomeCount} txns / 6mo` : '—'}
          trend="up"
          tone="positive"
          icon={TrendingUp}
        />
        <KpiCard
          label="Total Expense"
          value={kpis.expense}
          delta={kpis.expenseCount > 0 ? `${kpis.expenseCount} txns / 6mo` : '—'}
          trend="down"
          tone="negative"
          icon={TrendingDown}
        />
        <KpiCard
          label="Net Balance"
          value={kpis.net}
          delta={kpis.net >= 0 ? 'Positive' : 'Negative'}
          trend={kpis.net >= 0 ? 'up' : 'down'}
          tone={kpis.net >= 0 ? 'positive' : 'negative'}
          icon={Wallet}
        />
        <KpiCard
          label="Pending Invoices"
          value={kpis.pendingInvoices}
          delta={`${kpis.pendingInvoicesCount} open`}
          trend="up"
          tone="neutral"
          icon={FileText}
        />
      </div>

      {/* ============ CHARTS ROW ============ */}
      <div className="grid grid-cols-[1.4fr_1fr] gap-4">
        <ChartCard title="Income vs Expense" subtitle="Last 6 months">
          <IncomeVsExpenseChart data={monthlySeries} />
          <ChartLegend
            items={[
              { color: 'bg-primary', label: 'Income' },
              { color: 'bg-muted-foreground', label: 'Expense' },
            ]}
          />
        </ChartCard>

        <ChartCard title="Net Cashflow Trend" subtitle="Last 6 months">
          <NetCashflowChart data={monthlySeries} />
          <ChartLegend
            items={[
              { color: 'bg-primary', label: 'Net' },
              { color: 'bg-border', label: 'Baseline' },
            ]}
          />
        </ChartCard>
      </div>

      {/* ============ SIMULATION + RECENT ROW ============ */}
      <div className="grid grid-cols-[1fr_1.4fr] gap-4">
        <LatestSimulationCard sim={latestSim} />
        <RecentTransactionsCard txns={recentTxns} />
      </div>

      {/* ============ SIMULATION HISTORY ============ */}
      {sims.length > 0 && (
        <div className="border border-border bg-background flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="text-sm font-bold tracking-tight">Simulation History</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
              Last {sims.length} multi-agent runs
            </div>
          </div>
          <div className="grid grid-cols-[1fr_120px_100px_120px_100px] gap-4 px-4 py-2 border-b border-border text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <div>Title</div>
            <div>Forecast</div>
            <div>Risk</div>
            <div>Status</div>
            <div className="text-right">Action</div>
          </div>
          {sims.map((s: Simulation) => (
            <SimulationHistoryRow key={s.id} sim={s} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Compute helpers
   ============================================================ */
function computeKpis(txns: Transaction[]) {
  let income = 0;
  let expense = 0;
  let pendingInvoices = 0;
  let pendingInvoicesCount = 0;
  let incomeCount = 0;
  let expenseCount = 0;

  for (const t of txns) {
    const amt = Number(t.amount);
    if (t.type === 'income') {
      income += amt;
      incomeCount += 1;
    } else if (t.type === 'expense') {
      expense += amt;
      expenseCount += 1;
    } else if (t.type === 'invoice') {
      // Treat invoices as pending receivables (not yet collected)
      pendingInvoices += amt;
      pendingInvoicesCount += 1;
    }
  }

  return {
    income,
    expense,
    net: income - expense,
    pendingInvoices,
    pendingInvoicesCount,
    incomeCount,
    expenseCount,
  };
}

function computeMonthlySeries(txns: Transaction[]) {
  const months: { month: string; income: number; expense: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      income: 0,
      expense: 0,
    });
  }
  const indexByKey = new Map<string, number>();
  for (let i = 0; i < months.length; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    indexByKey.set(`${d.getFullYear()}-${d.getMonth()}`, i);
  }
  for (const t of txns) {
    const d = new Date(t.txDate);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const idx = indexByKey.get(key);
    if (idx === undefined) continue;
    const amt = Number(t.amount);
    if (t.type === 'income' || t.type === 'invoice') {
      months[idx].income += amt;
    } else if (t.type === 'expense') {
      months[idx].expense += amt;
    }
  }
  return months;
}

/* ============================================================
   KPI Card
   ============================================================ */
function KpiCard({
  label,
  value,
  delta,
  trend,
  tone,
  icon: Icon,
}: {
  label: string;
  value: number;
  delta: string;
  trend: Trend;
  tone: KpiTone;
  icon: typeof TrendingUp;
}) {
  const valueColor =
    tone === 'positive'
      ? 'text-primary'
      : tone === 'negative'
      ? 'text-destructive'
      : 'text-foreground';
  const TrendIcon = trend === 'up' ? ArrowUpRight : ArrowDownRight;
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
      <div className={`text-2xl font-bold tabular-nums ${valueColor}`}>
        {value === 0 ? '—' : currency(value)}
      </div>
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
        <TrendIcon className="w-3 h-3" />
        {delta}
      </div>
    </div>
  );
}

/* ============================================================
   Chart card shell + legend
   ============================================================ */
function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-border bg-background p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-bold tracking-tight">{title}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
            {subtitle}
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

function ChartLegend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div className="flex items-center gap-4 pt-2 border-t border-border">
      {items.map((it) => (
        <div
          key={it.label}
          className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground font-bold"
        >
          <div className={`w-3 h-3 ${it.color} border border-border`} />
          {it.label}
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   Income vs Expense — grouped bar chart (SVG)
   ============================================================ */
function IncomeVsExpenseChart({
  data,
}: {
  data: { month: string; income: number; expense: number }[];
}) {
  const W = 560;
  const H = 200;
  const padL = 28;
  const padR = 8;
  const padT = 8;
  const padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]));
  const groupW = innerW / data.length;
  const barW = Math.min(18, (groupW - 8) / 2);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[200px]" aria-label="Income vs Expense">
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = padT + innerH * (1 - t);
        return (
          <line
            key={t}
            x1={padL}
            y1={y}
            x2={W - padR}
            y2={y}
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-border"
          />
        );
      })}
      {data.map((d, i) => {
        const x0 = padL + i * groupW + groupW / 2;
        const incomeH = (d.income / max) * innerH;
        const expenseH = (d.expense / max) * innerH;
        return (
          <g key={i}>
            <rect
              x={x0 - barW - 2}
              y={padT + innerH - incomeH}
              width={barW}
              height={incomeH}
              className="fill-primary"
            />
            <rect
              x={x0 + 2}
              y={padT + innerH - expenseH}
              width={barW}
              height={expenseH}
              className="fill-muted-foreground"
            />
            <text
              x={x0}
              y={H - 10}
              textAnchor="middle"
              className="fill-muted-foreground"
              fontSize="10"
              fontFamily="ui-monospace, monospace"
            >
              {d.month}
            </text>
          </g>
        );
      })}
      {data.every((d) => d.income === 0 && d.expense === 0) && (
        <text
          x={W / 2}
          y={H / 2}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize="11"
          fontFamily="ui-monospace, monospace"
        >
          NO TRANSACTIONS YET
        </text>
      )}
    </svg>
  );
}

/* ============================================================
   Net Cashflow — area + line (SVG)
   ============================================================ */
function NetCashflowChart({
  data,
}: {
  data: { month: string; income: number; expense: number }[];
}) {
  const W = 360;
  const H = 200;
  const padL = 22;
  const padR = 8;
  const padT = 8;
  const padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const nets = data.map((d) => d.income - d.expense);
  const max = Math.max(1, ...nets.map(Math.abs));
  const midY = padT + innerH / 2;

  const stepX = data.length > 1 ? innerW / (data.length - 1) : innerW;
  const pts = nets.map((n, i) => {
    const x = padL + i * stepX;
    const y = midY - (n / max) * (innerH / 2);
    return { x, y };
  });

  const polyline = pts.map((p) => `${p.x},${p.y}`).join(' ');
  const area =
    pts.length > 0
      ? `${pts[0].x},${midY} ${polyline} ${pts[pts.length - 1].x},${midY}`
      : '';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[200px]" aria-label="Net Cashflow Trend">
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
      <polygon points={area} className="fill-primary/10" />
      <polyline points={polyline} fill="none" stroke="currentColor" strokeWidth="2" className="text-primary" />
      {pts.map((p, i) => (
        <rect key={i} x={p.x - 2} y={p.y - 2} width="4" height="4" className="fill-primary" />
      ))}
      {data.map((d, i) => (
        <text
          key={i}
          x={padL + i * stepX}
          y={H - 10}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize="10"
          fontFamily="ui-monospace, monospace"
        >
          {d.month}
        </text>
      ))}
      {nets.every((n) => n === 0) && (
        <text
          x={W / 2}
          y={midY - 12}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize="11"
          fontFamily="ui-monospace, monospace"
        >
          NO DATA
        </text>
      )}
    </svg>
  );
}

/* ============================================================
   Latest Simulation
   ============================================================ */
function LatestSimulationCard({ sim }: { sim?: Simulation }) {
  if (!sim) {
    return (
      <div className="border border-border bg-background p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-bold tracking-tight">Latest Simulation</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
              Multi-agent cashflow forecast
            </div>
          </div>
          <Sparkles className="w-4 h-4 text-primary" />
        </div>

        <div className="flex-1 flex items-center justify-center border border-dashed border-border bg-accent/10 p-6 min-h-[180px]">
          <div className="text-center max-w-[260px]">
            <AlertTriangle className="w-8 h-8 mx-auto text-muted-foreground/40 mb-3" />
            <div className="font-bold text-xs mb-1">No Simulation Yet</div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Run a simulation to project cashflow under price, hiring, inventory, and market growth scenarios.
            </p>
          </div>
        </div>

        <RunSimulationButton variant="ghost-full" />
      </div>
    );
  }

  return (
    <div className="border border-border bg-background p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
            Latest Simulation
          </div>
          <div className="text-sm font-bold tracking-tight mt-1 line-clamp-1">{sim.title}</div>
        </div>
        <StatusBadge status={sim.status} />
      </div>

      {sim.riskLevel && (
        <div className="flex items-center gap-2">
          <RiskBadge level={sim.riskLevel} />
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
            {sim.forecastMonths}mo forecast · conf {sim.confidence ?? '—'}%
          </div>
        </div>
      )}

      {sim.summary && (
        <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-4">{sim.summary}</p>
      )}

      <Link
        href={`/dashboard/finance/simulations/${sim.id}`}
        className="mt-auto h-10 border border-border bg-background text-[10px] font-bold uppercase tracking-widest hover:bg-accent transition-colors flex items-center justify-center gap-2"
      >
        View Full Report →
      </Link>
    </div>
  );
}

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
      className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-widest border border-border ${cfg.cls}`}
    >
      <cfg.Icon className={`w-3 h-3 ${cfg.spin ? 'animate-spin' : ''}`} />
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

/* ============================================================
   Recent Transactions
   ============================================================ */
function RecentTransactionsCard({ txns }: { txns: Transaction[] }) {
  return (
    <div className="border border-border bg-background flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <div className="text-sm font-bold tracking-tight">Recent Transactions</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
            Latest income, expense, and invoices
          </div>
        </div>
        <AddTransactionButton variant="link-only" />
      </div>

      <div className="grid grid-cols-[100px_90px_1fr_120px] gap-4 px-4 py-2 border-b border-border text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        <div>Date</div>
        <div>Type</div>
        <div>Description</div>
        <div className="text-right">Amount</div>
      </div>

      {txns.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-10 min-h-[180px]">
          <div className="text-center max-w-[320px]">
            <FileText className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <div className="font-bold text-xs mb-1">No Transactions</div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Add your first transaction to seed the multi-agent simulation
              (Owner / Supplier / Customer / Bank).
            </p>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {txns.map((t) => {
            const isExpense = t.type === 'expense';
            return (
              <div key={t.id} className="grid grid-cols-[100px_90px_1fr_120px] gap-4 px-4 py-3 text-[12px] items-center">
                <div className="font-mono text-muted-foreground">{t.txDate}</div>
                <div>
                  <span
                    className={`inline-block px-1.5 py-0.5 border border-border text-[10px] font-bold uppercase tracking-widest ${
                      t.type === 'income'
                        ? 'text-primary bg-accent'
                        : t.type === 'expense'
                        ? 'text-destructive bg-destructive/10'
                        : 'text-foreground bg-muted'
                    }`}
                  >
                    {t.type}
                  </span>
                </div>
                <div className="truncate">
                  <span className="font-medium">{t.category}</span>
                  {t.description && (
                    <span className="text-muted-foreground"> · {t.description}</span>
                  )}
                </div>
                <div
                  className={`text-right font-mono tabular-nums ${
                    isExpense ? 'text-destructive' : 'text-foreground'
                  }`}
                >
                  {isExpense ? '−' : '+'}
                  {compactCurrency(Number(t.amount))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Simulation history row
   ============================================================ */
function SimulationHistoryRow({ sim }: { sim: Simulation }) {
  return (
    <div className="grid grid-cols-[1fr_120px_100px_120px_100px] gap-4 px-4 py-3 border-b border-border last:border-b-0 text-[12px] items-center">
      <div className="truncate">
        <div className="font-medium">{sim.title}</div>
        <div className="text-[10px] text-muted-foreground font-mono">
          {new Date(sim.createdAt).toLocaleString('id-ID')}
        </div>
      </div>
      <div className="font-mono text-[11px] text-muted-foreground">{sim.forecastMonths} month(s)</div>
      <div>{sim.riskLevel ? <RiskBadge level={sim.riskLevel} /> : <span className="text-muted-foreground">—</span>}</div>
      <div>
        <StatusBadge status={sim.status} />
      </div>
      <div className="text-right">
        <Link
          href={`/dashboard/finance/simulations/${sim.id}`}
          className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          Open →
        </Link>
      </div>
    </div>
  );
}
