'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const STAGES = [
  'Prospecting',
  'Contacted',
  'Qualified',
  'Proposal',
  'Negotiation',
  'Closed Won',
  'Closed Lost',
] as const;

interface MoveStageButtonProps {
  leadId: string;
  currentStage: string;
}

export function MoveStageButton({ leadId, currentStage }: MoveStageButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleMove(stage: string) {
    if (stage === currentStage) {
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      await fetch(`/api/leads/${leadId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage }),
      });
      router.refresh();
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <button
        disabled={loading}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 px-2 py-1 border border-border bg-background text-[9px] font-bold uppercase tracking-widest hover:bg-accent transition-colors disabled:opacity-50"
      >
        Move <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <>
          {/* backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full mt-1 z-20 border border-border bg-background shadow-lg min-w-[160px] flex flex-col">
            {STAGES.map((s) => (
              <button
                key={s}
                onClick={() => handleMove(s)}
                className={`px-3 py-2 text-left text-[10px] font-bold uppercase tracking-widest hover:bg-accent transition-colors ${
                  s === currentStage
                    ? 'text-primary bg-accent/50'
                    : 'text-foreground'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
