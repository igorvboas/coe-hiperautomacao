import type { Opportunity, OpportunityPhase } from '@/lib/opportunities/types';
import { STATUS_META } from '@/lib/opportunities/status';

type Props = {
  opportunities: Opportunity[];
  phases: OpportunityPhase[];
};

// Fases exibidas na legenda / barras (mesmas do pipeline datado). backlog entra
// porque tem phase_key datado; novo/descontinuado não têm linha de fase.
const LEGEND_KEYS = [
  'em_analise',
  'planejamento',
  'backlog',
  'desenvolvimento',
  'homologacao',
  'producao',
  'concluido',
] as const;

const DAY = 86_400_000;

function metaFor(phaseKey: string) {
  return (STATUS_META as Record<string, (typeof STATUS_META)[keyof typeof STATUS_META]>)[
    phaseKey
  ];
}

function fmtDate(ts: number): string {
  const d = new Date(ts);
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yy = String(d.getUTCFullYear()).slice(2);
  return `${dd}/${mm}/${yy}`;
}

type Bar = {
  key: string;
  label: string;
  color: string;
  leftPct: number;
  widthPct: number;
  ongoing: boolean;
  title: string;
};

export function GanttChart({ opportunities, phases }: Props) {
  const now = Date.now();

  // Fases por oportunidade, só as que têm início datado.
  const byOpp = new Map<string, OpportunityPhase[]>();
  for (const p of phases) {
    if (!p.started_at) continue;
    const arr = byOpp.get(p.opportunity_id) ?? [];
    arr.push(p);
    byOpp.set(p.opportunity_id, arr);
  }

  // Só oportunidades com ≥1 fase datada, preservando a ordenação da lista.
  const rows = opportunities.filter((o) => byOpp.has(o.id));

  if (rows.length === 0) {
    return (
      <div className="bg-wh border border-bdr rounded-xl p-12 text-center text-mut">
        Nenhuma oportunidade com fases datadas para exibir no Gantt.
        <div className="text-[12px] mt-1">
          As datas são registradas automaticamente quando o status avança no
          pipeline.
        </div>
      </div>
    );
  }

  // Domínio temporal: menor início → maior fim (fase em andamento estende p/ hoje).
  let t0 = Infinity;
  let t1 = -Infinity;
  for (const o of rows) {
    for (const p of byOpp.get(o.id)!) {
      const s = Date.parse(p.started_at!);
      const e = p.finished_at ? Date.parse(p.finished_at) : now;
      if (s < t0) t0 = s;
      if (e > t1) t1 = e;
    }
  }
  // Padding de 1 dia em cada ponta + span mínimo p/ evitar divisão por zero.
  t0 -= DAY;
  t1 += DAY;
  if (t1 - t0 < DAY) t1 = t0 + DAY;
  const span = t1 - t0;
  const xPct = (t: number) => ((t - t0) / span) * 100;

  const ticks = Array.from({ length: 6 }, (_, i) => {
    const t = t0 + (span * i) / 5;
    return { leftPct: (i / 5) * 100, label: fmtDate(t) };
  });
  const todayPct = now >= t0 && now <= t1 ? xPct(now) : null;

  const rowData = rows.map((o) => {
    const bars: Bar[] = byOpp
      .get(o.id)!
      .map((p) => {
        const s = Date.parse(p.started_at!);
        const e = p.finished_at ? Date.parse(p.finished_at) : now;
        const meta = metaFor(p.phase_key);
        const left = xPct(s);
        const width = Math.max(xPct(e) - left, 0.8);
        const label = meta?.label ?? p.phase_key;
        return {
          key: p.id,
          label,
          color: meta?.color ?? '#94a3b8',
          leftPct: left,
          widthPct: width,
          ongoing: !p.finished_at,
          title: `${label}: ${fmtDate(s)} → ${
            p.finished_at ? fmtDate(e) : 'em andamento'
          }`,
        };
      })
      .sort((a, b) => a.leftPct - b.leftPct);
    return { o, bars };
  });

  return (
    <div className="bg-wh border border-bdr rounded-xl shadow-sm overflow-hidden">
      {/* Legenda */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-3 border-b border-bdr">
        {LEGEND_KEYS.map((k) => {
          const m = metaFor(k);
          return (
            <div key={k} className="flex items-center gap-1.5 text-[11px] text-mut">
              <span
                className="w-3 h-3 rounded-sm"
                style={{ background: m?.color ?? '#94a3b8' }}
              />
              {m?.label ?? k}
            </div>
          );
        })}
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          {/* Eixo de datas */}
          <div className="flex border-b border-bdr bg-bg">
            <div className="w-[240px] shrink-0 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-mut">
              Oportunidade
            </div>
            <div className="relative flex-1 h-8">
              {ticks.map((t, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 flex items-center text-[10px] text-mut -translate-x-1/2 whitespace-nowrap"
                  style={{ left: `${t.leftPct}%` }}
                >
                  {t.label}
                </div>
              ))}
            </div>
          </div>

          {/* Linhas */}
          {rowData.map(({ o, bars }) => (
            <div
              key={o.id}
              className="flex border-b border-bdr last:border-b-0 hover:bg-blue-50/40 dark:hover:bg-blue-950/30"
            >
              <div className="w-[240px] shrink-0 px-4 py-2.5 min-w-0">
                <div className="text-[12px] font-semibold text-txt truncate" title={o.processo}>
                  #{String(o.seq_id).padStart(4, '0')} · {o.processo}
                </div>
                <div className="text-[10px] text-mut truncate">{o.solicitante}</div>
              </div>
              <div className="relative flex-1 my-2 mr-3">
                {/* linha de "hoje" */}
                {todayPct !== null && (
                  <div
                    className="absolute top-0 bottom-0 w-px bg-red-400/70 z-10"
                    style={{ left: `${todayPct}%` }}
                    title="Hoje"
                  />
                )}
                {/* trilho */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-6">
                  {bars.map((b) => (
                    <div
                      key={b.key}
                      title={b.title}
                      className={
                        'absolute top-0 h-6 rounded-md flex items-center px-1.5 overflow-hidden ' +
                        (b.ongoing ? 'ring-1 ring-inset ring-white/50' : '')
                      }
                      style={{
                        left: `${b.leftPct}%`,
                        width: `${b.widthPct}%`,
                        background: b.ongoing
                          ? `repeating-linear-gradient(45deg, ${b.color}, ${b.color} 6px, ${b.color}cc 6px, ${b.color}cc 12px)`
                          : b.color,
                      }}
                    >
                      <span className="text-[10px] font-semibold text-white truncate">
                        {b.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-[11px] text-mut px-4 py-2.5 border-t border-bdr">
        💡 Barras hachuradas = fase em andamento (sem data de fim). Linha vermelha
        = hoje. Passe o mouse para ver as datas.
      </div>
    </div>
  );
}
