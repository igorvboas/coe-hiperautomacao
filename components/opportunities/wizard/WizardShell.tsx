'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createOpportunity,
  updateOpportunity,
} from '@/lib/opportunities/actions';
import type { OpportunityInput } from '@/lib/opportunities/schema';
import {
  defaultFormData,
  stepsFor,
  validateStep,
  type StepDef,
  type StepId,
  type WizardFormData,
} from './state';
import { StepsNav } from './StepsNav';
import { TipoStep } from './steps/TipoStep';
import { ClassificacaoStep } from './steps/ClassificacaoStep';
import { IdentificacaoStep } from './steps/IdentificacaoStep';
import { ProcessoStep } from './steps/ProcessoStep';
import { AutomacaoStep } from './steps/AutomacaoStep';
import { PriorizacaoStep } from './steps/PriorizacaoStep';
import { ContextoStep } from './steps/ContextoStep';
import { CriteriosStep } from './steps/CriteriosStep';
import { BeneficiosStep } from './steps/BeneficiosStep';

type Props = {
  mode: 'create' | 'edit';
  opportunityId?: string;
  initialData?: WizardFormData;
};

export function WizardShell({ mode, opportunityId, initialData }: Props) {
  const router = useRouter();
  const [data, setData] = useState<WizardFormData>(
    initialData ?? defaultFormData()
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reachedIndex, setReachedIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const steps: StepDef[] = stepsFor(data.source, mode);
  const currentStep = steps[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === steps.length - 1;
  const canSubmit = !!data.source && isLast;

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // ESC fecha
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') router.back();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [router]);

  function patch(p: Partial<WizardFormData>) {
    setData((d) => ({ ...d, ...p }));
    setErrors({});
  }

  function next() {
    if (!currentStep) return;
    const v = validateStep(currentStep.id, data);
    if (!v.ok) {
      setErrors(v.errors);
      return;
    }
    setErrors({});
    const nextIdx = currentIndex + 1;
    setCurrentIndex(nextIdx);
    if (nextIdx > reachedIndex) setReachedIndex(nextIdx);
  }

  function prev() {
    if (isFirst) return;
    setErrors({});
    setCurrentIndex(currentIndex - 1);
  }

  function jump(i: number) {
    if (i <= reachedIndex) {
      setErrors({});
      setCurrentIndex(i);
    }
  }

  function onOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) router.back();
  }

  async function onSubmit() {
    // Valida step final
    if (currentStep) {
      const v = validateStep(currentStep.id, data);
      if (!v.ok) {
        setErrors(v.errors);
        return;
      }
    }
    setSubmitError(null);

    startTransition(async () => {
      if (mode === 'create') {
        // FTE/score são entregáveis da automação — o create não coleta fte_horas
        // nem os fatores de score. `prioridade_fte` (5º fator) fica indefinido e o
        // enrichment por IA preenche `fte` depois do INSERT.
        const result = await createOpportunity(data as OpportunityInput);
        if (!result.ok) {
          setSubmitError(result.error);
          return;
        }
        router.replace(`/opportunities/${result.id}`);
      } else {
        if (!opportunityId) {
          setSubmitError('ID da oportunidade ausente.');
          return;
        }
        const result = await updateOpportunity(
          opportunityId,
          data as OpportunityInput
        );
        if (!result.ok) {
          setSubmitError(result.error);
          return;
        }
        router.back();
      }
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={onOverlayClick}
      className="fixed inset-0 z-50 bg-black/55 flex"
    >
      <div className="ml-auto w-full max-w-[760px] h-full bg-white flex flex-col shadow-2xl">
        <header className="bg-wh border-b border-bdr px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 text-primary rounded-lg flex items-center justify-center text-base">
              {mode === 'edit' ? '✏️' : '➕'}
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-txt">
                {mode === 'edit' ? 'Editar Oportunidade' : 'Nova Oportunidade'}
              </h2>
              <p className="text-[12px] text-mut">
                {mode === 'edit'
                  ? 'Atualize os dados e salve.'
                  : 'Preencha os passos para cadastrar.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Fechar"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-base font-bold flex items-center justify-center"
          >
            ✕
          </button>
        </header>

        {steps.length > 1 && (
          <StepsNav
            steps={steps}
            currentIndex={currentIndex}
            reachedIndex={reachedIndex}
            onJump={jump}
          />
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {renderStep(currentStep?.id, data, patch, errors)}
        </div>

        {submitError && (
          <div className="px-5 py-2 bg-red-50 border-t border-red-200 text-[11px] text-red-800">
            {submitError}
          </div>
        )}

        <footer className="bg-slate-50 border-t border-bdr px-5 py-3 flex items-center justify-between flex-shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-3 py-1.5 text-[12px] font-semibold text-mut hover:text-txt"
          >
            Cancelar
          </button>
          <div className="flex gap-2 flex-wrap">
            {!isFirst && (
              <button
                type="button"
                onClick={prev}
                className="px-3 py-1.5 bg-wh border border-bdr hover:bg-bg text-txt text-[12px] font-semibold rounded-lg"
              >
                ← Anterior
              </button>
            )}
            {!isLast && (
              <button
                type="button"
                onClick={next}
                disabled={!data.source}
                className="px-4 py-1.5 bg-dark hover:bg-slate-700 text-white text-[12px] font-semibold rounded-lg disabled:opacity-50"
              >
                Próximo →
              </button>
            )}
            {canSubmit && (
              <button
                type="button"
                onClick={onSubmit}
                disabled={pending}
                className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white text-[13px] font-bold rounded-lg disabled:opacity-50"
              >
                {pending
                  ? 'Salvando...'
                  : mode === 'edit'
                    ? '💾 Salvar Alterações'
                    : '✓ Finalizar'}
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

function renderStep(
  id: StepId | undefined,
  data: WizardFormData,
  patch: (p: Partial<WizardFormData>) => void,
  errors: Record<string, string>
) {
  if (!id) return null;
  switch (id) {
    case 'tipo':
      return <TipoStep data={data} onChange={patch} />;
    case 'classificacao':
      return <ClassificacaoStep data={data} onChange={patch} errors={errors} />;
    case 'identificacao':
      return <IdentificacaoStep data={data} onChange={patch} errors={errors} />;
    case 'processo':
      return <ProcessoStep data={data} onChange={patch} />;
    case 'automacao':
      return <AutomacaoStep data={data} onChange={patch} />;
    case 'priorizacao':
      return <PriorizacaoStep data={data} onChange={patch} errors={errors} />;
    case 'contexto':
      return <ContextoStep data={data} onChange={patch} />;
    case 'criterios':
      return <CriteriosStep data={data} onChange={patch} errors={errors} />;
    case 'beneficios':
      return <BeneficiosStep data={data} onChange={patch} />;
    default:
      return null;
  }
}
