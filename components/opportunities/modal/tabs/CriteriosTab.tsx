import type { Opportunity } from '@/lib/opportunities/types';
import type { CriterioValor } from '@/lib/database.types';

type Props = { opportunity: Opportunity };

type CriterioDef = {
  key: keyof NonNullable<NonNullable<Opportunity['formulario_extras']>['criterios']>;
  label: string;
};

const CRITERIOS: CriterioDef[] = [
  { key: 'regras_claras', label: 'Processo baseado em regras claras' },
  { key: 'totalmente_manual', label: 'Totalmente Manual' },
  { key: 'processo_uniforme', label: 'Processo uniforme / mesmo fluxo sempre' },
  { key: 'digitacao_manual', label: 'Digitação ou movimentação manual de dados' },
  { key: 'causa_reclamacoes', label: 'Causa reclamações quando falha' },
  { key: 'padronizacao_docs', label: 'Padronização em documentos (PDFs, formulários)' },
  { key: 'validacao_dados', label: 'Validação ou conferência de dados simples' },
  { key: 'schedulable', label: 'Pode ser programado para horários específicos' },
  { key: 'tem_documentacao', label: 'Possui documentação do processo' },
  { key: 'decisao_humana', label: 'Necessidade de decisão humana frequente' },
];

function renderValue(v: CriterioValor | undefined) {
  if (v === 'SIM') return { icon: '✅', label: 'Sim', bg: 'bg-green-50', fg: 'text-green-800', border: 'border-green-200' };
  if (v === 'NAO') return { icon: '❌', label: 'Não', bg: 'bg-red-50', fg: 'text-red-800', border: 'border-red-200' };
  if (v === 'PARCIAL') return { icon: '⚠️', label: 'Parcial', bg: 'bg-yellow-50', fg: 'text-yellow-900', border: 'border-yellow-200' };
  return { icon: '⚪', label: '—', bg: 'bg-slate-50', fg: 'text-mut', border: 'border-slate-200' };
}

export function CriteriosTab({ opportunity: o }: Props) {
  const criterios = o.formulario_extras?.criterios ?? {};

  return (
    <div className="px-5 py-4 space-y-1.5">
      {CRITERIOS.map((c) => {
        const value = criterios[c.key];
        const r = renderValue(value);
        return (
          <div
            key={c.key}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-[12px] ${r.bg} ${r.fg} ${r.border}`}
          >
            <span className="text-base w-5 text-center">{r.icon}</span>
            <span className="flex-1">{c.label}</span>
            <span className="font-bold text-[11px]">{r.label}</span>
          </div>
        );
      })}
    </div>
  );
}
