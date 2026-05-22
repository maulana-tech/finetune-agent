import { db, leads } from '@repo/db';
import { eq, desc } from 'drizzle-orm';
import { getWorkspaceId } from '@/lib/get-workspace';
import { MoveStageButton } from '@/features/leads/MoveStageButton';

export const dynamic = 'force-dynamic';

const STAGES = [
  'Prospecting',
  'Contacted',
  'Qualified',
  'Proposal',
  'Negotiation',
  'Closed Won',
  'Closed Lost',
] as const;

type Stage = (typeof STAGES)[number];

type Lead = {
  id: string;
  name: string;
  category: string | null;
  address: string | null;
  phone: string | null;
  pipelineStage: string | null;
};

export default async function PipelinesPage() {
  const workspaceId = await getWorkspaceId();
  const rows = await db
    .select({
      id: leads.id,
      name: leads.name,
      category: leads.category,
      address: leads.address,
      phone: leads.phone,
      pipelineStage: leads.pipelineStage,
    })
    .from(leads)
    .where(eq(leads.workspaceId, workspaceId))
    .orderBy(desc(leads.createdAt));

  // Group by stage — leads with null/unrecognized stage fall into Prospecting
  const grouped = Object.fromEntries(
    STAGES.map((s) => [s, [] as Lead[]])
  ) as Record<Stage, Lead[]>;

  for (const lead of rows) {
    const stage = (lead.pipelineStage ?? 'Prospecting') as Stage;
    const bucket: Stage = (STAGES as readonly string[]).includes(stage)
      ? stage
      : 'Prospecting';
    grouped[bucket].push(lead);
  }

  const totalLeads = rows.length;

  return (
    <div className="p-6 h-full flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pipelines</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalLeads} lead{totalLeads !== 1 ? 's' : ''} across{' '}
            {STAGES.length} stages
          </p>
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border border-border bg-accent/30 px-3 py-2">
          Live from DB
        </div>
      </div>

      {/* KANBAN BOARD */}
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageLeads = grouped[stage];
          const count = stageLeads.length;

          return (
            <div
              key={stage}
              className="min-w-[260px] w-[260px] shrink-0 bg-accent/30 border border-border flex flex-col"
            >
              {/* Column header */}
              <div className="p-3 border-b border-border flex items-center justify-between">
                <span className="font-bold text-[10px] uppercase tracking-widest">
                  {stage}
                </span>
                <span className="font-mono text-[10px] bg-background border border-border px-1.5 py-0.5 text-muted-foreground">
                  {count}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
                {count === 0 ? (
                  <div className="p-6 text-center text-[10px] text-muted-foreground italic border border-dashed border-border">
                    Empty
                  </div>
                ) : (
                  stageLeads.map((lead) => (
                    <LeadCard key={lead.id} lead={lead} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   Lead Card
   ============================================================ */
function LeadCard({ lead }: { lead: Lead }) {
  const stage = lead.pipelineStage ?? 'Prospecting';

  return (
    <div className="bg-background border border-border p-3 flex flex-col gap-2 hover:border-primary/50 transition-colors">
      {/* Name */}
      <div className="font-bold text-sm leading-tight">{lead.name}</div>

      {/* Category tag */}
      {lead.category && (
        <span className="self-start px-1.5 py-0.5 border border-border text-[9px] font-bold uppercase tracking-widest text-muted-foreground bg-accent/50">
          {lead.category}
        </span>
      )}

      {/* Address */}
      {lead.address && (
        <p className="text-[11px] text-muted-foreground truncate leading-tight">
          {lead.address}
        </p>
      )}

      {/* Phone */}
      {lead.phone && (
        <p className="text-[10px] font-mono text-muted-foreground">{lead.phone}</p>
      )}

      {/* Move button */}
      <div className="pt-1 border-t border-border flex items-center justify-end">
        <MoveStageButton leadId={lead.id} currentStage={stage} />
      </div>
    </div>
  );
}
