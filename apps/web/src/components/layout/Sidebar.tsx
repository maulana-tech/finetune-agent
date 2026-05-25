'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Map,
  Layers,
  Wallet,
  Globe,
  Clock,
  BarChart2,
  Settings,
  Search,
  Home,
  PanelLeft,
  History,
} from 'lucide-react';

const NAV_ITEMS = [
  {
    group: 'Overview',
    items: [
      { href: '/',                          icon: Home,             label: 'Homepage'         },
      { href: '/dashboard',                 icon: LayoutDashboard,  label: 'Dashboard'        },
    ],
  },
  {
    group: 'Prospecting',
    items: [
      { href: '/dashboard/pipelines',       icon: Layers,           label: 'Pipelines'        },
      { href: '/dashboard/scrape-schedules',icon: Clock,            label: 'Scrape Schedules' },
    ],
  },
  {
    group: 'Intelligence',
    items: [
      { href: '/dashboard/market',          icon: Globe,            label: 'Market Analysis'  },
      { href: '/dashboard/reports',         icon: BarChart2,        label: 'Reports'          },
      { href: '/dashboard/finance',         icon: Wallet,           label: 'Finance'          },
      { href: '/dashboard/history',         icon: History,          label: 'History'          },
    ],
  },
];

const BOTTOM_ITEMS = [
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const pathname  = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href === '/') return false; // never highlight homepage as active inside app
    return pathname.startsWith(href);
  }

  return (
    <aside
      className={`relative flex h-screen flex-col border-r border-border bg-background transition-all duration-200 ${
        collapsed ? 'w-[56px]' : 'w-[220px]'
      }`}
    >
      {/* ── Logo ── */}
      <div className={`flex h-16 shrink-0 items-center border-b border-border px-3 ${collapsed ? 'justify-center' : 'justify-between px-4'}`}>
        <div className={`flex items-center gap-2.5 ${collapsed ? 'hidden' : ''}`}>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center bg-foreground text-background">
            <Search className="size-3.5" />
          </div>
          <span className="text-[13px] font-bold uppercase tracking-tighter text-foreground">
            uTune AI
          </span>
        </div>

        {/* PanelLeft toggle — shadcn sidebar-07 pattern */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="flex h-8 w-8 items-center justify-center border border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <PanelLeft className="size-4" />
        </button>
      </div>

      {/* ── Nav ── */}
      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto py-4 px-2">
        {NAV_ITEMS.map((group) => (
          <div key={group.group}>
            {/* group label — hidden when collapsed */}
            {!collapsed && (
              <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {group.group}
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-3 px-2 py-2 text-[12.5px] font-medium transition-colors border ${
                      active
                        ? 'border-border bg-accent text-foreground'
                        : 'border-transparent text-muted-foreground hover:border-border hover:bg-accent/50 hover:text-foreground'
                    } ${collapsed ? 'justify-center' : ''}`}
                  >
                    <item.icon className="size-4 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Bottom ── */}
      <div className="shrink-0 border-t border-border px-2 py-3">
        {BOTTOM_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-2 py-2 text-[12.5px] font-medium transition-colors border ${
                active
                  ? 'border-border bg-accent text-foreground'
                  : 'border-transparent text-muted-foreground hover:border-border hover:bg-accent/50 hover:text-foreground'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <item.icon className="size-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </div>

    </aside>
  );
}
