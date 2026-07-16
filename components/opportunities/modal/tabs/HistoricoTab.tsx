import type { OpportunityHistoryEntry } from '@/lib/opportunities/types';

type Props = {
  history: OpportunityHistoryEntry[];
};

function fmtDataHora(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

/**
 * Aba "Histórico" (v0.3) — auditoria 100% automática e somente leitura. Cada
 * linha é gravada por `updateOpportunity` (lib/opportunities/actions.ts,
 * `diffOpportunity`) — não existe ação de usuário que crie/edite/apague
 * registros aqui (opportunity_history não tem policy de update/delete, 0018).
 */
export function HistoricoTab({ history }: Props) {
  return (
    <div className="px-5 py-4">
      <div className="text-[11px] text-mut mb-3">
        🔒 Registro de auditoria — automático e somente leitura ({history.length}{' '}
        alteração(ões)).
      </div>
      {history.length === 0 ? (
        <p className="text-[12px] text-mut italic">Nenhuma alteração registrada.</p>
      ) : (
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-mut border-b border-bdr">
              <th className="pb-2 pr-2 whitespace-nowrap">Data/Hora</th>
              <th className="pb-2">Alteração</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h) => (
              <tr key={h.id} className="border-b border-bdr last:border-b-0 align-top">
                <td className="py-2 pr-2 text-[11px] text-mut whitespace-nowrap">
                  {fmtDataHora(h.created_at)}
                </td>
                <td className="py-2">
                  <div>{h.resumo}</div>
                  {h.comentario && (
                    <div className="text-[11px] text-mut mt-0.5">{h.comentario}</div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
