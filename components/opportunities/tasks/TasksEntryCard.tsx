import Link from 'next/link';

type Props = {
  opportunityId: string;
  taskCount: number;
};

/**
 * Card de entrada para o Plano de Atividades, no topo do detalhe da
 * oportunidade — mesmo container visual do AssigneesPanel (fundo branco,
 * borda, cantos arredondados, sombra leve). Deliberadamente NÃO é uma aba do
 * TabsNav: aquele componente troca conteúdo no lugar, sem navegar, o que
 * quebraria a abstração para uma mudança de rota (RESEARCH §Pattern 6).
 */
export function TasksEntryCard({ opportunityId, taskCount }: Props) {
  const label = taskCount === 1 ? '1 tarefa' : `${taskCount} tarefas`;

  return (
    <div className="bg-wh border border-bdr rounded-xl shadow-sm px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-[12px] font-bold text-txt">🗂️ Plano de Atividades</span>
        <span className="text-[11px] text-mut">{label}</span>
      </div>
      <Link
        href={`/opportunities/${opportunityId}/tarefas`}
        className="text-[12px] font-semibold text-pri hover:text-pril inline-flex items-center gap-1"
      >
        Ver tarefas →
      </Link>
    </div>
  );
}
