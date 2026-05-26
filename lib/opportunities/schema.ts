import { z } from 'zod';

// =============================================================================
// Mass Assignment defense — Bloco B (Phase 7.5)
// -----------------------------------------------------------------------------
// Campos derivados do servidor — JAMAIS aparecem nos schemas de input do cliente.
// Se algum deles vier no payload, o `.strict()` aplicado em cada variant do
// `opportunityInputSchema` rejeita o parse inteiro com `unrecognized_keys`.
//
// Campos server-derived (NÃO whitelist):
//   - `id`          → gerado pelo DB (`default gen_random_uuid()`)
//   - `tenant_id`   → vem de `profiles.tenant_id` lookup via `auth.uid()`
//   - `created_by`  → vem de `auth.uid()` no Server Action
//   - `seq_id`      → vem do trigger SQL `trg_opportunities_seq_id`
//   - `created_at`  → `default now()` no DB
//   - `updated_at`  → mantido por trigger
//
// Length limits ampliados (CONTEXT.md §Bloco B):
//   - `processo`: max 2000 chars
//   - `solicitante`, `email`, `area`, `subarea`, `responsavel`: max 200 chars
//   - `notas`: max 2000 chars
//   - `escopo_automacao[]`, `beneficios_esperados[]`: max 20 itens × max 200 chars
//   - `formulario_extras` (JSONB): max ~8KB serializado (validado via .superRefine)
//
// Mensagens em pt-BR. Os testes que cobrem este contrato vivem em
// `tests/security/mass-assignment.test.ts` (HARD-B-01..04).
// =============================================================================

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
export const requestTypeEnum = z.enum([
  'nova_oportunidade',
  'melhoria_automacao',
  'duvidas_terceiros',
  'incidente',
  'treinamento',
]);

// =============================================================================
// Sub-schemas (JSONB) — `.strict()` para bloquear campos extras nos objetos
// aninhados também. Sub-objetos (criterios, beneficios) também `.strict()`.
// =============================================================================
export const personaExtrasSchema = z
  .object({
    cargo: z.string().max(200, 'Máximo 200 caracteres').optional(),
    tempo_funcao: z.string().max(60, 'Máximo 60 caracteres').optional(),
    local: z.string().max(200, 'Máximo 200 caracteres').optional(),
    papel: z.string().max(2000, 'Máximo 2000 caracteres').optional(),
    sistemas: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
    objetivos: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
    metricas: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
    desafios: z.string().max(2000, 'Máximo 2000 caracteres').optional(),
    dados: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
    automacao_atual: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
    expectativas: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
    priorizacao_desc: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
    observacoes: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
  })
  .strict()
  .partial();

export const formularioExtrasSchema = z
  .object({
    tipo_processo: z.string().max(200, 'Máximo 200 caracteres').optional(),
    sistemas: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
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
      .strict()
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
      .strict()
      .partial()
      .optional(),
  })
  .strict()
  .superRefine((val, ctx) => {
    // Limite de tamanho serializado — defesa contra storage exhaustion.
    // ~8KB conforme CONTEXT.md §Bloco B.
    if (JSON.stringify(val).length > 8192) {
      ctx.addIssue({
        code: 'custom',
        message: 'formulario_extras excede 8KB serializado',
      });
    }
  });

// =============================================================================
// Base shared schema — limits ampliados conforme CONTEXT.md §Bloco B.
//
// NÃO aplicar `.strict()` aqui — `.extend()` precisa do object schema sem
// `unknownKeys: 'strict'` ainda. O `.strict()` é aplicado por variant do
// discriminatedUnion abaixo (linha 138-148) para que campos server-derived
// extras (tenant_id, created_by, seq_id, id) sejam rejeitados no nível final.
// =============================================================================
const baseSchema = z.object({
  solicitante: z
    .string()
    .min(2, 'Nome muito curto')
    .max(200, 'Máximo 200 caracteres'),
  email: z
    .string()
    .email('E-mail inválido')
    .max(200, 'Máximo 200 caracteres')
    .or(z.literal(''))
    .optional(),
  area: z
    .string()
    .min(2, 'Área obrigatória')
    .max(200, 'Máximo 200 caracteres'),
  subarea: z
    .string()
    .max(200, 'Máximo 200 caracteres')
    .optional()
    .or(z.literal('')),
  processo: z
    .string()
    .min(3, 'Processo obrigatório')
    .max(2000, 'Máximo 2000 caracteres'),
  request_type: requestTypeEnum.default('nova_oportunidade'),
  frequencia: z
    .string()
    .max(60, 'Máximo 60 caracteres')
    .optional()
    .or(z.literal('')),
  volume_medio: z
    .string()
    .max(60, 'Máximo 60 caracteres')
    .optional()
    .or(z.literal('')),
  tempo_execucao: z
    .string()
    .max(60, 'Máximo 60 caracteres')
    .optional()
    .or(z.literal('')),
  num_pessoas: z
    .string()
    .max(60, 'Máximo 60 caracteres')
    .optional()
    .or(z.literal('')),
  ferramenta: toolEnum.nullable().optional(),
  escopo_automacao: z
    .array(z.string().max(200, 'Item excede 200 caracteres'))
    .max(20, 'Máximo 20 itens')
    .default([]),
  beneficios_esperados: z
    .array(z.string().max(200, 'Item excede 200 caracteres'))
    .max(20, 'Máximo 20 itens')
    .default([]),
  esforco: effortEnum,
  complexidade: complexityEnum,
  tempo: timeBucketEnum,
  objetivo: z.number().int().min(1).max(5),
  status: statusEnum.default('novo'),
  responsavel: z
    .string()
    .max(200, 'Máximo 200 caracteres')
    .optional()
    .or(z.literal('')),
  notas: z
    .string()
    .max(2000, 'Máximo 2000 caracteres')
    .optional()
    .or(z.literal('')),
  observacao: z
    .string()
    .max(2000, 'Máximo 2000 caracteres')
    .optional()
    .or(z.literal('')),
  risco: z
    .string()
    .max(2000, 'Máximo 2000 caracteres')
    .optional()
    .or(z.literal('')),
});

// =============================================================================
// Discriminated union — persona vs formulário
//
// `.strict()` em CADA variant bloqueia Mass Assignment:
//   - rejeita campos server-derived no input (tenant_id, created_by, seq_id, id)
//   - rejeita formulario_extras em payload `source: 'persona'` (variant mismatch)
//   - rejeita persona_extras  em payload `source: 'formulario'` (variant mismatch)
//
// Zod 4.x: `.strict()` em discriminatedUnion variants funciona via
// `unknownKeys: 'strict'` no nível do object schema final (após `.extend()`).
// =============================================================================
export const opportunityInputSchema = z.discriminatedUnion('source', [
  baseSchema
    .extend({
      source: z.literal('persona'),
      persona_extras: personaExtrasSchema.optional(),
    })
    .strict(),
  baseSchema
    .extend({
      source: z.literal('formulario'),
      formulario_extras: formularioExtrasSchema.optional(),
    })
    .strict(),
]);

export type OpportunityInput = z.infer<typeof opportunityInputSchema>;
