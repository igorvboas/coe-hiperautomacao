'use client';

import { useState } from 'react';
import type {
  Opportunity,
  OpportunityPhase,
  OpportunityRisk,
} from '@/lib/opportunities/types';
import { ModalHeader } from './Header';
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

type Props = {
  opportunity: Opportunity;
  phases: OpportunityPhase[];
  risks: OpportunityRisk[];
};

export function OpportunityDetail({ opportunity, phases, risks }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('processo');

  return (
    <>
      <ModalHeader opportunity={opportunity} />
      <TabsNav tabs={MODAL_TABS} activeTab={activeTab} onChange={setActiveTab} />
      <div className="max-h-[60vh] overflow-y-auto">
        {renderTab(activeTab, opportunity, phases, risks)}
      </div>
    </>
  );
}

function renderTab(
  tab: TabId,
  opp: Opportunity,
  phases: OpportunityPhase[],
  risks: OpportunityRisk[],
) {
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
    case 'fases':
      return <FasesTab opportunity={opp} phases={phases} />;
    case 'risco':
      return <RiscoTab opportunity={opp} risks={risks} />;
    case 'observacao':
      return <ObservacaoTab opportunity={opp} />;

    default:
      return null;
  }
}

