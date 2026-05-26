// =============================================================================
// database.types.ts — Types do schema Supabase (multi-tenant CoE)
// =============================================================================
// ⚠️  ARQUIVO PROVISÓRIO escrito à mão a partir de
//     supabase/migrations/0001_init.sql. SUBSTITUA por geração automática
//     assim que tiver o SUPABASE_ACCESS_TOKEN:
//
//         npm run gen:types
//
//     O script regenera este arquivo lendo o schema real do projeto via
//     `supabase gen types typescript --project-id $SUPABASE_PROJECT_REF`.
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
export type TimeBucket = 'pequeno' | 'medio' | 'grande';

export type PhaseKey =
  | 'em_analise'
  | 'planejamento'
  | 'backlog'
  | 'desenvolvimento'
  | 'homologacao'
  | 'producao'
  | 'concluido';

export type TenantRole = 'member' | 'tenant_admin';

export type OpportunityRequestType =
  | 'nova_oportunidade'
  | 'melhoria_automacao'
  | 'duvidas_terceiros'
  | 'incidente'
  | 'treinamento';

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
  tempo: TimeBucket | null;
  objetivo: number | null;
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
          tempo: TimeBucket | null;
          objetivo: number | null;
          status: OpportunityStatus;
          responsavel: string | null;
          notas: string | null;
          observacao: string | null;
          risco: string | null;
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
          tempo?: TimeBucket | null;
          objetivo?: number | null;
          status?: OpportunityStatus;
          responsavel?: string | null;
          notas?: string | null;
          observacao?: string | null;
          risco?: string | null;
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
          p_tempo: TimeBucket;
          p_objetivo: number;
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
        };
        Returns: string;
      };
    };

    Enums: {
      opportunity_source: OpportunitySource;
      opportunity_status: OpportunityStatus;
      automation_tool: AutomationTool;
      effort_level: EffortLevel;
      complexity_level: ComplexityLevel;
      time_bucket: TimeBucket;
      phase_key: PhaseKey;
      tenant_role: TenantRole;
    };

    CompositeTypes: Record<string, never>;
  };
};
