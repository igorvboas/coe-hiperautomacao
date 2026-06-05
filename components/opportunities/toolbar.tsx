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

type Props = {
  counts: { visible: number; total: number };
  areas: string[];
  tenantSlug: string | null;
};

type View = 'table' | 'cards' | 'kanban' | 'relatorio';

const VIEWS: { id: View; icon: string; label: string }[] = [
  { id: 'table', icon: '☰', label: 'Tabela' },
  { id: 'cards', icon: '⊞', label: 'Cards' },
  { id: 'kanban', icon: '📊', label: 'Kanban' },
  { id: 'relatorio', icon: '📈', label: 'Relatório' },
];

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'novo', label: 'Novo' },
  { value: 'em_analise', label: 'Em Análise' },
  { value: 'planejamento', label: 'Planejamento' },
  { value: 'backlog', label: 'Backlog' },
  { value: 'desenvolvimento', label: 'Desenvolvimento' },
  { value: 'homologacao', label: 'Homologação' },
  { value: 'producao', label: 'Produção' },
  { value: 'concluido', label: 'Concluído' },
];

function parseView(raw: string | null): View {
  if (raw === 'cards' || raw === 'kanban' || raw === 'relatorio') return raw;
  return 'table';
}

export function Toolbar({ counts, areas, tenantSlug }: Props) {
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
    (filters.sort && filters.sort !== 'score_desc');

  const selectClass =
    'px-2 py-1 border border-bdr rounded-md text-[11px] bg-white text-txt focus:outline-none focus:border-pril';

  return (
    <div className="bg-white border-b border-bdr px-6 py-2 flex flex-col gap-2">
      {/* Linha 1: Action button + counts + view switcher */}
      <div className="flex items-center gap-3">
        <Link
          href="/opportunities/new"
          className="px-3 py-1.5 bg-acc hover:opacity-90 text-white text-[12px] font-bold rounded-lg flex items-center gap-1 transition-opacity"
        >
          <span>➕</span>
          <span className="hidden sm:inline">Nova Oportunidade</span>
        </Link>

        {tenantSlug && (
          <button
            type="button"
            onClick={copyPublicLink}
            title="Copiar link do formulário público"
            className={
              'px-3 py-1.5 text-[12px] font-bold rounded-lg flex items-center gap-1 transition-colors border ' +
              (copied
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white text-pri border-bdr hover:bg-bg')
            }
          >
            <span>{copied ? '✓' : '🔗'}</span>
            <span className="hidden sm:inline">
              {copied ? 'Link copiado!' : 'Copiar link do formulário'}
            </span>
          </button>
        )}

        <div className="ml-auto flex items-center gap-3">
          <span className="text-[11px] text-mut">
            {counts.visible} de {counts.total} oportunidades
          </span>
          <div className="inline-flex border border-bdr rounded-lg overflow-hidden">
            {VIEWS.map((v) => {
              const isActive = v.id === currentView;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => changeView(v.id)}
                  title={v.label}
                  className={
                    'px-2.5 py-1 text-[13px] transition-colors ' +
                    (isActive
                      ? 'bg-pri text-white'
                      : 'bg-bg text-txt hover:bg-slate-200')
                  }
                >
                  {v.icon}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Linha 2: busca + 5 dropdowns + sort + limpar */}
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="search"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="🔍  Buscar por nome, processo ou área..."
          className="flex-1 min-w-[200px] px-2.5 py-1.5 border border-bdr rounded-md text-[12px] bg-bg focus:outline-none focus:border-pril focus:ring-2 focus:ring-pril/15"
        />
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
        {hasAnyFilter && (
          <button
            type="button"
            onClick={clearAll}
            className="px-2.5 py-1 bg-bg border border-bdr hover:bg-slate-200 text-txt text-[11px] font-semibold rounded-md"
          >
            ↺ Limpar
          </button>
        )}
      </div>
    </div>
  );
}
