import type { Opportunity } from '@/lib/opportunities/types';

type Props = { opportunity: Opportunity };

// D-10: a aba Observação acomoda DOIS campos legados de texto livre — `observacao`
// e `risco` (nota livre da 0009, ≠ tabela estruturada `opportunity_risks`, que vive
// na aba Risco/Phase 12). Cada bloco mostra seu valor ou seu próprio empty state pt-BR.
export function ObservacaoTab({ opportunity: o }: Props) {
  return (
    <div className="px-5 py-4 space-y-5">
      <FreeTextBlock label="Observação" value={o.observacao} />
      <FreeTextBlock
        label="Risco (nota livre)"
        value={o.risco}
        hint="Nota livre legada — o registro estruturado de riscos fica na aba Risco."
      />
    </div>
  );
}

function FreeTextBlock({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | null;
  hint?: string;
}) {
  const text = (value ?? '').trim();
  const isEmpty = text.length === 0;

  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-mut mb-2">
        {label}
      </div>
      {isEmpty ? (
        <p className="text-[12px] text-mut italic">Nada registrado.</p>
      ) : (
        <div className="text-[12px] leading-relaxed text-txt whitespace-pre-wrap">
          {text}
        </div>
      )}
      {hint && <p className="text-[10px] text-mut mt-1.5">{hint}</p>}
    </div>
  );
}
