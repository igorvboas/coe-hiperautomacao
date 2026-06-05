// =============================================================================
// state.ts — unit tests (Phase 11 wizard fluxo único — 5 steps)
// =============================================================================
// Trava o novo contrato de criação (D-04/D-08/D-11):
//   - mode='create' = fluxo ÚNICO de 5 steps, independe de source.
//   - defaultFormData() fixa source='formulario'.
//   - validateStep: Identificação(nome+área+email) / Processo(processo) pt-BR.
//
// O contrato de mode='edit' permanece intocado nesta fase (escopo Phase 13) —
// não é re-testado aqui; só garantimos que create não tem mais tipo/classificacao.
//
// Funções puras — sem mocks, sem React, sem jsdom.
// =============================================================================

import { describe, it, expect } from 'vitest';
import {
  stepsFor,
  validateStep,
  defaultFormData,
} from '@/components/opportunities/wizard/state';

const CREATE_STEPS = [
  'identificacao',
  'processo',
  'criterios',
  'beneficios',
  'priorizacao',
];

describe('stepsFor — Phase 11 fluxo único de criação', () => {
  it('WIZARD-01: formulario create → 5 steps na ordem canônica', () => {
    expect(stepsFor('formulario', 'create').map((s) => s.id)).toEqual(
      CREATE_STEPS
    );
  });

  it('WIZARD-01: persona create → MESMO array (fluxo único independe de source)', () => {
    expect(stepsFor('persona', 'create').map((s) => s.id)).toEqual(CREATE_STEPS);
  });

  it('WIZARD-01: undefined source + create → os 5 steps (não mais [TIPO])', () => {
    expect(stepsFor(undefined, 'create').map((s) => s.id)).toEqual(CREATE_STEPS);
  });

  it('cross-check: nenhum step do create tem id "tipo" nem "classificacao"', () => {
    const ids = [
      ...stepsFor('formulario', 'create'),
      ...stepsFor('persona', 'create'),
      ...stepsFor(undefined, 'create'),
    ].map((s) => s.id);
    expect(ids).not.toContain('tipo');
    expect(ids).not.toContain('classificacao');
  });
});

describe('validateStep — Phase 11 (Identificação + Processo, pt-BR)', () => {
  it('identificacao vazio → ok:false com errors.solicitante e errors.area', () => {
    const result = validateStep('identificacao', {});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.solicitante).toBe('Nome obrigatório');
      expect(result.errors.area).toBe('Área obrigatória');
      // processo NÃO é validado em identificacao (migrou p/ step processo)
      expect(result.errors).not.toHaveProperty('processo');
    }
  });

  it('identificacao com email inválido → ok:false com errors.email', () => {
    const result = validateStep('identificacao', {
      solicitante: 'Alice',
      area: 'TI',
      email: 'not-an-email',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.email).toBe('E-mail inválido');
    }
  });

  it('identificacao válido (nome+área, sem processo) → ok:true', () => {
    const result = validateStep('identificacao', {
      solicitante: 'Alice',
      area: 'TI',
    });
    expect(result.ok).toBe(true);
  });

  it('processo vazio → ok:false com errors.processo === "Processo obrigatório"', () => {
    const result = validateStep('processo', {});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.processo).toBe('Processo obrigatório');
    }
  });

  it('processo preenchido → ok:true', () => {
    const result = validateStep('processo', { processo: 'Conciliação bancária' });
    expect(result.ok).toBe(true);
  });
});

describe('defaultFormData — Phase 11 (source fixo formulário)', () => {
  it('fixa source="formulario" (D-04)', () => {
    expect(defaultFormData().source).toBe('formulario');
  });

  it('mantém defaults de score/status do create', () => {
    const d = defaultFormData();
    expect(d.esforco).toBe('medio');
    expect(d.complexidade).toBe('medio');
    expect(d.objetivo).toBe(3);
    expect(d.status).toBe('novo');
    expect(d.request_type).toBe('nova_oportunidade');
    // tempo (frequência) não tem default — Priorização define da frequência do Processo.
    expect(d.tempo).toBeUndefined();
  });
});
