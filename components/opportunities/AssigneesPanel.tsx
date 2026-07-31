'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setOpportunityAssignees } from '@/lib/opportunities/assignee-actions';
import {
  assigneeInitials,
  assigneeName,
  type Assignee,
  type AssignableProfile,
} from '@/lib/opportunities/assignee-types';
import { cargoLabel } from '@/lib/security/cargo';

type Props = {
  opportunityId: string;
  assignees: Assignee[];
  /** Pessoas do tenant da oportunidade. Vazio quando não pode atribuir. */
  options: AssignableProfile[];
  /** tenant_admin ou platform_admin — só eles veem o botão de gerenciar. */
  canAssign: boolean;
};

/**
 * Painel de pessoas atribuídas, no topo do detalhe da oportunidade. Substitui
 * o antigo campo de texto "Responsável CoE": agora são perfis reais (0032).
 * Quem não é admin vê a lista, sem o botão.
 */
export function AssigneesPanel({ opportunityId, assignees, options, canAssign }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<string[]>(() =>
    assignees.map((a) => a.profileId)
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(profileId: string) {
    setSelected((prev) =>
      prev.includes(profileId)
        ? prev.filter((id) => id !== profileId)
        : [...prev, profileId]
    );
  }

  function onCancel() {
    setSelected(assignees.map((a) => a.profileId));
    setError(null);
    setEditing(false);
  }

  function onSave() {
    setError(null);
    startTransition(async () => {
      const result = await setOpportunityAssignees(opportunityId, selected);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  return (
    <div className="bg-wh border border-bdr rounded-xl shadow-sm px-4 py-3 flex flex-col gap-3">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[10px] uppercase tracking-wider font-bold text-mut">
          Atribuído a
        </span>

        {assignees.length === 0 ? (
          <span className="text-[12px] text-mut">Ninguém atribuído</span>
        ) : (
          <div className="flex items-center gap-1.5 flex-wrap">
            {assignees.map((a) => (
              <span
                key={a.profileId}
                title={`${a.email}${a.cargo ? ` · ${cargoLabel(a.cargo)}` : ''}`}
                className="inline-flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full bg-bg border border-bdr text-[12px] text-txt"
              >
                <span className="w-5 h-5 rounded-full bg-pri text-white text-[9px] font-bold flex items-center justify-center">
                  {assigneeInitials(a)}
                </span>
                {assigneeName(a)}
                {a.cargo && (
                  <span className="text-[10px] text-mut">{cargoLabel(a.cargo)}</span>
                )}
              </span>
            ))}
          </div>
        )}

        {canAssign && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="ml-auto px-2.5 py-1 text-[12px] font-semibold rounded-lg border border-bdr bg-wh text-txt hover:bg-bg transition-colors"
          >
            Gerenciar
          </button>
        )}
      </div>

      {editing && (
        <div className="flex flex-col gap-2 border-t border-bdr pt-3">
          {options.length === 0 ? (
            <p className="text-[12px] text-mut">
              Ninguém desta empresa tem conta ainda — convide pessoas em Equipe.
            </p>
          ) : (
            <div className="flex flex-col gap-1 max-h-56 overflow-y-auto">
              {options.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center gap-2 text-[13px] text-txt px-1.5 py-1 rounded-md hover:bg-bg cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(p.id)}
                    onChange={() => toggle(p.id)}
                    disabled={pending}
                  />
                  <span className="font-medium">{assigneeName(p)}</span>
                  <span className="text-[11px] text-mut">
                    {p.cargo ? cargoLabel(p.cargo) : p.email}
                  </span>
                </label>
              ))}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 dark:text-red-300 dark:bg-red-950/40 dark:border-red-800"
            >
              {error}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSave}
              disabled={pending}
              className="px-3 py-1.5 text-[12px] font-semibold rounded-lg bg-pri hover:bg-pril text-white disabled:opacity-50 transition-colors"
            >
              {pending ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={pending}
              className="px-3 py-1.5 text-[12px] font-semibold rounded-lg border border-bdr bg-wh text-txt hover:bg-bg disabled:opacity-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
