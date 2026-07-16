import {
  fetchOpportunities,
  fetchAreas,
  computeKpis,
} from '@/lib/opportunities/queries';
import { parseFilters } from '@/lib/opportunities/filters';
import { getCurrentTenant } from '@/lib/tenants/queries';
import { isReadOnlyViewer } from '@/lib/security/role';
import { KpiBar } from '@/components/opportunities/kpi-bar';
import { Toolbar } from '@/components/opportunities/toolbar';
import { OpportunityTable } from '@/components/opportunities/table';
import { OpportunityCards } from '@/components/opportunities/cards';
import { KanbanBoard } from '@/components/opportunities/kanban/Board';
import { Relatorio } from '@/components/opportunities/relatorio/relatorio';
import type { Opportunity } from '@/lib/opportunities/types';

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
  const isReport = view === 'relatorio';

  const [opportunities, areas, tenant, fullPortfolio, readOnly] = await Promise.all([
    fetchOpportunities(filters),
    fetchAreas(),
    getCurrentTenant(),
    // D-01a: o Relatório agrega o portfólio INTEIRO do tenant, não a lista
    // filtrada. Fetch SEM filtros → nenhum .eq/.or aplicado. O RLS continua
    // escopando pelo tenant corrente (via current_tenant), nunca cross-tenant.
    isReport ? fetchOpportunities() : Promise.resolve([] as Opportunity[]),
    isReadOnlyViewer(),
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
        readOnly={readOnly}
      />
      <div className="flex-1 px-6 py-4">
        {view === 'relatorio' ? (
          <Relatorio
            opportunities={fullPortfolio}
            sourceLabel={tenant?.name ?? null}
          />
        ) : view === 'cards' ? (
          <OpportunityCards opportunities={opportunities} />
        ) : view === 'kanban' ? (
          <KanbanBoard opportunities={opportunities} readOnly={readOnly} />
        ) : (
          <OpportunityTable opportunities={opportunities} />
        )}
      </div>
    </div>
  );
}
