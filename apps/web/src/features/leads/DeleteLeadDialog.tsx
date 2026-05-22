'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2, X } from 'lucide-react';
import { apiUrl } from '@/lib/workspace';
import { useWorkspaceId } from '@/lib/workspace-context';

export function DeleteLeadButton({ leadId, leadName }: { leadId: string; leadName: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full py-2 bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold uppercase tracking-widest hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
      >
        <Trash2 className="w-3 h-3" />
        Delete Lead
      </button>
      {open && <DeleteLeadDialog leadId={leadId} leadName={leadName} onClose={() => setOpen(false)} />}
    </>
  );
}

function DeleteLeadDialog({
  leadId,
  leadName,
  onClose,
}: {
  leadId: string;
  leadName: string;
  onClose: () => void;
}) {
  const workspaceId = useWorkspaceId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const res = await fetch(`${apiUrl()}/leads/${leadId}?workspaceId=${workspaceId}`, {
          method: 'DELETE',
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.message || `HTTP ${res.status}`);
        }

        onClose();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed');
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[400px] bg-background border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="text-sm font-bold tracking-tight">Delete Lead</div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 border border-border bg-background hover:bg-accent flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-xs text-muted-foreground">
            Are you sure you want to delete <strong>{leadName}</strong>? This action cannot be undone.
          </p>

          {error && <p className="text-red-600 text-xs">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={pending}
              className="flex-1 py-2 bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {pending && <Loader2 className="w-3 h-3 animate-spin" />}
              Delete
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="flex-1 py-2 border border-border bg-background text-[10px] font-bold uppercase tracking-widest hover:bg-accent transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
