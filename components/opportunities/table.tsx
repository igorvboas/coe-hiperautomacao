'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { Opportunity } from '@/lib/opportunities/types';
import {
  StatusBadge,
  ComplexityBadge,
  ScoreDisplay,
  SeqIdDisplay,
  FteCell,
} from './cells';
import { getInitials } from '@/lib/opportunities/utils';
import { buildQuery, parseFilters, type SortKey } from '@/lib/opportunities/filters';
import {
  assigneeInitials,
  assigneeName,
  type Assignee,
} from '@/lib/opportunities/assignee-types';

// Data de registro (created_at) — formata a partir do ISO por slicing, sem
// `new Date()`/locale, para não divergir entre SSR e hidratação (timezone).
function fmtDataRegistro(iso: string | null | undefined): string {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return y && m && d ? `${d}/${m}/${y}` : '—';
}

type Props = {
  opportunities: Opportunity[];
  /** Assignees por opportunity_id (0032) — buscados em uma query só na page. */
  assigneesByOpportunity: Record<string, Assignee[]>;
  /** Mapa tenant_id → nome (Phase 17, Plan 17-07) — alimenta a coluna
   *  "Empresa". Vazio por padrão: nenhuma mudança de comportamento para os
   *  demais papéis. */
  companyById?: Record<string, string>;
  /** Exibe a coluna "Empresa" — flag calculada no servidor a partir do papel
   *  do usuário. Este componente NÃO decide por papel; só lê a flag. */
  showCompany?: boolean;
};

type SortableColumn = {
  asc: SortKey;
  desc: SortKey;
};

const SORTABLE_COLS: Record<string, SortableColumn> = {
  id: { asc: 'seq_asc', desc: 'seq_desc' },
  nome: { asc: 'nome_asc', desc: 'nome_desc' },
  area: { asc: 'area_asc', desc: 'area_asc' },
  processo: { asc: 'processo_asc', desc: 'processo_asc' },
  status: { asc: 'status_asc', desc: 'status_asc' },
  score: { asc: 'score_asc', desc: 'score_desc' },
  fte: { asc: 'fte_asc', desc: 'fte_desc' },
};

