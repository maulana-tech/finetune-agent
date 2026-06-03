'use client';

import { Search, Bell, User, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type ScrapeStatus = 'idle' | 'scraping' | 'done' | 'error';

export function Topbar({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<ScrapeStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [scrapeQuery, setScrapeQuery] = useState('');

  useEffect(() => {
    if (status === 'done' || status === 'error') {
      const timer = setTimeout(() => setStatus('idle'), 6000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const capturedQuery = query.trim();
    setQuery('');
    setScrapeQuery(capturedQuery);
    setLoading(true);
    setStatus('scraping');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const response = await fetch(`${apiUrl}/jobs/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: capturedQuery, limit: 10, workspaceId }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        setStatus('error');
        setStatusMessage(errData.message || 'Failed to start scrape');
        return;
      }

      // Poll for new leads by checking for entries created after job start
      const jobStartedAt = Date.now();
      let attempts = 0;
      const maxAttempts = 12;

      const poll = async () => {
        attempts++;
        try {
          const res = await fetch(`${apiUrl}/leads/search?workspaceId=${workspaceId}&limit=50`);
          if (res.ok) {
            const data = await res.json();
            const allLeads: Array<{ createdAt: string }> = Array.isArray(data)
              ? data
              : (data.results ?? []);
            const newLeads = allLeads.filter(
              (l) => new Date(l.createdAt).getTime() > jobStartedAt - 5000,
            );
            if (newLeads.length > 0) {
              setStatusMessage(`${newLeads.length} new lead${newLeads.length > 1 ? 's' : ''} added`);
              setStatus('done');
              router.refresh();
              return;
            }
          }
        } catch {}

        if (attempts >= maxAttempts) {
          setStatusMessage('Job queued — leads loading in background');
          setStatus('done');
          router.refresh();
          return;
        }

        setTimeout(poll, 3000);
      };

      setTimeout(poll, 4000);
    } catch {
      setStatus('error');
      setStatusMessage('Network error — is the API running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6 shrink-0">
      <form onSubmit={handleSearch} className="flex items-center gap-2 w-full max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search leads (e.g. 'Coffee Shop Jakarta')..."
            className="w-full bg-accent/50 border border-border h-10 pl-10 pr-4 text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <button
          disabled={loading}
          type="submit"
          className="px-4 h-10 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-95 shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Scrape'}
        </button>
      </form>

      <div className="flex items-center gap-3 ml-4">
        {status === 'scraping' && (
          <div className="flex items-center gap-2 px-3 py-1.5 border border-border bg-accent/30 text-[10px]">
            <Loader2 className="w-3 h-3 animate-spin text-primary shrink-0" />
            <span className="text-muted-foreground">
              Scraping{' '}
              <span className="font-bold text-foreground">"{scrapeQuery}"</span>
              ...
            </span>
          </div>
        )}

        {status === 'done' && (
          <div className="flex items-center gap-2 px-3 py-1.5 border border-green-500/40 bg-green-500/5 text-[10px]">
            <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
            <span className="font-bold text-green-600">{statusMessage}</span>
            <button
              onClick={() => setStatus('idle')}
              className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center gap-2 px-3 py-1.5 border border-red-500/40 bg-red-500/5 text-[10px]">
            <AlertCircle className="w-3 h-3 text-red-500 shrink-0" />
            <span className="text-red-600">{statusMessage}</span>
            <button
              onClick={() => setStatus('idle')}
              className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <button className="w-10 h-10 flex items-center justify-center border border-border bg-background hover:bg-accent transition-colors">
          <Bell className="w-4 h-4 text-foreground" />
        </button>
        <button className="w-10 h-10 flex items-center justify-center border border-border bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
          <User className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
