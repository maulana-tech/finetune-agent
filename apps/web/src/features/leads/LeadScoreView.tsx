'use client';

import { Trophy, TrendingUp, Target, DollarSign } from 'lucide-react';
import { useMapStore } from '../map/store';

interface ScoredLead {
  leadId: string;
  name: string;
  category: string | null;
  address: string | null;
  pipelineStage: string | null;
  qualityScore: number;
  conversionProbability: number;
  estimatedValue: number | null;
  priorityTier: string;
  recommendedAction: string;
  messagingFit: number | null;
  financialHealth: number | null;
  strategicAlignment: number | null;
  computedAt: string;
}

export function LeadScoreView({ scores }: { scores: ScoredLead[] }) {
  const setSelectedLeadId = useMapStore((s) => s.setSelectedLeadId);

  if (scores.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-muted-foreground">
        No scores yet. Run a pipeline to generate lead scores.
      </div>
    );
  }

  const tierColor = (tier: string) => {
    switch (tier) {
      case 'A': return 'text-green-600 bg-green-50 border-green-200';
      case 'B': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'C': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'D': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-muted-foreground bg-accent border-border';
    }
  };

  return (
    <div className="flex-1 overflow-auto p-2 flex flex-col gap-2">
      {scores.map((s) => (
        <div
          key={s.leadId}
          onClick={() => setSelectedLeadId(s.leadId)}
          className="p-3 border border-border bg-accent/10 hover:border-primary/50 transition-colors cursor-pointer"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0">
              <div className="font-bold text-sm leading-tight truncate">{s.name}</div>
              {s.category && (
                <div className="text-[10px] text-muted-foreground truncate">{s.category}</div>
              )}
            </div>
            <div className={`shrink-0 w-8 h-8 flex items-center justify-center border text-xs font-bold ${tierColor(s.priorityTier)}`}>
              {s.priorityTier}
            </div>
          </div>

          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              <span className={s.qualityScore >= 70 ? 'text-green-600 font-bold' : ''}>{s.qualityScore}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>{Math.round(s.conversionProbability * 100)}%</span>
            </div>
            {s.estimatedValue != null && (
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                <span>${s.estimatedValue.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="mt-2 flex gap-1 flex-wrap">
            {s.financialHealth != null && (
              <span className="px-1 py-0.5 border border-border text-[9px] font-bold uppercase tracking-wider">
                Finance {s.financialHealth}
              </span>
            )}
            {s.messagingFit != null && (
              <span className="px-1 py-0.5 border border-border text-[9px] font-bold uppercase tracking-wider">
                Market {s.messagingFit}
              </span>
            )}
            {s.recommendedAction === 'immediate_outreach' && (
              <span className="px-1 py-0.5 bg-green-100 text-green-700 border border-green-200 text-[9px] font-bold uppercase tracking-wider">
                <Target className="w-2.5 h-2.5 inline mr-0.5" />
                Outreach Now
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
