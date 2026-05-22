'use client';

import type { TabDef, TabId } from './types';

type Props = {
  tabs: TabDef[];
  activeTab: TabId;
  onChange: (id: TabId) => void;
};

export function TabsNav({ tabs, activeTab, onChange }: Props) {
  return (
    <div className="flex border-b border-bdr bg-slate-50 overflow-x-auto">
      {tabs.map((t) => {
        const isActive = t.id === activeTab;
        return (
          <button
            type="button"
            key={t.id}
            onClick={() => onChange(t.id)}
            className={
              'px-3.5 py-2.5 text-[11px] font-semibold whitespace-nowrap border-b-2 flex items-center gap-1.5 transition-colors ' +
              (isActive
                ? 'text-pri border-pri bg-white'
                : 'text-mut border-transparent hover:bg-slate-100')
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
