import type { OpportunityKpis } from '@/lib/opportunities/types';

type Props = { kpis: OpportunityKpis };

type KpiCellProps = {
  value: number | string;
  label: string;
  color?: string;
};

function KpiCell({ value, label, color }: KpiCellProps) {
  return (
    <div className="text-center min-w-[62px]">
      <div
        className="text-xl font-extrabold leading-none"
        style={{ color: color ?? 'var(--color-pri)' }}
      >
        {value}
      </div>
      <div className="text-[9px] text-mut mt-0.5 uppercase tracking-wider whitespace-nowrap">
        {label}
      </div>
    </div>
  );
}

function Divider() {
  return <div className="w-px bg-bdr h-7 flex-shrink-0" />;
}

export function KpiBar({ kpis }: Props) {
  return (
    <div className="bg-white border-b border-bdr px-6 py-2.5 flex gap-3.5 items-center overflow-x-auto">
      <KpiCell value={kpis.total} label="Total" />
      <Divider />
      <KpiCell value={kpis.byPriority.alta} label="🟢 Alta (≥70)" color="#22c55e" />
      <KpiCell value={kpis.byPriority.media} label="🟡 Média (40-69)" color="#f59e0b" />
      <KpiCell value={kpis.byPriority.baixa} label="🔴 Baixa (<40)" color="#ef4444" />
      <Divider />
      <KpiCell value={kpis.scoreMedio || '–'} label="Score Médio" />
      <KpiCell value={`${kpis.fteTotal}h`} label="FTE Total/mês" color="#0ea5e9" />
      <Divider />
      <KpiCell value={kpis.byStatus.novo || '–'} label="Novos" color="#64748b" />
      <KpiCell value={kpis.byStatus.producao || '–'} label="Produção" color="#22c55e" />
      <KpiCell value={kpis.byStatus.concluido || '–'} label="Concluídos" color="#10b981" />
    </div>
  );
}
