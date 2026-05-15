'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2, ChevronRight } from 'lucide-react';
import { DEV_WORKSPACE_ID, apiUrl } from '@/lib/workspace';
import { Field, Modal } from './AddTransactionDialog';

type ForecastMonths = 1 | 2 | 3 | 6;

interface Scenario {
  price_change_pct: number;
  hiring_delta: number;
  inventory_budget_monthly: number;
  market_growth_pct: number;
}

const DEFAULT_SCENARIO: Scenario = {
  price_change_pct: 0,
  hiring_delta: 0,
  inventory_budget_monthly: 0,
  market_growth_pct: 0,
};

const idr = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n);

const AGENTS = [
  { name: 'Owner', role: 'Revenue strategy, margin, hiring, growth' },
  { name: 'Supplier', role: 'Supply chain, cost pressure, lead time' },
  { name: 'Customer', role: 'Price sensitivity, demand, churn' },
  { name: 'Bank', role: 'Runway, debt service, credit recommendation' },
] as const;

export function RunSimulationButton({
  variant = 'primary',
}: {
  variant?: 'primary' | 'ghost-full';
}) {
  const [open, setOpen] = useState(false);

  if (variant === 'ghost-full') {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="h-10 w-full border border-border bg-background text-[10px] font-bold uppercase tracking-widest hover:bg-accent transition-colors flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Start First Simulation
        </button>
        {open && <RunSimulationDialog onClose={() => setOpen(false)} />}
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="h-10 px-4 border border-border bg-background text-[10px] font-bold uppercase tracking-widest hover:bg-accent transition-colors flex items-center gap-2"
      >
        <Sparkles className="w-4 h-4" />
        Run Simulation
      </button>
      {open && <RunSimulationDialog onClose={() => setOpen(false)} />}
    </>
  );
}

function RunSimulationDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [dataSeedMonths, setDataSeedMonths] = useState(6);
  const [scenario, setScenario] = useState<Scenario>(DEFAULT_SCENARIO);
  const [title, setTitle] = useState('');
  const [forecastMonths, setForecastMonths] = useState<ForecastMonths>(3);

  const onSubmit = () => {
    setError(null);
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch(`${apiUrl()}/finance/simulations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspaceId: DEV_WORKSPACE_ID,
            title: title.trim(),
            scenarioParams: scenario,
            forecastMonths,
            dataSeedMonths,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.message || `HTTP ${res.status}`);
        }
        const data = await res.json();
        const simId = data?.simulation?.id;
        onClose();
        if (simId) {
          router.push(`/dashboard/finance/simulations/${simId}`);
        } else {
          router.refresh();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    });
  };

  return (
    <Modal onClose={onClose} title="Run Multi-Agent Simulation" size="lg">
      <div className="flex flex-col gap-5">
        <Stepper step={step} />

        {step === 1 && (
          <StepDataSeed
            dataSeedMonths={dataSeedMonths}
            setDataSeedMonths={setDataSeedMonths}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <StepScenario
            scenario={scenario}
            setScenario={setScenario}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <StepLaunch
            title={title}
            setTitle={setTitle}
            forecastMonths={forecastMonths}
            setForecastMonths={setForecastMonths}
            scenario={scenario}
            dataSeedMonths={dataSeedMonths}
            pending={pending}
            error={error}
            onBack={() => setStep(2)}
            onLaunch={onSubmit}
          />
        )}
      </div>
    </Modal>
  );
}

/* ============================================================
   Stepper indicator
   ============================================================ */
function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const labels = ['Data Seed', 'What-if Scenario', 'Launch'];
  return (
    <div className="flex items-center gap-2">
      {labels.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        const active = step === n;
        const done = step > n;
        return (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div
              className={`w-6 h-6 border border-border flex items-center justify-center text-[10px] font-bold ${
                active
                  ? 'bg-primary text-primary-foreground'
                  : done
                  ? 'bg-accent text-foreground'
                  : 'bg-background text-muted-foreground'
              }`}
            >
              {n}
            </div>
            <div
              className={`text-[10px] uppercase tracking-widest font-bold ${
                active ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              {label}
            </div>
            {i < labels.length - 1 && <div className="flex-1 h-px bg-border" />}
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   Step 1 — Data seed
   ============================================================ */
function StepDataSeed({
  dataSeedMonths,
  setDataSeedMonths,
  onNext,
}: {
  dataSeedMonths: number;
  setDataSeedMonths: (n: number) => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="text-sm font-bold tracking-tight">Step 1 · Data Seed</div>
        <p className="text-[12px] text-muted-foreground mt-1">
          Choose how many months of historical transactions to feed the agents
          as context. More history → more confident forecast.
        </p>
      </div>

      <Field label={`Historical Window — ${dataSeedMonths} month(s)`}>
        <input
          type="range"
          min={1}
          max={12}
          step={1}
          value={dataSeedMonths}
          onChange={(e) => setDataSeedMonths(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
          <span>1mo</span>
          <span>6mo</span>
          <span>12mo</span>
        </div>
      </Field>

      <div className="border border-border bg-accent/20 p-3 text-[11px] text-muted-foreground leading-relaxed">
        Agents will receive: total income / expense, average monthly figures,
        and top-5 categories computed from this window.
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
        <button
          onClick={onNext}
          className="h-10 px-4 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          Next: Scenario
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   Step 2 — What-if scenario
   ============================================================ */
function StepScenario({
  scenario,
  setScenario,
  onBack,
  onNext,
}: {
  scenario: Scenario;
  setScenario: (s: Scenario) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="text-sm font-bold tracking-tight">Step 2 · What-if Scenario</div>
        <p className="text-[12px] text-muted-foreground mt-1">
          Adjust the 4 levers. All 4 stakeholder agents will reason about how
          this scenario affects their domain.
        </p>
      </div>

      <Slider
        label="Price Change"
        unit="%"
        min={-30}
        max={50}
        step={1}
        value={scenario.price_change_pct}
        onChange={(v) => setScenario({ ...scenario, price_change_pct: v })}
        marks={['-30%', '0%', '+50%']}
      />
      <Slider
        label="Hiring"
        unit=" employees"
        min={0}
        max={10}
        step={1}
        value={scenario.hiring_delta}
        onChange={(v) => setScenario({ ...scenario, hiring_delta: v })}
        marks={['0', '5', '10']}
      />
      <Slider
        label="Inventory Budget (Monthly)"
        formatValue={(v) => `IDR ${idr(v)}`}
        min={0}
        max={20_000_000}
        step={500_000}
        value={scenario.inventory_budget_monthly}
        onChange={(v) =>
          setScenario({ ...scenario, inventory_budget_monthly: v })
        }
        marks={['IDR 0', 'IDR 10M', 'IDR 20M']}
      />
      <Slider
        label="Market Growth"
        unit="%"
        min={-20}
        max={30}
        step={1}
        value={scenario.market_growth_pct}
        onChange={(v) => setScenario({ ...scenario, market_growth_pct: v })}
        marks={['-20%', '0%', '+30%']}
      />

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
        <button
          onClick={onBack}
          className="h-10 px-4 border border-border bg-background text-[10px] font-bold uppercase tracking-widest hover:bg-accent transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="h-10 px-4 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          Next: Launch
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function Slider({
  label,
  unit,
  formatValue,
  min,
  max,
  step,
  value,
  onChange,
  marks,
}: {
  label: string;
  unit?: string;
  formatValue?: (v: number) => string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  marks?: string[];
}) {
  const display = formatValue ? formatValue(value) : `${value}${unit ?? ''}`;
  return (
    <Field label={`${label} — ${display}`}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
      {marks && (
        <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
          {marks.map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
      )}
    </Field>
  );
}

/* ============================================================
   Step 3 — Launch
   ============================================================ */
function StepLaunch({
  title,
  setTitle,
  forecastMonths,
  setForecastMonths,
  scenario,
  dataSeedMonths,
  pending,
  error,
  onBack,
  onLaunch,
}: {
  title: string;
  setTitle: (t: string) => void;
  forecastMonths: ForecastMonths;
  setForecastMonths: (m: ForecastMonths) => void;
  scenario: Scenario;
  dataSeedMonths: number;
  pending: boolean;
  error: string | null;
  onBack: () => void;
  onLaunch: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="text-sm font-bold tracking-tight">Step 3 · Launch</div>
        <p className="text-[12px] text-muted-foreground mt-1">
          4 stakeholder agents run in parallel, then a Synthesizer reconciles
          their views into a unified cashflow forecast.
        </p>
      </div>

      <Field label="Simulation Title">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Q3 price hike + 2 new hires"
          required
          className="w-full h-10 border border-border bg-background px-3 text-sm focus:outline-none focus:border-primary"
        />
      </Field>

      <Field label="Forecast Window">
        <div className="grid grid-cols-4 gap-2">
          {([1, 2, 3, 6] as const).map((m) => (
            <button
              type="button"
              key={m}
              onClick={() => setForecastMonths(m)}
              className={`h-10 border border-border text-[10px] font-bold uppercase tracking-widest transition-colors ${
                forecastMonths === m
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-accent'
              }`}
            >
              {m} {m === 1 ? 'month' : 'months'}
            </button>
          ))}
        </div>
      </Field>

      {/* Active agents */}
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
          Active Agents (parallel)
        </div>
        <div className="grid grid-cols-2 gap-2">
          {AGENTS.map((a) => (
            <div key={a.name} className="border border-border bg-background p-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary border border-border" />
                <div className="text-[12px] font-bold">{a.name}</div>
              </div>
              <div className="text-[11px] text-muted-foreground mt-1 leading-snug">{a.role}</div>
            </div>
          ))}
        </div>
        <div className="border border-border bg-accent/30 p-3 mt-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-primary" />
            <div className="text-[12px] font-bold">Synthesizer</div>
          </div>
          <div className="text-[11px] text-muted-foreground mt-1 leading-snug">
            Reconciles the 4 stakeholder views → produces final cashflow forecast + risk level.
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="border border-border bg-background p-3 text-[11px] text-muted-foreground space-y-1 font-mono">
        <div>data_seed: {dataSeedMonths} month(s)</div>
        <div>price_change: {scenario.price_change_pct}%</div>
        <div>hiring: {scenario.hiring_delta} employee(s)</div>
        <div>inventory_budget: IDR {scenario.inventory_budget_monthly.toLocaleString('id-ID')}/mo</div>
        <div>market_growth: {scenario.market_growth_pct}%</div>
        <div>forecast: {forecastMonths} month(s)</div>
      </div>

      {error && (
        <div className="text-[11px] text-destructive bg-destructive/10 border border-destructive/30 px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
        <button
          onClick={onBack}
          disabled={pending}
          className="h-10 px-4 border border-border bg-background text-[10px] font-bold uppercase tracking-widest hover:bg-accent transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={onLaunch}
          disabled={pending}
          className="h-10 px-4 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Launch Simulation
        </button>
      </div>
    </div>
  );
}
