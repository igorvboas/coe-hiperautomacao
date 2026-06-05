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
import { PerfilTab } from './tabs/PerfilTab';
import { DesafiosTab } from './tabs/DesafiosTab';
import { CoeTab } from './tabs/CoeTab';
import { ProcessoTab } from './tabs/ProcessoTab';
import { CriteriosTab } from './tabs/CriteriosTab';
import { BeneficiosTab } from './tabs/BeneficiosTab';
import { ObservacaoTab } from './tabs/ObservacaoTab';
import { RiscoTab } from './tabs/RiscoTab';

const TABS_PERSONA: TabDef[] = [
  { id: 'perfil', label: 'Perfil', icon: '👤' },
  { id: 'desafios', label: 'Desafios', icon: '⚠️' },
  { id: 'automacao', label: 'Automação', icon: '🤖' },
  { id: 'coe', label: 'CoE', icon: '🎯' },
  { id: 'observacao', label: 'Observação', icon: '📝' },
  { id: 'risco', label: 'Risco', icon: '⚡' },
  { id: 'fases', label: 'Fases', icon: '📅' },
  { id: 'score', label: 'Score', icon: '📊' },
];

const TABS_FORMULARIO: TabDef[] = [
  { id: 'processo', label: 'Processo', icon: '📋' },
  { id: 'criterios', label: 'Critérios Técnicos', icon: '✅' },
  { id: 'beneficios', label: 'Benefícios', icon: '📈' },
  { id: 'automacao', label: 'Automação', icon: '🤖' },
  { id: 'observacao', label: 'Observação', icon: '📝' },
  { id: 'risco', label: 'Risco', icon: '⚡' },
  { id: 'fases', label: 'Fases', icon: '📅' },
  { id: 'score', label: 'Score', icon: '📊' },
];

type Props = {
  opportunity: Opportunity;
  phases: OpportunityPhase[];
  risks: OpportunityRisk[];
};

export function OpportunityDetail({ opportunity, phases, risks }: Props) {
  const isPersona = opportunity.source === 'persona';
  const tabs = isPersona ? TABS_PERSONA : TABS_FORMULARIO;
  const defaultTab: TabId = isPersona ? 'perfil' : 'processo';

  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);

  return (
    <>
      <ModalHeader opportunity={opportunity} />
      <TabsNav tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
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
    // tabs comuns (Plan 04-01)
    case 'automacao':
      return <AutomacaoTab opportunity={opp} />;
    case 'fases':
      return <FasesTab opportunity={opp} phases={phases} />;
    case 'score':
      return <ScoreTab opportunity={opp} />;

    // tabs persona (Plan 04-02)
    case 'perfil':
      return <PerfilTab opportunity={opp} />;
    case 'desafios':
      return <DesafiosTab opportunity={opp} />;
    case 'coe':
      return <CoeTab opportunity={opp} />;

    // tabs formulário (Plan 04-03)
    case 'processo':
      return <ProcessoTab opportunity={opp} />;
    case 'criterios':
      return <CriteriosTab opportunity={opp} />;
    case 'beneficios':
      return <BeneficiosTab opportunity={opp} />;

    // tabs comuns adicionais — Observação + Risco
    case 'observacao':
      return <ObservacaoTab opportunity={opp} />;
    case 'risco':
      return <RiscoTab opportunity={opp} risks={risks} />;

    default:
      return null;
  }
}

