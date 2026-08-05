'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export type TaskView = 'lista' | 'kanban';

// Neste plano (16-06) o switcher registra Lista e Kanban; 16-07 acrescenta a
// entrada de Gantt à mesma lista, sem mudar a mecânica.
const VIEWS: { id: TaskView; icon: string; label: string }[] = [
  { id: 'lista', icon: '☰', label: 'Lista' },
  { id: 'kanban', icon: '📊', label: 'Kanban' },
];

type Props = {
  currentView: TaskView;
};

/**
 * Controle segmentado de troca de view — forma exata do switcher de
 * `toolbar.tsx` (mesmo container, mesmas classes de opção ativa/inativa,
 * rótulos ocultos abaixo do breakpoint `lg`). Troca só o parâmetro `view` na
 * URL, preservando todos os demais (`?tarefa=`, `?parent=`, e qualquer
 * parâmetro futuro) — para não derrubar um diálogo aberto nem perder estado
 * de navegação (UI-SPEC "View switcher").
 */
export function TaskViewSwitcher({ currentView }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function changeView(view: TaskView) {
    const qs = new URLSearchParams(searchParams.toString());
    if (view === 'lista') {
      qs.delete('view');
    } else {
      qs.set('view', view);
    }
    const query = qs.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="flex items-center gap-1 bg-bg border border-bdr rounded-lg p-0.5">
      {VIEWS.map((v) => {
        const isActive = v.id === currentView;
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => changeView(v.id)}
            title={v.label}
            className={
              'px-2.5 py-1.5 rounded-md text-[12px] font-semibold transition-colors inline-flex items-center gap-1 whitespace-nowrap ' +
              (isActive ? 'bg-wh text-txt shadow-sm' : 'text-mut hover:text-txt')
            }
          >
            <span>{v.icon}</span>
            <span className="hidden lg:inline">{v.label}</span>
          </button>
        );
      })}
    </div>
  );
}
