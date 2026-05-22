'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2, ChevronRight, Search } from 'lucide-react';
import { apiUrl } from '@/lib/workspace';
import { useWorkspaceId } from '@/lib/workspace-context';
import { Field, Modal } from '@/features/finance/AddTransactionDialog';

interface Scenario {
  industry: string;
  region: string;
  target_segment: string;
  competitor_focus: 'pricing' | 'product' | 'positioning' | 'all';
  time_horizon_months: number;
}

const DEFAULT: Scenario = {
  industry: 'Coffee Shop',
  region: 'Jakarta',
  target_segment: 'UMKM coffee shops in CBD area',
  competitor_focus: 'all',
  time_horizon_months: 6,
};

const AGENTS = [
  { name: 'Competitor', role: 'Competitive intensity, pricing, positioning gaps' },
  { name: 'Trend', role: 'Industry direction, drivers' },
  { name: 'Risk', role: 'Regulatory, macro, supply chain risk' },
  { name: 'Demand', role: 'Customer demand, willingness to pay, triggers' },
] as const;

export function RunMarketAnalysisButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="h-10 px-4 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors flex items-center gap-2"
      >
        <Sparkles className="w-4 h-4" />
        Run Market Analysis
      </button>
      {open && <RunMarketAnalysisDialog onClose={() => setOpen(false)} />}
    </>
  );
}

function RunMarketAnalysisDialog({ onClose }: { onClose: () => void }) {
  const workspaceId = useWorkspaceId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [scenario, setScenario] = useState<Scenario>(DEFAULT);

  const onSubmit = () => {
    setError(null);
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch(`${apiUrl()}/market/analyses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspaceId,
            title: title.trim(),
            scenarioParams: scenario,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.message || `HTTP ${res.status}`);
        }
        const data = await res.json();
        const id = data?.analysis?.id;
        onClose();
        if (id) {
          router.push(`/dashboard/market/analyses/${id}`);
        } else {
          router.refresh();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    });
  };

  return (
    <Modal onClose={onClose} title="Run Market Analysis (4 agents ∥ + synthesizer)" size="lg">
      <div className="flex flex-col gap-4">
        <Field label="Title">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Q3 expansion to Bandung coffee market"
            required
            className="w-full h-10 border border-border bg-background px-3 text-sm focus:outline-none focus:border-primary"
          />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Industry">
            <input
              type="text"
              value={scenario.industry}
              onChange={(e) => setScenario({ ...scenario, industry: e.target.value })}
              className="w-full h-10 border border-border bg-background px-3 text-sm focus:outline-none focus:border-primary"
            />
          </Field>
          <Field label="Region">
            <input
              type="text"
              value={scenario.region}
              onChange={(e) => setScenario({ ...scenario, region: e.target.value })}
              className="w-full h-10 border border-border bg-background px-3 text-sm focus:outline-none focus:border-primary"
            />
          </Field>
        </div>

        <Field label="Target Segment">
          <input
            type="text"
            value={scenario.target_segment}
            onChange={(e) => setScenario({ ...scenario, target_segment: e.target.value })}
            className="w-full h-10 border border-border bg-background px-3 text-sm focus:outline-none focus:border-primary"
          />
        </Field>

        <Field label="Competitor Focus">
          <div className="grid grid-cols-4 gap-2">
            {(['pricing', 'product', 'positioning', 'all'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setScenario({ ...scenario, competitor_focus: f })}
                className={`h-10 border border-border text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  scenario.competitor_focus === f
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-accent'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </Field>

        <Field label={`Time Horizon — ${scenario.time_horizon_months} months`}>
          <input
            type="range"
            min={1}
            max={24}
            step={1}
            value={scenario.time_horizon_months}
            onChange={(e) =>
              setScenario({ ...scenario, time_horizon_months: Number(e.target.value) })
            }
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
            <span>1mo</span>
            <span>12mo</span>
            <span>24mo</span>
          </div>
        </Field>

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
              Reconciles 4 lenses → opportunity score + positioning recommendation + risk level.
            </div>
          </div>
        </div>

        {error && (
          <div className="text-[11px] text-destructive bg-destructive/10 border border-destructive/30 px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="h-10 px-4 border border-border bg-background text-[10px] font-bold uppercase tracking-widest hover:bg-accent transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={pending}
            className="h-10 px-4 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Launch Analysis
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function RunMarketScrapeButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="h-10 px-4 border border-border bg-background text-[10px] font-bold uppercase tracking-widest hover:bg-accent transition-colors flex items-center gap-2"
      >
        <Search className="w-4 h-4" />
        Scrape Market Data
      </button>
      {open && <RunMarketScrapeDialog onClose={() => setOpen(false)} />}
    </>
  );
}

function RunMarketScrapeDialog({ onClose }: { onClose: () => void }) {
  const workspaceId = useWorkspaceId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [industry, setIndustry] = useState('Coffee Shop');
  const [region, setRegion] = useState('Jakarta');
  const [limit, setLimit] = useState(10);

  const onSubmit = () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`${apiUrl()}/market/scrape`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspaceId,
            industry,
            region,
            limit,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.message || `HTTP ${res.status}`);
        }
        onClose();
        // Worker will populate market_data async; give it a beat then refresh
        setTimeout(() => router.refresh(), 1500);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    });
  };

  return (
    <Modal onClose={onClose} title="Scrape Market Data">
      <div className="flex flex-col gap-4">
        <p className="text-[12px] text-muted-foreground leading-relaxed">
          Triggers the Python scraper to fetch competitor + trend + demand signals
          for the given industry / region. Results land in <code>market_data</code> table
          and become the seed for future analyses.
        </p>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Industry">
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              required
              className="w-full h-10 border border-border bg-background px-3 text-sm focus:outline-none focus:border-primary"
            />
          </Field>
          <Field label="Region">
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              required
              className="w-full h-10 border border-border bg-background px-3 text-sm focus:outline-none focus:border-primary"
            />
          </Field>
        </div>

        <Field label={`Limit — ${limit} records`}>
          <input
            type="range"
            min={3}
            max={30}
            step={1}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </Field>

        {error && (
          <div className="text-[11px] text-destructive bg-destructive/10 border border-destructive/30 px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="h-10 px-4 border border-border bg-background text-[10px] font-bold uppercase tracking-widest hover:bg-accent transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={pending}
            className="h-10 px-4 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Scrape Now
          </button>
        </div>
      </div>
    </Modal>
  );
}
