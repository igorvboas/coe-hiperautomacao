'use client';

import { useRef, useState, useTransition } from 'react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import {
  createPublicOpportunity,
  type PublicSubmitInput,
} from '@/lib/opportunities/actions';
import type { PublicTenant } from '@/lib/tenants/queries';
import { DynamicList } from '@/components/opportunities/wizard/steps/DynamicList';
import {
  TextField,
  TextareaField,
  SelectField,
} from '@/components/opportunities/wizard/steps/fields';
import { ScorePreview } from '@/components/opportunities/wizard/ScorePreview';

type StepId =
  | 'identificacao'
  | 'processo'
  | 'automacao'
  | 'criterios'
  | 'beneficios'
  | 'priorizacao';

type Step = { id: StepId; label: string; icon: string };

const STEPS: Step[] = [
  { id: 'identificacao', label: 'Identificação', icon: '👤' },
  { id: 'processo', label: 'Processo', icon: '📋' },
  { id: 'automacao', label: 'Automação', icon: '🤖' },
  { id: 'criterios', label: 'Critérios', icon: '✅' },
  { id: 'beneficios', label: 'Benefícios', icon: '📈' },
  { id: 'priorizacao', label: 'Priorização', icon: '📊' },
];

type CriterioValor = 'SIM' | 'NAO' | 'PARCIAL';
type CriterioKey =
  | 'regras_claras'
  | 'totalmente_manual'
  | 'processo_uniforme'
  | 'digitacao_manual'
  | 'causa_reclamacoes'
  | 'padronizacao_docs'
  | 'validacao_dados'
  | 'schedulable'
  | 'tem_documentacao'
  | 'decisao_humana';

const CRITERIOS: { key: CriterioKey; label: string }[] = [
  { key: 'regras_claras', label: 'Processo baseado em regras claras' },
  { key: 'totalmente_manual', label: 'Totalmente Manual' },
  { key: 'processo_uniforme', label: 'Processo uniforme / mesmo fluxo sempre' },
  { key: 'digitacao_manual', label: 'Digitação ou movimentação manual de dados' },
  { key: 'causa_reclamacoes', label: 'Causa reclamações quando falha' },
  { key: 'padronizacao_docs', label: 'Padronização em documentos (PDFs, formulários)' },
  { key: 'validacao_dados', label: 'Validação ou conferência de dados simples' },
  { key: 'schedulable', label: 'Pode ser programado para horários específicos' },
  { key: 'tem_documentacao', label: 'Possui documentação do processo' },
  { key: 'decisao_humana', label: 'Necessidade de decisão humana frequente' },
];

type BeneficioKey =
  | 'reducao_tempo'
  | 'eliminacao_erros'
  | 'produtividade'
  | 'qualidade_dados'
  | 'reducao_custos'
  | 'reducao_retrabalho'
  | 'compliance'
  | 'objetivos_estrategicos';

const BENEFICIOS: { key: BeneficioKey; label: string; color: string }[] = [
  { key: 'reducao_tempo', label: 'Redução de Tempo', color: '#3b82f6' },
  { key: 'eliminacao_erros', label: 'Eliminação de Erros', color: '#8b5cf6' },
  { key: 'produtividade', label: 'Aumento de Produtividade', color: '#10b981' },
  { key: 'qualidade_dados', label: 'Qualidade de Dados', color: '#f59e0b' },
  { key: 'reducao_custos', label: 'Redução de Custos', color: '#ef4444' },
  { key: 'reducao_retrabalho', label: 'Redução de Retrabalho', color: '#ec4899' },
  { key: 'compliance', label: 'Compliance & Regulatório', color: '#06b6d4' },
  { key: 'objetivos_estrategicos', label: 'Objetivos Estratégicos', color: '#f97316' },
];

