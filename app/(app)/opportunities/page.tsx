import {
  fetchOpportunities,
  fetchAreas,
  computeKpis,
  fetchPhasesForOpportunities,
} from '@/lib/opportunities/queries';
import { parseFilters } from '@/lib/opportunities/filters';
import { getCurrentTenant, fetchTenantIdBySlug } from '@/lib/tenants/queries';
import { isReadOnlyViewer, getCurrentProfile, isPlatformAdmin } from '@/lib/security/role';
import { KpiBar } from '@/components/opportunities/kpi-bar';
import { Toolbar } from '@/components/opportunities/toolbar';
import { OpportunityTable } from '@/components/opportunities/table';
import { OpportunityCards } from '@/components/opportunities/cards';
import { KanbanBoard } from '@/components/opportunities/kanban/Board';
import { GanttChart } from '@/components/opportunities/gantt/GanttChart';
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

  // Seletor de empresa (platform_admin): a URL carrega o SLUG (?empresa=fgcoop),
  // nunca o UUID. Resolve para tenant_id server-side — e só tentamos resolver
  // se o usuário corrente for platform_admin (para os demais, ?empresa= é
  // ignorado; a RLS bloquearia de qualquer forma, mas evitamos o round-trip
  // e uma mensagem de "empresa não encontrada" que não faz sentido pra eles).
  const profile = await getCurrentProfile();
  const isAdmin = isPlatformAdmin(profile);
  const empresaSlug = isAdmin ? sp.get('empresa')?.trim() || undefined : undefined;
  const scopedTenantId = empresaSlug
    ? (await fetchTenantIdBySlug(empresaSlug)) ?? undefined
    : undefined;
  // Slug informado mas não resolvido = empresa inexistente (ou sem acesso).
  // NÃO cair silenciosamente em "Todas" — sinaliza o erro explicitamente.
  const empresaNotFound = !!empresaSlug && !scopedTenantId;
  const listFilters = { ...filters, tenant: scopedTenantId };

  const [opportunities, areas, tenant, fullPortfolio, readOnly] = await Promise.all([
    empresaNotFound ? Promise.resolve([] as Opportunity[]) : fetchOpportunities(listFilters),
    fetchAreas(),
    getCurrentTenant(),
    // D-01a: o Relatório agrega o portfólio INTEIRO do tenant (ou da empresa
    // selecionada pelo admin), não a lista filtrada — preserva o recorte de
    // empresa mas ignora os demais filtros de busca/status/etc.
    !empresaNotFound && isReport
      ? fetchOpportunities(scopedTenantId ? { tenant: scopedTenantId } : {})
      : Promise.resolve([] as Opportunity[]),
    isReadOnlyViewer(),
  ]);
  const kpis = computeKpis(opportunities);

  // Gantt: fases das oportunidades da lista filtrada (mesmo recorte de table/kanban).
  const ganttPhases =
    view === 'gantt' && !empresaNotFound
      ? await fetchPhasesForOpportunities(opportunities.map((o) => o.id))
      : [];

  return (
    <div className="px-6 lg:px-8 py-6 flex flex-col gap-6">
      <header>
        <h1 className="text-[26px] font-bold text-txt tracking-tight">
          Oportunidades
        </h1>
        <p className="text-[13px] text-mut mt-0.5">
          Gerencie e acompanhe todas as oportunidades de automação
        </p>
      </header>

      <Toolbar
        counts={{
          visible: opportunities.length,
          total: opportunities.length,
        }}
        areas={areas}
        tenantSlug={tenant?.slug ?? null}
        readOnly={readOnly}
      />

      {!isReport && !empresaNotFound && <KpiBar kpis={kpis} />}

      <div>
        {empresaNotFound ? (
          <div className="bg-wh border border-bdr rounded-xl p-12 text-center flex flex-col items-center gap-2">
            <h2 className="text-[16px] font-bold text-txt">
              Empresa &quot;{empresaSlug}&quot; não encontrada
            </h2>
            <p className="text-[13px] text-mut max-w-sm">
              Escolha uma empresa válida no seletor da barra lateral (ou
              &quot;Todas as empresas&quot;).
            </p>
          </div>
        ) : view === 'relatorio' ? (
          <Relatorio
            opportunities={fullPortfolio}
            sourceLabel={tenant?.name ?? null}
          />
        ) : view === 'cards' ? (
          <OpportunityCards opportunities={opportunities} />
        ) : view === 'kanban' ? (
          <KanbanBoard opportunities={opportunities} readOnly={readOnly} />
        ) : view === 'gantt' ? (
          <GanttChart opportunities={opportunities} phases={ganttPhases} />
        ) : (
          <OpportunityTable opportunities={opportunities} />
        )}
      </div>
    </div>
  );
}
