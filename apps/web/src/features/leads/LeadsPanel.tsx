'use client';

import { useMapStore } from '../map/store';

interface Lead {
  id: string;
  name: string;
  address: string | null;
  emails: string[] | null;
  category: string | null;
}

export function LeadsPanel({ leads }: { leads: Lead[] }) {
  const { selectedLeadId, setSelectedLeadId } = useMapStore();

  const selectedLead = leads.find(l => l.id === selectedLeadId);

  return (
    <div className="w-80 border-l border-border bg-background flex flex-col">
      <div className="p-4 border-b border-border font-bold text-sm uppercase tracking-tight">
        {selectedLead ? 'Lead Details' : `Found (${leads.length})`}
      </div>
      
      <div className="flex-1 overflow-auto p-2 flex flex-col gap-2">
        {selectedLead ? (
          <div className="p-4 flex flex-col gap-4">
            <button 
              onClick={() => setSelectedLeadId(null)}
              className="text-[10px] uppercase font-bold text-muted-foreground hover:text-primary transition-colors"
            >
              ← Back to list
            </button>
            <div>
              <h2 className="font-bold text-lg leading-tight">{selectedLead.name}</h2>
              <p className="text-xs text-muted-foreground">{selectedLead.address}</p>
            </div>
            
            <div className="mt-4 p-4 border border-border bg-accent/20">
              <h3 className="text-[10px] font-bold uppercase tracking-widest mb-3 text-primary">AI Strategy Insights</h3>
              <div className="text-xs space-y-3">
                <div className="animate-pulse flex flex-col gap-2">
                  <div className="h-2 bg-muted w-full"></div>
                  <div className="h-2 bg-muted w-3/4"></div>
                  <div className="h-2 bg-muted w-5/6"></div>
                </div>
                <p className="text-[10px] text-muted-foreground italic">NVIDIA Llama 3.1 analyzing market position...</p>
              </div>
            </div>

            <div className="mt-2 space-y-2">
               <button className="w-full py-2 bg-background border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-accent transition-colors">
                 Generate Outreach Draft
               </button>
               <button className="w-full py-2 bg-background border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-accent transition-colors">
                 Analyze Financial Potential
               </button>
            </div>
          </div>
        ) : (
          leads.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No leads found yet. Try running a scrape job above.
            </div>
          ) : (
            leads.map(lead => (
              <div 
                key={lead.id} 
                onClick={() => setSelectedLeadId(lead.id)}
                className={`p-3 border transition-colors cursor-pointer group ${selectedLeadId === lead.id ? 'border-primary bg-accent/50' : 'border-border bg-accent/10 hover:border-primary/50'}`}
              >
                <div className="font-bold text-sm leading-tight mb-1">{lead.name}</div>
                <div className="text-[10px] text-muted-foreground truncate">{lead.address}</div>
                <div className="mt-3 flex gap-1">
                  {lead.emails && lead.emails.length > 0 && (
                    <span className="px-1.5 py-0.5 bg-primary text-primary-foreground text-[9px] font-bold uppercase tracking-wider">Email</span>
                  )}
                  {lead.category && (
                    <span className="px-1.5 py-0.5 border border-border text-muted-foreground text-[9px] font-bold uppercase tracking-wider">{lead.category}</span>
                  )}
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}