export function OpportunityTable({
  opportunities,
  assigneesByOpportunity,
  companyById = {},
  showCompany = false,
}: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const filters = parseFilters(params);
  const currentSort: SortKey = filters.sort ?? 'score_desc';

  function toggleSort(colKey: keyof typeof SORTABLE_COLS) {
    const col = SORTABLE_COLS[colKey];
    let next: SortKey;
    if (currentSort === col.desc) next = col.asc;
    else if (currentSort === col.asc) next = col.desc;
    else next = col.desc; // primeira vez: desc se score, senão asc (a config define)
    if (currentSort === col.asc && col.asc === col.desc) next = col.asc; // colunas sem reverso

    const sp = new URLSearchParams(params.toString());
    const qs = buildQuery({ ...filters, sort: next }, sp);
    router.replace(qs ? `/opportunities?${qs}` : '/opportunities');
  }

  function arrowFor(colKey: keyof typeof SORTABLE_COLS): string {
    const col = SORTABLE_COLS[colKey];
    if (currentSort === col.asc) return ' ↑';
    if (currentSort === col.desc && col.asc !== col.desc) return ' ↓';
    if (currentSort === col.desc) return ' ↑';
    return '';
  }

  function isActive(colKey: keyof typeof SORTABLE_COLS): boolean {
    const col = SORTABLE_COLS[colKey];
    return currentSort === col.asc || currentSort === col.desc;
  }

  if (opportunities.length === 0) {
    return (
      <div className="bg-wh border border-bdr rounded-xl p-12 text-center text-mut">
        Nenhuma oportunidade encontrada com esses filtros.
      </div>
    );
  }

  return (
    <div className="bg-wh border border-bdr rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            {/* Gradiente diagonal — mockup _giba_wsi-dashboard.html:48 (thead) */}
            <tr className="bg-gradient-to-br from-pril to-pri text-white">
              <ThSort
                active={isActive('id')}
                onClick={() => toggleSort('id')}
              >
                ID{arrowFor('id')}
              </ThSort>
              {/* Coluna "Empresa" (Phase 17, Plan 17-07) — flag calculada no
                  servidor a partir do papel do usuário. Logo após o ID:
                  "de quem é esta demanda" é a primeira pergunta de uma
                  listagem unificada cross-tenant. NÃO entra em
                  SORTABLE_COLS — ordenar por empresa exigiria ordenação no
                  servidor por uma coluna que a query não traz, e nenhum
                  critério da fase pede isso. */}
              {showCompany && <Th>Empresa</Th>}
              <ThSort
                active={isActive('nome')}
                onClick={() => toggleSort('nome')}
              >
                Solicitante{arrowFor('nome')}
              </ThSort>
              <ThSort
                active={isActive('area')}
                onClick={() => toggleSort('area')}
              >
                Área / Subárea{arrowFor('area')}
              </ThSort>
              <ThSort
                active={isActive('processo')}
                onClick={() => toggleSort('processo')}
              >
                Processo / Oportunidade{arrowFor('processo')}
              </ThSort>
              <ThSort
                active={isActive('fte')}
                onClick={() => toggleSort('fte')}
              >
                FTE/mês{arrowFor('fte')}
              </ThSort>
              <ThSort
                active={isActive('status')}
                onClick={() => toggleSort('status')}
              >
                Status{arrowFor('status')}
              </ThSort>
              <Th>Freq.</Th>
              <Th>Pessoas</Th>
              <Th>Complex.</Th>
              <ThSort
                active={isActive('score')}
                onClick={() => toggleSort('score')}
              >
                Score{arrowFor('score')}
              </ThSort>
              <Th>Atribuído a</Th>
              <Th>Data de Registro</Th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map((o) => (
              <tr
                key={o.id}
                onClick={() => router.push(`/opportunities/${o.id}`)}
                className="border-b border-bdr last:border-b-0 hover:bg-blue-50/50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
              >
                <Td>
                  <SeqIdDisplay seqId={o.seq_id} />
                </Td>
                {showCompany && (
                  <Td>
                    <span className="text-[12px] font-medium">
                      {companyById[o.tenant_id] ?? '—'}
                    </span>
                  </Td>
                )}
                <Td>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-pri text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                      {getInitials(o.solicitante)}
                    </div>
                    <div className="font-semibold text-[12px] leading-tight">
                      {o.solicitante}
                    </div>
                  </div>
                </Td>
                <Td>
                  <div className="text-[12px] font-medium">{o.area}</div>
                  {o.subarea && (
                    <div className="text-[10px] text-mut">{o.subarea}</div>
                  )}
                </Td>
                <Td>
                  <div
                    className="text-[12px] max-w-[280px] truncate"
                    title={o.processo}
                  >
                    {o.processo}
                  </div>
                </Td>
                <Td>
                  <FteCell fte={o.fte_horas} />
                </Td>
                <Td>
                  <StatusBadge status={o.status} />
                </Td>
                <Td>
                  <span className="text-[11px] text-mut">
                    {o.frequencia ?? '—'}
                  </span>
                </Td>
                <Td>
                  <span className="text-[11px] text-mut">
                    {o.num_pessoas ?? '—'}
                  </span>
                </Td>
                <Td>
                  <ComplexityBadge value={o.complexidade} />
                </Td>
                <Td>
                  <ScoreDisplay score={o.score} />
                </Td>
                <Td>
                  <AssigneeStack assignees={assigneesByOpportunity[o.id] ?? []} />
                </Td>
                <Td>
                  <span className="text-[11px] text-mut whitespace-nowrap">
                    {fmtDataRegistro(o.created_at)}
                  </span>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Avatares empilhados das pessoas atribuídas. Acima de 3, condensa em "+N"
 * para a linha não estourar — os nomes completos ficam no `title`.
 */
function AssigneeStack({ assignees }: { assignees: Assignee[] }) {
  if (assignees.length === 0) {
    return <span className="text-[11px] text-mut">—</span>;
  }

  const shown = assignees.slice(0, 3);
  const rest = assignees.length - shown.length;
  const allNames = assignees.map(assigneeName).join(', ');

  return (
    <div className="flex items-center -space-x-1.5" title={allNames}>
      {shown.map((a) => (
        <span
          key={a.profileId}
          className="w-6 h-6 rounded-full bg-pri text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-wh"
        >
          {assigneeInitials(a)}
        </span>
      ))}
      {rest > 0 && (
        <span className="w-6 h-6 rounded-full bg-bg text-mut text-[9px] font-bold flex items-center justify-center ring-2 ring-wh">
          +{rest}
        </span>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-2.5 py-2 text-left text-[10px] uppercase tracking-wider font-bold whitespace-nowrap">
      {children}
    </th>
  );
}

function ThSort({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <th className="px-0 py-0">
      <button
        type="button"
        onClick={onClick}
        className={
          'w-full text-left px-2.5 py-2 text-[10px] uppercase tracking-wider font-bold whitespace-nowrap hover:bg-pril ' +
          (active ? 'bg-pril' : '')
        }
      >
        {children}
      </button>
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-2.5 py-2 align-middle">{children}</td>;
}
