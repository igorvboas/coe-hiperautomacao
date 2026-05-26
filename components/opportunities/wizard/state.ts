import type { OpportunityInput } from '@/lib/opportunities/schema';
import type { Opportunity } from '@/lib/opportunities/types';

type PersonaInput = Extract<OpportunityInput, { source: 'persona' }>;
type FormularioInput = Extract<OpportunityInput, { source: 'formulario' }>;

/**
 * Estado intermediário do form durante o wizard.
 * Mantém AMBOS persona_extras e formulario_extras disponíveis ao mesmo tempo
 * — submit final filtra um deles conforme `source` antes de enviar pro server.
 */
export type WizardFormData = Partial<
  Omit<PersonaInput, 'persona_extras' | 'source'> &
    Omit<FormularioInput, 'formulario_extras' | 'source'> & {
      source: 'persona' | 'formulario';
      persona_extras: PersonaInput['persona_extras'];
      formulario_extras: FormularioInput['formulario_extras'];
    }
>;

export type StepId =
  | 'tipo'
  | 'classificacao'
  | 'identificacao'
  | 'processo'
  | 'automacao'
  | 'priorizacao'
  | 'contexto'
  | 'criterios'
  | 'beneficios';

export type StepDef = {
  id: StepId;
  label: string;
  icon: string;
};

const STEP_TIPO: StepDef = { id: 'tipo', label: 'Tipo', icon: '🔀' };
const STEP_CLASSIFICACAO: StepDef = {
  id: 'classificacao',
  label: 'Classificação',
  icon: '🏷️',
};
// Phase 7.6: step 'automacao' removido do fluxo create — agora é output de IA
// (lib/ai/enrichment.ts). Componente AutomacaoStep.tsx PRESERVADO; usado em
// mode='edit' do modal de detalhe (Plan 06).
const STEPS_COMMON: StepDef[] = [
  { id: 'identificacao', label: 'Identificação', icon: '👤' },
  { id: 'processo', label: 'Processo', icon: '📋' },
];
// Phase 7.6: step 'priorizacao' removido. PriorizacaoStep.tsx PRESERVADO
// (reaproveitado em mode='edit' — Plan 06).
const STEPS_PERSONA_EXTRA: StepDef[] = [
  { id: 'contexto', label: 'Contexto', icon: '💬' },
];
// Phase 7.6: step 'priorizacao' removido (mesmo motivo de STEPS_PERSONA_EXTRA).
const STEPS_FORMULARIO_EXTRA: StepDef[] = [
  { id: 'criterios', label: 'Critérios', icon: '✅' },
  { id: 'beneficios', label: 'Benefícios', icon: '📈' },
];

// Phase 7.6 (hotfix pós-execute): admin precisa editar os 9 campos preenchidos
// pela IA. Steps Automação + Priorização voltam SÓ em mode='edit' (continuam
// invisíveis no fluxo create, que é IA-only).
const STEPS_EDIT_AI_FIELDS: StepDef[] = [
  { id: 'automacao', label: 'Automação', icon: '🤖' },
  { id: 'priorizacao', label: 'Priorização', icon: '🎯' },
];

/**
 * Sequência de steps por modo+source.
 * - mode='create': Tipo → Classificação → Identificação → ... (sem Automação/Priorização — IA preenche)
 * - mode='edit':   Classificação → Identificação → ... → Automação → Priorização (admin pode corrigir IA)
 */
export function stepsFor(
  source: 'persona' | 'formulario' | undefined,
  mode: 'create' | 'edit'
): StepDef[] {
  if (!source) {
    return mode === 'create' ? [STEP_TIPO] : [];
  }
  const extras =
    source === 'persona' ? STEPS_PERSONA_EXTRA : STEPS_FORMULARIO_EXTRA;
  const prefix =
    mode === 'create'
      ? [STEP_TIPO, STEP_CLASSIFICACAO]
      : [STEP_CLASSIFICACAO];
  const suffix = mode === 'edit' ? STEPS_EDIT_AI_FIELDS : [];
  return [...prefix, ...STEPS_COMMON, ...extras, ...suffix];
}

export function defaultFormData(): WizardFormData {
  return {
    request_type: 'nova_oportunidade',
    escopo_automacao: [''],
    beneficios_esperados: [''],
    esforco: 'medio',
    complexidade: 'medio',
    tempo: 'medio',
    objetivo: 3,
    status: 'novo',
  };
}

/**
 * Converte uma `Opportunity` (row do banco) em `WizardFormData` editável.
 * Trata null → '' (string vazia) ou [] (array vazio) pra compat com inputs.
 */
export function opportunityToFormData(opp: Opportunity): WizardFormData {
  return {
    source: opp.source,
    request_type: opp.request_type ?? 'nova_oportunidade',
    solicitante: opp.solicitante,
    email: opp.email ?? '',
    area: opp.area,
    subarea: opp.subarea ?? '',
    processo: opp.processo,
    frequencia: opp.frequencia ?? '',
    volume_medio: opp.volume_medio ?? '',
    tempo_execucao: opp.tempo_execucao ?? '',
    num_pessoas: opp.num_pessoas ?? '',
    ferramenta: opp.ferramenta,
    escopo_automacao:
      opp.escopo_automacao && opp.escopo_automacao.length > 0
        ? opp.escopo_automacao
        : [''],
    beneficios_esperados:
      opp.beneficios_esperados && opp.beneficios_esperados.length > 0
        ? opp.beneficios_esperados
        : [''],
    esforco: opp.esforco ?? 'medio',
    complexidade: opp.complexidade ?? 'medio',
    tempo: opp.tempo ?? 'medio',
    objetivo: opp.objetivo ?? 3,
    status: opp.status,
    responsavel: opp.responsavel ?? '',
    notas: opp.notas ?? '',
    observacao: opp.observacao ?? '',
    risco: opp.risco ?? '',
    persona_extras: opp.persona_extras ?? undefined,
    formulario_extras: opp.formulario_extras ?? undefined,
  };
}

/**
 * Valida apenas os campos relevantes do step atual.
 * Retorna erros campo-a-campo (string única por campo).
 */
export function validateStep(
  step: StepId,
  data: WizardFormData
): { ok: true } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (step === 'tipo') {
    if (!data.source) errors.source = 'Escolha um tipo';
  }

  if (step === 'classificacao') {
    if (!data.request_type) errors.request_type = 'Escolha uma classificação';
  }

  if (step === 'identificacao') {
    if (!data.solicitante || data.solicitante.length < 2)
      errors.solicitante = 'Nome obrigatório';
    if (!data.area || data.area.length < 2) errors.area = 'Área obrigatória';
    if (!data.processo || data.processo.length < 3)
      errors.processo = 'Processo obrigatório';
    if (
      data.email &&
      data.email !== '' &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)
    )
      errors.email = 'E-mail inválido';
  }

  // Phase 7.6: branch de validação do step de Priorização removido — campos
  // esforco/complexidade/tempo/objetivo agora são output de IA (não input do
  // user). Type StepId mantém o literal correspondente para compatibilidade
  // com WizardShell renderStep() em mode='edit'.

  return Object.keys(errors).length === 0 ? { ok: true } : { ok: false, errors };
}
