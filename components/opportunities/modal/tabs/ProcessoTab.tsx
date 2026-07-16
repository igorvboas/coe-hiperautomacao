import type { Opportunity } from '@/lib/opportunities/types';
import { StatusBadge, CriticidadeBadge } from '@/components/opportunities/cells';
import { tempoAbertoCoe } from '@/lib/opportunities/coe';
import { Field } from './Field';

type Props = { opportunity: Opportunity };

export function ProcessoTab({ opportunity: o }: Props) {
  const extras = o.formulario_extras ?? {};
  const tempoAberto = tempoAbertoCoe(o.data_abertura_coe, o.data_fechamento_coe);

  return (
    <div className="px-5 py-4">
      <div className="grid grid-cols-2 gap-x-5 gap-y-0">
        <div>
          <Field label="Frequência de Execução" value={o.frequencia} />
          <Field label="Volume Médio" value={o.volume_medio} />
          <Field label="Tempo Médio de Execução" value={o.tempo_execucao} />
          <Field label="Pessoas Envolvidas" value={o.num_pessoas} />
          <Field
            label="Execuções/mês"
            value={o.execucoes_mes != null ? String(o.execucoes_mes) : null}
            hideIfEmpty
          />
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

      {/* v0.3 — operacionais (automação já implementada) */}
      {(o.criticidade || o.azure_boards_codigo || o.linguagem || o.execucao || o.usuarios_servico || o.data_conclusao) && (
        <div className="grid grid-cols-2 gap-x-5 gap-y-0 mt-1 pt-3 border-t border-bdr">
          <div>
            <div className="mb-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-mut mb-1">
                Criticidade
              </div>
              <CriticidadeBadge value={o.criticidade} />
            </div>
            <Field label="Código Azure Boards" value={o.azure_boards_codigo} hideIfEmpty />
            <Field label="Linguagem" value={o.linguagem} hideIfEmpty />
          </div>
          <div>
            <Field label="Execução" value={o.execucao} hideIfEmpty />
            <Field label="Usuários de Serviço" value={o.usuarios_servico} hideIfEmpty />
            <Field label="Data de Conclusão" value={o.data_conclusao} hideIfEmpty />
          </div>
        </div>
      )}
      {tempoAberto && (
        <p className="text-[11px] text-mut mt-1">⏱️ {tempoAberto} no COE</p>
      )}

      <Field label="Sistemas Utilizados" value={extras.sistemas} multiline />
      <Field label="Responsável CoE" value={o.responsavel} hideIfEmpty />
      <Field label="Notas" value={o.notas} multiline hideIfEmpty />
    </div>
  );
}
