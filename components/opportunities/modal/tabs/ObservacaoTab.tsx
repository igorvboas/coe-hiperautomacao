'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Opportunity, OpportunityNote } from '@/lib/opportunities/types';
import { createNote, deleteNote } from '@/lib/opportunities/note-actions';
import { TextareaField } from '@/components/opportunities/wizard/steps/fields';

type Props = {
  opportunity: Opportunity;
  notes: OpportunityNote[];
  readOnly?: boolean;
  /** Modo edição global do modal (D-12) — habilita os campos legados abaixo. */
  editMode?: boolean;
  legacyObservacao?: string;
  legacyRisco?: string;
  onLegacyChange?: (patch: { observacao?: string; risco?: string }) => void;
};

function fmtData(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('pt-BR');
}

// D-10 (legado): a aba acomoda DOIS campos de texto livre — `observacao` e
// `risco` (nota livre da 0009, ≠ tabela estruturada `opportunity_risks`, que
// vive na aba Risco/Phase 12). v0.3 acrescenta as Anotações estruturadas
// (autor+data, `opportunity_notes`) ACIMA dos legados — substituem o padrão
// de texto único livre pra registros novos sem descartar o histórico antigo.
export function ObservacaoTab({
  opportunity: o,
  notes,
  readOnly = false,
  editMode = false,
  legacyObservacao,
  legacyRisco,
  onLegacyChange,
}: Props) {
  const router = useRouter();
  const [texto, setTexto] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!texto.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await createNote(o.id, { texto: texto.trim() });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setTexto('');
      router.refresh();
    });
  }

  function onDelete(noteId: string) {
    if (!confirm('Excluir esta anotação?')) return;
    startTransition(async () => {
      const result = await deleteNote(noteId, o.id);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="px-5 py-4 space-y-5">
      <div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-mut mb-2">
          Anotações
        </div>

        {!readOnly && (
          <div className="mb-3">
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={2}
              placeholder="Escreva uma anotação..."
              className="w-full px-2.5 py-1.5 border border-bdr rounded-lg text-[12px] bg-bg"
            />
            <button
              type="button"
              onClick={submit}
              disabled={pending || !texto.trim()}
              className="mt-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg disabled:opacity-50"
            >
              ➕ Adicionar anotação
            </button>
            {error && <div className="text-[11px] text-red-700 dark:text-red-300 mt-1">{error}</div>}
          </div>
        )}

        {notes.length === 0 ? (
          <p className="text-[12px] text-mut italic">Sem anotações registradas.</p>
        ) : (
          <table className="w-full text-[12px]">
            <tbody>
              {notes.map((n) => (
                <tr key={n.id} className="border-b border-bdr last:border-b-0 align-top">
                  <td className="py-2 pr-2 w-20 text-[10px] text-mut whitespace-nowrap">
                    {fmtData(n.created_at)}
                  </td>
                  <td className="py-2 whitespace-pre-wrap">{n.texto}</td>
                  {!readOnly && (
                    <td className="py-2 text-right w-10">
                      <button
                        type="button"
                        onClick={() => onDelete(n.id)}
                        title="Excluir anotação"
                        className="bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 rounded px-2 py-1 text-[10px] font-bold"
                      >
                        🗑️
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editMode ? (
        <>
          <TextareaField
            label="Observação (legado)"
            value={legacyObservacao ?? ''}
            onChange={(v) => onLegacyChange?.({ observacao: v })}
            rows={4}
          />
          <TextareaField
            label="Risco (nota livre, legado)"
            value={legacyRisco ?? ''}
            onChange={(v) => onLegacyChange?.({ risco: v })}
            rows={4}
          />
        </>
      ) : (
        <>
          <FreeTextBlock label="Observação (legado)" value={o.observacao} />
          <FreeTextBlock
            label="Risco (nota livre, legado)"
            value={o.risco}
            hint="Nota livre legada — o registro estruturado de riscos fica na aba Risco."
          />
        </>
      )}
    </div>
  );
}

function FreeTextBlock({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | null;
  hint?: string;
}) {
  const text = (value ?? '').trim();
  const isEmpty = text.length === 0;

  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-mut mb-2">
        {label}
      </div>
      {isEmpty ? (
        <p className="text-[12px] text-mut italic">Nada registrado.</p>
      ) : (
        <div className="text-[12px] leading-relaxed text-txt whitespace-pre-wrap">
          {text}
        </div>
      )}
      {hint && <p className="text-[10px] text-mut mt-1.5">{hint}</p>}
    </div>
  );
}
