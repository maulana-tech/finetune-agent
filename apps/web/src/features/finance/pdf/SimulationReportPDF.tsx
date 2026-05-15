import { Document, Page, Text, View, Svg, Line, Polyline } from '@react-pdf/renderer';
import type {
  Simulation,
  CashflowForecastPoint,
  SimulationScenarioParams,
} from '@repo/db';
import { pdfStyles as s } from './styles';

type AgentLogLike = {
  id: string;
  agentName: string;
  agentRole: string;
  stepNumber: number;
  reasoning: string;
  confidence: number | null;
  durationMs: number | null;
  tokensUsed: number | null;
  output: unknown;
};

interface Props {
  simulation: Simulation;
  agentLogs: AgentLogLike[];
}

const idr = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);

export function SimulationReportPDF({ simulation, agentLogs }: Props) {
  const scenario = simulation.scenarioParams as SimulationScenarioParams;
  const forecast = (simulation.cashflowForecast ?? []) as CashflowForecastPoint[];
  const stakeholders = agentLogs.filter((l) => l.stepNumber === 1);
  const synthesizer = agentLogs.find((l) => l.agentName === 'synthesizer');

  return (
    <Document
      title={`Simulation Report — ${simulation.title}`}
      author="Cofounder · Multi-Agent Finance Simulation"
    >
      <Page size="A4" style={s.page}>
        {/* HEADER */}
        <View style={s.section}>
          <Text style={s.label}>Multi-Agent Finance Simulation Report</Text>
          <Text style={s.h1}>{simulation.title}</Text>
          <View style={[s.row, { justifyContent: 'space-between', marginTop: 4 }]}>
            <Text style={s.smallMono}>
              Sim ID: {simulation.id.slice(0, 8)} · Exec: {simulation.executionId.slice(0, 8)}
            </Text>
            <Text style={s.smallMono}>
              {simulation.completedAt
                ? `Completed ${new Date(simulation.completedAt).toLocaleString('id-ID')}`
                : `Created ${new Date(simulation.createdAt).toLocaleString('id-ID')}`}
            </Text>
          </View>
        </View>

        {/* SCENARIO + RESULT — 2 columns */}
        <View style={[s.row, { gap: 10 }]}>
          {/* Scenario */}
          <View style={[s.card, { flex: 1 }]}>
            <Text style={s.h2}>Scenario</Text>
            <ScenarioRow label="Price change" value={`${signed(scenario.price_change_pct)}%`} />
            <ScenarioRow label="Hiring" value={`${scenario.hiring_delta} employee(s)`} />
            <ScenarioRow
              label="Inventory budget"
              value={`IDR ${scenario.inventory_budget_monthly.toLocaleString('id-ID')}/mo`}
            />
            <ScenarioRow label="Market growth" value={`${signed(scenario.market_growth_pct)}%`} />
            <ScenarioRow label="Forecast window" value={`${simulation.forecastMonths} month(s)`} />
            <ScenarioRow label="Data seed" value={`${simulation.dataSeedMonths} month(s)`} />
          </View>

          {/* Result */}
          <View style={[s.card, { flex: 1 }]}>
            <View style={[s.row, { justifyContent: 'space-between', alignItems: 'flex-start' }]}>
              <Text style={s.h2}>Final Result</Text>
              {simulation.riskLevel && (
                <Text style={s.badge}>Risk: {simulation.riskLevel}</Text>
              )}
            </View>
            {simulation.summary && (
              <Text style={{ marginTop: 4, lineHeight: 1.5 }}>{simulation.summary}</Text>
            )}
            {simulation.finalReasoning && (
              <View style={{ marginTop: 6, borderLeftWidth: 1.5, borderLeftColor: '#0f1115', paddingLeft: 6 }}>
                <Text style={s.label}>Synthesizer reasoning</Text>
                <Text style={[s.muted, { marginTop: 2, lineHeight: 1.5 }]}>{simulation.finalReasoning}</Text>
              </View>
            )}
          </View>
        </View>

        {/* FORECAST */}
        {forecast.length > 0 && (
          <View style={[s.section, { marginTop: 10 }]}>
            <Text style={s.h2}>Projected Cashflow</Text>
            <ForecastChart points={forecast} />

            <View style={s.tableHeader}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Month</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={s.label}>Income</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={s.label}>Expense</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={s.label}>Net</Text>
              </View>
            </View>
            {forecast.map((p) => (
              <View key={p.month} style={s.tableRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.tableCellMono}>{p.month}</Text>
                </View>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={s.tableCellMono}>{idr(p.projectedIncome)}</Text>
                </View>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={[s.tableCellMono, s.negative]}>{idr(p.projectedExpense)}</Text>
                </View>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={[s.tableCellMono, p.projectedNet >= 0 ? s.positive : s.negative, { fontWeight: 'bold' }]}>
                    {idr(p.projectedNet)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* AGENT TRACE */}
        {agentLogs.length > 0 && (
          <View style={s.section} break>
            <Text style={s.h2}>Agent Reasoning Trace</Text>
            <Text style={[s.small, { marginBottom: 8 }]}>
              Multi-agent pipeline: 4 stakeholders ran in parallel, then a synthesizer reconciled them into the forecast above.
            </Text>

            {/* Stakeholders */}
            {stakeholders.length > 0 && (
              <>
                <Text style={[s.label, { marginBottom: 4 }]}>Stakeholders · parallel phase</Text>
                {stakeholders.map((log) => (
                  <AgentBlock key={log.id} log={log} />
                ))}
              </>
            )}

            {/* Synthesizer */}
            {synthesizer && (
              <>
                <Text style={[s.label, { marginTop: 8, marginBottom: 4 }]}>
                  Synthesizer · final reconciliation
                </Text>
                <AgentBlock log={synthesizer} />
              </>
            )}
          </View>
        )}

        {/* EXECUTION METRICS */}
        {(simulation.totalDurationMs || simulation.totalTokensUsed || simulation.confidence != null) && (
          <View style={[s.section, { marginTop: 4 }]}>
            <View style={s.row}>
              <Metric label="Total Duration" value={simulation.totalDurationMs ? `${(simulation.totalDurationMs / 1000).toFixed(1)}s` : '—'} />
              <Metric label="Total Tokens" value={simulation.totalTokensUsed?.toLocaleString('id-ID') ?? '—'} />
              <Metric label="Confidence" value={simulation.confidence != null ? `${simulation.confidence}%` : '—'} />
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text>Cofounder · Multi-Agent Finance Simulation</Text>
          <Text
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}

function ScenarioRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={[s.row, { justifyContent: 'space-between', paddingVertical: 2 }]}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.tableCellMono}>{value}</Text>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={[s.card, { flex: 1 }]}>
      <Text style={s.label}>{label}</Text>
      <Text style={[s.h1, { marginTop: 4 }]}>{value}</Text>
    </View>
  );
}

function AgentBlock({ log }: { log: AgentLogLike }) {
  const output = (log.output ?? {}) as Record<string, unknown>;
  return (
    <View style={[s.card, { marginBottom: 6 }]} wrap={false}>
      <View style={[s.row, { justifyContent: 'space-between', marginBottom: 4 }]}>
        <View style={{ flex: 1 }}>
          <Text style={s.h3}>{capitalize(log.agentName)}</Text>
          <Text style={s.small}>{log.agentRole}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          {log.confidence != null && <Text style={s.badge}>conf {log.confidence}%</Text>}
          {log.durationMs != null && (
            <Text style={[s.smallMono, { marginTop: 2 }]}>
              {(log.durationMs / 1000).toFixed(1)}s
              {log.tokensUsed != null && ` · ${log.tokensUsed} tok`}
            </Text>
          )}
        </View>
      </View>

      {log.reasoning && (
        <View style={{ borderLeftWidth: 1, borderLeftColor: '#9aa0aa', paddingLeft: 6, marginBottom: 4 }}>
          <Text style={s.label}>Reasoning</Text>
          <Text style={{ marginTop: 2, lineHeight: 1.5 }}>{log.reasoning}</Text>
        </View>
      )}

      <View style={{ marginTop: 4 }}>
        {Object.entries(output)
          .filter(([k]) => k !== 'reasoning' && k !== 'confidence' && k !== 'monthly_forecast')
          .map(([k, v]) => (
            <View key={k} style={[s.row, { paddingVertical: 1 }]}>
              <Text style={[s.label, { width: 130 }]}>{k.replace(/_/g, ' ')}</Text>
              <Text style={[s.tableCellMono, { flex: 1 }]}>{renderValue(v)}</Text>
            </View>
          ))}
      </View>
    </View>
  );
}

function ForecastChart({ points }: { points: CashflowForecastPoint[] }) {
  const W = 520;
  const H = 140;
  const padL = 40;
  const padR = 10;
  const padT = 8;
  const padB = 24;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const values = points.flatMap((p) => [p.projectedIncome, p.projectedExpense, p.projectedNet]);
  const maxAbs = Math.max(1, ...values.map(Math.abs));
  const midY = padT + innerH / 2;
  const stepX = points.length > 1 ? innerW / (points.length - 1) : innerW;
  const yFor = (n: number) => midY - (n / maxAbs) * (innerH / 2);

  const series = (key: 'projectedIncome' | 'projectedExpense' | 'projectedNet') =>
    points.map((p, i) => `${padL + i * stepX},${yFor(p[key])}`).join(' ');

  return (
    <View style={{ marginBottom: 8 }}>
      <Svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
        {/* baseline */}
        <Line x1={padL} y1={midY} x2={W - padR} y2={midY} stroke="#cccccc" strokeWidth={0.5} strokeDasharray="2 2" />

        {/* y axis */}
        {[-1, -0.5, 0, 0.5, 1].map((t) => {
          const y = midY - t * (innerH / 2);
          return <Line key={t} x1={padL} y1={y} x2={W - padR} y2={y} stroke="#eeeeee" strokeWidth={0.3} />;
        })}

        <Polyline points={series('projectedIncome')} fill="none" stroke="#0f1115" strokeWidth={1.5} />
        <Polyline points={series('projectedExpense')} fill="none" stroke="#a83232" strokeWidth={1.5} strokeDasharray="3 2" />
        <Polyline points={series('projectedNet')} fill="none" stroke="#0f1115" strokeWidth={2} />
      </Svg>
      <View style={[s.row, { justifyContent: 'space-between', marginTop: 2 }]}>
        {points.map((p) => (
          <Text key={p.month} style={s.smallMono}>{p.month}</Text>
        ))}
      </View>
      <View style={[s.row, { gap: 12, marginTop: 4 }]}>
        <Legend color="#0f1115" label="Income" />
        <Legend color="#a83232" label="Expense (dashed)" />
        <Legend color="#0f1115" label="Net (thick)" />
      </View>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={[s.row, { alignItems: 'center', gap: 4 }]}>
      <View style={{ width: 8, height: 8, backgroundColor: color }} />
      <Text style={s.small}>{label}</Text>
    </View>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function renderValue(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (Array.isArray(v)) return v.map(String).join(' · ');
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function signed(n: number) {
  return n > 0 ? `+${n}` : `${n}`;
}
