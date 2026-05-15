import { Document, Page, Text, View, Svg, Line, Rect } from '@react-pdf/renderer';
import type { Simulation, Transaction } from '@repo/db';
import { pdfStyles as s } from './styles';

interface Props {
  transactions: Transaction[]; // last 6 months
  latestSimulation?: Simulation;
  generatedAt?: Date;
}

interface MonthlyPoint {
  month: string;
  income: number;
  expense: number;
}

const idr = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);

const idrCompact = (n: number) =>
  new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(n);

export function FinanceSummaryPDF({ transactions, latestSimulation, generatedAt }: Props) {
  const kpis = computeKpis(transactions);
  const series = computeMonthlySeries(transactions);
  const date = generatedAt ?? new Date();

  return (
    <Document
      title="Finance Summary"
      author="Cofounder · Finance Dashboard Export"
    >
      <Page size="A4" style={s.page}>
        {/* HEADER */}
        <View style={s.section}>
          <Text style={s.label}>Finance Dashboard Export</Text>
          <Text style={s.h1}>Cashflow Summary — Last 6 Months</Text>
          <Text style={s.smallMono}>Generated {date.toLocaleString('id-ID')}</Text>
        </View>

        {/* KPI CARDS */}
        <View style={[s.row, { gap: 8 }]}>
          <KpiCard label="Total Income" value={kpis.income} subtitle={`${kpis.incomeCount} txns`} tone="positive" />
          <KpiCard label="Total Expense" value={kpis.expense} subtitle={`${kpis.expenseCount} txns`} tone="negative" />
          <KpiCard label="Net Balance" value={kpis.net} subtitle={kpis.net >= 0 ? 'positive' : 'negative'} tone={kpis.net >= 0 ? 'positive' : 'negative'} />
          <KpiCard label="Pending Invoices" value={kpis.pendingInvoices} subtitle={`${kpis.pendingInvoicesCount} open`} tone="neutral" />
        </View>

        {/* CHART */}
        <View style={s.section}>
          <Text style={s.h2}>Income vs Expense</Text>
          <IncomeVsExpenseChart data={series} />
        </View>

        {/* LATEST SIMULATION */}
        {latestSimulation && (
          <View style={[s.card, { marginTop: 4 }]}>
            <View style={[s.row, { justifyContent: 'space-between' }]}>
              <Text style={s.h2}>Latest Simulation</Text>
              {latestSimulation.riskLevel && (
                <Text style={s.badge}>Risk: {latestSimulation.riskLevel}</Text>
              )}
            </View>
            <Text style={[s.h3, { marginTop: 4 }]}>{latestSimulation.title}</Text>
            <Text style={[s.smallMono, { marginTop: 2 }]}>
              {latestSimulation.forecastMonths} month forecast · status {latestSimulation.status}
              {latestSimulation.confidence != null && ` · confidence ${latestSimulation.confidence}%`}
            </Text>
            {latestSimulation.summary && (
              <Text style={{ marginTop: 6, lineHeight: 1.5 }}>{latestSimulation.summary}</Text>
            )}
          </View>
        )}

        {/* RECENT TRANSACTIONS */}
        <View style={s.section}>
          <Text style={s.h2}>Recent Transactions (Top 15)</Text>
          <View style={s.tableHeader}>
            <View style={{ flex: 1.4 }}>
              <Text style={s.label}>Date</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Type</Text>
            </View>
            <View style={{ flex: 3 }}>
              <Text style={s.label}>Category / Description</Text>
            </View>
            <View style={{ flex: 1.4, alignItems: 'flex-end' }}>
              <Text style={s.label}>Amount</Text>
            </View>
          </View>
          {transactions.slice(0, 15).map((t) => {
            const amt = Number(t.amount);
            const isExpense = t.type === 'expense';
            return (
              <View key={t.id} style={s.tableRow}>
                <View style={{ flex: 1.4 }}>
                  <Text style={s.tableCellMono}>{t.txDate}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.badge, { alignSelf: 'flex-start' }]}>{t.type}</Text>
                </View>
                <View style={{ flex: 3 }}>
                  <Text style={s.tableCell}>{t.category}</Text>
                  {t.description && <Text style={s.small}>{t.description}</Text>}
                </View>
                <View style={{ flex: 1.4, alignItems: 'flex-end' }}>
                  <Text style={[s.tableCellMono, isExpense ? s.negative : s.positive, { fontWeight: 'bold' }]}>
                    {isExpense ? '−' : '+'} {idr(amt)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={s.footer} fixed>
          <Text>Cofounder · Finance Dashboard</Text>
          <Text
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}

/* ============================================================
   Sub-components
   ============================================================ */

function KpiCard({
  label,
  value,
  subtitle,
  tone,
}: {
  label: string;
  value: number;
  subtitle: string;
  tone: 'positive' | 'negative' | 'neutral';
}) {
  return (
    <View style={[s.card, { flex: 1 }]}>
      <Text style={s.label}>{label}</Text>
      <Text
        style={[
          s.h1,
          { fontSize: 14, marginTop: 4 },
          tone === 'negative' ? s.negative : s.positive,
        ]}
      >
        {value === 0 ? '—' : idr(value)}
      </Text>
      <Text style={[s.smallMono, { marginTop: 2 }]}>{subtitle}</Text>
    </View>
  );
}

function IncomeVsExpenseChart({ data }: { data: MonthlyPoint[] }) {
  const W = 520;
  const H = 160;
  const padL = 50;
  const padR = 10;
  const padT = 10;
  const padB = 22;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]));
  const groupW = innerW / data.length;
  const barW = Math.min(16, (groupW - 6) / 2);

  return (
    <View style={{ marginBottom: 6 }}>
      <Svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = padT + innerH * (1 - t);
          return <Line key={t} x1={padL} y1={y} x2={W - padR} y2={y} stroke="#eeeeee" strokeWidth={0.3} />;
        })}
        {data.map((d, i) => {
          const x0 = padL + i * groupW + groupW / 2;
          const incomeH = (d.income / max) * innerH;
          const expenseH = (d.expense / max) * innerH;
          return (
            <View key={d.month}>
              <Rect x={x0 - barW - 2} y={padT + innerH - incomeH} width={barW} height={incomeH} fill="#0f1115" />
              <Rect x={x0 + 2} y={padT + innerH - expenseH} width={barW} height={expenseH} fill="#6b7180" />
            </View>
          );
        })}
      </Svg>
      <View style={[s.row, { justifyContent: 'space-between', paddingHorizontal: padL, marginTop: 2 }]}>
        {data.map((d) => (
          <Text key={d.month} style={s.smallMono}>{d.month}</Text>
        ))}
      </View>
      <View style={[s.row, { gap: 12, marginTop: 4 }]}>
        <View style={[s.row, { alignItems: 'center', gap: 4 }]}>
          <View style={{ width: 8, height: 8, backgroundColor: '#0f1115' }} />
          <Text style={s.small}>Income</Text>
        </View>
        <View style={[s.row, { alignItems: 'center', gap: 4 }]}>
          <View style={{ width: 8, height: 8, backgroundColor: '#6b7180' }} />
          <Text style={s.small}>Expense</Text>
        </View>
      </View>
      <Text style={[s.small, { marginTop: 4 }]}>
        Max bar height = {idrCompact(max)} (monthly)
      </Text>
    </View>
  );
}

/* ============================================================
   Compute helpers (mirrors finance page)
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
      pendingInvoices += amt;
      pendingInvoicesCount += 1;
    }
  }
  return { income, expense, net: income - expense, pendingInvoices, pendingInvoicesCount, incomeCount, expenseCount };
}

function computeMonthlySeries(txns: Transaction[]): MonthlyPoint[] {
  const now = new Date();
  const months: MonthlyPoint[] = [];
  const indexByKey = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const idx = months.length;
    months.push({ month: d.toLocaleDateString('en-US', { month: 'short' }), income: 0, expense: 0 });
    indexByKey.set(`${d.getFullYear()}-${d.getMonth()}`, idx);
  }
  for (const t of txns) {
    const d = new Date(t.txDate);
    const idx = indexByKey.get(`${d.getFullYear()}-${d.getMonth()}`);
    if (idx === undefined) continue;
    const amt = Number(t.amount);
    if (t.type === 'income' || t.type === 'invoice') months[idx].income += amt;
    else if (t.type === 'expense') months[idx].expense += amt;
  }
  return months;
}
