'use client';

import type { WizardFormData } from '../state';
import { TextField, SelectField } from './fields';

type Props = {
  data: WizardFormData;
  onChange: (patch: Partial<WizardFormData>) => void;
};

type Frequency = 'diario' | 'semanal' | 'quinzenal' | 'mensal' | 'anual';

// Frequência é a FONTE ÚNICA do fator de score `tempo` (diario..anual, 0011) —
// não pedir frequência de novo na Priorização. Pesos visíveis nos rótulos
// (alinhados a lib/opportunities/score.ts / _giba:483-490).
const FREQUENCY_OPTIONS = [
  { value: 'diario', label: 'Diário (+20)' },
  { value: 'semanal', label: 'Semanal (+16)' },
  { value: 'quinzenal', label: 'Quinzenal (+12)' },
  { value: 'mensal', label: 'Mensal (+8)' },
  { value: 'anual', label: 'Anual (+2)' },
];

// Ferramenta Sugerida (D-07), default n8n. Domínio = toolEnum.
const TOOL_OPTIONS = [
  { value: 'rpa', label: 'RPA' },
  { value: 'n8n', label: 'n8n' },
  { value: 'ambos', label: 'Ambos' },
];

// Rótulo legível espelhado em `frequencia` (texto) p/ compat de display — o
// fator de score é `data.tempo`.
const FREQUENCY_LABEL: Record<string, string> = {
  diario: 'Diário',
  semanal: 'Semanal',
  quinzenal: 'Quinzenal',
  mensal: 'Mensal',
  anual: 'Anual',
};

export function ProcessoStep({ data, onChange }: Props) {
  const isFormulario = data.source === 'formulario';

  function patchFormularioExtras(patch: Record<string, string>) {
    onChange({
      formulario_extras: { ...(data.formulario_extras ?? {}), ...patch },
    });
  }

  function patchPersonaExtras(patch: Record<string, string>) {
    onChange({
      persona_extras: { ...(data.persona_extras ?? {}), ...patch },
    });
  }

  return (
    <div className="px-2 py-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <SelectField
          label="Frequência"
          value={data.tempo}
          onChange={(v) =>
            // frequência é a fonte única do fator `tempo`; espelha rótulo em `frequencia` p/ display
            onChange({ tempo: v as Frequency, frequencia: FREQUENCY_LABEL[v] ?? '' })
          }
          options={FREQUENCY_OPTIONS}
        />
        <SelectField
          label="Ferramenta Sugerida"
          value={data.ferramenta ?? 'n8n'}
          onChange={(v) =>
            onChange({ ferramenta: v as 'rpa' | 'n8n' | 'ambos' })
          }
          options={TOOL_OPTIONS}
        />
        <TextField
          label="Volume Médio"
          value={data.volume_medio ?? ''}
          onChange={(v) => onChange({ volume_medio: v })}
          placeholder="Ex: 1 a 3 Vezes"
        />
        <TextField
          label="Tempo de Execução"
          value={data.tempo_execucao ?? ''}
          onChange={(v) => onChange({ tempo_execucao: v })}
          placeholder="Ex: 1 a 2 horas"
        />
        <TextField
          label="Pessoas Envolvidas"
          value={data.num_pessoas ?? ''}
          onChange={(v) => onChange({ num_pessoas: v })}
          placeholder="Ex: De 2 a 4 pessoas"
        />

        {isFormulario && (
          <>
            <TextField
              label="Tipo do Processo"
              value={data.formulario_extras?.tipo_processo ?? ''}
              onChange={(v) => patchFormularioExtras({ tipo_processo: v })}
              placeholder="Ex: Financeiro; Compliance"
            />
            <TextField
              label="Sistemas Utilizados"
              value={data.formulario_extras?.sistemas ?? ''}
              onChange={(v) => patchFormularioExtras({ sistemas: v })}
              placeholder="Ex: Protheus, Fluig, E-mail"
            />
          </>
        )}

        {!isFormulario && (
          <>
            <TextField
              label="Cargo do Solicitante"
              value={data.persona_extras?.cargo ?? ''}
              onChange={(v) => patchPersonaExtras({ cargo: v })}
            />
            <TextField
              label="Tempo na Função"
              value={data.persona_extras?.tempo_funcao ?? ''}
              onChange={(v) => patchPersonaExtras({ tempo_funcao: v })}
              placeholder="Ex: 5 anos"
            />
            <TextField
              label="Localidade"
              value={data.persona_extras?.local ?? ''}
              onChange={(v) => patchPersonaExtras({ local: v })}
              placeholder="Ex: Brasília/DF"
            />
            <TextField
              label="Sistemas que utiliza"
              value={data.persona_extras?.sistemas ?? ''}
              onChange={(v) => patchPersonaExtras({ sistemas: v })}
              placeholder="Ex: Protheus, Teams, Excel"
            />
          </>
        )}
      </div>
    </div>
  );
}
