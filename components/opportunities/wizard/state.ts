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
const STEPS_COMMON: StepDef[] = [
  { id: 'identificacao', label: 'Identificação', icon: '👤' },
  { id: 'processo', label: 'Processo', icon: '📋' },
  { id: 'automacao', label: 'Automação', icon: '🤖' },
];
const STEPS_PERSONA_EXTRA: StepDef[] = [
  { id: 'priorizacao', label: 'Priorização', icon: '📊' },
  { id: 'contexto', label: 'Contexto', icon: '💬' },
];
const STEPS_FORMULARIO_EXTRA: StepDef[] = [
  { id: 'criterios', label: 'Critérios', icon: '✅' },
  { id: 'beneficios', label: 'Benefícios', icon: '📈' },
  { id: 'priorizacao', label: 'Priorização', icon: '📊' },
];

/**
 * Sequência de steps por modo+source.
 * Em mode='edit' pulamos o step Tipo (source é imutável).
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
  const prefix = mode === 'create' ? [STEP_TIPO] : [];
  return [...prefix, ...STEPS_COMMON, ...extras];
}

export function defaultFormData(): WizardFormData {
  return {
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

  if (step === 'priorizacao') {
    if (!data.esforco) errors.esforco = 'Selecione';
    if (!data.complexidade) errors.complexidade = 'Selecione';
    if (!data.tempo) errors.tempo = 'Selecione';
    if (!data.objetivo || data.objetivo < 1 || data.objetivo > 5)
      errors.objetivo = 'Valor entre 1 e 5';
  }

  return Object.keys(errors).length === 0 ? { ok: true } : { ok: false, errors };
}
