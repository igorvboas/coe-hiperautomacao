import {
  fetchOpportunities,
  fetchAreas,
  computeKpis,
} from '@/lib/opportunities/queries';
import { parseFilters } from '@/lib/opportunities/filters';
import { getCurrentTenant, fetchTenantIdBySlug } from '@/lib/tenants/queries';
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

  // Seletor de empresa (platform_admin): a URL carrega o SLUG (?empresa=fgcoop),
  // nunca o UUID. Resolve para tenant_id server-side.
  const empresaSlug = sp.get('empresa')?.trim() || undefined;
  const tenantId = empresaSlug
    ? (await fetchTenantIdBySlug(empresaSlug)) ?? undefined
    : undefined;
  // Slug informado mas não resolvido = empresa inexistente (ou sem acesso).
  // NÃO cair silenciosamente em "Todas" — sinaliza o erro explicitamente.
  const empresaNotFound = !!empresaSlug && !tenantId;
  const listFilters = { ...filters, tenant: tenantId };

  const [areas, tenant] = await Promise.all([fetchAreas(), getCurrentTenant()]);

  // Empresa inválida → não busca nada; o conteúdo mostra o aviso.
  const opportunities = empresaNotFound
    ? []
    : await fetchOpportunities(listFilters);
  // D-01a: o Relatório agrega o portfólio INTEIRO (não a lista filtrada),
  // preservando o recorte de empresa do admin.
  const fullPortfolio =
    !empresaNotFound && isReport
      ? await fetchOpportunities(tenantId ? { tenant: tenantId } : {})
      : ([] as Opportunity[]);
  const kpis = computeKpis(opportunities);

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
      />

      {!isReport && !empresaNotFound && <KpiBar kpis={kpis} />}

      <div>
        {empresaNotFound ? (
          <div className="bg-wh border border-bdr rounded-xl p-12 text-center flex flex-col items-center gap-2">
            <div className="text-4xl">🤨</div>
            <h2 className="text-[16px] font-bold text-txt">
              Empresa “{empresaSlug}” não existe
            </h2>
            <p className="text-[13px] text-mut max-w-sm">
              Para de brincar nos parâmetros da URL 😄 — escolha uma empresa
              válida no seletor da barra lateral (ou use “Todas as empresas”).
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
          <KanbanBoard opportunities={opportunities} />
        ) : (
          <OpportunityTable opportunities={opportunities} />
        )}
      </div>
    </div>
  );
}
