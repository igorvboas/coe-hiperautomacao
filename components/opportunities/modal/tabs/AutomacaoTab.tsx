import type { Opportunity } from '@/lib/opportunities/types';
import { ToolBadge, StatusBadge } from '@/components/opportunities/cells';

type Props = { opportunity: Opportunity };

export function AutomacaoTab({ opportunity: o }: Props) {
  const hasEscopo = (o.escopo_automacao ?? []).length > 0;
  const hasBeneficios = (o.beneficios_esperados ?? []).length > 0;

  return (
    <div className="px-5 py-4">
      <div className="flex items-center flex-wrap gap-3 mb-4 text-[11px]">
        <span className="font-bold uppercase tracking-wider text-mut">Ferramenta:</span>
        <ToolBadge tool={o.ferramenta} />
        <span className="font-bold uppercase tracking-wider text-mut ml-2">
          Status:
        </span>
        <StatusBadge status={o.status} />
      </div>

      <SectionTitle>Escopo de Automação Sugerido</SectionTitle>
      {hasEscopo ? (
        <ol className="space-y-2 mb-5">
          {o.escopo_automacao.map((item, i) => (
            <li key={i} className="flex gap-2 items-start">
              <span className="w-5 h-5 rounded-full bg-pri text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="text-[12px] leading-relaxed">{item}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-[11px] text-mut italic mb-5">Sem escopo cadastrado ainda.</p>
      )}

      <SectionTitle>Benefícios Esperados</SectionTitle>
      {hasBeneficios ? (
        <ul className="space-y-1.5">
          {o.beneficios_esperados.map((item, i) => (
            <li key={i} className="flex gap-2 items-start">
              <span className="w-4 h-4 rounded-full bg-acc text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                ✓
              </span>
              <span className="text-[12px] leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[11px] text-mut italic">Sem benefícios cadastrados.</p>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-bold uppercase tracking-wider text-mut mb-2 mt-1">
      {children}
    </div>
  );
}
