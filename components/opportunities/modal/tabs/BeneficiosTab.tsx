import type { Opportunity } from '@/lib/opportunities/types';

type Props = { opportunity: Opportunity };

type BeneficioDef = {
  key: keyof NonNullable<NonNullable<Opportunity['formulario_extras']>['beneficios']>;
  label: string;
  color: string;
};

const BENEFICIOS: BeneficioDef[] = [
  { key: 'reducao_tempo', label: 'Redução de Tempo', color: '#3b82f6' },
  { key: 'eliminacao_erros', label: 'Eliminação de Erros', color: '#8b5cf6' },
  { key: 'produtividade', label: 'Aumento de Produtividade', color: '#10b981' },
  { key: 'qualidade_dados', label: 'Qualidade de Dados', color: '#f59e0b' },
  { key: 'reducao_custos', label: 'Redução de Custos', color: '#ef4444' },
  { key: 'reducao_retrabalho', label: 'Redução de Retrabalho', color: '#ec4899' },
  { key: 'compliance', label: 'Compliance & Regulatório', color: '#06b6d4' },
  { key: 'objetivos_estrategicos', label: 'Objetivos Estratégicos', color: '#f97316' },
];

export function BeneficiosTab({ opportunity: o }: Props) {
  const beneficios = o.formulario_extras?.beneficios ?? {};
  const rows = BENEFICIOS.map((b) => ({
    ...b,
    value: beneficios[b.key],
  })).filter((r) => r.value != null);

  if (rows.length === 0) {
    return (
      <div className="px-5 py-8 text-center text-mut text-[12px]">
        Sem benefícios pontuados neste formulário.
      </div>
    );
  }

  return (
    <div className="px-5 py-4">
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
