// =============================================================================
// state.ts — unit tests (Phase 7.6 wizard refactor)
// =============================================================================
// 12 testes de função pura cobrindo:
//   1. stepsFor('persona', 'create')    → 5 steps na ordem correta
//   2. stepsFor('formulario', 'create') → 6 steps na ordem correta
//   3. stepsFor('persona', 'edit')      → 4 steps (sem 'tipo')
//   4. stepsFor('formulario', 'edit')   → 5 steps (sem 'tipo')
//   5. stepsFor(undefined, 'create')    → apenas [TIPO]
//   6. stepsFor(undefined, 'edit')      → []
//   7. cross-check: nenhum step em create tem id 'automacao'/'priorizacao'
//   8. cross-check: nenhum step em edit tem id 'automacao'/'priorizacao'
//   9. validateStep('priorizacao', ...) → ok:true (branch removido)
//  10. validateStep('identificacao', incomplete) → ok:false com erros
//  11. validateStep('identificacao', invalid email) → ok:false com errors.email
//  12. validateStep('tipo', no source) → ok:false
//  13. validateStep('automacao', ...) → ok:true (não está no fluxo create)
//  14. defaultFormData() → defaults preservados (esforco/complexidade/tempo/objetivo)
//
// Funções puras — sem mocks, sem React, sem jsdom.
// =============================================================================

import { describe, it, expect } from 'vitest';
import {
  stepsFor,
  validateStep,
  defaultFormData,
} from '@/components/opportunities/wizard/state';

describe('stepsFor — Phase 7.6 refactor', () => {
  it('AI-WIZARD-01: persona create → 5 steps na ordem correta', () => {
    const result = stepsFor('persona', 'create');
    expect(result.map((s) => s.id)).toEqual([
      'tipo',
      'classificacao',
      'identificacao',
      'processo',
      'contexto',
    ]);
  });

  it('AI-WIZARD-01: formulario create → 6 steps na ordem correta', () => {
    const result = stepsFor('formulario', 'create');
    expect(result.map((s) => s.id)).toEqual([
      'tipo',
      'classificacao',
      'identificacao',
      'processo',
      'criterios',
      'beneficios',
    ]);
  });

  it('persona edit → 4 steps (sem "tipo")', () => {
    const result = stepsFor('persona', 'edit');
    expect(result.map((s) => s.id)).toEqual([
      'classificacao',
      'identificacao',
      'processo',
      'contexto',
    ]);
  });

  it('formulario edit → 5 steps (sem "tipo")', () => {
    const result = stepsFor('formulario', 'edit');
    expect(result.map((s) => s.id)).toEqual([
      'classificacao',
      'identificacao',
      'processo',
      'criterios',
      'beneficios',
    ]);
  });

  it('undefined source + create → apenas TIPO step', () => {
    const result = stepsFor(undefined, 'create');
    expect(result.map((s) => s.id)).toEqual(['tipo']);
  });

  it('undefined source + edit → array vazio', () => {
    const result = stepsFor(undefined, 'edit');
    expect(result).toEqual([]);
  });

  it('AI-WIZARD-01 cross-check: nenhum step em CREATE tem id "automacao" nem "priorizacao"', () => {
    const personaCreate = stepsFor('persona', 'create');
    const formularioCreate = stepsFor('formulario', 'create');
    const allCreateIds = [...personaCreate, ...formularioCreate].map((s) => s.id);
    expect(allCreateIds).not.toContain('automacao');
    expect(allCreateIds).not.toContain('priorizacao');
  });

  it('AI-WIZARD-01 cross-check: nenhum step em EDIT tem id "automacao" nem "priorizacao" (renderizacao vem de WizardShell renderStep, nao da sequencia)', () => {
    const personaEdit = stepsFor('persona', 'edit');
    const formularioEdit = stepsFor('formulario', 'edit');
    const allEditIds = [...personaEdit, ...formularioEdit].map((s) => s.id);
    expect(allEditIds).not.toContain('automacao');
    expect(allEditIds).not.toContain('priorizacao');
  });
});

describe('validateStep — Phase 7.6 (branch priorizacao removido)', () => {
  it('priorizacao step sem dados → retorna ok:true (sem validation)', () => {
    // Phase 7.6: validateStep NÃO valida mais campos do step priorizacao —
    // mesmo se chamado, retorna ok:true porque o branch foi removido.
    const result = validateStep('priorizacao', defaultFormData());
    expect(result.ok).toBe(true);
  });

  it('identificacao sem solicitante/area/processo → retorna ok:false com erros', () => {
    const result = validateStep('identificacao', {
      ...defaultFormData(),
      solicitante: '',
      area: '',
      processo: '',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toHaveProperty('solicitante');
      expect(result.errors).toHaveProperty('area');
      expect(result.errors).toHaveProperty('processo');
    }
  });

  it('identificacao com email inválido → retorna ok:false com errors.email', () => {
    const result = validateStep('identificacao', {
      ...defaultFormData(),
      solicitante: 'Alice',
      area: 'TI',
      processo: 'processo válido aqui',
      email: 'not-an-email',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toHaveProperty('email');
    }
  });

  it('tipo sem source → retorna ok:false', () => {
    const result = validateStep('tipo', defaultFormData());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toHaveProperty('source');
    }
  });

  it('automacao step → retorna ok:true (sem validation no fluxo create)', () => {
    // automacao NÃO está no fluxo de create (Phase 7.6); mas se chamado
    // diretamente (ex.: mode='edit' calling validateStep early), retorna ok.
    const result = validateStep('automacao', defaultFormData());
    expect(result.ok).toBe(true);
  });
});

describe('defaultFormData — defaults preservados (DB constraints)', () => {
  it('mantém esforco/complexidade/tempo/objetivo defaults — IA vai sobrescrever', () => {
    const d = defaultFormData();
    expect(d.esforco).toBe('medio');
    expect(d.complexidade).toBe('medio');
    expect(d.tempo).toBe('medio');
    expect(d.objetivo).toBe(3);
    expect(d.status).toBe('novo');
    expect(d.request_type).toBe('nova_oportunidade');
  });
});
