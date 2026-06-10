'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type {
  Opportunity,
  OpportunityPhase,
  OpportunityRisk,
} from '@/lib/opportunities/types';
import { updateOpportunity } from '@/lib/opportunities/actions';
import type { OpportunityInput } from '@/lib/opportunities/schema';
import {
  opportunityToFormData,
  validateStep,
  type WizardFormData,
} from '@/components/opportunities/wizard/state';
import { calcScore, priorityLevel } from '@/lib/opportunities/score';
import { deriveFteBucket } from '@/lib/opportunities/fte';
import { deriveRpaScore } from '@/lib/opportunities/rpa';
import { ModalHeader } from './Header';
import { EnrichingOverlay } from './EnrichingOverlay';
import { TabsNav } from './TabsNav';
import type { TabDef, TabId } from './types';
import { AutomacaoTab } from './tabs/AutomacaoTab';
import { FasesTab } from './tabs/FasesTab';
import { ScoreTab } from './tabs/ScoreTab';
import { ProcessoTab } from './tabs/ProcessoTab';
import { CriteriosTab } from './tabs/CriteriosTab';
import { BeneficiosTab } from './tabs/BeneficiosTab';
import { ObservacaoTab } from './tabs/ObservacaoTab';
import { RiscoTab } from './tabs/RiscoTab';
import { TextField, SelectField, TextareaField } from '@/components/opportunities/wizard/steps/fields';
import { CriteriosStep } from '@/components/opportunities/wizard/steps/CriteriosStep';
import { BeneficiosStep } from '@/components/opportunities/wizard/steps/BeneficiosStep';
import { PriorizacaoStep } from '@/components/opportunities/wizard/steps/PriorizacaoStep';

// D-07/D-08/D-09: conjunto ÚNICO de 8 abas para QUALQUER oportunidade, na ordem
// do mockup (`_giba_wsi-dashboard.html:959-968`). Sem ramificação por `source`.
// As abas só-persona (Perfil/Desafios/CoE) saem da exibição — os arquivos
// permanecem no disco e os dados em `persona_extras`, apenas não são mais montados.
const MODAL_TABS: TabDef[] = [
  { id: 'processo', label: 'Processo', icon: '📋' },
  { id: 'criterios', label: 'Critérios', icon: '✅' },
  { id: 'automacao', label: 'Automação', icon: '🤖' },
  { id: 'beneficios', label: 'Benefícios', icon: '📈' },
  { id: 'score', label: 'Score', icon: '📊' },
  { id: 'fases', label: 'Fases', icon: '📅' },
  { id: 'risco', label: 'Risco', icon: '⚠️' },
  { id: 'observacao', label: 'Observação', icon: '💬' },
];

// Domínio de Frequência (fonte única do fator `tempo`, 0011). Espelha ProcessoStep.
const FREQUENCY_OPTIONS = [
  { value: 'diario', label: 'Diário' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'quinzenal', label: 'Quinzenal' },
  { value: 'mensal', label: 'Mensal' },
  { value: 'anual', label: 'Anual' },
];
const FREQUENCY_LABEL: Record<string, string> = {
  diario: 'Diário',
  semanal: 'Semanal',
  quinzenal: 'Quinzenal',
  mensal: 'Mensal',
  anual: 'Anual',
};
// toolEnum lowercase (Pitfall 5 — nunca 'RPA').
const TOOL_OPTIONS = [
  { value: 'rpa', label: 'RPA' },
  { value: 'n8n', label: 'n8n' },
  { value: 'ambos', label: 'Ambos' },
];

type Props = {
  opportunity: Opportunity;
  phases: OpportunityPhase[];
  risks: OpportunityRisk[];
};

