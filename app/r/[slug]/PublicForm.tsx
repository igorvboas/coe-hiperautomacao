'use client';

import { useRef, useState, useTransition } from 'react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import {
  createPublicOpportunity,
  type PublicSubmitInput,
} from '@/lib/opportunities/actions';
import type { PublicTenant } from '@/lib/tenants/queries';
import {
  TextField,
  TextareaField,
  SelectField,
} from '@/components/opportunities/wizard/steps/fields';

// Phase 7.6: steps 'automacao', 'criterios', 'beneficios', 'priorizacao' removidos —
// esses campos viram OUTPUT da IA (lib/ai/enrichment.ts), não input do user.
// O formulário público agora pede apenas identificação + processo; defaults
// dos 9 campos enriquecidos são injetados em createPublicOpportunity (Plan 03)
// para satisfazer a assinatura da RPC create_public_opportunity (migration 0007).
type StepId = 'identificacao' | 'processo';

type Step = { id: StepId; label: string; icon: string };

const STEPS: Step[] = [
  { id: 'identificacao', label: 'Identificação', icon: '👤' },
  { id: 'processo', label: 'Processo', icon: '📋' },
];

type RequestType =
  | 'nova_oportunidade'
  | 'melhoria_automacao'
  | 'duvidas_terceiros'
  | 'incidente'
  | 'treinamento';

const REQUEST_TYPE_OPTIONS: { value: RequestType; label: string }[] = [
  { value: 'nova_oportunidade', label: 'Nova Oportunidade' },
  { value: 'melhoria_automacao', label: 'Melhoria da Automação já Existente' },
  { value: 'duvidas_terceiros', label: 'Dúvidas — Avaliar soluções de terceiros' },
  { value: 'incidente', label: 'Incidente' },
  { value: 'treinamento', label: 'Pedido de Treinamento' },
];

type FormState = {
  // Identificação
  request_type: RequestType;
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
  // Phase 7.6: campos abaixo removidos do FormState — IA vai gerar via
  // enrichOpportunity(). Server Action createPublicOpportunity continua
  // enviando defaults para a RPC (assinatura compatível com migration 0007):
  //   ferramenta, escopo_automacao, beneficios_esperados, observacao, risco,
  //   esforco, complexidade, tempo, objetivo, criterios (extras), beneficios (extras)
};

function initialState(): FormState {
  return {
    request_type: 'nova_oportunidade',
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
      if (!data.request_type) errs.request_type = 'Selecione a classificação';
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

    // Phase 7.6: payload reduzido — campos enriquecidos pela IA OMITIDOS.
    // Server Action createPublicOpportunity (Plan 03) injeta defaults antes
    // de chamar a RPC create_public_opportunity (migration 0007 — 18 params
    // fixos; assinatura preservada). IA sobrescreve via UPDATE pós-INSERT.
    const input: PublicSubmitInput = {
      request_type: data.request_type,
      solicitante: data.solicitante.trim(),
      email: data.email.trim(),
      area: data.area.trim(),
      subarea: data.subarea.trim() || undefined,
      processo: data.processo.trim(),
      frequencia: data.frequencia.trim() || undefined,
      volume_medio: data.volume_medio.trim() || undefined,
      tempo_execucao: data.tempo_execucao.trim() || undefined,
      num_pessoas: data.num_pessoas.trim() || undefined,
      // objetivo é obrigatório no type — default neutro (IA sobrescreve).
      objetivo: 3,
      formulario_extras: {
        tipo_processo: data.tipo_processo.trim() || undefined,
        sistemas: data.sistemas.trim() || undefined,
        cargo_solicitante: data.cargo.trim() || undefined,
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
                <div className="sm:col-span-2">
                  <SelectField
                    label="Classificação da Solicitação"
                    required
                    value={data.request_type}
                    onChange={(v) => patch({ request_type: v as RequestType })}
                    options={REQUEST_TYPE_OPTIONS}
                    error={errors.request_type}
                    placeholder="Selecione..."
                  />
                </div>
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

          {/* Phase 7.6: render branches `automacao`, `criterios`, `beneficios`,
              `priorizacao` REMOVIDOS — os campos agora são output da IA
              (lib/ai/enrichment.ts), preenchidos via after() do Server Action. */}

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
