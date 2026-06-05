import type { Opportunity } from '@/lib/opportunities/types';
import { rpaTier } from '@/lib/opportunities/cells';

// rpaTier (fn pura, _giba:520-525) vive em lib/opportunities/cells.ts — fonte
// única importável também pelos specs puros. Reexportado aqui para os consumidores
// de UI (tabela/kanban) que já importam de './cells'.
export { rpaTier };

// =============================================================================
// SourceBadge — persona / formulario
// =============================================================================
const SOURCE_LABEL = {
  persona: 'Persona',
  formulario: 'Formulário',
} as const;

export function SourceBadge({ source }: { source: Opportunity['source'] }) {
  const isPersona = source === 'persona';
  return (
    <span
      className={
        'inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ' +
        (isPersona
          ? 'bg-violet-100 text-violet-800'
          : 'bg-emerald-100 text-emerald-800')
      }
    >
      {SOURCE_LABEL[source]}
    </span>
  );
}

// =============================================================================
// ToolBadge — rpa | n8n | ambos
// =============================================================================
const TOOL_MAP = {
  rpa: { label: '🤖 RPA', bg: 'bg-violet-100', fg: 'text-rpa' },
  n8n: { label: '⚡ n8n', bg: 'bg-orange-50', fg: 'text-n8n' },
  ambos: { label: '🔁 Ambos', bg: 'bg-cyan-50', fg: 'text-both' },
} as const;

export function ToolBadge({ tool }: { tool: Opportunity['ferramenta'] }) {
  if (!tool) return <span className="text-mut text-xs">—</span>;
  const m = TOOL_MAP[tool];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${m.bg} ${m.fg}`}
    >
      {m.label}
    </span>
  );
}

// =============================================================================
// StatusBadge — 8 status com cor+ícone (extraído do mockup STATUS_INFO)
// =============================================================================
const STATUS_MAP = {
  novo: { label: 'Novo', icon: '🆕', bg: '#f1f5f9', color: '#64748b' },
  em_analise: { label: 'Em Análise', icon: '🔍', bg: '#ede9fe', color: '#8b5cf6' },
  planejamento: { label: 'Planejamento', icon: '📋', bg: '#dbeafe', color: '#3b82f6' },
  backlog: { label: 'Backlog', icon: '⏳', bg: '#fef3c7', color: '#f59e0b' },
  desenvolvimento: { label: 'Desenvolvimento', icon: '⚙️', bg: '#ffedd5', color: '#f97316' },
  homologacao: { label: 'Homologação', icon: '🧪', bg: '#cffafe', color: '#06b6d4' },
  producao: { label: 'Produção', icon: '🚀', bg: '#dcfce7', color: '#22c55e' },
  concluido: { label: 'Concluído', icon: '✅', bg: '#d1fae5', color: '#10b981' },
} as const;

export function StatusBadge({ status }: { status: Opportunity['status'] }) {
  const m = STATUS_MAP[status];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap"
      style={{ backgroundColor: m.bg, color: m.color }}
    >
      <span>{m.icon}</span>
      <span>{m.label}</span>
    </span>
  );
}

// =============================================================================
// ComplexityBadge — baixo / medio / alto
// =============================================================================
const COMPLEX_MAP = {
  baixo: { label: 'Baixa', bg: 'bg-green-100', fg: 'text-green-800' },
  medio: { label: 'Média', bg: 'bg-yellow-100', fg: 'text-yellow-900' },
  alto: { label: 'Alta', bg: 'bg-red-100', fg: 'text-red-800' },
} as const;

export function ComplexityBadge({ value }: { value: Opportunity['complexidade'] }) {
  if (!value) return <span className="text-mut text-xs">—</span>;
  const m = COMPLEX_MAP[value];
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${m.bg} ${m.fg}`}
    >
      {m.label}
    </span>
  );
}

// =============================================================================
// RpaFitBadge — badge por faixa de rpa_score (D-05 / _giba:520-525)
//   rs >= 5 → ⭐ RPA Ideal (n/6)   (âmbar)
//   rs >= 3 → ✓  RPA+n8n (n/6)     (índigo)
//   else    → n8n (n/6)            (cinza)
// Reusa rpaTier (lib/opportunities/cells — fonte única do rótulo/ícone) e
// mapeia o tom da faixa para as cores inline do mockup.
// =============================================================================
function rpaColors(rs: number): { bg: string; fg: string } {
  if (rs >= 5) return { bg: '#fef3c7', fg: '#92400e' };
  if (rs >= 3) return { bg: '#e0e7ff', fg: '#3730a3' };
  return { bg: '#f1f5f9', fg: '#64748b' };
}

export function RpaFitBadge({ score }: { score: number | null }) {
  if (score == null) return <span className="text-mut text-xs">—</span>;
  const tier = rpaTier(score);
  const colors = rpaColors(score);
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap"
      style={{ backgroundColor: colors.bg, color: colors.fg }}
    >
      {tier.icon ? `${tier.icon} ` : ''}
      {tier.label}
    </span>
  );
}

// =============================================================================
// FteCell — FTE em h/mês (D-05). null → travessão.
// =============================================================================
export function FteCell({ fte }: { fte: number | null }) {
  if (fte == null) return <span className="text-mut text-xs">—</span>;
  return <span className="text-[12px] tabular-nums">{Math.round(fte)}h</span>;
}

// =============================================================================
// ScoreDisplay — número + dot colorido (>=70 verde, >=40 amarelo, <40 vermelho)
// =============================================================================
function scoreColor(s: number) {
  if (s >= 70) return 'var(--color-grn)';
  if (s >= 40) return 'var(--color-yel)';
  return 'var(--color-red)';
}

export function ScoreDisplay({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: scoreColor(score) }}
      />
      <span
        className="text-sm font-extrabold tabular-nums"
        style={{ color: scoreColor(score) }}
      >
        {score}
      </span>
    </div>
  );
}

// =============================================================================
// PriorityPill — alta / media / baixa
// =============================================================================
const PRIORITY_MAP = {
  alta: { label: 'Alta', bg: 'bg-green-500', fg: 'text-white' },
  media: { label: 'Média', bg: 'bg-amber-500', fg: 'text-white' },
  baixa: { label: 'Baixa', bg: 'bg-red-500', fg: 'text-white' },
} as const;

export function PriorityPill({ level }: { level: Opportunity['priority_level'] }) {
  const m = PRIORITY_MAP[level];
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${m.bg} ${m.fg}`}
    >
      {m.label}
    </span>
  );
}

// =============================================================================
// SeqIdDisplay — #0001 zero-padded
// =============================================================================
export function SeqIdDisplay({ seqId }: { seqId: number }) {
  return (
    <span className="font-extrabold text-[11px] text-pri tracking-wider">
      #{String(seqId).padStart(4, '0')}
    </span>
  );
}
