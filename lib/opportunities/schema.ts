import { z } from 'zod';

// =============================================================================
// Enums — espelham os enums Postgres
// =============================================================================
export const sourceEnum = z.enum(['persona', 'formulario']);
export const statusEnum = z.enum([
  'novo',
  'em_analise',
  'planejamento',
  'backlog',
  'desenvolvimento',
  'homologacao',
  'producao',
  'concluido',
]);
export const toolEnum = z.enum(['rpa', 'n8n', 'ambos']);
export const effortEnum = z.enum(['baixo', 'medio', 'alto']);
export const complexityEnum = z.enum(['baixo', 'medio', 'alto']);
export const timeBucketEnum = z.enum(['pequeno', 'medio', 'grande']);
export const criterioEnum = z.enum(['SIM', 'NAO', 'PARCIAL']);

// =============================================================================
// Sub-schemas (JSONB)
// =============================================================================
export const personaExtrasSchema = z
  .object({
    cargo: z.string().max(120).optional(),
    tempo_funcao: z.string().max(60).optional(),
    local: z.string().max(80).optional(),
    papel: z.string().max(2000).optional(),
    sistemas: z.string().max(500).optional(),
    objetivos: z.string().max(1000).optional(),
    metricas: z.string().max(1000).optional(),
    desafios: z.string().max(2000).optional(),
    dados: z.string().max(1000).optional(),
    automacao_atual: z.string().max(1000).optional(),
    expectativas: z.string().max(1000).optional(),
    priorizacao_desc: z.string().max(1000).optional(),
    observacoes: z.string().max(1000).optional(),
  })
  .partial();

export const formularioExtrasSchema = z.object({
  tipo_processo: z.string().max(120).optional(),
  sistemas: z.string().max(300).optional(),
  criterios: z
    .object({
      regras_claras: criterioEnum.optional(),
      totalmente_manual: criterioEnum.optional(),
      processo_uniforme: criterioEnum.optional(),
      digitacao_manual: criterioEnum.optional(),
      causa_reclamacoes: criterioEnum.optional(),
      padronizacao_docs: criterioEnum.optional(),
      validacao_dados: criterioEnum.optional(),
      schedulable: criterioEnum.optional(),
      tem_documentacao: criterioEnum.optional(),
      decisao_humana: criterioEnum.optional(),
    })
    .partial()
    .optional(),
  beneficios: z
    .object({
      reducao_tempo: z.number().int().min(1).max(5).optional(),
      eliminacao_erros: z.number().int().min(1).max(5).optional(),
      produtividade: z.number().int().min(1).max(5).optional(),
      qualidade_dados: z.number().int().min(1).max(5).optional(),
      reducao_custos: z.number().int().min(1).max(5).optional(),
      reducao_retrabalho: z.number().int().min(1).max(5).optional(),
      compliance: z.number().int().min(1).max(5).optional(),
      objetivos_estrategicos: z.number().int().min(1).max(5).optional(),
    })
    .partial()
    .optional(),
});

// =============================================================================
// Base shared schema
// =============================================================================
const baseSchema = z.object({
  solicitante: z.string().min(2, 'Nome muito curto').max(120),
  email: z.string().email('E-mail inválido').or(z.literal('')).optional(),
  area: z.string().min(2, 'Área obrigatória').max(80),
  subarea: z.string().max(80).optional().or(z.literal('')),
  processo: z.string().min(3, 'Processo obrigatório').max(200),
  frequencia: z.string().max(60).optional().or(z.literal('')),
  volume_medio: z.string().max(60).optional().or(z.literal('')),
  tempo_execucao: z.string().max(60).optional().or(z.literal('')),
  num_pessoas: z.string().max(60).optional().or(z.literal('')),
  ferramenta: toolEnum.nullable().optional(),
  escopo_automacao: z.array(z.string()).default([]),
  beneficios_esperados: z.array(z.string()).default([]),
  esforco: effortEnum,
  complexidade: complexityEnum,
  tempo: timeBucketEnum,
  objetivo: z.number().int().min(1).max(5),
  status: statusEnum.default('novo'),
  responsavel: z.string().max(120).optional().or(z.literal('')),
  notas: z.string().max(2000).optional().or(z.literal('')),
});

// =============================================================================
// Discriminated union — persona vs formulário
// =============================================================================
export const opportunityInputSchema = z.discriminatedUnion('source', [
  baseSchema.extend({
    source: z.literal('persona'),
    persona_extras: personaExtrasSchema.optional(),
  }),
  baseSchema.extend({
    source: z.literal('formulario'),
    formulario_extras: formularioExtrasSchema.optional(),
  }),
]);

export type OpportunityInput = z.infer<typeof opportunityInputSchema>;