type FormState = {
  // Identificação
  solicitante: string;
  email: string;
  area: string;
  subarea: string;
  cargo: string;
  // Processo
  processo: string;
  frequencia: string;
  volume_medio: string;
  tempo_execucao: string;
  num_pessoas: string;
  tipo_processo: string;
  sistemas: string;
  // Automação
  ferramenta: 'rpa' | 'n8n' | 'ambos' | '';
  escopo_automacao: string[];
  beneficios_esperados: string[];
  // Critérios
  criterios: Partial<Record<CriterioKey, CriterioValor>>;
  // Benefícios
  beneficios: Partial<Record<BeneficioKey, number>>;
  // Priorização
  esforco: 'baixo' | 'medio' | 'alto';
  complexidade: 'baixo' | 'medio' | 'alto';
  tempo: 'pequeno' | 'medio' | 'grande';
  objetivo: number;
};

function initialState(): FormState {
  return {
    solicitante: '',
    email: '',
    area: '',
    subarea: '',
    cargo: '',
    processo: '',
    frequencia: '',
    volume_medio: '',
    tempo_execucao: '',
    num_pessoas: '',
    tipo_processo: '',
    sistemas: '',
    ferramenta: '',
    escopo_automacao: [''],
    beneficios_esperados: [''],
    criterios: {},
    beneficios: {},
    esforco: 'medio',
    complexidade: 'medio',
    tempo: 'medio',
    objetivo: 3,
  };
}

type Props = {
  tenant: PublicTenant;
  siteKey: string;
};

