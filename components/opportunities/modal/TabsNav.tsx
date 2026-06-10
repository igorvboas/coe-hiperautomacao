'use client';

import type { TabDef, TabId } from './types';

type Props = {
  tabs: TabDef[];
  activeTab: TabId;
  onChange: (id: TabId) => void;
};

export function TabsNav({ tabs, activeTab, onChange }: Props) {
  // `.tabs` do mockup (_giba:150-156): faixa #f8fafc, padding lateral 16px,
  // botões 12px, aba ativa = cor pri + borda inferior 3px pri.
  return (
    <div className="flex gap-0.5 px-4 border-b border-bdr bg-slate-50 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tabs.map((t) => {
        const isActive = t.id === activeTab;
        return (
          <button
            type="button"
            key={t.id}
            onClick={() => onChange(t.id)}
            className={
              'px-3.5 py-2.5 text-[12px] font-semibold whitespace-nowrap border-b-[3px] -mb-px flex items-center gap-1.5 transition-colors ' +
              (isActive
                ? 'text-pri border-pri'
                : 'text-mut border-transparent hover:text-pri')
            }
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
