'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  buildQuery,
  parseFilters,
  SORT_LABELS,
  type OpportunityFilters,
  type SortKey,
} from '@/lib/opportunities/filters';
import { STATUS_OPTIONS } from '@/lib/opportunities/status';

type Props = {
  counts: { visible: number; total: number };
  areas: string[];
  tenantSlug: string | null;
  readOnly?: boolean;
};

type View = 'table' | 'cards' | 'kanban' | 'gantt' | 'relatorio';

// Rótulos do switcher: Lista · Gestão · Gantt (os ids internos table/kanban/gantt
// permanecem; cards/relatorio ainda existem por URL mas saíram do switcher).
const VIEWS: { id: View; icon: string; label: string }[] = [
  { id: 'table', icon: '☰', label: 'Lista' },
  { id: 'kanban', icon: '📊', label: 'Gestão' },
  { id: 'gantt', icon: '📅', label: 'Gantt' },
];

function parseView(raw: string | null): View {
  if (raw === 'cards' || raw === 'kanban' || raw === 'gantt' || raw === 'relatorio')
    return raw;
  return 'table';
}

export function Toolbar({ counts, areas, tenantSlug, readOnly = false }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyPublicLink() {
    if (!tenantSlug) return;
    const url = `${window.location.origin}/r/${tenantSlug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback se clipboard API falhar (ex: contexto não-seguro)
      window.prompt('Copie o link manualmente:', url);
    }
  }
  const router = useRouter();
  const params = useSearchParams();
  const currentView = parseView(params.get('view'));
  const filters = parseFilters(params);

  // Export CSV: mesmo recorte de filtros/empresa que a lista (a route handler
  // relê a mesma query string). `view` não afeta o export, mas é inofensivo.
  const exportHref = (() => {
    const qs = params.toString();
    return qs ? `/opportunities/export?${qs}` : '/opportunities/export';
  })();
  const sortValue: SortKey = filters.sort ?? 'score_desc';

  // ===========================================================================
  // Busca livre com debounce 200ms
  // ===========================================================================
  const [searchText, setSearchText] = useState(filters.q ?? '');

  useEffect(() => {
    setSearchText(filters.q ?? '');
  }, [filters.q]);

  useEffect(() => {
    const trimmed = searchText.trim();
    if ((trimmed || undefined) === (filters.q || undefined)) return;
    const sp = new URLSearchParams(params.toString());
    const handle = setTimeout(() => {
      const next: OpportunityFilters = {
        ...filters,
        q: trimmed || undefined,
      };
      const qs = buildQuery(next, sp);
      router.replace(qs ? `/opportunities?${qs}` : '/opportunities');
    }, 200);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  // ===========================================================================
  // Dropdown changes
  // ===========================================================================
  function applyChange(patch: Partial<OpportunityFilters>) {
    const sp = new URLSearchParams(params.toString());
    const next: OpportunityFilters = { ...filters, ...patch };
    (Object.keys(patch) as (keyof OpportunityFilters)[]).forEach((k) => {
      if (!patch[k]) delete next[k];
    });
    const qs = buildQuery(next, sp);
    router.replace(qs ? `/opportunities?${qs}` : '/opportunities');
  }

  function changeView(v: View) {
    const sp = new URLSearchParams(params.toString());
    if (v === 'table') sp.delete('view');
    else sp.set('view', v);
    const qs = sp.toString();
    router.replace(qs ? `/opportunities?${qs}` : '/opportunities');
  }

  function clearAll() {
    const view = params.get('view');
    setSearchText('');
    router.replace(view ? `/opportunities?view=${view}` : '/opportunities');
  }

  const hasAnyFilter =
    !!filters.q ||
    !!filters.source ||
    !!filters.area ||
    !!filters.ferramenta ||
    !!filters.priority ||
    !!filters.status ||
    !!filters.dateFrom ||
    !!filters.dateTo ||
    (filters.sort && filters.sort !== 'score_desc');

  const selectClass =
    'px-2.5 py-1.5 border border-bdr rounded-lg text-[12px] bg-wh text-txt focus:outline-none focus:border-pril focus:ring-2 focus:ring-pril/15';

  return (
    // v0.3: linha de busca/ações + views, e abaixo a linha de filtros.
    // Sem barra full-width — vive dentro do conteúdo da página.
    <div className="flex flex-col gap-3">
      {/* Linha 1: busca + ações + view switcher */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mut pointer-events-none"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Buscar por nome, processo ou área..."
            className="w-full pl-9 pr-3 py-2 border border-bdr rounded-lg text-[13px] bg-wh text-txt focus:outline-none focus:border-pril focus:ring-2 focus:ring-pril/15"
          />
        </div>

        {!readOnly && (
          <Link
            href="/opportunities/new"
            className="px-4 py-2 bg-acc hover:opacity-90 text-white text-[13px] font-semibold rounded-lg flex items-center gap-1.5 transition-opacity whitespace-nowrap"
          >
            <span className="text-base leading-none">+</span>
            <span className="hidden sm:inline">Nova Oportunidade</span>
          </Link>
        )}

        <a
          href={exportHref}
          title="Exportar oportunidades (com os filtros atuais) em CSV"
          className="px-3 py-2 text-[13px] font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-bdr bg-wh text-txt hover:bg-bg whitespace-nowrap"
        >
          <span>⬇</span>
          <span className="hidden md:inline">Exportar CSV</span>
        </a>

        {tenantSlug && (
          <button
            type="button"
            onClick={copyPublicLink}
            title="Copiar link do formulário público"
            className={
              'px-3 py-2 text-[13px] font-semibold rounded-lg flex items-center gap-1.5 transition-colors border whitespace-nowrap ' +
              (copied
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700'
                : 'bg-wh text-txt border-bdr hover:bg-bg')
            }
          >
            <span>{copied ? '✓' : '🔗'}</span>
            <span className="hidden md:inline">
              {copied ? 'Link copiado!' : 'Copiar link'}
            </span>
          </button>
        )}

        {/* Switcher de view, à direita */}
        <div className="ml-auto flex items-center gap-1 bg-bg border border-bdr rounded-lg p-0.5">
          {VIEWS.map((v) => {
            const isActive = v.id === currentView;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => changeView(v.id)}
                title={v.label}
                className={
                  'px-2.5 py-1.5 rounded-md text-[12px] font-semibold transition-colors inline-flex items-center gap-1 whitespace-nowrap ' +
                  (isActive
                    ? 'bg-wh text-txt shadow-sm'
                    : 'text-mut hover:text-txt')
                }
              >
                <span>{v.icon}</span>
                <span className="hidden lg:inline">{v.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Linha 2: filtros + ordenação + limpar + counts */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filters.source ?? ''}
          onChange={(e) =>
            applyChange({
              source:
                (e.target.value as 'persona' | 'formulario') || undefined,
            })
          }
          className={selectClass}
          aria-label="Filtrar por fonte"
        >
          <option value="">Todas as Fontes</option>
          <option value="persona">Personas</option>
          <option value="formulario">Formulários</option>
        </select>
        <select
          value={filters.area ?? ''}
          onChange={(e) => applyChange({ area: e.target.value || undefined })}
          className={selectClass}
          aria-label="Filtrar por área"
        >
          <option value="">Todas as Áreas</option>
          {areas.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select
          value={filters.ferramenta ?? ''}
          onChange={(e) =>
            applyChange({
              ferramenta:
                (e.target.value as 'rpa' | 'n8n' | 'ambos') || undefined,
            })
          }
          className={selectClass}
          aria-label="Filtrar por ferramenta"
        >
          <option value="">Todas as Ferramentas</option>
          <option value="rpa">RPA</option>
          <option value="n8n">n8n</option>
          <option value="ambos">Ambos</option>
        </select>
        <select
          value={filters.priority ?? ''}
          onChange={(e) =>
            applyChange({
              priority:
                (e.target.value as 'alta' | 'media' | 'baixa') || undefined,
            })
          }
          className={selectClass}
          aria-label="Filtrar por prioridade"
        >
          <option value="">Todas as Prioridades</option>
          <option value="alta">Alta (≥ 70)</option>
          <option value="media">Média (40–69)</option>
          <option value="baixa">Baixa (&lt; 40)</option>
        </select>
        <select
          value={filters.status ?? ''}
          onChange={(e) =>
            applyChange({
              status: (e.target.value || undefined) as OpportunityFilters['status'],
            })
          }
          className={selectClass}
          aria-label="Filtrar por status"
        >
          <option value="">Todos os Status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        {/* Range de data de criação (created_at) */}
        <div className="flex items-center gap-1.5 border border-bdr rounded-lg px-2 py-1 bg-wh">
          <span className="text-[11px] font-medium text-mut whitespace-nowrap">
            Criadas:
          </span>
          <input
            type="date"
            value={filters.dateFrom ?? ''}
            max={filters.dateTo || undefined}
            onChange={(e) => applyChange({ dateFrom: e.target.value || undefined })}
            aria-label="Data de criação — de"
            className="text-[12px] bg-transparent text-txt focus:outline-none"
          />
          <span className="text-[11px] text-mut">–</span>
          <input
            type="date"
            value={filters.dateTo ?? ''}
            min={filters.dateFrom || undefined}
            onChange={(e) => applyChange({ dateTo: e.target.value || undefined })}
            aria-label="Data de criação — até"
            className="text-[12px] bg-transparent text-txt focus:outline-none"
          />
        </div>
        <select
          value={sortValue}
          onChange={(e) => applyChange({ sort: e.target.value as SortKey })}
          className={selectClass}
          aria-label="Ordenação"
        >
          {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
            <option key={k} value={k}>
              {SORT_LABELS[k]}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={clearAll}
          disabled={!hasAnyFilter}
          className="px-2.5 py-1.5 bg-wh border border-bdr hover:bg-bg text-txt text-[12px] font-semibold rounded-lg whitespace-nowrap disabled:opacity-40 disabled:hover:bg-wh disabled:cursor-default"
        >
          ↺ Limpar
        </button>

        <span className="ml-auto text-[12px] text-mut whitespace-nowrap">
          {counts.visible} de {counts.total} oportunidades
        </span>
      </div>
    </div>
  );
}
