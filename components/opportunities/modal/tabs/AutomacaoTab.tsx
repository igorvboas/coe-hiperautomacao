import type { Opportunity } from '@/lib/opportunities/types';
import { ToolBadge, StatusBadge } from '@/components/opportunities/cells';

type Props = { opportunity: Opportunity };

// Espelha `renderAutoTab` do mockup (_giba:1053-1074): seções com h4 sublinhado
// (Ferramenta Sugerida · Status · Responsável · Escopo do Projeto). Os benefícios
// esperados (texto livre) ficam na aba Benefícios, não aqui.
export function AutomacaoTab({ opportunity: o }: Props) {
  const escopo = o.escopo_automacao ?? [];

  return (
    <div className="px-5 py-[18px]">
      <Section title="Ferramenta Sugerida">
        <div className="flex items-center gap-2">
          <ToolBadge tool={o.ferramenta} />
        </div>
      </Section>

      <Section title="Status">
        <StatusBadge status={o.status} />
      </Section>

      <Section title="Responsável">
        {o.responsavel && o.responsavel.trim() !== '' ? (
          <div className="text-[13px] text-txt">{o.responsavel}</div>
        ) : (
          <div className="text-[13px] text-mut">Não atribuído</div>
        )}
      </Section>

      <Section title="Escopo do Projeto" last>
        {escopo.length > 0 ? (
          <ul className="m-0 p-0 list-none">
            {escopo.map((item, i) => (
              <li
                key={i}
                className="py-1.5 border-b border-bdr last:border-b-0 text-[13px] flex gap-2"
              >
                <span className="flex-shrink-0">⚡</span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-mut text-[12px]">
            Nenhum escopo definido ainda.
          </span>
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
  last,
}: {
  title: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={last ? '' : 'mb-3.5'}>
      <h4 className="text-[12px] font-bold text-mut uppercase tracking-wider mb-2 border-b border-bdr pb-1.5">
        {title}
      </h4>
      {children}
    </div>
  );
}
