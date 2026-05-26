import type { Opportunity } from '@/lib/opportunities/types';

type Props = { opportunity: Opportunity };

export function ObservacaoTab({ opportunity: o }: Props) {
  const value = (o.observacao ?? '').trim();
  const isEmpty = value.length === 0;

  return (
    <div className="px-5 py-4">
      <div className="text-[10px] font-bold uppercase tracking-wider text-mut mb-2">
        Observação
      </div>
      {isEmpty ? (
        <p className="text-[12px] text-mut italic">
          Nenhuma observação registrada. Use o botão{' '}
          <span className="font-semibold">Editar</span> para preencher.
        </p>
      ) : (
        <div className="text-[12px] leading-relaxed text-txt whitespace-pre-wrap">
          {value}
        </div>
      )}
    </div>
  );
}
