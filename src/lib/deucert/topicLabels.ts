// Nomes normalizados (bonitos, em português) para os slugs de `topic` que
// existem hoje no banco. Curado à mão porque abreviações/siglas (KQL, PCA,
// RAG...) não convertem bem a partir de um simples snake_case → Title Case.
const TOPIC_LABELS: Record<string, string> = {
  // algebra_linear
  autovalores: 'Autovalores',
  decomposicao: 'Decomposição',
  determinantes: 'Determinantes',
  espacos: 'Espaços Vetoriais',
  matrizes: 'Matrizes',
  multiplicacao: 'Multiplicação',
  normas: 'Normas',
  sistemas: 'Sistemas Lineares',
  vetores: 'Vetores',
  // regressao
  glm: 'GLM',
  linear: 'Regressão Linear',
  polinomial: 'Regressão Polinomial',
  regularizacao: 'Regularização',
  residuos: 'Análise de Resíduos',
  // programacao
  kql: 'KQL',
  kusto: 'Kusto',
  modelagem_relacional: 'Modelagem Relacional',
  python: 'Python',
  spark: 'Spark',
  sql: 'SQL',
  // az104
  armazenamento: 'Armazenamento',
  computacao: 'Computação',
  identidade_governanca: 'Identidade & Governança',
  monitoramento: 'Monitoramento',
  redes: 'Redes',
  // data_preparation
  dimensionality_reduction: 'Redução de Dimensionalidade',
  encoding: 'Encoding',
  feature_selection: 'Seleção de Features',
  missings: 'Valores Ausentes',
  outliers: 'Outliers',
  pca: 'PCA',
  scaling: 'Normalização de Escala',
  // metricas_de_validacao
  auc_roc: 'AUC-ROC',
  kpis: 'KPIs',
  ks_gini: 'KS & Gini',
  precision_recall: 'Precision & Recall',
  rmse_mae: 'RMSE & MAE',
  // generative_ai
  embeddings: 'Embeddings',
  llm: 'LLMs',
  prompt_engineering: 'Prompt Engineering',
  rag: 'RAG',
  rlhf: 'RLHF',
  // estatistica
  amostragem: 'Amostragem',
  correlacao: 'Correlação',
  distribuicoes: 'Distribuições',
  intervalos_confianca: 'Intervalos de Confiança',
  p_valor: 'P-valor',
  testes_de_hipotese: 'Testes de Hipótese',
}

/** Nome bonito pra um slug de topic. Cai num fallback snake_case → Title Case
 * (com acentuação básica preservada) pra qualquer slug fora da lista acima. */
export function normalizeTopicLabel(slug: string): string {
  const known = TOPIC_LABELS[slug]
  if (known) return known
  return slug
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