export function PublicForm({ tenant, siteKey }: Props) {
  const [data, setData] = useState<FormState>(initialState());
  const [stepIdx, setStepIdx] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [pending, startTransition] = useTransition();

  // Phase 7.5 Bloco D — Turnstile invisível. Token gerado por challenge,
  // passado como 3º param ao Server Action. Single-use → reset após submit.
  const turnstileRef = useRef<TurnstileInstance | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string>('');

  const currentStep = STEPS[stepIdx];
  const isFirst = stepIdx === 0;
  const isLast = stepIdx === STEPS.length - 1;

  function patch(p: Partial<FormState>) {
    setData((d) => ({ ...d, ...p }));
    setErrors({});
  }

  function validateCurrent(): boolean {
    const errs: Record<string, string> = {};
    if (currentStep.id === 'identificacao') {
      if (!data.solicitante.trim() || data.solicitante.trim().length < 2)
        errs.solicitante = 'Informe seu nome completo';
      if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
        errs.email = 'E-mail inválido';
      if (!data.area.trim() || data.area.trim().length < 2)
        errs.area = 'Área é obrigatória';
    }
    if (currentStep.id === 'processo') {
      if (!data.processo.trim() || data.processo.trim().length < 3)
        errs.processo = 'Descreva o processo';
    }
    if (currentStep.id === 'priorizacao') {
      if (!data.objetivo || data.objetivo < 1 || data.objetivo > 5)
        errs.objetivo = 'Selecione entre 1 e 5';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function next() {
    if (!validateCurrent()) return;
    setStepIdx(Math.min(stepIdx + 1, STEPS.length - 1));
  }

  function prev() {
    setErrors({});
    setStepIdx(Math.max(stepIdx - 1, 0));
  }

  function submit() {
    if (!validateCurrent()) return;
    setSubmitError(null);

    // Phase 7.5 Bloco D — exige token Turnstile. Sem token, dispara o challenge
    // invisível e pede pro usuário tentar de novo (challenge resolve em <1s).
    if (!turnstileToken) {
      turnstileRef.current?.execute();
      setSubmitError('Aguarde a verificação anti-bot e tente novamente.');
      return;
    }

    const input: PublicSubmitInput = {
      solicitante: data.solicitante.trim(),
      email: data.email.trim(),
      area: data.area.trim(),
      subarea: data.subarea.trim() || undefined,
      processo: data.processo.trim(),
      frequencia: data.frequencia.trim() || undefined,
      volume_medio: data.volume_medio.trim() || undefined,
      tempo_execucao: data.tempo_execucao.trim() || undefined,
      num_pessoas: data.num_pessoas.trim() || undefined,
      ferramenta: data.ferramenta || null,
      escopo_automacao: data.escopo_automacao,
      beneficios_esperados: data.beneficios_esperados,
      esforco: data.esforco,
      complexidade: data.complexidade,
      tempo: data.tempo,
      objetivo: data.objetivo,
      formulario_extras: {
        tipo_processo: data.tipo_processo.trim() || undefined,
        sistemas: data.sistemas.trim() || undefined,
        cargo_solicitante: data.cargo.trim() || undefined,
        criterios: data.criterios,
        beneficios: data.beneficios,
      },
    };

    startTransition(async () => {
      const result = await createPublicOpportunity(
        tenant.slug,
        input,
        turnstileToken,
      );
      // Token é single-use — Cloudflare retorna `timeout-or-duplicate` se reusado.
      // Sempre resetar após resposta, mesmo em erro.
      turnstileRef.current?.reset();
      setTurnstileToken('');

      if (!result.ok) {
        setSubmitError(result.error);
        return;
      }
      setSubmitted(true);
    });
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
          <div className="bg-gradient-to-br from-acc to-emerald-600 text-white px-6 py-8 text-center">
            <div className="text-5xl mb-2">✅</div>
            <h1 className="text-xl font-extrabold">Obrigado!</h1>
            <p className="text-sm opacity-90 mt-1">Sua oportunidade foi registrada.</p>
          </div>
          <div className="p-6 text-center space-y-3">
            <p className="text-[13px] text-txt leading-relaxed">
              O time do CoE de Hiperautomação da <strong>{tenant.name}</strong> vai
              analisar sua solicitação. Se precisar, entrarão em contato pelo
              e-mail <strong>{data.email}</strong>.
            </p>
            <button
              type="button"
              onClick={() => {
                setData(initialState());
                setStepIdx(0);
                setSubmitted(false);
              }}
              className="px-4 py-2 bg-pri hover:bg-pril text-white text-sm font-bold rounded-lg"
            >
              ➕ Registrar outra oportunidade
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg py-6 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <header className="bg-gradient-to-br from-pri to-pril text-white px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center font-black">
              {tenant.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold truncate">{tenant.name}</h1>
              <p className="text-xs opacity-75">
                Formulário público de oportunidade de automação
              </p>
            </div>
          </div>
        </header>

        {/* Steps nav */}
        <nav className="bg-slate-50 border-b border-bdr flex overflow-x-auto">
          {STEPS.map((s, i) => {
            const isActive = i === stepIdx;
            const isDone = i < stepIdx;
            return (
              <button
                key={s.id}
                type="button"
                disabled={i > stepIdx}
                onClick={() => i <= stepIdx && setStepIdx(i)}
                className={
                  'px-3 py-2.5 text-[11px] font-semibold whitespace-nowrap flex items-center gap-1.5 border-b-2 ' +
                  (isActive
                    ? 'text-pri border-pri bg-white'
                    : isDone
                      ? 'text-emerald-600 border-transparent'
                      : 'text-mut border-transparent') +
                  (i <= stepIdx ? ' cursor-pointer' : ' cursor-not-allowed opacity-60')
                }
              >
                <span
                  className={
                    'w-4 h-4 rounded-full text-[9px] font-extrabold flex items-center justify-center ' +
                    (isActive
                      ? 'bg-pri text-white'
                      : isDone
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 text-mut')
                  }
                >
                  {isDone ? '✓' : i + 1}
                </span>
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Body */}
        <div className="p-5">
          {currentStep.id === 'identificacao' && (
            <div>
              <h2 className="text-sm font-bold text-txt mb-1">
                Quem é você?
              </h2>
              <p className="text-[11px] text-mut mb-4">
                Suas informações ajudam o time do CoE a entrar em contato sobre
                a oportunidade.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <TextField
                  label="Nome completo"
                  required
                  value={data.solicitante}
                  onChange={(v) => patch({ solicitante: v })}
                  error={errors.solicitante}
                  placeholder="Ex: Maria Silva"
                />
                <TextField
                  label="E-mail corporativo"
                  type="email"
                  required
                  value={data.email}
                  onChange={(v) => patch({ email: v })}
                  error={errors.email}
                  placeholder="maria@empresa.com.br"
                />
                <TextField
                  label="Área"
                  required
                  value={data.area}
                  onChange={(v) => patch({ area: v })}
                  error={errors.area}
                  placeholder="Ex: Financeiro"
                />
                <TextField
                  label="Subárea / Time"
                  value={data.subarea}
                  onChange={(v) => patch({ subarea: v })}
                  placeholder="Ex: Contas a Pagar"
                />
                <div className="sm:col-span-2">
                  <TextField
                    label="Cargo"
                    value={data.cargo}
                    onChange={(v) => patch({ cargo: v })}
                    placeholder="Ex: Analista Júnior"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep.id === 'processo' && (
            <div>
              <h2 className="text-sm font-bold text-txt mb-1">
                Conte sobre o processo
              </h2>
              <p className="text-[11px] text-mut mb-4">
                Quanto mais detalhe, mais fácil pro CoE avaliar.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <div className="sm:col-span-2">
                  <TextareaField
                    label="Processo / Oportunidade"
                    required
                    value={data.processo}
                    onChange={(v) => patch({ processo: v })}
                    error={errors.processo}
                    rows={2}
                    placeholder="Ex: Conciliação bancária diária"
                  />
                </div>
                <TextField
                  label="Frequência"
                  value={data.frequencia}
                  onChange={(v) => patch({ frequencia: v })}
                  placeholder="Diária / Semanal / Mensal"
                />
                <TextField
                  label="Volume Médio"
                  value={data.volume_medio}
                  onChange={(v) => patch({ volume_medio: v })}
                  placeholder="Ex: 50 lançamentos/dia"
                />
                <TextField
                  label="Tempo de Execução"
                  value={data.tempo_execucao}
                  onChange={(v) => patch({ tempo_execucao: v })}
                  placeholder="Ex: 2 horas"
                />
                <TextField
                  label="Pessoas Envolvidas"
                  value={data.num_pessoas}
                  onChange={(v) => patch({ num_pessoas: v })}
                  placeholder="Ex: 3"
                />
                <TextField
                  label="Tipo do Processo"
                  value={data.tipo_processo}
                  onChange={(v) => patch({ tipo_processo: v })}
                  placeholder="Ex: Financeiro; Backoffice"
                />
                <TextField
                  label="Sistemas Utilizados"
                  value={data.sistemas}
                  onChange={(v) => patch({ sistemas: v })}
                  placeholder="Ex: Excel, ERP, E-mail"
                />
              </div>
            </div>
          )}

          {currentStep.id === 'automacao' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-sm font-bold text-txt mb-1">
                  Como você imagina a automação?
                </h2>
                <p className="text-[11px] text-mut mb-3">
                  Sem certeza? Tudo bem — deixa o CoE sugerir.
                </p>
                <div className="text-[10px] font-bold uppercase tracking-wider text-mut mb-2">
                  Ferramenta sugerida
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { v: 'rpa', label: '🤖 RPA', desc: 'Sistemas legados/desktop' },
                    { v: 'n8n', label: '⚡ n8n', desc: 'APIs e integrações' },
                    { v: 'ambos', label: '🔁 Ambos', desc: 'Mix' },
                  ].map((opt) => {
                    const active = data.ferramenta === opt.v;
                    return (
                      <button
                        key={opt.v}
                        type="button"
                        onClick={() =>
                          patch({
                            ferramenta:
                              data.ferramenta === opt.v
                                ? ''
                                : (opt.v as FormState['ferramenta']),
                          })
                        }
                        className={
                          'p-3 text-left rounded-lg border-2 transition-all ' +
                          (active
                            ? 'border-pri bg-pri/5'
                            : 'border-bdr bg-white hover:border-pril')
                        }
                      >
                        <div className="text-[13px] font-bold mb-0.5">{opt.label}</div>
                        <div className="text-[10px] text-mut leading-snug">
                          {opt.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-mut mb-2">
                  O que você quer automatizar?
                </div>
                <DynamicList
                  items={data.escopo_automacao}
                  onChange={(next) => patch({ escopo_automacao: next })}
                  placeholder="Ex: Validar CNPJ no Receita Federal"
                  addLabel="+ Adicionar item"
                />
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-mut mb-2">
                  Benefícios esperados (texto livre)
                </div>
                <DynamicList
                  items={data.beneficios_esperados}
                  onChange={(next) => patch({ beneficios_esperados: next })}
                  placeholder="Ex: Economia de 4h/dia"
                  addLabel="+ Adicionar benefício"
                />
              </div>
            </div>
          )}

          {currentStep.id === 'criterios' && (
            <div>
              <h2 className="text-sm font-bold text-txt mb-1">
                Critérios técnicos
              </h2>
              <p className="text-[11px] text-mut mb-4">
                Click pra alternar entre SIM / NÃO / PARCIAL.
              </p>
              <div className="space-y-1.5">
                {CRITERIOS.map((c) => {
                  const v = data.criterios[c.key];
                  const meta =
                    v === 'SIM'
                      ? {
                          icon: '✅',
                          label: 'Sim',
                          cls: 'bg-green-50 text-green-800 border-green-300',
                        }
                      : v === 'NAO'
                        ? {
                            icon: '❌',
                            label: 'Não',
                            cls: 'bg-red-50 text-red-800 border-red-300',
                          }
                        : v === 'PARCIAL'
                          ? {
                              icon: '⚠️',
                              label: 'Parcial',
                              cls: 'bg-yellow-50 text-yellow-900 border-yellow-300',
                            }
                          : {
                              icon: '⚪',
                              label: '—',
                              cls: 'bg-slate-50 text-mut border-slate-200',
                            };
                  return (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => {
                        const nextV: CriterioValor =
                          v === 'SIM'
                            ? 'NAO'
                            : v === 'NAO'
                              ? 'PARCIAL'
                              : 'SIM';
                        patch({
                          criterios: { ...data.criterios, [c.key]: nextV },
                        });
                      }}
                      className={
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-[12px] text-left transition-colors hover:brightness-95 ' +
                        meta.cls
                      }
                    >
                      <span className="text-base w-5 text-center">
                        {meta.icon}
                      </span>
                      <span className="flex-1">{c.label}</span>
                      <span className="font-bold text-[11px]">{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {currentStep.id === 'beneficios' && (
            <div>
              <h2 className="text-sm font-bold text-txt mb-1">
                Pontue os benefícios esperados
              </h2>
              <p className="text-[11px] text-mut mb-4">
                De 1 (nada alinhado) a 5 (totalmente alinhado). Pode deixar em branco
                quem não se aplica.
              </p>
              <div className="space-y-3">
                {BENEFICIOS.map((b) => {
                  const v = data.beneficios[b.key];
                  return (
                    <div key={b.key} className="flex items-center gap-3 flex-wrap">
                      <span className="text-[11px] text-mut min-w-[160px]">
                        {b.label}
                      </span>
                      <div className="flex-1 flex gap-1 min-w-[200px]">
                        {[1, 2, 3, 4, 5].map((n) => {
                          const active = v === n;
                          return (
                            <button
                              key={n}
                              type="button"
                              onClick={() => {
                                const nextBen = { ...data.beneficios };
                                if (active) delete nextBen[b.key];
                                else nextBen[b.key] = n;
                                patch({ beneficios: nextBen });
                              }}
                              className={
                                'flex-1 py-1.5 rounded text-[11px] font-bold border transition-colors ' +
                                (active
                                  ? 'text-white border-transparent'
                                  : 'bg-bg text-txt border-bdr hover:border-pril')
                              }
                              style={active ? { background: b.color } : undefined}
                            >
                              {n}
                            </button>
                          );
                        })}
                      </div>
                      <span
                        className="text-[11px] font-bold min-w-[32px] text-right tabular-nums"
                        style={{ color: v ? b.color : 'var(--color-mut)' }}
                      >
                        {v ?? '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {currentStep.id === 'priorizacao' && (
            <div>
              <h2 className="text-sm font-bold text-txt mb-1">
                Como você prioriza isso?
              </h2>
              <p className="text-[11px] text-mut mb-4">
                O CoE ajusta depois — esta é sua visão.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <SelectField
                  label="Esforço de Implementação"
                  required
                  value={data.esforco}
                  onChange={(v) =>
                    patch({ esforco: v as FormState['esforco'] })
                  }
                  options={[
                    { value: 'baixo', label: 'Baixo' },
                    { value: 'medio', label: 'Médio' },
                    { value: 'alto', label: 'Alto' },
                  ]}
                />
                <SelectField
                  label="Complexidade Técnica"
                  required
                  value={data.complexidade}
                  onChange={(v) =>
                    patch({ complexidade: v as FormState['complexidade'] })
                  }
                  options={[
                    { value: 'baixo', label: 'Baixo' },
                    { value: 'medio', label: 'Médio' },
                    { value: 'alto', label: 'Alto' },
                  ]}
                />
                <SelectField
                  label="Tempo Estimado"
                  required
                  value={data.tempo}
                  onChange={(v) =>
                    patch({ tempo: v as FormState['tempo'] })
                  }
                  options={[
                    { value: 'pequeno', label: 'Pequeno' },
                    { value: 'medio', label: 'Médio' },
                    { value: 'grande', label: 'Grande' },
                  ]}
                />
                <div className="mb-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-mut mb-1">
                    Alinhamento Estratégico <span className="text-red-500">*</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => {
                      const active = data.objetivo === n;
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => patch({ objetivo: n })}
                          className={
                            'flex-1 py-1.5 rounded-lg text-[12px] font-bold border ' +
                            (active
                              ? 'bg-pri text-white border-pri'
                              : 'bg-bg text-txt border-bdr hover:border-pril')
                          }
                        >
                          {n}
                        </button>
                      );
                    })}
                  </div>
                  {errors.objetivo && (
                    <div className="text-[11px] text-red-700 mt-1">
                      {errors.objetivo}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3">
                <ScorePreview
                  esforco={data.esforco}
                  complexidade={data.complexidade}
                  tempo={data.tempo}
                  objetivo={data.objetivo}
                />
              </div>
            </div>
          )}

          {/* Phase 7.5 Bloco D — Turnstile invisível. Renderiza sempre (não só
              no último step) para que o challenge possa rodar em background
              enquanto o usuário avança pelo wizard. Sem UI visível com size=invisible. */}
          <Turnstile
            ref={turnstileRef}
            siteKey={siteKey}
            onSuccess={(token) => setTurnstileToken(token)}
            onError={() => setTurnstileToken('')}
            onExpire={() => setTurnstileToken('')}
            options={{ size: 'invisible', appearance: 'interaction-only' }}
          />

          {submitError && (
            <div className="mt-4 text-[11px] text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {submitError}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="bg-slate-50 border-t border-bdr px-5 py-3 flex items-center justify-between flex-wrap gap-2">
          <span className="text-[11px] text-mut">
            Passo {stepIdx + 1} de {STEPS.length}
          </span>
          <div className="flex gap-2 flex-wrap">
            {!isFirst && (
              <button
                type="button"
                onClick={prev}
                disabled={pending}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-txt text-[12px] font-semibold rounded-lg disabled:opacity-50"
              >
                ← Anterior
              </button>
            )}
            {!isLast ? (
              <button
                type="button"
                onClick={next}
                className="px-3 py-1.5 bg-pri hover:bg-pril text-white text-[12px] font-semibold rounded-lg"
              >
                Próximo →
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={pending}
                className="px-4 py-1.5 bg-acc hover:opacity-90 text-white text-[13px] font-bold rounded-lg disabled:opacity-50"
              >
                {pending ? 'Enviando...' : '✓ Enviar'}
              </button>
            )}
          </div>
        </footer>
      </div>
    </main>
  );
}
