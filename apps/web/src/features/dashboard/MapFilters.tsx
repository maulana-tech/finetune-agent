'use client';

import { useState } from 'react';
import { Filter, X } from 'lucide-react';

const STAGES = [
  'Prospecting',
  'Contacted',
  'Qualified',
  'Proposal',
  'Negotiation',
  'Closed Won',
  'Closed Lost',
];

interface MapFiltersProps {
  categories: string[];
  selectedCategories: Set<string>;
  onToggleCategory: (cat: string) => void;
  onClearCategories: () => void;
  pipelineFilter: string | null;
  onPipelineFilter: (stage: string | null) => void;
  hasEmailOnly: boolean;
  onHasEmailOnly: (v: boolean) => void;
  totalLeads: number;
  filteredCount: number;
}

export function MapFilters(props: MapFiltersProps) {
  const [open, setOpen] = useState(false);

  const activeCount =
    (props.selectedCategories.size > 0 ? 1 : 0) +
    (props.pipelineFilter ? 1 : 0) +
    (props.hasEmailOnly ? 1 : 0);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="h-8 px-3 bg-background border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-accent transition-colors flex items-center gap-2 shadow-sm"
      >
        <Filter className="w-3 h-3" />
        Filters
        {activeCount > 0 && (
          <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[8px] font-bold flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-background border border-border shadow-md p-4 space-y-4 z-20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Filters
            </span>
            <button
              onClick={() => setOpen(false)}
              className="w-5 h-5 flex items-center justify-center hover:bg-accent"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <div className="text-[10px] text-muted-foreground">
            {props.filteredCount} / {props.totalLeads} leads
          </div>

          {/* Category filter */}
          {props.categories.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Category
              </div>
              <div className="flex flex-wrap gap-1">
                {props.categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => props.onToggleCategory(cat)}
                    className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wider border transition-colors ${
                      props.selectedCategories.has(cat)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pipeline stage filter */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
              Pipeline Stage
            </div>
            <select
              value={props.pipelineFilter ?? ''}
              onChange={(e) => props.onPipelineFilter(e.target.value || null)}
              className="w-full px-2 py-1 text-xs border border-border bg-background focus:outline-none focus:border-primary"
            >
              <option value="">All stages</option>
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Has-email toggle */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={props.hasEmailOnly}
                onChange={(e) => props.onHasEmailOnly(e.target.checked)}
                className="accent-primary"
              />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Has email only
              </span>
            </label>
          </div>

          {/* Clear all */}
          {activeCount > 0 && (
            <button
              onClick={() => {
                props.onClearCategories();
                props.onPipelineFilter(null);
                props.onHasEmailOnly(false);
              }}
              className="w-full py-1.5 border border-border text-[9px] font-bold uppercase tracking-widest hover:bg-accent transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
