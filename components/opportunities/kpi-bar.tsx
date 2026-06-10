import type { OpportunityKpis } from '@/lib/opportunities/types';

type Props = { kpis: OpportunityKpis };

// Ícones inline (stroke 1.8) — sem dependência de icon lib.
const svg = {
  className: 'w-[18px] h-[18px]',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const ICONS = {
  total: (
    <svg {...svg}>
      <path d="M12 2 2 7l10 5 10-5-10-5Z" />
      <path d="m2 17 10 5 10-5" />
      <path d="m2 12 10 5 10-5" />
    </svg>
  ),
  novas: (
    <svg {...svg}>
      <path d="M12 3v18M3 12h18" />
    </svg>
  ),
  analise: (
    <svg {...svg}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
  concluidas: (
    <svg {...svg}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  ),
};

type CardProps = {
  label: string;
  value: number | string;
  sub: string;
  icon: React.ReactNode;
  tint: string; // classe de cor do ícone (texto) — o fundo usa /10
  iconBg: string;
};

function KpiCard({ label, value, sub, icon, tint, iconBg }: CardProps) {
  return (
    <div className="bg-wh rounded-xl border border-bdr p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[12px] font-medium text-mut">{label}</span>
        <span
          className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg} ${tint}`}
        >
          {icon}
        </span>
      </div>
      <div className="mt-3 text-[30px] font-bold text-txt leading-none tabular-nums">
        {value}
      </div>
      <div className="mt-1.5 text-[12px] text-mut">{sub}</div>
    </div>
  );
}

function pct(part: number, total: number): string {
  if (!total) return '0% do total';
  return `${Math.round((part / total) * 100)}% do total`;
}

export function KpiBar({ kpis }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        label="Total"
        value={kpis.total}
        sub={`Score médio: ${kpis.scoreMedio}`}
        icon={ICONS.total}
        tint="text-slate-600"
        iconBg="bg-slate-100"
      />
      <KpiCard
        label="Novas"
        value={kpis.byStatus.novo}
        sub={pct(kpis.byStatus.novo, kpis.total)}
        icon={ICONS.novas}
        tint="text-blue-600"
        iconBg="bg-blue-50"
      />
      <KpiCard
        label="Em Análise"
        value={kpis.emAnalise}
        sub={pct(kpis.emAnalise, kpis.total)}
        icon={ICONS.analise}
        tint="text-violet-600"
        iconBg="bg-violet-50"
      />
      <KpiCard
        label="Concluídas"
        value={kpis.byStatus.concluido}
        sub={pct(kpis.byStatus.concluido, kpis.total)}
        icon={ICONS.concluidas}
        tint="text-emerald-600"
        iconBg="bg-emerald-50"
      />
    </div>
  );
}
