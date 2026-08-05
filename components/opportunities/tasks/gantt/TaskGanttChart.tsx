import type { OpportunityTask } from '@/lib/opportunities/types';

// =============================================================================
// TaskGanttChart.tsx — Gantt de 2 níveis do Plano de Atividades (Phase 16,
// TASK-10/TASK-11, D-07 — zero dependência nova, mesma técnica leftPct/widthPct
// de `components/opportunities/gantt/GanttChart.tsx`).
//
// O módulo abre com as DUAS funções puras do domínio temporal — sem React,
// sem `@dnd-kit/core`, sem `@/lib/supabase/` (16-07 Task 1; o componente
// `'use client'` que as envolve chega na Task 2). A restrição mais importante
// é de ASSINATURA, não de implementação: `computeGanttDomain` recebe o array
// COMPLETO de tarefas (raízes e subtarefas, expandidas ou não) e NUNCA um
// parâmetro de expansão — é essa restrição que torna o Pitfall 3 (RESEARCH
// §Pattern 4: "expandir uma tarefa nunca pode deslocar as outras barras")
// impossível de reintroduzir: se a função não aceita o estado de expansão
// como entrada, nenhum código que a chama pode acidentalmente filtrar por
// visibilidade antes de calcular o eixo.
// =============================================================================

const DAY_MS = 86_400_000;

/**
 * Largura mínima de uma barra, em %, para que um intervalo degenerado
 * (início igual ao fim de UMA tarefa) ainda seja visível — mesmo piso de
 * `components/opportunities/gantt/GanttChart.tsx` (`Math.max(..., 0.8)`).
 */
const MIN_BAR_WIDTH_PCT = 0.8;

export type GanttDomain = {
  /** Início do domínio (ms), com 1 dia de folga antes da menor data de início. */
  t0: number;
  /** Fim do domínio (ms), com 1 dia de folga depois da maior data de fim. */
  t1: number;
};

/**
 * Domínio temporal do Gantt — calculado sobre o array COMPLETO de tarefas
 * (raízes + subtarefas, TODAS, independentemente de expansão). Considera
 * apenas tarefas com `start_date` **e** `due_date` (A4 — tarefa com data
 * incompleta não distorce o eixo, e é tratada em outro lugar como linha sem
 * barra). Devolve `null` quando nenhuma tarefa qualifica — a UI trata isso
 * como "nada a posicionar", nunca dividindo por zero.
 *
 * Mesma técnica de `opportunities/gantt/GanttChart.tsx`: folga de 1 dia em
 * cada ponta e um piso mínimo de intervalo (`t1 - t0 >= DAY_MS`), garantindo
 * que nenhum consumidor precise proteger a divisão por `t1 - t0` em outro
 * lugar do código.
 */
export function computeGanttDomain(tasks: OpportunityTask[]): GanttDomain | null {
  let t0 = Infinity;
  let t1 = -Infinity;

  for (const task of tasks) {
    if (!task.start_date || !task.due_date) continue;
    const start = Date.parse(task.start_date);
    const due = Date.parse(task.due_date);
    if (start < t0) t0 = start;
    if (due > t1) t1 = due;
  }

  if (t0 === Infinity || t1 === -Infinity) return null;

  t0 -= DAY_MS;
  t1 += DAY_MS;
  if (t1 - t0 < DAY_MS) t1 = t0 + DAY_MS;

  return { t0, t1 };
}

/**
 * Posição de uma barra dentro do domínio — recebe o domínio já calculado e um
 * par de datas (início/fim da PRÓPRIA linha: da tarefa, ou do span agregado
 * de `computeTaskRollup` no caso da pai com subtarefas) e devolve a posição
 * inicial e a largura, ambas em porcentagem do domínio. A largura nunca cai
 * abaixo de `MIN_BAR_WIDTH_PCT`, para que um intervalo degenerado (início
 * igual ao fim) ainda produza uma barra visível.
 */
export function ganttBarPosition(
  domain: GanttDomain,
  startIso: string,
  dueIso: string
): { leftPct: number; widthPct: number } {
  const span = domain.t1 - domain.t0;
  const start = Date.parse(startIso);
  const due = Date.parse(dueIso);
  const leftPct = ((start - domain.t0) / span) * 100;
  const rightPct = ((due - domain.t0) / span) * 100;
  const widthPct = Math.max(rightPct - leftPct, MIN_BAR_WIDTH_PCT);

  return { leftPct, widthPct };
}
