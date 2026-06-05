'use client';

import type { WizardFormData } from '../state';

type Props = {
  data: WizardFormData;
  onChange: (patch: Partial<WizardFormData>) => void;
};

// Phase 11 / D-09: modelo first-class v0.2 — 8 critérios em `data.criterios`
// top-level, chaves camelCase EXATAS do schema (schema.ts §245-258) e valores
// do criterioEnum em minúsculo ('sim' | 'nao' | 'parcial'). A UX click-to-cycle
// é mantida (superior aos dropdowns do mockup).
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

function next(v: CriterioValor | undefined): CriterioValor {
  if (v === 'sim') return 'nao';
  if (v === 'nao') return 'parcial';
  return 'sim';
}

function visual(v: CriterioValor | undefined) {
  if (v === 'sim') return { icon: '✅', label: 'Sim', cls: 'bg-green-50 text-green-800 border-green-300' };
  if (v === 'nao') return { icon: '❌', label: 'Não', cls: 'bg-red-50 text-red-800 border-red-300' };
  if (v === 'parcial') return { icon: '⚠️', label: 'Parcial', cls: 'bg-yellow-50 text-yellow-900 border-yellow-300' };
  return { icon: '⚪', label: '—', cls: 'bg-slate-50 text-mut border-slate-200' };
}

export function CriteriosStep({ data, onChange }: Props) {
  const criterios = data.criterios ?? {};

  function toggle(key: CriterioKey) {
    const current = criterios[key];
    const nextV = next(current);
    onChange({ criterios: { ...criterios, [key]: nextV } });
  }

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