export function OpportunityDetail({ opportunity, phases, risks }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('processo');

  // ── Estado de edição global (recipe do WizardShell, D-12/D-13/D-15) ───────
  const router = useRouter();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<WizardFormData>(
    opportunityToFormData(opportunity)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // IA ainda processando → o corpo do modal mostra um loader em vez de dados de
  // placeholder (score/automação/critérios com defaults que mudam em segundos).
  const isPending = opportunity.ai_enrichment_status === 'pending';

  // Safety net: NUNCA prender o usuário no loader. Enrichment só roda para
  // oportunidades criadas pelo app (after() em createOpportunity). Linhas de
  // seed / legadas ficam 'pending' para sempre (nada as enriquece), e um after()
  // morto por cold start também deixaria 'pending' órfão. Se após ~20s o status
  // ainda é 'pending', desistimos de esperar e mostramos os dados que JÁ existem
  // na row (que para seed/legado estão completos e corretos).
  const [waitedTooLong, setWaitedTooLong] = useState(false);
  const enriching = isPending && !waitedTooLong;

  // Polling enquanto enriquece: router.refresh() re-busca a row no servidor. Ao
  // sair de 'pending' (ou ao desistir) o efeito limpa o intervalo e o modal
  // repinta com os campos já populados. Sem isto, o loader giraria sem parar.
  useEffect(() => {
    if (!enriching) return;
    const id = setInterval(() => router.refresh(), 3000);
    return () => clearInterval(id);
  }, [enriching, router]);

  // Timeout do safety net: marca waitedTooLong após 20s de 'pending'. Se a row
  // sair de 'pending' antes (enrichment real concluído), o cleanup cancela.
  useEffect(() => {
    if (!isPending) return;
    const id = setTimeout(() => setWaitedTooLong(true), 20000);
    return () => clearTimeout(id);
  }, [isPending]);

  // Re-sincroniza o form quando a row muda no servidor (ex.: fim do enriquecimento)
  // e não estamos editando — evita que o modo edição abra com os defaults pré-IA
  // stale capturados no mount. Em edição o form é preservado (onCancel já reseta).
  useEffect(() => {
    if (!editMode) {
      setForm(opportunityToFormData(opportunity));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opportunity.updated_at, opportunity.ai_enriched_at]);

  function patch(p: Partial<WizardFormData>) {
    setForm((d) => ({ ...d, ...p }));
  }

  function onEdit() {
    setEditMode(true);
  }

  function onCancel() {
    setForm(opportunityToFormData(opportunity));
    setErrors({});
    setSubmitError(null);
    setEditMode(false);
  }

  function onSave() {
    // Pitfall 2: gate all-or-null dos 8 critérios antes do submit (espelha o
    // CHECK `opportunities_criterios_chk` + o .refine do Zod). Persona legada
    // intocada mantém criterios undefined/null — validateStep só bloqueia se
    // houver resposta parcial; criterios totalmente ausente também é bloqueado,
    // coerente com o gate do wizard (mensagem pt-BR "Responda todos os 8…").
    const cv = validateStep('criterios', form);
    if (!cv.ok) {
      setErrors(cv.errors);
      return;
    }
    setSubmitError(null);
    startTransition(async () => {
      // Deriva o 5º fator (bucket FTE) de fte_horas — fonte única (mesma fn do
      // display read-only) → impossível divergir preview × persistência. Derivado
      // NUNCA é input; só `prioridade_fte` (que a action mapeia p/ coluna `fte`).
      const payload = {
        ...form,
        prioridade_fte:
          form.fte_horas != null ? deriveFteBucket(Number(form.fte_horas)) : undefined,
      };
      const result = await updateOpportunity(
        opportunity.id,
        payload as OpportunityInput
      );
      if (!result.ok) {
        setSubmitError(result.error);
        if (result.fieldErrors) {
          // fieldErrors do Zod são Record<string,string[]> — pega a 1ª mensagem.
          const flat: Record<string, string> = {};
          for (const [k, v] of Object.entries(result.fieldErrors)) {
            if (Array.isArray(v) && v[0]) flat[k] = v[0];
          }
          setErrors(flat);
        }
        return;
      }
      // Pitfall 4: o modal NÃO fecha (ao contrário do WizardShell, que navega
      // para trás). Sai do modo edição e repinta com valores DB-authoritative
      // (score/priority/rpa_score/fte recalculados no servidor após o update).
      setEditMode(false);
      router.refresh();
    });
  }

  // ── Derivados ao vivo (Shared Pattern C, read-only — D-15) ────────────────
  // Display-only: NUNCA inputs, NUNCA no payload. Em modo edição refletem o form;
  // em modo leitura o Header usa os valores DB-authoritative da row.
  const fteBucket =
    form.fte_horas != null ? deriveFteBucket(Number(form.fte_horas)) : undefined;
  const liveScore = calcScore({
    esforco: form.esforco,
    complexidade: form.complexidade,
    tempo: form.tempo,
    objetivo: form.objetivo,
    fte: fteBucket,
  });
  const livePriority = priorityLevel(liveScore);
  const liveRpaScore = deriveRpaScore(
    (form.criterios ?? null) as Record<string, string> | null
  );

  return (
    <>
      <ModalHeader
        opportunity={opportunity}
        editMode={editMode}
        enriching={enriching}
        pending={pending}
        submitError={submitError}
        liveScore={liveScore}
        livePriority={livePriority}
        onEdit={onEdit}
        onSave={onSave}
        onCancel={onCancel}
      />
      {enriching ? (
        <EnrichingOverlay />
      ) : (
        <>
          <TabsNav
            tabs={MODAL_TABS}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
          <div className="max-h-[60vh] overflow-y-auto">
            {renderTab({
              tab: activeTab,
              opp: opportunity,
              phases,
              risks,
              editMode,
              form,
              patch,
              errors,
              liveRpaScore,
            })}
          </div>
        </>
      )}
    </>
  );
}

function renderTab(args: {
  tab: TabId;
  opp: Opportunity;
  phases: OpportunityPhase[];
  risks: OpportunityRisk[];
  editMode: boolean;
  form: WizardFormData;
  patch: (p: Partial<WizardFormData>) => void;
  errors: Record<string, string>;
  liveRpaScore: number | null;
}) {
  const { tab, opp, phases, risks, editMode, form, patch, errors } = args;

  // Fases e Risco permanecem READ-ONLY mesmo em modo edição (D-12): fases mudam
  // via StatusSelector no header; riscos via o CRUD da aba Risco (Phase 12).
  // Eles NÃO fazem parte do payload global da oportunidade.
  if (tab === 'fases') return <FasesTab opportunity={opp} phases={phases} />;
  if (tab === 'risco') return <RiscoTab opportunity={opp} risks={risks} />;

  // ── Modo LEITURA: abas de display do Plan 04 (inalteradas) ────────────────
  if (!editMode) {
    switch (tab) {
      case 'processo':
        return <ProcessoTab opportunity={opp} />;
      case 'criterios':
        return <CriteriosTab opportunity={opp} />;
      case 'automacao':
        return <AutomacaoTab opportunity={opp} />;
      case 'beneficios':
        return <BeneficiosTab opportunity={opp} />;
      case 'score':
        return <ScoreTab opportunity={opp} />;
      case 'observacao':
        return <ObservacaoTab opportunity={opp} />;
      default:
        return null;
    }
  }

  // ── Modo EDIÇÃO: bodies puros do wizard contra UM payload (Shared Pattern D) ─
  switch (tab) {
    case 'processo':
      return (
        <div className="px-5 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <TextField
              label="Processo"
              required
              value={form.processo ?? ''}
              onChange={(v) => patch({ processo: v })}
              error={errors.processo}
            />
            <TextField
              label="Área Responsável"
              required
              value={form.area ?? ''}
              onChange={(v) => patch({ area: v })}
              error={errors.area}
            />
            <TextField
              label="Subárea / Time"
              value={form.subarea ?? ''}
              onChange={(v) => patch({ subarea: v })}
            />
            <SelectField
              label="Frequência"
              value={form.tempo}
              onChange={(v) =>
                patch({
                  tempo: v as WizardFormData['tempo'],
                  frequencia: FREQUENCY_LABEL[v] ?? '',
                })
              }
              options={FREQUENCY_OPTIONS}
            />
            <TextField
              label="Volume Médio"
              value={form.volume_medio ?? ''}
              onChange={(v) => patch({ volume_medio: v })}
            />
            <TextField
              label="Tempo de Execução"
              value={form.tempo_execucao ?? ''}
              onChange={(v) => patch({ tempo_execucao: v })}
            />
            <TextField
              label="Pessoas Envolvidas"
              value={form.num_pessoas ?? ''}
              onChange={(v) => patch({ num_pessoas: v })}
            />
            <TextField
              label="E-mail do Solicitante"
              type="email"
              value={form.email ?? ''}
              onChange={(v) => patch({ email: v })}
              error={errors.email}
            />
          </div>
        </div>
      );
    case 'criterios':
      return <CriteriosStep data={form} onChange={patch} errors={errors} />;
    case 'beneficios':
      return <BeneficiosStep data={form} onChange={patch} />;
    case 'score':
      // PriorizacaoStep: 4 fatores manuais + bucket FTE read-only + ScorePreview
      // (o score/priority são DISPLAY-only — nunca inputs, D-15).
      return <PriorizacaoStep data={form} onChange={patch} errors={errors} />;
    case 'automacao':
      return (
        <div className="px-5 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <SelectField
              label="Ferramenta Sugerida"
              value={form.ferramenta ?? 'n8n'}
              onChange={(v) =>
                patch({ ferramenta: v as WizardFormData['ferramenta'] })
              }
              options={TOOL_OPTIONS}
            />
          </div>
        </div>
      );
    case 'observacao':
      // Texto livre `observacao`. O campo legado `risco` (nota livre) foi removido
      // da UI — o registro de riscos é estruturado na aba Risco (opportunity_risks).
      // `form.risco` não é mais editável aqui; updateOpportunity preserva o valor
      // existente (semeado por opportunityToFormData), sem perda de dados.
      return (
        <div className="px-5 py-4">
          <TextareaField
            label="Observação"
            value={form.observacao ?? ''}
            onChange={(v) => patch({ observacao: v })}
            rows={4}
          />
        </div>
      );
    default:
      return null;
  }
}
