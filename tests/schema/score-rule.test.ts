// =============================================================================
// opportunity_score — fórmula de 5 fatores — Phase 9 / Plan 09-03 (SCORE-01)
// =============================================================================
// Spec PURO (sem DB) que trava a fórmula de score da migration 0011 contra
// `_giba_wsi-dashboard.html:483-490` (função `calcScore`). Replica os pesos E os
// fallbacks LITERALMENTE — qualquer divergência quebra o build.
//
// Este spec é também o SEED da paridade SCORE-04 (Phase 10 o reusa comparando o
// preview do cliente com a função SQL `opportunity_score()` do backend).
//
// Pesos (_giba:483-490):
//   ef={baixo:8,medio:14,alto:20}|14
//   cx={baixo:20,medio:13,alto:6}|13   ← INVERTIDO: menos complexo pontua mais
//   tm={diario:20,semanal:16,quinzenal:12,mensal:8,anual:2}|16
//   ob={1:4,2:8,3:12,4:16,5:20}|12     (objetivo*4)
//   ft={muito_baixo:4,baixo:8,medio:12,alto:16,muito_alto:20}|12
//   score = soma (0–100)
// =============================================================================
import { describe, it, expect } from 'vitest';

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

describe('opportunity_score — fórmula 5 fatores (_giba:483-490)', () => {
  it('caso máximo: (alto,baixo,diario,5,muito_alto) === 100 — alinhado ao smoke do 09-01', () => {
    // ef alto=20 + cx baixo=20 + tm diario=20 + ob 5=20 + ft muito_alto=20 = 100
    expect(calcScore({ esforco: 'alto', complexidade: 'baixo', tempo: 'diario', objetivo: 5, fte: 'muito_alto' })).toBe(100);
  });

  it('ATENÇÃO: (baixo,baixo,diario,5,muito_alto) === 88, NÃO 100 (esforço alto é o que vale 20)', () => {
    // ef baixo=8 + cx baixo=20 + tm diario=20 + ob 5=20 + ft muito_alto=20 = 88
    // Este é exatamente o erro corrigido no smoke do 09-01 (era esperado 100).
    expect(calcScore({ esforco: 'baixo', complexidade: 'baixo', tempo: 'diario', objetivo: 5, fte: 'muito_alto' })).toBe(88);
  });

  it('caso mínimo-ish: (alto,alto,anual,1,muito_baixo) === 36', () => {
    // ef alto=20 + cx alto=6 + tm anual=2 + ob 1=4 + ft muito_baixo=4 = 36
    expect(calcScore({ esforco: 'alto', complexidade: 'alto', tempo: 'anual', objetivo: 1, fte: 'muito_baixo' })).toBe(36);
  });

  it('caso intermediário: (medio,medio,mensal,3,medio) === 59', () => {
    // 14 + 13 + 8 + 12 + 12 = 59
    expect(calcScore({ esforco: 'medio', complexidade: 'medio', tempo: 'mensal', objetivo: 3, fte: 'medio' })).toBe(59);
  });

  it('valores ausentes/inválidos exercitam TODOS os fallbacks (14+13+16+12+12 = 67)', () => {
    expect(calcScore({})).toBe(67);
    expect(calcScore({ esforco: 'xxx', complexidade: 'yyy', tempo: 'zzz', objetivo: 99, fte: 'www' })).toBe(67);
  });

  it('priority_level: 100→alta, 59→media, 36→baixa', () => {
    expect(priorityLevel(100)).toBe('alta');
    expect(priorityLevel(70)).toBe('alta');
    expect(priorityLevel(69)).toBe('media');
    expect(priorityLevel(59)).toBe('media');
    expect(priorityLevel(40)).toBe('media');
    expect(priorityLevel(39)).toBe('baixa');
    expect(priorityLevel(36)).toBe('baixa');
  });
});
