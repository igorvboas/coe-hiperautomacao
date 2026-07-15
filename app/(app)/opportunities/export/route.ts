// app/(app)/opportunities/export/route.ts
// =============================================================================
// Download do portfólio do tenant logado em CSV. GET → arquivo attachment.
//
// Respeita os MESMOS filtros da tela de Oportunidades (query string idêntica:
// ?q=&source=&area=&ferramenta=&priority=&status=&sort=&empresa=), então o
// botão "Exportar CSV" exporta exatamente o recorte que o usuário está vendo
// (sem filtros = tudo do tenant). Isolamento multi-tenant garantido pelo RLS +
// resolução server-side do slug de empresa (nunca UUID na URL).
// =============================================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchOpportunities } from '@/lib/opportunities/queries';
import { fetchTenantIdBySlug } from '@/lib/tenants/queries';
import { parseFilters } from '@/lib/opportunities/filters';
import { opportunitiesToCsv } from '@/lib/opportunities/csv';

export async function GET(request: NextRequest) {
  // Exige sessão — sem usuário, 401 (o RLS já barraria, mas falha explícito).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new NextResponse('Não autorizado', { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const filters = parseFilters(sp);

  // Seletor de empresa (platform_admin): a URL carrega o SLUG, resolvido para
  // tenant_id server-side. Membro comum → RLS restringe de qualquer forma.
  const empresaSlug = sp.get('empresa')?.trim() || undefined;
  const tenantId = empresaSlug
    ? (await fetchTenantIdBySlug(empresaSlug)) ?? undefined
    : undefined;

  // Slug informado mas não resolvido = empresa inexistente/sem acesso: não
  // exporta o portfólio inteiro por engano.
  if (empresaSlug && !tenantId) {
    return new NextResponse(`Empresa "${empresaSlug}" não encontrada`, {
      status: 404,
    });
  }

  const opportunities = await fetchOpportunities({ ...filters, tenant: tenantId });
  const csv = opportunitiesToCsv(opportunities);

  const stamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const filename = `oportunidades-${stamp}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
