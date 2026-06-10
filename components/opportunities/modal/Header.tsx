'use client';

import type { Opportunity } from '@/lib/opportunities/types';
import { getInitials, scoreColor } from '@/lib/opportunities/utils';
import { StatusSelector } from './StatusSelector';
import { DeleteButton } from './DeleteButton';
import { AiEnrichmentBadge } from './AiEnrichmentBadge';

type Props = {
  opportunity: Opportunity;
  // ── Edição global do modal (Phase 13, D-12) ───────────────────────────────
  editMode: boolean;
  // IA ainda enriquecendo: oculta as ações de edição e mostra '…' no score
  // (não vazar score/prioridade pré-IA que mudam ao final do enriquecimento).
  enriching?: boolean;
  pending: boolean;
  submitError: string | null;
  // Derivados ao vivo (read-only — D-15). Em modo edição o círculo mostra estes;
  // em leitura mostra o.score / o.priority_level DB-authoritative.
  liveScore: number;
  livePriority: 'alta' | 'media' | 'baixa';
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
};

/**
 * Header do detail (modal e fullscreen) — espelha `.mo-head` do mockup
 * (`_giba_wsi-dashboard.html:386-410`): gradiente azul, avatar empilhado acima
 * do nome/processo/área à esquerda, círculo de score à direita, e uma LINHA DE
 * BOTÕES abaixo (status · Editar/Salvar/Cancelar · Excluir). O score recalcula
 * ao vivo em modo edição; em leitura mostra o valor DB-authoritative.
 */
export function ModalHeader({
  opportunity: o,
  editMode,
  enriching = false,
  pending,
  submitError,
  liveScore,
  livePriority,
  onEdit,
  onSave,
  onCancel,
}: Props) {
  // Enriquecendo: score/prioridade ainda não são confiáveis → mostra '…' neutro.
  // Em edição: score derivado ao vivo (read-only). Em leitura: DB-authoritative.
  const displayScore = enriching ? '…' : editMode ? liveScore : o.score;
  const displayPriority = editMode ? livePriority : o.priority_level;
  const color = enriching
    ? 'var(--color-mut)'
    : scoreColor(displayScore as number);
  const PRIORITY_LABEL = { alta: 'Alta', media: 'Média', baixa: 'Baixa' } as const;

  // Botão da linha de ações — v0.3 header flat (ver UI-IDENTITY.md). Editar/
  // Cancelar = outline claro; Salvar = primário verde.
  const mhbtn =
    'px-3.5 py-1.5 rounded-lg text-[12px] font-semibold border transition-colors inline-flex items-center gap-1 disabled:opacity-50';
  const mhbtnOutline = `${mhbtn} bg-wh border-bdr text-txt hover:bg-bg`;

  return (
    <div className="bg-wh border-b border-bdr pl-6 pr-12 py-5">
      <div className="flex items-start gap-3.5">
        <div className="w-[48px] h-[48px] rounded-full bg-nav text-white flex items-center justify-center font-bold text-[16px] shrink-0">
          {getInitials(o.solicitante)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[18px] font-bold text-txt truncate">
            #{String(o.seq_id).padStart(4, '0')} · {o.processo}
          </div>
          <div className="text-[13px] text-mut truncate mt-0.5">
            {o.solicitante}
          </div>
          <div className="mt-1.5 flex items-center gap-2 flex-wrap text-[12px] text-mut">
            <span className="truncate">
              🏢 {o.area}
              {o.subarea && o.subarea !== o.area ? ` · ${o.subarea}` : ''}
            </span>
            <AiEnrichmentBadge
              status={o.ai_enrichment_status}
              error={o.ai_enrichment_error}
            />
          </div>
        </div>

        {/* Score à direita — anel colorido sobre fundo branco */}
        <div className="flex flex-col items-center shrink-0">
          <div
            className="w-[52px] h-[52px] rounded-full border-[3px] flex items-center justify-center bg-wh"
            style={{ borderColor: color }}
            title={
              enriching
                ? 'Score sendo calculado pela IA…'
                : displayPriority
                  ? `Prioridade: ${PRIORITY_LABEL[displayPriority]}`
                  : undefined
            }
          >
            <div
              className="text-[19px] font-extrabold leading-none"
              style={{ color }}
            >
              {displayScore}
            </div>
          </div>
          <div className="text-[9px] text-mut uppercase tracking-wide mt-1">
            score
          </div>
        </div>
      </div>

      {/* Linha de botões */}
      <div className="mt-4 flex items-center gap-2 flex-wrap">
        <StatusSelector opportunityId={o.id} currentStatus={o.status} />

        {enriching ? null : !editMode ? (
          <button
            type="button"
            onClick={onEdit}
            title="Editar oportunidade"
            className={mhbtnOutline}
          >
            ✏️ Editar
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onSave}
              disabled={pending}
              title="Salvar alterações"
              className={`${mhbtn} bg-primary hover:bg-primary-hover text-white border-primary`}
            >
              {pending ? 'Salvando...' : '💾 Salvar'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={pending}
              title="Cancelar edição"
              className={mhbtnOutline}
            >
              ✕ Cancelar
            </button>
          </>
        )}

        {!editMode && (
          <DeleteButton
            opportunityId={o.id}
            label={`#${String(o.seq_id).padStart(4, '0')} · ${o.solicitante}`}
          />
        )}
      </div>

      {/* Erro de submit (pt-BR) — só em edição (D-12). */}
      {editMode && submitError && (
        <div className="mt-2 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-[11px] text-red-700">
          {submitError}
        </div>
      )}
    </div>
  );
}
