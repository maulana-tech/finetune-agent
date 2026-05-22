'use client';

import { Search, Bell, User, Loader2 } from 'lucide-react';
import { useState } from 'react';

export function Topbar({ workspaceId }: { workspaceId: string }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setLoading(true);
    try {
      // Direct call to API (assuming it runs on port 3001 in dev)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/jobs/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query, 
          limit: 10,
          workspaceId,
        }),
      });
      
      if (response.ok) {
        alert(`Scrape job started for: ${query}. Leads will appear on the map shortly.`);
        setQuery('');
      } else {
        const errData = await response.json();
        alert(`Failed to start scrape: ${errData.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Network error. Is the API running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6">
      <form onSubmit={handleSearch} className="flex items-center gap-2 w-full max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search leads (e.g. 'Coffee Shop Jakarta')..." 
            className="w-full bg-accent/50 border border-border h-10 pl-10 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-0 transition-colors"
          />
        </div>
        <button 
          disabled={loading}
          type="submit" 
          className="px-4 h-10 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-95"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Scrape'}
        </button>
      </form>
      
      <div className="flex items-center gap-4">
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
