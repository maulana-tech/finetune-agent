import Link from 'next/link';
import { Map, Layers, PieChart, Settings, Hexagon, Wallet, Globe } from 'lucide-react';

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-border h-screen bg-background flex flex-col p-4">
      <div className="flex items-center gap-2 mb-8 px-2 text-primary font-bold text-xl uppercase tracking-tighter">
        <Hexagon className="w-6 h-6 fill-primary" />
        <span>Finetune B2B</span>
      </div>
      <nav className="flex flex-col gap-1">
        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-foreground bg-accent border border-border">
          <Map className="w-4 h-4" />
          Map Explorer
        </Link>
        <Link href="/dashboard/pipelines" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 border border-transparent hover:border-border transition-colors">
          <Layers className="w-4 h-4" />
          Pipelines
        </Link>
        <Link href="/dashboard/finance" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 border border-transparent hover:border-border transition-colors">
          <Wallet className="w-4 h-4" />
          Finance
        </Link>
        <Link href="/dashboard/market" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 border border-transparent hover:border-border transition-colors">
          <Globe className="w-4 h-4" />
          Market Analysis
        </Link>
        <Link href="/dashboard/reports" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 border border-transparent hover:border-border transition-colors">
          <PieChart className="w-4 h-4" />
          Market Reports
        </Link>
      </nav>
      <div className="mt-auto">
        <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 border border-transparent hover:border-border transition-colors">
          <Settings className="w-4 h-4" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
