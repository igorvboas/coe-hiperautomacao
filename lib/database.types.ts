// =============================================================================
// database.types.ts — Types do schema Supabase (multi-tenant CoE)
// =============================================================================
// ⚠️  ARQUIVO MANTIDO À MÃO. O projeto ainda não tem SUPABASE_ACCESS_TOKEN com
//     privilégio no projeto `vxgthycrjetniejsjmee`, então `npm run gen:types`
//     (e o MCP Auton-DB, que aponta para OUTRO projeto) não funcionam.
//
//     Estado atual: schema vivo PÓS-migration 0011 (Phase 9), VERIFICADO contra
//     o catálogo do Postgres por introspecção (information_schema/pg_catalog) em
//     2026-06-04 (Phase 10 / Plan 10-01, D-04). Reflete:
//       - opportunities: tempo→frequency_bucket; + fte_horas, fonte, tipo_processo,
//         beneficio_qualitativo, criterios, beneficios, fte, rpa_score (GENERATED)
//       - opportunity_score(): 5 fatores (p_fte fte_bucket adicionado)
//       - view opportunities_with_score (herda as colunas novas + score/priority_level)
//       - tabela opportunity_risks (priority risk_priority, set por trigger)
//
//     Quando houver token com privilégio: rodar `npm run gen:types` deve produzir
//     um superset equivalente deste arquivo (verificação, não mudança funcional).
// =============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// -----------------------------------------------------------------------------
// Enums
// -----------------------------------------------------------------------------
export type OpportunitySource = 'persona' | 'formulario';

export type OpportunityStatus =
  | 'novo'
  | 'em_analise'
  | 'planejamento'
  | 'backlog'
  | 'desenvolvimento'
  | 'homologacao'
  | 'producao'
  | 'concluido';

export type AutomationTool = 'rpa' | 'n8n' | 'ambos';
export type EffortLevel = 'baixo' | 'medio' | 'alto';
export type ComplexityLevel = 'baixo' | 'medio' | 'alto';
/** @deprecated v0.1 — `tempo` migrou para FrequencyBucket em 0011. Tipo mantido
 * porque o enum `time_bucket` ainda existe no banco e é usado pelo contrato legado
 * da IA (lib/ai/schema.ts) até REALIGN-7.6. */
export type TimeBucket = 'pequeno' | 'medio' | 'grande';

/** v0.2 (0011): `tempo` como frequência. */
export type FrequencyBucket = 'diario' | 'semanal' | 'quinzenal' | 'mensal' | 'anual';
/** v0.2 (0011): 5º fator de score (bucket de FTE). */
export type FteBucket = 'muito_baixo' | 'baixo' | 'medio' | 'alto' | 'muito_alto';

// opportunity_risks (0011)
export type RiskType = 'impedimento' | 'risco' | 'oportunidade';
export type RiskImpact = 'alto' | 'significativo' | 'moderado' | 'baixo';
export type RiskProbability = 'provavel' | 'possivel' | 'improvavel' | 'remota';
export type RiskStatus = 'novo' | 'gerenciado' | 'mitigado' | 'ocorrido';
export type RiskPriority = 'critica' | 'alta' | 'media' | 'baixa';

export type PhaseKey =
  | 'em_analise'
  | 'planejamento'
  | 'backlog'
  | 'desenvolvimento'
  | 'homologacao'
  | 'producao'
  | 'concluido';

export type TenantRole = 'member' | 'tenant_admin' | 'platform_admin';

export type OpportunityRequestType =
  | 'nova_oportunidade'
  | 'melhoria_automacao'
  | 'duvidas_terceiros'
  | 'incidente'
  | 'treinamento';

export type AiEnrichmentStatus = 'pending' | 'enriched' | 'failed';

// -----------------------------------------------------------------------------
// JSONB schemas (descritivos; o banco aceita qualquer shape)
// -----------------------------------------------------------------------------
export type PersonaExtras = {
  cargo?: string;
  tempo_funcao?: string;
  local?: string;
  papel?: string;
  sistemas?: string;
  objetivos?: string;
  metricas?: string;
  desafios?: string;
  dados?: string;
  automacao_atual?: string;
  expectativas?: string;
  priorizacao_desc?: string;
  observacoes?: string;
  processos_detalhados?: string[];
};

/** @deprecated v0.1 — domínio uppercase do `formulario_extras.criterios` legado.
 * Os novos `opportunities.criterios` (0011) usam minúsculo sim/nao/parcial. */
export type CriterioValor = 'SIM' | 'NAO' | 'PARCIAL';

