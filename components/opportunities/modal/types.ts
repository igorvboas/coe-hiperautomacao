export type TabId =
  | 'perfil'
  | 'desafios'
  | 'coe'
  | 'processo'
  | 'criterios'
  | 'beneficios'
  | 'automacao'
  | 'fases'
  | 'score';

export type TabDef = {
  id: TabId;
  label: string;
  icon: string;
};
