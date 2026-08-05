'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { AssignableProfile } from '@/lib/opportunities/assignee-types';
import { TaskForm } from './TaskForm';

type Props = {
  opportunityId: string;
  assignableProfiles: AssignableProfile[];
  parentTitle?: string;
  parentTaskId?: string;
};

/**
 * Layout de PÁGINA (não overlay) que envolve o TaskForm — usado pela rota
 * fullscreen de criação. Espelha RiskFormPage.tsx, mas o link de voltar aponta
 * para a Lista de tarefas (`/opportunities/${id}/tarefas`), não para o detalhe
 * da oportunidade — a volta natural de um formulário de tarefa é a lista.
 */
export function TaskFormPage({
  opportunityId,
  assignableProfiles,
  parentTitle,
  parentTaskId,
}: Props) {
  const router = useRouter();

  function onDone() {
    router.push(`/opportunities/${opportunityId}/tarefas`);
  }

  return (
    <div className="px-6 py-4">
      <div className="max-w-lg mx-auto">
        <div className="mb-3">
          <Link
            href={`/opportunities/${opportunityId}/tarefas`}
            className="text-[11px] font-semibold text-pri hover:text-pril inline-flex items-center gap-1"
          >
            ← Voltar
          </Link>
        </div>
        <div className="bg-wh rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-bg border-b border-bdr px-5 py-3">
            <h1 className="text-[14px] font-bold text-pri">
              {parentTitle ? '➕ Nova Subtarefa' : '+ Nova Tarefa'}
            </h1>
          </div>
          <div className="px-5 py-4">
            <TaskForm
              opportunityId={opportunityId}
              assignableProfiles={assignableProfiles}
              parentTitle={parentTitle}
              parentTaskId={parentTaskId}
              onDone={onDone}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
