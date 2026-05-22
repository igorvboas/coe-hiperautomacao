import type { Opportunity } from '@/lib/opportunities/types';
import { StatusBadge } from '@/components/opportunities/cells';
import { Field } from './Field';

type Props = { opportunity: Opportunity };

export function ProcessoTab({ opportunity: o }: Props) {
  const extras = o.formulario_extras ?? {};

  return (
    <div className="px-5 py-4">
      <div className="grid grid-cols-2 gap-x-5 gap-y-0">
        <div>
          <Field label="Frequência de Execução" value={o.frequencia} />
          <Field label="Volume Médio" value={o.volume_medio} />
          <Field label="Tempo Médio de Execução" value={o.tempo_execucao} />
          <Field label="Pessoas Envolvidas" value={o.num_pessoas} />
        </div>
        <div>
          <Field label="E-mail do Solicitante" value={o.email} />
          <Field label="Área Responsável" value={o.area} />
          <Field label="Subárea / Time" value={o.subarea} />
          <Field label="Tipo do Processo" value={extras.tipo_processo} />
          <div className="mb-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-mut mb-1">
              Status Atual
            </div>
            <StatusBadge status={o.status} />
          </div>
        </div>
      </div>

      <Field label="Sistemas Utilizados" value={extras.sistemas} multiline />
      <Field label="Responsável CoE" value={o.responsavel} hideIfEmpty />
      <Field label="Notas" value={o.notas} multiline hideIfEmpty />
    </div>
  );
}
