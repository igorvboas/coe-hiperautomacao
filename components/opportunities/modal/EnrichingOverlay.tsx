'use client';

/**
 * Overlay exibido no corpo do modal enquanto `ai_enrichment_status === 'pending'`.
 *
 * Substitui as abas + conteúdo (Processo/Critérios/Score/…) por um estado de
 * carregamento até a IA terminar de enriquecer a oportunidade — evita mostrar
 * dados de placeholder (score/automação/critérios com defaults) que mudam segundos
 * depois. O `OpportunityDetail` faz polling do servidor; quando o status sai de
 * 'pending', este overlay desaparece e os dados reais aparecem.
 *
 * Sem dependência de imagem/lib externa: spinner via `animate-spin` (Tailwind) +
 * barra indeterminada via keyframe inline. Cores do tema (`--color-pri/pril/acc`).
 */
export function EnrichingOverlay() {
  return (
    <div className="px-6 py-16 flex flex-col items-center justify-center text-center gap-4 min-h-[280px]">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-[3px] border-bdr" />
        <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-pri animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-lg" aria-hidden>
          🤖
        </div>
      </div>

      <div>
        <div className="text-[15px] font-bold text-txt">Enriquecendo com IA…</div>
        <div className="text-[12px] text-mut mt-1 max-w-[340px] leading-relaxed">
          A IA está analisando a demanda para preencher automação, score, critérios
          e benefícios. Isso leva alguns segundos — os dados aparecem aqui
          automaticamente quando terminar.
        </div>
      </div>

      <div
        className="w-full max-w-[280px] h-1.5 rounded-full bg-bdr overflow-hidden"
        role="progressbar"
        aria-label="Enriquecendo com IA"
      >
        <div className="enrich-bar h-full rounded-full" />
      </div>

      <style>{`
        .enrich-bar {
          width: 40%;
          background: linear-gradient(90deg, var(--color-pri), var(--color-pril), var(--color-acc));
          animation: enrich-indeterminate 1.2s ease-in-out infinite;
        }
        @keyframes enrich-indeterminate {
          0%   { margin-left: -40%; }
          100% { margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}
