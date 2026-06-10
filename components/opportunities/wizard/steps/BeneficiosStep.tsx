'use client';

import type { WizardFormData } from '../state';

type Props = {
  data: WizardFormData;
  onChange: (patch: Partial<WizardFormData>) => void;
};

// Phase 11 / D-09: modelo first-class v0.2 — 8 benefícios em `data.beneficios`
// top-level, chaves camelCase EXATAS do schema (schema.ts §260-273), escala 1–5.
// A UX de barras 1–5 + cores é mantida (superior aos dropdowns do mockup).
type BeneficioKey =
  | 'reducaoTempo'
  | 'eliminacaoErros'
  | 'produtividade'
  | 'qualidadeDados'
  | 'reducaoCustos'
  | 'reducaoRetrabalho'
  | 'compliance'
  | 'objetivosEstrategicos';

const BENEFICIOS: { key: BeneficioKey; label: string; color: string }[] = [
  { key: 'reducaoTempo', label: 'Redução de Tempo', color: '#3b82f6' },
  { key: 'eliminacaoErros', label: 'Eliminação de Erros', color: '#8b5cf6' },
  { key: 'produtividade', label: 'Aumento de Produtividade', color: '#10b981' },
  { key: 'qualidadeDados', label: 'Qualidade de Dados', color: '#f59e0b' },
  { key: 'reducaoCustos', label: 'Redução de Custos', color: '#ef4444' },
  { key: 'reducaoRetrabalho', label: 'Redução de Retrabalho', color: '#ec4899' },
  { key: 'compliance', label: 'Compliance & Regulatório', color: '#06b6d4' },
  { key: 'objetivosEstrategicos', label: 'Objetivos Estratégicos', color: '#f97316' },
];

export function BeneficiosStep({ data, onChange }: Props) {
  const beneficios = data.beneficios ?? {};

  // WR-01: desmarcar REMOVE a chave (não grava 0). O schema exige escala 1–5
  // (`min(1)` sob `.strict()`); gravar 0 fazia o submit ser rejeitado pelo Zod.
  // `value == null` → desmarcar; o display (`v ?? '—'`) e `active = v === n` já
  // tratam chave ausente.
  function update(key: BeneficioKey, value: number | null) {
    const nextBeneficios = { ...beneficios };
    if (value == null) {
      delete nextBeneficios[key];
    } else {
      nextBeneficios[key] = value;
    }
    onChange({ beneficios: nextBeneficios });
  }

  // FTE estimado (h/mês) saiu do create: é calculado pela automação a partir de
  // pessoas envolvidas × tempo de execução, não input do usuário. `fte_horas`
  // continua no schema (opcional) e é preenchido pelo enrichment / mode='edit'.

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
                      onClick={() => update(b.key, active ? null : n)}
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
