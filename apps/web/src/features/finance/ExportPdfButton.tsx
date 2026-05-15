'use client';

import { useState, useTransition } from 'react';
import { Download, Loader2 } from 'lucide-react';
import type { Simulation, Transaction } from '@repo/db';

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

type SimulationExport = {
  kind: 'simulation';
  simulation: Simulation;
  agentLogs: AgentLogLike[];
};

type SummaryExport = {
  kind: 'summary';
  transactions: Transaction[];
  latestSimulation?: Simulation;
};

type ExportPayload = SimulationExport | SummaryExport;

/**
 * Lazy-loads @react-pdf/renderer and the relevant document on demand so the
 * ~140KB PDF runtime never lands in the initial bundle.
 */
export function ExportPdfButton({
  payload,
  label = 'Export PDF',
  variant = 'ghost',
}: {
  payload: ExportPayload;
  label?: string;
  variant?: 'ghost' | 'compact';
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onClick = () => {
    setError(null);
    startTransition(async () => {
      try {
        // Dynamic import keeps react-pdf out of the initial bundle.
        const [{ pdf }, simMod, summaryMod] = await Promise.all([
          import('@react-pdf/renderer'),
          payload.kind === 'simulation'
            ? import('./pdf/SimulationReportPDF')
            : Promise.resolve(null),
          payload.kind === 'summary'
            ? import('./pdf/FinanceSummaryPDF')
            : Promise.resolve(null),
        ]);

        let instance: ReturnType<typeof pdf>;
        let filename: string;

        if (payload.kind === 'simulation' && simMod) {
          const Doc = simMod.SimulationReportPDF;
          instance = pdf(
            <Doc simulation={payload.simulation} agentLogs={payload.agentLogs} />,
          );
          filename = `simulation-${payload.simulation.id.slice(0, 8)}.pdf`;
        } else if (payload.kind === 'summary' && summaryMod) {
          const Doc = summaryMod.FinanceSummaryPDF;
          instance = pdf(
            <Doc
              transactions={payload.transactions}
              latestSimulation={payload.latestSimulation}
              generatedAt={new Date()}
            />,
          );
          filename = `finance-summary-${new Date().toISOString().slice(0, 10)}.pdf`;
        } else {
          throw new Error('Unknown export payload');
        }

        const blob = await instance.toBlob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'PDF generation failed');
      }
    });
  };

  const baseCls =
    'border border-border text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2 disabled:opacity-50';
  const sizeCls =
    variant === 'compact'
      ? 'h-8 px-3 bg-background hover:bg-accent'
      : 'h-10 px-4 bg-background hover:bg-accent';

  return (
    <div className="flex flex-col items-end gap-1">
      <button onClick={onClick} disabled={pending} className={`${baseCls} ${sizeCls}`}>
        {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        {label}
      </button>
      {error && (
        <div className="text-[10px] text-destructive font-mono max-w-[280px] truncate">{error}</div>
      )}
    </div>
  );
}
