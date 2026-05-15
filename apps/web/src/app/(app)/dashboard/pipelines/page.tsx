import { Layers, Plus } from 'lucide-react';

export default function PipelinesPage() {
  return (
    <div className="p-6 h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pipelines</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your lead pipeline stages</p>
        </div>
        <button className="px-4 h-10 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Stage
        </button>
      </div>

      <div className="flex-1 flex gap-4 overflow-auto">
        {['Prospecting', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'].map((stage) => (
          <div key={stage} className="min-w-[260px] bg-accent/30 border border-border flex flex-col">
            <div className="p-3 border-b border-border font-bold text-xs uppercase tracking-wider flex items-center justify-between">
              <span>{stage}</span>
              <span className="text-muted-foreground font-mono text-[10px]">0</span>
            </div>
            <div className="flex-1 p-2 flex flex-col gap-2">
              <div className="p-8 text-center text-[10px] text-muted-foreground italic">
                Drop leads here
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
