import type { Opportunity } from '@/lib/opportunities/types';

type Props = { opportunity: Opportunity };

// D-11: lê a coluna first-class v0.2 `o.beneficios` (8 chaves camelCase, escala 1–5)
// + `o.fte_horas` — autoridade: wizard BeneficiosStep.tsx:23-32. Substitui o modelo
// legado `formulario_extras.beneficios`.
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

export function BeneficiosTab({ opportunity: o }: Props) {
  // `beneficios` é Json|null na view; null (persona legada) → empty state pt-BR (D-08).
  const beneficios = (o.beneficios ?? null) as Partial<Record<BeneficioKey, number>> | null;

  const rows =
    beneficios == null
      ? []
      : BENEFICIOS.map((b) => ({ ...b, value: beneficios[b.key] })).filter(
          (r) => r.value != null,
        );

  const fteHoras = o.fte_horas;

  if (rows.length === 0) {
    return (
      <div className="px-5 py-8 text-center text-mut text-[12px]">
        Benefícios ainda não pontuados para esta oportunidade.
      </div>
    );
  }

  return (
    <div className="px-5 py-4">
      {fteHoras != null && (
        <div className="mb-4 rounded-lg border border-bdr bg-slate-50 px-3 py-2 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-mut">
            FTE estimado
          </span>
          <span className="text-[13px] font-extrabold text-txt tabular-nums">
            {fteHoras} h/mês
          </span>
        </div>
      )}
      <div className="space-y-2.5 mb-4">
        {rows.map((r) => {
          const v = r.value as number;
          const pct = (v / 5) * 100;
          return (
            <div key={r.key} className="flex items-center gap-3">
              <span className="text-[11px] text-mut min-w-[170px]">{r.label}</span>
              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: r.color }}
                />
              </div>
              <span
                className="text-[11px] font-bold min-w-[32px] text-right"
                style={{ color: r.color }}
              >
                {v}/5
              </span>
            </div>
          );
        })}
      </div>
      <div className="text-[10px] text-mut bg-slate-50 rounded-lg px-3 py-2 leading-relaxed">
        <strong>Escala:</strong> 1 = Nada Alinhado · 2 = Pouco · 3 = Moderadamente · 4 = Muito · 5 = Totalmente Alinhado
      </div>
    </div>
  );
}
