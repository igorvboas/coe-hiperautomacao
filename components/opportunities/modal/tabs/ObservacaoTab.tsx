'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Opportunity } from '@/lib/opportunities/types';
import { updateObservacao } from '@/lib/opportunities/actions';
import { TextareaField } from '@/components/opportunities/wizard/steps/fields';

type Props = { opportunity: Opportunity };

// Aba Observação: campo livre `observacao` com edição INLINE (botão próprio de
// Editar/Salvar) — independente do modo de edição global do modal. O campo
// `risco` (nota livre legada) foi removido: o registro de riscos é estruturado
// na aba Risco (`opportunity_risks`).
export function ObservacaoTab({ opportunity: o }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(o.observacao ?? '');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const saved = (o.observacao ?? '').trim();
  const isEmpty = saved.length === 0;

  function onEdit() {
    setValue(o.observacao ?? '');
    setError(null);
    setEditing(true);
  }

  function onCancel() {
    setError(null);
    setEditing(false);
  }

  function onSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateObservacao(o.id, value);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  return (
    <div className="px-5 py-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-mut">
          Observação
        </div>
        {!editing && (
          <button
            type="button"
            onClick={onEdit}
            className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-txt text-[11px] font-semibold border border-bdr inline-flex items-center gap-1"
          >
            ✏️ Editar
          </button>
        )}
      </div>

      {editing ? (
        <div>
          <TextareaField
            label=""
            value={value}
            onChange={setValue}
            rows={5}
            placeholder="Anote observações sobre esta oportunidade…"
          />
          {error && (
            <div className="text-[11px] text-red-700 mt-1">{error}</div>
          )}
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={onSave}
              disabled={pending}
              className="px-3 py-1.5 bg-acc hover:opacity-90 text-white text-[12px] font-bold rounded-lg disabled:opacity-50"
            >
              {pending ? 'Salvando...' : '💾 Salvar'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={pending}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-txt text-[12px] font-semibold rounded-lg disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : isEmpty ? (
        <p className="text-[12px] text-mut italic">Nada registrado.</p>
      ) : (
        <div className="text-[12px] leading-relaxed text-txt whitespace-pre-wrap">
          {saved}
        </div>
      )}
    </div>
  );
}
