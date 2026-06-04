'use client';

import type { WizardFormData } from '../state';
import { SelectField } from './fields';
import { ScorePreview } from '../ScorePreview';

type Props = {
  data: WizardFormData;
  onChange: (patch: Partial<WizardFormData>) => void;
  errors: Record<string, string>;
};

// Pesos alinhados à fórmula de 5 fatores (lib/opportunities/score.ts / _giba:483-490).
const EFFORT_OPTIONS = [
  { value: 'baixo', label: 'Baixo (+8)' },
  { value: 'medio', label: 'Médio (+14)' },
  { value: 'alto', label: 'Alto (+20)' },
];

// Complexidade é INVERTIDA: menos complexo pontua mais.
const COMPLEXITY_OPTIONS = [
  { value: 'baixo', label: 'Baixo (+20)' },
  { value: 'medio', label: 'Médio (+13)' },
  { value: 'alto', label: 'Alto (+6)' },
];

// `tempo` agora é FREQUÊNCIA (0011), não duração.
const TIME_OPTIONS = [
  { value: 'diario', label: 'Diário (+20)' },
  { value: 'semanal', label: 'Semanal (+16)' },
  { value: 'quinzenal', label: 'Quinzenal (+12)' },
  { value: 'mensal', label: 'Mensal (+8)' },
  { value: 'anual', label: 'Anual (+2)' },
];

export function PriorizacaoStep({ data, onChange, errors }: Props) {
  return (
    <div className="px-2 py-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <SelectField
          label="Esforço de Implementação"
          required
          value={data.esforco}
          onChange={(v) => onChange({ esforco: v as 'baixo' | 'medio' | 'alto' })}
          options={EFFORT_OPTIONS}
          error={errors.esforco}
        />
        <SelectField
          label="Complexidade Técnica"
          required
          value={data.complexidade}
          onChange={(v) =>
            onChange({ complexidade: v as 'baixo' | 'medio' | 'alto' })
          }
          options={COMPLEXITY_OPTIONS}
          error={errors.complexidade}
        />
        <SelectField
          label="Tempo Estimado"
          required
          value={data.tempo}
          onChange={(v) =>
            onChange({
              tempo: v as
                | 'diario'
                | 'semanal'
                | 'quinzenal'
                | 'mensal'
                | 'anual',
            })
          }
          options={TIME_OPTIONS}
          error={errors.tempo}
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
                  onClick={() => onChange({ objetivo: n })}
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
            <div className="text-[11px] text-red-700 mt-1">{errors.objetivo}</div>
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
  );
}
