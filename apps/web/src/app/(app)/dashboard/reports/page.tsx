import { PieChart, TrendingUp, TrendingDown, Users, MapPin } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="p-6 h-full flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Market Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">AI-powered market analysis from your leads</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Leads', value: '0', icon: MapPin },
          { label: 'Markets Analyzed', value: '0', icon: PieChart },
          { label: 'Avg. Opportunity Score', value: '—', icon: TrendingUp },
        ].map((stat) => (
          <div key={stat.label} className="border border-border bg-background p-4 flex items-center gap-4">
            <div className="w-10 h-10 border border-border flex items-center justify-center bg-accent/50 shrink-0">
              <stat.icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 flex items-center justify-center border border-dashed border-border bg-accent/10">
        <div className="text-center max-w-md">
          <PieChart className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
          <h3 className="font-bold text-sm mb-2">No Reports Yet</h3>
          <p className="text-xs text-muted-foreground">
            Scrape leads first, then AI agents will analyze market trends, competition, and opportunities.
            Reports appear here automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
