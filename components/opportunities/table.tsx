'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Opportunity } from '@/lib/opportunities/types';
import {
  SourceBadge,
  ToolBadge,
  StatusBadge,
  ComplexityBadge,
  ScoreDisplay,
  PriorityPill,
  SeqIdDisplay,
  FteCell,
  RpaFitBadge,
} from './cells';
import { getInitials } from '@/lib/opportunities/utils';
import { buildQuery, parseFilters, type SortKey } from '@/lib/opportunities/filters';

type Props = { opportunities: Opportunity[] };

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

export function OpportunityTable({ opportunities }: Props) {
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
      <div className="bg-white border border-bdr rounded-xl p-12 text-center text-mut">
        Nenhuma oportunidade encontrada com esses filtros.
      </div>
    );
  }

  return (
    <div className="bg-white border border-bdr rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-bdr">
              <ThSort
                active={isActive('id')}
                onClick={() => toggleSort('id')}
              >
                ID{arrowFor('id')}
              </ThSort>
              <Th>Fonte</Th>
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
              <Th>Freq.</Th>
              <Th>Pessoas</Th>
              <ThSort
                active={isActive('fte')}
                onClick={() => toggleSort('fte')}
              >
                FTE/mês{arrowFor('fte')}
              </ThSort>
              <Th>Complex.</Th>
              <Th>RPA Fit</Th>
              <Th>Ferramenta</Th>
              <ThSort
                active={isActive('status')}
                onClick={() => toggleSort('status')}
              >
                Status{arrowFor('status')}
              </ThSort>
              <ThSort
                active={isActive('score')}
                onClick={() => toggleSort('score')}
              >
                Score{arrowFor('score')}
              </ThSort>
              <Th>Prior.</Th>
              <Th>Ação</Th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map((o) => (
              <tr
                key={o.id}
                className="border-b border-bdr last:border-b-0 hover:bg-slate-50 transition-colors"
              >
                <Td>
                  <SeqIdDisplay seqId={o.seq_id} />
                </Td>
                <Td>
                  <SourceBadge source={o.source} />
                </Td>
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
                  <FteCell fte={o.fte_horas} />
                </Td>
                <Td>
                  <ComplexityBadge value={o.complexidade} />
                </Td>
                <Td>
                  <RpaFitBadge score={o.rpa_score} />
                </Td>
                <Td>
                  <ToolBadge tool={o.ferramenta} />
                </Td>
                <Td>
                  <StatusBadge status={o.status} />
                </Td>
                <Td>
                  <ScoreDisplay score={o.score} />
                </Td>
                <Td>
                  <PriorityPill level={o.priority_level} />
                </Td>
                <Td>
                  <Link
                    href={`/opportunities/${o.id}`}
                    className="text-[12px] font-semibold text-primary hover:underline"
                  >
                    Ver
                  </Link>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-2.5 py-2.5 text-left text-[11px] uppercase tracking-wider font-bold text-mut whitespace-nowrap">
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
          'w-full text-left px-2.5 py-2.5 text-[11px] uppercase tracking-wider font-bold whitespace-nowrap transition-colors hover:bg-slate-100 ' +
          (active ? 'bg-slate-100 text-txt' : 'text-mut')
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
