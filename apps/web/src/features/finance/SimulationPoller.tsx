'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { DEV_WORKSPACE_ID, apiUrl } from '@/lib/workspace';

/**
 * Polls the simulation status until it flips to 'completed' or 'failed',
 * then triggers a server-component refresh so the parent page re-fetches
 * the final result + agent_logs.
 */
export function SimulationPoller({
  simulationId,
  intervalMs = 2500,
}: {
  simulationId: string;
  intervalMs?: number;
}) {
  const router = useRouter();
  const startedAt = useRef<number>(Date.now());
  const stopped = useRef(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      if (stopped.current) return;
      try {
        const url = `${apiUrl()}/finance/simulations/${simulationId}?workspaceId=${DEV_WORKSPACE_ID}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const status = data?.simulation?.status;
          if (status === 'completed' || status === 'failed') {
            router.refresh();
            return;
          }
        }
      } catch {
        // Network blip — keep polling.
      }
      if (!stopped.current) {
        timeout = setTimeout(tick, intervalMs);
      }
    };

    timeout = setTimeout(tick, intervalMs);
    return () => {
      stopped.current = true;
      if (timeout) clearTimeout(timeout);
    };
  }, [simulationId, intervalMs, router]);

  return (
    <div className="border border-border bg-accent/30 p-4 flex items-center gap-3">
      <Loader2 className="w-5 h-5 text-primary animate-spin" />
      <div className="flex flex-col">
        <div className="text-sm font-bold tracking-tight">Agents working in parallel…</div>
        <div className="text-[11px] text-muted-foreground">
          Polling every {(intervalMs / 1000).toFixed(1)}s — page will refresh when synthesis completes.
        </div>
      </div>
      <ElapsedTimer startedAt={startedAt.current} />
    </div>
  );
}

function ElapsedTimer({ startedAt }: { startedAt: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const tick = () => {
      if (!ref.current) return;
      const sec = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
      ref.current.textContent = `${sec}s`;
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  return (
    <div
      ref={ref}
      className="ml-auto text-[11px] font-mono uppercase tracking-widest text-muted-foreground"
    >
      0s
    </div>
  );
}
