export type TabId =
  | 'processo'
  | 'criterios'
  | 'automacao'
  | 'beneficios'
  | 'score'
  | 'fases'
  | 'risco'
  | 'observacao'
  | 'documentos'
  | 'historico';

export type TabDef = {
  id: TabId;
  label: string;
  icon: string;
};
