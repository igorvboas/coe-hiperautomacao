export type TabId =
  | 'perfil'
  | 'desafios'
  | 'coe'
  | 'processo'
  | 'criterios'
  | 'beneficios'
  | 'automacao'
  | 'observacao'
  | 'risco'
  | 'fases'
  | 'score';

export type TabDef = {
  id: TabId;
  label: string;
  icon: string;
};
