import type { Opportunity } from '@/lib/opportunities/types';

type Props = { opportunity: Opportunity };

// D-11: lê a coluna first-class v0.2 `o.criterios` (8 chaves camelCase, valores
// 'sim'|'nao'|'parcial' em minúsculo) — autoridade: wizard CriteriosStep.tsx:27-49.
// Substitui o modelo legado `formulario_extras.criterios` (UPPERCASE, 10 keys).
type CriterioValor = 'sim' | 'nao' | 'parcial';

type CriterioKey =
  | 'causaReclamacoes'
  | 'totalmenteManual'
  | 'regrasClaras'
  | 'decisaoHumana'
  | 'padronizacaoDocs'
  | 'validacaoDados'
  | 'schedulable'
  | 'temDocumentacao';

const CRITERIOS: { key: CriterioKey; label: string }[] = [
  { key: 'causaReclamacoes', label: 'Causa reclamações quando falha' },
  { key: 'totalmenteManual', label: 'Totalmente Manual' },
  { key: 'regrasClaras', label: 'Processo baseado em regras claras' },
  { key: 'decisaoHumana', label: 'Necessidade de decisão humana frequente' },
  { key: 'padronizacaoDocs', label: 'Padronização em documentos (PDFs, formulários)' },
  { key: 'validacaoDados', label: 'Validação ou conferência de dados simples' },
  { key: 'schedulable', label: 'Pode ser programado para horários específicos' },
  { key: 'temDocumentacao', label: 'Possui documentação do processo' },
];

function visual(v: CriterioValor | undefined) {
  if (v === 'sim') return { icon: '✅', label: 'Sim', bg: 'bg-green-50', fg: 'text-green-800', border: 'border-green-200' };
  if (v === 'nao') return { icon: '❌', label: 'Não', bg: 'bg-red-50', fg: 'text-red-800', border: 'border-red-200' };
  if (v === 'parcial') return { icon: '⚠️', label: 'Parcial', bg: 'bg-yellow-50', fg: 'text-yellow-900', border: 'border-yellow-200' };
  return { icon: '⚪', label: '—', bg: 'bg-slate-50', fg: 'text-mut', border: 'border-slate-200' };
}

export function CriteriosTab({ opportunity: o }: Props) {
  // `criterios` é Json|null na view; quando null (persona legada) → empty state pt-BR (D-08).
  const criterios = (o.criterios ?? null) as Partial<Record<CriterioKey, CriterioValor>> | null;

  if (criterios == null) {
    return (
      <div className="px-5 py-8 text-center text-mut text-[12px]">
        Critérios técnicos ainda não preenchidos para esta oportunidade.
      </div>
    );
  }

  return (
    <div className="px-5 py-4 space-y-1.5">
      {CRITERIOS.map((c) => {
        const value = criterios[c.key];
        const r = visual(value);
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
