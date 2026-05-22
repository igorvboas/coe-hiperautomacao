'use client';

import type { WizardFormData } from '../state';

type Props = {
  data: WizardFormData;
  onChange: (patch: Partial<WizardFormData>) => void;
};

type BeneficioKey =
  | 'reducao_tempo'
  | 'eliminacao_erros'
  | 'produtividade'
  | 'qualidade_dados'
  | 'reducao_custos'
  | 'reducao_retrabalho'
  | 'compliance'
  | 'objetivos_estrategicos';

const BENEFICIOS: { key: BeneficioKey; label: string; color: string }[] = [
  { key: 'reducao_tempo', label: 'Redução de Tempo', color: '#3b82f6' },
  { key: 'eliminacao_erros', label: 'Eliminação de Erros', color: '#8b5cf6' },
  { key: 'produtividade', label: 'Aumento de Produtividade', color: '#10b981' },
  { key: 'qualidade_dados', label: 'Qualidade de Dados', color: '#f59e0b' },
  { key: 'reducao_custos', label: 'Redução de Custos', color: '#ef4444' },
  { key: 'reducao_retrabalho', label: 'Redução de Retrabalho', color: '#ec4899' },
  { key: 'compliance', label: 'Compliance & Regulatório', color: '#06b6d4' },
  { key: 'objetivos_estrategicos', label: 'Objetivos Estratégicos', color: '#f97316' },
];

export function BeneficiosStep({ data, onChange }: Props) {
  const beneficios = data.formulario_extras?.beneficios ?? {};

  function update(key: BeneficioKey, value: number) {
    onChange({
      formulario_extras: {
        ...(data.formulario_extras ?? {}),
        beneficios: { ...beneficios, [key]: value },
      },
    });
  }

  return (
    <div className="px-2 py-2">
      <div className="text-[11px] text-mut mb-3">
        Pontue de 1 a 5 cada benefício esperado. Sem pontuação = não considerar.
      </div>
      <div className="space-y-3">
        {BENEFICIOS.map((b) => {
          const v = beneficios[b.key];
          return (
            <div key={b.key} className="flex items-center gap-3">
              <span className="text-[11px] text-mut min-w-[170px]">{b.label}</span>
              <div className="flex-1 flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => {
                  const active = v === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => update(b.key, active ? 0 : n)}
                      className={
                        'flex-1 py-1.5 rounded text-[11px] font-bold border transition-colors ' +
                        (active
                          ? 'text-white border-transparent'
                          : 'bg-bg text-txt border-bdr hover:border-pril')
                      }
                      style={active ? { background: b.color } : undefined}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
              <span
                className="text-[11px] font-bold min-w-[32px] text-right tabular-nums"
                style={{ color: v ? b.color : 'var(--color-mut)' }}
              >
                {v ?? '—'}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 text-[10px] text-mut bg-slate-50 rounded-lg px-3 py-2 leading-relaxed">
        <strong>Escala:</strong> 1 = Nada · 2 = Pouco · 3 = Moderadamente · 4 = Muito · 5 = Totalmente
      </div>
    </div>
  );
}
