import {
  fetchOpportunities,
  fetchAreas,
  computeKpis,
} from '@/lib/opportunities/queries';
import { parseFilters } from '@/lib/opportunities/filters';
import { getCurrentTenant } from '@/lib/tenants/queries';
import { KpiBar } from '@/components/opportunities/kpi-bar';
import { Toolbar } from '@/components/opportunities/toolbar';
import { OpportunityTable } from '@/components/opportunities/table';
import { OpportunityCards } from '@/components/opportunities/cards';
import { KanbanBoard } from '@/components/opportunities/kanban/Board';

type SearchParams = Promise<Record<string, string | undefined>>;

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const raw = await searchParams;
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === 'string') sp.set(k, v);
  }

  const filters = parseFilters(sp);
  const view = sp.get('view');

  const [opportunities, areas, tenant] = await Promise.all([
    fetchOpportunities(filters),
    fetchAreas(),
    getCurrentTenant(),
  ]);
  const kpis = computeKpis(opportunities);

  return (
    <div className="flex flex-col min-h-full">
      <KpiBar kpis={kpis} />
      <Toolbar
        counts={{
          visible: opportunities.length,
          total: opportunities.length,
        }}
        areas={areas}
        tenantSlug={tenant?.slug ?? null}
      />
      <div className="flex-1 px-6 py-4">
        {view === 'cards' ? (
          <OpportunityCards opportunities={opportunities} />
        ) : view === 'kanban' ? (
          <KanbanBoard opportunities={opportunities} />
        ) : (
          <OpportunityTable opportunities={opportunities} />
        )}
      </div>
    </div>
  );
}
