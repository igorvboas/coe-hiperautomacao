import type { Opportunity } from '@/lib/opportunities/types';
import { ComplexityBadge } from '@/components/opportunities/cells';

type Props = { opportunity: Opportunity };

// Espelha `renderProcTab` do mockup (_giba:1012-1028): `.info-grid` de cards
// (bg-bg, label 10px uppercase, valor 13px/600) em 2 colunas, com Processo e
// Tipo do Processo ocupando a linha inteira (`.info-item.full`).
export function ProcessoTab({ opportunity: o }: Props) {
  const tipos = o.tipo_processo ?? [];

  return (
    <div className="px-5 py-[18px]">
      <div className="grid grid-cols-2 gap-2.5">
        <InfoItem full label="Processo" value={o.processo} />
        <InfoItem label="Área" value={o.area} />
        <InfoItem label="Subárea / Time" value={o.subarea} />
        <InfoItem label="Frequência" value={o.frequencia} />
        <InfoItem label="Volume Médio" value={o.volume_medio} />
        <InfoItem label="Tempo de Execução" value={o.tempo_execucao} />
        <InfoItem label="Nº de Pessoas" value={o.num_pessoas} />
        <InfoItem label="Complexidade">
          <ComplexityBadge value={o.complexidade} />
        </InfoItem>
        <InfoItem full label="Tipo do Processo">
          {tipos.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {tipos.map((t, i) => (
                <span
                  key={i}
                  className="bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                >
                  {t}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-mut">—</span>
          )}
        </InfoItem>
        <InfoItem label="Solicitante" value={o.solicitante} />
        <InfoItem label="E-mail" value={o.email} small />
      </div>
    </div>
  );
}

type InfoItemProps = {
  label: string;
  value?: string | null;
  full?: boolean;
  small?: boolean;
  children?: React.ReactNode;
};

function InfoItem({ label, value, full, small, children }: InfoItemProps) {
  const empty = !value || value.trim() === '';
  return (
    <div className={`bg-bg rounded-lg px-3.5 py-2.5 ${full ? 'col-span-2' : ''}`}>
      <div className="text-[10px] font-bold uppercase tracking-wider text-mut mb-0.5">
        {label}
      </div>
      {children ?? (
        <div
          className={`font-semibold text-txt ${small ? 'text-[12px]' : 'text-[13px]'}`}
        >
          {empty ? <span className="text-mut">—</span> : value}
        </div>
      )}
    </div>
  );
}
