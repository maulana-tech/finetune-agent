'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useMapStore } from '../map/store';
import { apiUrl } from '@/lib/workspace';
import { useWorkspaceId } from '@/lib/workspace-context';
import { AddLeadButton, AddLeadDialog } from './AddLeadDialog';
import { DeleteLeadButton } from './DeleteLeadDialog';
import { LeadScoreView } from './LeadScoreView';
import { GenerateEmailButton } from './GenerateEmailModal';

interface AiInsight {
  id: string;
  leadId: string;
  agentType: string;
  content: Record<string, unknown>;
  createdAt: string;
}

interface Note {
  id: string;
  leadId: string;
  content: string;
  author: string;
  createdAt: string;
}

interface EmailHistory {
  id: string;
  toEmail: string;
  subject: string;
  status: string;
  sentAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  createdAt: string;
}

interface Lead {
  id: string;
  name: string;
  address: string | null;
  emails: string[] | null;
  category: string | null;
  mapsUrl: string | null;
  phone: string | null;
  createdAt: string;
}

// Helper function to check if lead is new (< 24 hours)
function isNewLead(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const hoursDiff = (now - created) / (1000 * 60 * 60);
  return hoursDiff < 24;
}

// Helper function to format relative time
function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = Date.now();
  const seconds = Math.floor((now - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function LeadsPanel({ leads: initialLeads }: { leads: Lead[] }) {
  const workspaceId = useWorkspaceId();
  const { selectedLeadId, setSelectedLeadId } = useMapStore();
  const [query, setQuery] = useState('');
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [searching, setSearching] = useState(false);

  const search = useCallback(async (q: string) => {
    setSearching(true);
    try {
      const params = new URLSearchParams({ workspaceId, limit: '50' });
      if (q.trim()) params.set('q', q.trim());
      const res = await fetch(`${apiUrl()}/leads/search?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.results ?? data);
      }
    } catch {
      // keep current list on network error
    } finally {
      setSearching(false);
    }
  }, []);

  const [viewMode, setViewMode] = useState<'list' | 'scores'>('list');
  const [scoredLeads, setScoredLeads] = useState<any[]>([]);
  const [scoresLoading, setScoresLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  useEffect(() => {
    if (viewMode !== 'scores') return;
    setScoresLoading(true);
    fetch(`${apiUrl()}/leads/scores?workspaceId=${workspaceId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setScoredLeads)
      .catch(() => setScoredLeads([]))
      .finally(() => setScoresLoading(false));
  }, [viewMode, workspaceId, apiUrl]);

  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteInput, setNoteInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [emailHistory, setEmailHistory] = useState<EmailHistory[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedLead = leads.find(l => l.id === selectedLeadId);

  const fetchInsights = useCallback(async (leadId: string) => {
    setInsightsLoading(true);
    fetch(`${apiUrl()}/leads/${leadId}/insights`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setInsights)
      .catch(() => setInsights([]))
      .finally(() => setInsightsLoading(false));
  }, []);

  const fetchNotes = useCallback(async (leadId: string) => {
    fetch(`${apiUrl()}/leads/${leadId}/notes`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setNotes)
      .catch(() => setNotes([]));
  }, []);

  const fetchEmailHistory = useCallback(async (leadId: string) => {
    fetch(`${apiUrl()}/leads/${leadId}/emails`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setEmailHistory)
      .catch(() => setEmailHistory([]));
  }, []);

  useEffect(() => {
    if (!selectedLeadId) {
      setInsights([]);
      setNotes([]);
      setEmailHistory([]);
      return;
    }
    fetchInsights(selectedLeadId);
    fetchNotes(selectedLeadId);
    fetchEmailHistory(selectedLeadId);
  }, [selectedLeadId, fetchInsights, fetchNotes, fetchEmailHistory]);

  const handleAddNote = async () => {
    if (!noteInput.trim() || !selectedLeadId) return;
    setNoteSubmitting(true);
    try {
      const res = await fetch(`${apiUrl()}/leads/${selectedLeadId}/notes?workspaceId=${workspaceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: noteInput.trim(), author: 'User' }),
      });
      if (res.ok) {
        setNoteInput('');
        fetchNotes(selectedLeadId);
        setTimeout(() => scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight), 50);
      }
    } catch {
      // ignore
    } finally {
      setNoteSubmitting(false);
    }
  };

  return (
    <div className="w-80 border-l border-border bg-background flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="font-bold text-sm uppercase tracking-tight mb-3">
          {selectedLead ? 'Lead Details' : `Leads (${leads.length})`}
        </div>
        {!selectedLead ? (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search leads..."
                className="w-full px-3 py-1.5 text-xs border border-border bg-accent/20 focus:outline-none focus:border-primary placeholder:text-muted-foreground"
              />
              {searching && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground uppercase tracking-widest">
                  ...
                </span>
              )}
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setViewMode('list')}
                className={`h-7 px-2 text-[9px] font-bold uppercase tracking-widest border transition-colors ${viewMode === 'list' ? 'bg-foreground text-background border-foreground' : 'bg-background text-muted-foreground border-border hover:border-primary/50'}`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('scores')}
                className={`h-7 px-2 text-[9px] font-bold uppercase tracking-widest border transition-colors ${viewMode === 'scores' ? 'bg-foreground text-background border-foreground' : 'bg-background text-muted-foreground border-border hover:border-primary/50'}`}
              >
                Scores
              </button>
              <AddLeadButton />
            </div>
          </div>
        ) : (
          <button
            onClick={() => setSelectedLeadId(null)}
            className="text-[10px] uppercase font-bold text-muted-foreground hover:text-primary transition-colors text-left"
          >
            ← Back to list
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto p-2 flex flex-col gap-2">
        {editingLead && (
          <AddLeadDialog
            initial={{
              id: editingLead.id,
              name: editingLead.name,
              address: editingLead.address ?? undefined,
              phone: editingLead.phone ?? undefined,
              category: editingLead.category ?? undefined,
              emails: editingLead.emails ?? undefined,
              mapsUrl: editingLead.mapsUrl ?? undefined,
            }}
            onClose={() => setEditingLead(null)}
          />
        )}

        {selectedLead ? (
          <div className="p-4 flex flex-col gap-4">
            <div>
              <h2 className="font-bold text-lg leading-tight">{selectedLead.name}</h2>
              <p className="text-xs text-muted-foreground">{selectedLead.address}</p>
            </div>

            <div className="space-y-1.5 text-xs">
              {selectedLead.category && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-16 shrink-0">Category</span>
                  <span className="font-medium">{selectedLead.category}</span>
                </div>
              )}
              {selectedLead.phone && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-16 shrink-0">Phone</span>
                  <a href={`tel:${selectedLead.phone}`} className="font-medium hover:text-primary transition-colors">
                    {selectedLead.phone}
                  </a>
                </div>
              )}
              {selectedLead.emails && selectedLead.emails.length > 0 && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-16 shrink-0">Email</span>
                  <span className="font-medium break-all">{selectedLead.emails[0]}</span>
                </div>
              )}
              {selectedLead.mapsUrl && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-16 shrink-0">Maps</span>
                  <a
                    href={selectedLead.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline truncate"
                  >
                    Open in Google Maps ↗
                  </a>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setEditingLead(selectedLead)}
                className="flex-1 py-2 bg-background border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-accent transition-colors"
              >
                Edit
              </button>
              <div className="flex-1">
                <DeleteLeadButton leadId={selectedLead.id} leadName={selectedLead.name} />
              </div>
            </div>

            <div className="mt-4 p-4 border border-border bg-accent/20">
              <h3 className="text-[10px] font-bold uppercase tracking-widest mb-3 text-primary">AI Strategy Insights</h3>
              {insightsLoading ? (
                <div className="text-xs space-y-3">
                  <div className="animate-pulse flex flex-col gap-2">
                    <div className="h-2 bg-muted w-full"></div>
                    <div className="h-2 bg-muted w-3/4"></div>
                    <div className="h-2 bg-muted w-5/6"></div>
                  </div>
                </div>
              ) : insights.length === 0 ? (
                <p className="text-[10px] text-muted-foreground italic">No AI insights yet. Run a pipeline to generate insights for this lead.</p>
              ) : (
                <div className="space-y-3">
                  {insights.map((insight) => (
                    <div key={insight.id} className="text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-wider">
                          {insight.agentType}
                        </span>
                        <span className="text-[9px] text-muted-foreground">
                          {new Date(insight.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-muted-foreground space-y-1">
                        {Object.entries(insight.content).map(([key, val]) => (
                          <p key={key}>
                            <span className="font-medium text-foreground capitalize">{key.replace(/_/g, ' ')}: </span>
                            {typeof val === 'string' ? val : JSON.stringify(val)}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-2 space-y-2">
              <button
                onClick={async () => {
                  if (!selectedLeadId) return;
                  setAnalyzing(true);
                  try {
                    const res = await fetch(`${apiUrl()}/leads/${selectedLeadId}/analyze?workspaceId=${workspaceId}`, { method: 'POST' });
                    if (res.ok) {
                      fetchInsights(selectedLeadId);
                    }
                  } catch {}
                  setAnalyzing(false);
                }}
                disabled={analyzing}
                className="w-full py-2 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {analyzing ? 'Analyzing...' : 'Analyze for My Business'}
              </button>
              <GenerateEmailButton
                leadId={selectedLeadId!}
                leadEmail={selectedLead.emails?.[0]}
                onGenerated={() => {
                  fetchInsights(selectedLeadId!);
                  fetchEmailHistory(selectedLeadId!);
                }}
              />
              <button className="w-full py-2 bg-background border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-accent transition-colors">
                Analyze Financial Potential
              </button>
            </div>

            {/* Email History */}
            {emailHistory.length > 0 && (
              <div className="mt-4">
                <h3 className="text-[10px] font-bold uppercase tracking-widest mb-3 text-primary">Email History</h3>
                <div className="space-y-2">
                  {emailHistory.map((email) => (
                    <div key={email.id} className="p-3 border border-border bg-accent/10">
                      <div className="text-xs font-medium mb-1">{email.subject}</div>
                      <div className="text-[10px] text-muted-foreground space-y-0.5">
                        <div>To: {email.toEmail}</div>
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider ${
                            email.status === 'sent' || email.status === 'delivered' ? 'bg-green-100 text-green-700' :
                            email.status === 'failed' || email.status === 'bounced' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {email.status}
                          </span>
                          {email.sentAt && (
                            <span>{new Date(email.sentAt).toLocaleString()}</span>
                          )}
                        </div>
                        {email.openedAt && (
                          <div className="text-green-600">✓ Opened {new Date(email.openedAt).toLocaleString()}</div>
                        )}
                        {email.clickedAt && (
                          <div className="text-blue-600">✓ Clicked {new Date(email.clickedAt).toLocaleString()}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes / Activity */}
            <div className="mt-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest mb-3 text-primary">Notes & Activity</h3>
              <div
                ref={scrollRef}
                className="max-h-48 overflow-auto space-y-2 mb-3"
              >
                {notes.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground italic">No notes yet.</p>
                ) : (
                  notes.map((note) => (
                    <div key={note.id} className="p-2 border border-border bg-accent/10">
                      <p className="text-xs whitespace-pre-wrap">{note.content}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{note.author}</span>
                        <span className="text-[9px] text-muted-foreground">
                          {new Date(note.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddNote(); } }}
                  placeholder="Add a note..."
                  className="flex-1 px-2 py-1.5 text-xs border border-border bg-background focus:outline-none focus:border-primary"
                />
                <button
                  onClick={handleAddNote}
                  disabled={noteSubmitting || !noteInput.trim()}
                  className="px-3 py-1.5 bg-foreground text-background text-[9px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        ) : viewMode === 'scores' ? (
          scoresLoading ? (
            <div className="p-8 text-center text-xs text-muted-foreground">Loading scores...</div>
          ) : (
            <LeadScoreView scores={scoredLeads} />
          )
        ) : leads.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            {query ? 'No leads match your search.' : 'No leads found yet. Try running a scrape job above.'}
          </div>
        ) : (
          leads.map(lead => {
            const isNew = isNewLead(lead.createdAt);
            return (
              <div
                key={lead.id}
                onClick={() => setSelectedLeadId(lead.id)}
                className={`p-3 border transition-colors cursor-pointer group ${
                  selectedLeadId === lead.id
                    ? 'border-primary bg-accent/50'
                    : isNew
                      ? 'border-green-500/50 bg-green-50/10 hover:border-green-500'
                      : 'border-border bg-accent/10 hover:border-primary/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="font-bold text-sm leading-tight">{lead.name}</div>
                  {isNew && (
                    <span className="px-1.5 py-0.5 bg-green-500 text-white text-[8px] font-bold uppercase tracking-wider shrink-0 animate-pulse">
                      NEW
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground truncate">{lead.address}</div>
                <div className="text-[9px] text-muted-foreground mt-1">
                  Added {timeAgo(lead.createdAt)}
                </div>
                <div className="mt-3 flex gap-1 flex-wrap">
                  {lead.emails && lead.emails.length > 0 && (
                    <span className="px-1.5 py-0.5 bg-primary text-primary-foreground text-[9px] font-bold uppercase tracking-wider">Email</span>
                  )}
                  {lead.category && (
                    <span className="px-1.5 py-0.5 border border-border text-muted-foreground text-[9px] font-bold uppercase tracking-wider">{lead.category}</span>
                  )}
                  {lead.mapsUrl && (
                    <span className="px-1.5 py-0.5 border border-border text-muted-foreground text-[9px] font-bold uppercase tracking-wider">Maps</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
