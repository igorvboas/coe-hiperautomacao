// =============================================================================
// opportunity_score — fórmula única de 5 fatores (cliente + servidor) — SCORE-04
// =============================================================================
// Fonte da verdade da fórmula de score do produto v0.2. Replica LITERALMENTE os
// pesos e fallbacks de `_giba_wsi-dashboard.html:483-490` (função `calcScore`),
// idênticos aos travados em `tests/schema/score-rule.test.ts` (o SEED da paridade).
//
// Módulo CLIENTE-SAFE (não marcado como server-side): consumido pelo ScorePreview
// (`'use client'`) e pelo teste de paridade. O lado servidor é a função SQL
// `opportunity_score()` (migration 0011); o teste de paridade prova que os dois
// nunca divergem.
//
// Pesos (_giba:483-490):
//   ef = {baixo:8, medio:14, alto:20}                              fallback 14
//   cx = {baixo:20, medio:13, alto:6}      (INVERTIDO)             fallback 13
//   tm = {diario:20, semanal:16, quinzenal:12, mensal:8, anual:2}  fallback 16
//   ob = objetivo*4 (1→4 .. 5→20)                                  fallback 12
//   ft = {muito_baixo:4, baixo:8, medio:12, alto:16, muito_alto:20} fallback 12
//   score = soma (0–100)
//   priority_level: alta >=70 / media 40–69 / baixa <40
// =============================================================================

export interface Prioridade {
  esforco?: string;
  complexidade?: string;
  tempo?: string;
  objetivo?: number;
  fte?: string;
}

/** Replica LITERAL de calcScore (_giba:483-490), com os mesmos fallbacks. */
export function calcScore(p: Prioridade): number {
  const ef: Record<string, number> = { baixo: 8, medio: 14, alto: 20 };
  const cx: Record<string, number> = { baixo: 20, medio: 13, alto: 6 };
  const tm: Record<string, number> = { diario: 20, semanal: 16, quinzenal: 12, mensal: 8, anual: 2 };
  const ob: Record<number, number> = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20 };
  const ft: Record<string, number> = { muito_baixo: 4, baixo: 8, medio: 12, alto: 16, muito_alto: 20 };
  return (
    (ef[p.esforco as string] ?? 14) +
    (cx[p.complexidade as string] ?? 13) +
    (tm[p.tempo as string] ?? 16) +
    (ob[p.objetivo as number] ?? 12) +
    (ft[p.fte as string] ?? 12)
  );
}

/** priority_level conforme SCORE-02 (alta>=70 / media 40–69 / baixa<40). */
export function priorityLevel(score: number): 'alta' | 'media' | 'baixa' {
  return score >= 70 ? 'alta' : score >= 40 ? 'media' : 'baixa';
}
