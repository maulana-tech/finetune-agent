'use client';

import { useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { apiUrl, DEV_WORKSPACE_ID } from '@/lib/workspace';

interface ScheduleActionsProps {
  id: string;
  isActive: boolean;
}

export function ScheduleActions({ id, isActive }: ScheduleActionsProps) {
  const [loading, setLoading] = useState<'run' | 'toggle' | null>(null);
  const [active, setActive] = useState(isActive);
  const [error, setError] = useState<string | null>(null);

  async function handleRunNow() {
    setLoading('run');
    setError(null);
    try {
      const res = await fetch(
        `${apiUrl()}/scrape-schedules/${id}/run-now?workspaceId=${DEV_WORKSPACE_ID}`,
        { method: 'POST' },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(null);
    }
  }

  async function handleToggle() {
    setLoading('toggle');
    setError(null);
    try {
      const res = await fetch(
        `${apiUrl()}/scrape-schedules/${id}?workspaceId=${DEV_WORKSPACE_ID}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: !active }),
        },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setActive((prev) => !prev);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {error && (
        <span className="text-[10px] text-destructive font-mono truncate max-w-[100px]" title={error}>
          {error}
        </span>
      )}
      <button
        onClick={handleRunNow}
        disabled={loading !== null}
        className="inline-flex items-center gap-1.5 px-2 py-1.5 border border-border bg-background text-[10px] font-bold uppercase tracking-widest hover:bg-accent/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RotateCcw className={`w-3 h-3 ${loading === 'run' ? 'animate-spin' : ''}`} />
        Run Now
      </button>
      <button
        onClick={handleToggle}
        disabled={loading !== null}
        className="inline-flex items-center gap-1.5 px-2 py-1.5 border border-border bg-background text-[10px] font-bold uppercase tracking-widest hover:bg-accent/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {active ? (
          <>
            <Pause className="w-3 h-3" />
            Pause
          </>
        ) : (
          <>
            <Play className="w-3 h-3" />
            Resume
          </>
        )}
      </button>
    </div>
  );
}