export type FormularioExtras = {
  tipo_processo?: string;
  sistemas?: string;
  cargo_solicitante?: string;
  criterios?: {
    regras_claras?: CriterioValor;
    totalmente_manual?: CriterioValor;
    processo_uniforme?: CriterioValor;
    digitacao_manual?: CriterioValor;
    causa_reclamacoes?: CriterioValor;
    padronizacao_docs?: CriterioValor;
    validacao_dados?: CriterioValor;
    schedulable?: CriterioValor;
    tem_documentacao?: CriterioValor;
    decisao_humana?: CriterioValor;
  };
  beneficios?: {
    reducao_tempo?: number;
    eliminacao_erros?: number;
    produtividade?: number;
    qualidade_dados?: number;
    reducao_custos?: number;
    reducao_retrabalho?: number;
    compliance?: number;
    objetivos_estrategicos?: number;
  };
};

export type Prioridade = {
  esforco: EffortLevel | null;
  complexidade: ComplexityLevel | null;
  tempo: FrequencyBucket | null;
  objetivo: number | null;
  fte: FteBucket | null;
};

// -----------------------------------------------------------------------------
// Database (formato compatível com @supabase/ssr generic)
// -----------------------------------------------------------------------------
export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          name: string;
          slug: string;
          status: 'active' | 'suspended';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          status?: 'active' | 'suspended';
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          name: string;
          slug: string;
          status: 'active' | 'suspended';
          updated_at: string;
        }>;
        Relationships: [];
      };

      profiles: {
        Row: {
          id: string;
          tenant_id: string;
          email: string;
          full_name: string | null;
          role: TenantRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          tenant_id: string;
          email: string;
          full_name?: string | null;
          role?: TenantRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          tenant_id: string;
          email: string;
          full_name: string | null;
          role: TenantRole;
          updated_at: string;
        }>;
        Relationships: [
          {
            foreignKeyName: 'profiles_tenant_id_fkey';
            columns: ['tenant_id'];
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          }
        ];
      };

      invited_emails: {
        Row: {
          id: string;
          email: string;
          tenant_id: string;
          role: Exclude<TenantRole, 'platform_admin'>;
          invited_by: string | null;
          created_at: string;
          used_at: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          tenant_id: string;
          role?: Exclude<TenantRole, 'platform_admin'>;
          invited_by?: string | null;
          created_at?: string;
          used_at?: string | null;
        };
        Update: Partial<{
          email: string;
          tenant_id: string;
          role: Exclude<TenantRole, 'platform_admin'>;
          used_at: string | null;
        }>;
        Relationships: [
          {
            foreignKeyName: 'invited_emails_tenant_id_fkey';
            columns: ['tenant_id'];
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          }
        ];
      };

      opportunities: {
        Row: {
          id: string;
          tenant_id: string;
          seq_id: number;
          source: OpportunitySource;
          request_type: OpportunityRequestType;
          solicitante: string;
          email: string | null;
          area: string;
          subarea: string | null;
          processo: string;
          frequencia: string | null;
          volume_medio: string | null;
          tempo_execucao: string | null;
          num_pessoas: string | null;
          ferramenta: AutomationTool | null;
          escopo_automacao: string[];
          beneficios_esperados: string[];
          esforco: EffortLevel | null;
          complexidade: ComplexityLevel | null;
          tempo: FrequencyBucket | null;
          objetivo: number | null;
          status: OpportunityStatus;
          responsavel: string | null;
          notas: string | null;
          observacao: string | null;
          risco: string | null;
          // v0.2 (0011)
          fte_horas: number | null;
          fonte: string | null;
          tipo_processo: string[];
          beneficio_qualitativo: string | null;
          criterios: Json | null;
          beneficios: Json | null;
          fte: FteBucket | null;
          rpa_score: number | null; // GENERATED ALWAYS — leitura apenas
          ai_enrichment_status: AiEnrichmentStatus;
          ai_enrichment_error: string | null;
          ai_enriched_at: string | null;
          persona_extras: PersonaExtras | null;
          formulario_extras: FormularioExtras | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          seq_id?: number;
          source: OpportunitySource;
          request_type?: OpportunityRequestType;
          solicitante: string;
          email?: string | null;
          area: string;
          subarea?: string | null;
          processo: string;
          frequencia?: string | null;
          volume_medio?: string | null;
          tempo_execucao?: string | null;
          num_pessoas?: string | null;
          ferramenta?: AutomationTool | null;
          escopo_automacao?: string[];
          beneficios_esperados?: string[];
          esforco?: EffortLevel | null;
          complexidade?: ComplexityLevel | null;
          tempo?: FrequencyBucket | null;
          objetivo?: number | null;
          status?: OpportunityStatus;
          responsavel?: string | null;
          notas?: string | null;
          observacao?: string | null;
          risco?: string | null;
          // v0.2 (0011) — rpa_score é GENERATED (omitido do Insert)
          fte_horas?: number | null;
          fonte?: string | null;
          tipo_processo?: string[];
          beneficio_qualitativo?: string | null;
          criterios?: Json | null;
          beneficios?: Json | null;
          fte?: FteBucket | null;
          ai_enrichment_status?: AiEnrichmentStatus;
          ai_enrichment_error?: string | null;
          ai_enriched_at?: string | null;
          persona_extras?: PersonaExtras | null;
          formulario_extras?: FormularioExtras | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['opportunities']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'opportunities_tenant_id_fkey';
            columns: ['tenant_id'];
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'opportunities_created_by_fkey';
            columns: ['created_by'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };

      opportunity_phases: {
        Row: {
          id: string;
          opportunity_id: string;
          tenant_id: string;
          phase_key: PhaseKey;
          started_at: string | null;
          finished_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          opportunity_id: string;
          tenant_id: string;
          phase_key: PhaseKey;
          started_at?: string | null;
          finished_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          phase_key: PhaseKey;
          started_at: string | null;
          finished_at: string | null;
          updated_at: string;
        }>;
        Relationships: [
          {
            foreignKeyName: 'opportunity_phases_opportunity_id_fkey';
            columns: ['opportunity_id'];
            referencedRelation: 'opportunities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'opportunity_phases_tenant_id_fkey';
            columns: ['tenant_id'];
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          }
        ];
      };

      opportunity_risks: {
        Row: {
          id: string;
          opportunity_id: string;
          tenant_id: string;
          descricao: string;
          tipo: RiskType;
          responsavel: string | null;
          impacto: RiskImpact;
          probabilidade: RiskProbability;
          status: RiskStatus;
          resposta: string | null;
          descricao_impacto: string | null;
          priority: RiskPriority | null; // set por trigger set_risk_priority() — nunca input manual
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          opportunity_id: string;
          tenant_id: string;
          descricao: string;
          tipo: RiskType;
          responsavel?: string | null;
          impacto: RiskImpact;
          probabilidade: RiskProbability;
          status?: RiskStatus;
          resposta?: string | null;
          descricao_impacto?: string | null;
          priority?: RiskPriority | null; // sobrescrito pelo trigger; não enviar
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['opportunity_risks']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'opportunity_risks_opportunity_id_fkey';
            columns: ['opportunity_id'];
            referencedRelation: 'opportunities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'opportunity_risks_tenant_id_fkey';
            columns: ['tenant_id'];
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'opportunity_risks_created_by_fkey';
            columns: ['created_by'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
    };

    Views: {
      opportunities_with_score: {
        Row: Database['public']['Tables']['opportunities']['Row'] & {
          score: number;
          priority_level: 'alta' | 'media' | 'baixa';
        };
        Relationships: [];
      };
    };

    Functions: {
      opportunity_score: {
        Args: {
          p_esforco: EffortLevel;
          p_complexidade: ComplexityLevel;
          p_tempo: FrequencyBucket;
          p_objetivo: number;
          p_fte: FteBucket;
        };
        Returns: number;
      };
      current_tenant_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      fetch_public_tenant: {
        Args: { p_slug: string };
        Returns: { id: string; name: string; slug: string }[];
      };
      create_public_opportunity: {
        // Overload canônico (21 params, de 0009 + 0012). O overload antigo de 18
        // params foi removido em 0012 (era ambíguo e carregava o mapeamento antigo).
        Args: {
          p_tenant_slug: string;
          p_solicitante: string;
          p_email: string;
          p_area: string;
          p_subarea: string;
          p_processo: string;
          p_frequencia: string;
          p_volume_medio: string;
          p_tempo_execucao: string;
          p_num_pessoas: string;
          p_ferramenta: string;
          p_escopo_automacao: string[];
          p_beneficios_esperados: string[];
          p_esforco: string;
          p_complexidade: string;
          p_tempo: string;
          p_objetivo: number;
          p_formulario_extras: Json;
          p_request_type: string;
          p_observacao: string | null;
          p_risco: string | null;
        };
        Returns: string;
      };
    };

    Enums: {
      opportunity_source: OpportunitySource;
      opportunity_status: OpportunityStatus;
      opportunity_request_type: OpportunityRequestType;
      automation_tool: AutomationTool;
      effort_level: EffortLevel;
      complexity_level: ComplexityLevel;
      time_bucket: TimeBucket;
      frequency_bucket: FrequencyBucket;
      fte_bucket: FteBucket;
      risk_type: RiskType;
      risk_impact: RiskImpact;
      risk_probability: RiskProbability;
      risk_status: RiskStatus;
      risk_priority: RiskPriority;
      ai_enrichment_status: AiEnrichmentStatus;
      phase_key: PhaseKey;
      tenant_role: TenantRole;
    };

    CompositeTypes: Record<string, never>;
  };
};
