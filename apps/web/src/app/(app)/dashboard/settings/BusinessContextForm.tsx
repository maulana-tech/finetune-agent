'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Check } from 'lucide-react';
import { apiUrl } from '@/lib/workspace';

export function BusinessContextForm({
  workspaceId,
  initialValue,
}: {
  workspaceId: string;
  initialValue: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(initialValue);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    startTransition(async () => {
      try {
        const res = await fetch(`${apiUrl()}/workspaces/${workspaceId}?workspaceId=${workspaceId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ businessContext: value }),
        });
        if (res.ok) {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
          router.refresh();
        }
      } catch {
        // ignore
      }
    });
  };

  return (
    <div className="space-y-3">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="e.g., We are a B2B SaaS company selling inventory management software to small-to-medium coffee shops and F&B businesses in Indonesia. Our product helps track stock, predict reorder points, and manage supplier relationships. Key differentiator: AI-powered demand forecasting."
        className="w-full h-32 px-3 py-2 text-xs border border-border bg-background focus:outline-none focus:border-primary resize-vertical"
      />
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={pending}
          className="h-8 px-4 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
        >
          {pending && <Loader2 className="w-3 h-3 animate-spin" />}
          Save
        </button>
        {saved && (
          <span className="text-[10px] text-green-600 font-bold uppercase tracking-widest flex items-center gap-1">
            <Check className="w-3 h-3" />
            Saved
          </span>
        )}
      </div>
    </div>
  );
}
