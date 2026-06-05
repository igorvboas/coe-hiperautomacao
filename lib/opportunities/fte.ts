import { fteBucketEnum } from './schema';

/**
 * Bucket de FTE (5º fator de score) — deriva do enum existente, sem redefinir
 * os literais. Fonte do tipo: `fteBucketEnum` em `lib/opportunities/schema.ts`.
 */
export type FteBucket = (typeof fteBucketEnum)['options'][number];

/**
 * deriveFteBucket — fonte ÚNICA horas/mês → bucket de FTE (D-01/D-02).
 *
 * O usuário digita apenas `fte_horas` (step Benefícios); o bucket (`prioridade_fte`)
 * é derivado automaticamente — sem campo manual, impossível divergir. Esta função é
 * consumida tanto pela UI (display/preview no step Priorização) quanto pelo submit
 * (persistência), garantindo display === persistência.
 *
 * Faixas (D-02 / `_giba_wsi-dashboard.html:1565`), limites inferiores INCLUSIVOS,
 * superiores EXCLUSIVOS:
 *   horas < 10           → 'muito_baixo'
 *   10  <= horas < 40    → 'baixo'
 *   40  <= horas < 100   → 'medio'
 *   100 <= horas < 200   → 'alto'
 *   horas >= 200         → 'muito_alto'
 *
 * Entrada não-finita (NaN/undefined coerced) ou negativa é tratada como 0
 * (→ 'muito_baixo'), sem throw.
 *
 * NÃO duplica a fórmula de score nem o peso do FTE — apenas mapeia horas→bucket.
 * O peso vive em `lib/opportunities/score.ts` (D-03).
 */
export function deriveFteBucket(horas: number): FteBucket {
  const h = Number.isFinite(horas) && horas > 0 ? horas : 0;
  if (h < 10) return 'muito_baixo';
  if (h < 40) return 'baixo';
  if (h < 100) return 'medio';
  if (h < 200) return 'alto';
  return 'muito_alto';
}
