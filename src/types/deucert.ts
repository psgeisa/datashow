// ============================================================
// deucert (portado) — Types de perguntas / supertópicos
// ============================================================

export type QuestionSuperTopic =
  | 'ciencia_de_dados'
  | 'machine_learning'
  | 'separacao_validacao_generalizacao'
  | 'classificacao'
  | 'clustering'
  | 'regressao'
  | 'estatistica'
  | 'algebra_linear'
  | 'programacao'
  | 'metricas_de_validacao'
  | 'data_preparation'
  | 'generative_ai'
  | 'az104'

export const CHOOSABLE_SUPERTOPICS: {
  id: QuestionSuperTopic
  name: string
  emoji: string
  description: string
}[] = [
  { id: 'ciencia_de_dados', name: 'Ciência de Dados', emoji: '🔬', description: 'Fundamentos, ciclo de vida e cultura de dados' },
  { id: 'machine_learning', name: 'Machine Learning', emoji: '🤖', description: 'Fundamentos, vieses, regularização e ensembles' },
  { id: 'separacao_validacao_generalizacao', name: 'Validação & Generalização', emoji: '✅', description: 'Treino/Teste, Cross-Validation, Leakage' },
  { id: 'classificacao', name: 'Classificação', emoji: '🎯', description: 'Logística, SVM, Decision Tree, Random Forest' },
  { id: 'clustering', name: 'Clustering', emoji: '🔮', description: 'K-Means, DBSCAN, hierárquico, GMM' },
  { id: 'regressao', name: 'Regressão', emoji: '📈', description: 'Linear, Ridge, Lasso, ElasticNet, Poisson' },
  { id: 'estatistica', name: 'Estatística', emoji: '📊', description: 'Distribuições, testes de hipótese, inferência' },
  { id: 'algebra_linear', name: 'Álgebra Linear', emoji: '🧮', description: 'Vetores, matrizes, autovalores, decomposições' },
  { id: 'programacao', name: 'Programação', emoji: '💻', description: 'Python, Pandas, NumPy, algoritmos e estruturas' },
  { id: 'metricas_de_validacao', name: 'Métricas de Validação', emoji: '📏', description: 'AUC, KS, Precision, Recall, RMSE, MAE' },
  { id: 'data_preparation', name: 'Preparação de Dados', emoji: '🧹', description: 'Missings, outliers, encoding, PCA, feature selection' },
  { id: 'generative_ai', name: 'IA Generativa', emoji: '✨', description: 'LLMs, RAG, Embeddings, Prompt Engineering, RLHF' },
  { id: 'az104', name: 'AZ-104 (Azure Admin)', emoji: '☁️', description: 'Identidades, redes, storage, VMs e monitoramento no Azure' },
]

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface PublicQuestion {
  id: string
  category: string
  super_topic: string
  topic: string | null
  difficulty: Difficulty
  type: string
  question: string
  options: string[]
  code_snippet?: string | null
  meme_context?: string | null
}

export interface AnswerResult {
  is_correct: boolean
  correct_index: number
  explanation: string | null
}

export interface TopicStat {
  topic: string
  correct: number
  total: number
  accuracy: number
}

export interface TopicStats {
  super_topic: string
  overall: { correct: number; total: number; accuracy: number }
  topics: TopicStat[]
  has_topic_data: boolean
  untracked: { correct: number; total: number } | null
}

export interface TopicAvailability {
  id: string
  count: number
}
