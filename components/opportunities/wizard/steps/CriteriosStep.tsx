'use client';

import type { WizardFormData } from '../state';

type Props = {
  data: WizardFormData;
  onChange: (patch: Partial<WizardFormData>) => void;
};

type CriterioValor = 'SIM' | 'NAO' | 'PARCIAL';

type CriterioKey =
  | 'regras_claras'
  | 'totalmente_manual'
  | 'processo_uniforme'
  | 'digitacao_manual'
  | 'causa_reclamacoes'
  | 'padronizacao_docs'
  | 'validacao_dados'
  | 'schedulable'
  | 'tem_documentacao'
  | 'decisao_humana';

const CRITERIOS: { key: CriterioKey; label: string }[] = [
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

const ORDER: CriterioValor[] = ['SIM', 'NAO', 'PARCIAL'];

function next(v: CriterioValor | undefined): CriterioValor {
  if (v === 'SIM') return 'NAO';
  if (v === 'NAO') return 'PARCIAL';
  return 'SIM';
}

function visual(v: CriterioValor | undefined) {
  if (v === 'SIM') return { icon: '✅', label: 'Sim', cls: 'bg-green-50 text-green-800 border-green-300' };
  if (v === 'NAO') return { icon: '❌', label: 'Não', cls: 'bg-red-50 text-red-800 border-red-300' };
  if (v === 'PARCIAL') return { icon: '⚠️', label: 'Parcial', cls: 'bg-yellow-50 text-yellow-900 border-yellow-300' };
  return { icon: '⚪', label: '—', cls: 'bg-slate-50 text-mut border-slate-200' };
}

export function CriteriosStep({ data, onChange }: Props) {
  const criterios = data.formulario_extras?.criterios ?? {};

  function toggle(key: CriterioKey) {
    const current = criterios[key];
    const nextV = next(current);
    onChange({
      formulario_extras: {
        ...(data.formulario_extras ?? {}),
        criterios: { ...criterios, [key]: nextV },
      },
    });
  }

  // Suprime warning de ORDER não-usado direto (left for documentation)
  void ORDER;

  return (
    <div className="px-2 py-2">
      <div className="text-[11px] text-mut mb-3">
        Click pra alternar entre SIM / NÃO / PARCIAL.
      </div>
      <div className="space-y-1.5">
        {CRITERIOS.map((c) => {
          const v = criterios[c.key];
          const u = visual(v);
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => toggle(c.key)}
              className={
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-[12px] text-left transition-colors hover:brightness-95 ' +
                u.cls
              }
            >
              <span className="text-base w-5 text-center">{u.icon}</span>
              <span className="flex-1">{c.label}</span>
              <span className="font-bold text-[11px]">{u.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
