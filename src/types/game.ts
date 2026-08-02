// ============================================================
// DATASHOW — Types centrais
// ============================================================

export type GameStatus = 'waiting' | 'playing' | 'finished'
export type RoomGamePhase = 'waiting' | 'choosing' | 'playing' | 'phase_end'

export interface AvatarConfig {
  skinTone:   string
  hairStyle:  'bald' | 'short' | 'long' | 'curly'
  hairColor:  string
  shirtColor: string
  pantsColor: string
}
export type CharacterSlug = 'data_scientist' | 'data_engineer' | 'bi_analyst' | 'ml_engineer'
export type QuestionCategory = 'sql' | 'python' | 'ml' | 'stats' | 'powerbi' | 'azure' | 'data_eng' | 'databricks' | 'meme'
export type QuestionType = 'multiple_choice' | 'code' | 'debug' | 'chart' | 'meme'
export type AbilityType = 'eliminate' | 'skip' | 'peek' | 'double'
export type Difficulty = 'easy' | 'medium' | 'hard'

// ── Supertópicos ────────────────────────────────────────────
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
  color: string
  description: string
}[] = [
  { id: 'ciencia_de_dados',              name: 'Ciência de Dados',          emoji: '🔬', color: '#3b82f6', description: 'Fundamentos, ciclo de vida e cultura de dados' },
  { id: 'machine_learning',              name: 'Machine Learning',           emoji: '🤖', color: '#a855f7', description: 'Fundamentos, vieses, regularização e ensembles' },
  { id: 'separacao_validacao_generalizacao', name: 'Validação & Generalização', emoji: '✅', color: '#00d4ff', description: 'Treino/Teste, Cross-Validation, Leakage' },
  { id: 'classificacao',                 name: 'Classificação',              emoji: '🎯', color: '#f97316', description: 'Logística, SVM, Decision Tree, Random Forest' },
  { id: 'clustering',                    name: 'Clustering',                 emoji: '🔮', color: '#ec4899', description: 'K-Means, DBSCAN, hierárquico, GMM' },
  { id: 'regressao',                     name: 'Regressão',                  emoji: '📈', color: '#22c55e', description: 'Linear, Ridge, Lasso, ElasticNet, Poisson' },
  { id: 'estatistica',                   name: 'Estatística',                emoji: '📊', color: '#f59e0b', description: 'Distribuições, testes de hipótese, inferência' },
  { id: 'algebra_linear',                name: 'Álgebra Linear',             emoji: '🧮', color: '#6366f1', description: 'Vetores, matrizes, autovalores, decomposições' },
  { id: 'programacao',                   name: 'Programação',                emoji: '💻', color: '#64748b', description: 'Python, Pandas, NumPy, algoritmos e estruturas' },
  { id: 'metricas_de_validacao',         name: 'Métricas de Validação',      emoji: '📏', color: '#ef4444', description: 'AUC, KS, Precision, Recall, RMSE, MAE' },
  { id: 'data_preparation',              name: 'Preparação de Dados',        emoji: '🧹', color: '#14b8a6', description: 'Missings, outliers, encoding, PCA, feature selection' },
  { id: 'generative_ai',                 name: 'IA Generativa',              emoji: '✨', color: '#d946ef', description: 'LLMs, RAG, Embeddings, Prompt Engineering, RLHF' },
  { id: 'az104',                         name: 'AZ-104 (Azure Admin)',       emoji: '☁️', color: '#0078d4', description: 'Identidades, redes, storage, VMs e monitoramento no Azure' },
]

// ── Personagem ──────────────────────────────────────────────
export interface Character {
  slug: CharacterSlug
  name: string
  emoji: string
  color: string
  role: string
  ability_name: string
  ability_description: string
  ability_type: AbilityType
}

// ── Sala ────────────────────────────────────────────────────
export interface Room {
  id: string
  code: string
  host_session_id: string
  status: GameStatus
  current_round: number
  total_rounds: number
  timer_seconds: number
  round_started_at: string | null
  created_at: string
  current_phase: number
  total_phases: number
  game_phase: RoomGamePhase
}

// ── Jogador ─────────────────────────────────────────────────
export interface Player {
  id: string
  room_id: string
  session_id: string
  nickname: string
  character_slug: CharacterSlug | null
  score: number
  combo: number
  multiplier: number
  ability_uses: number
  status: 'active' | 'disconnected'
  joined_at: string
  avatar_config: AvatarConfig | null
}

// ── Pergunta (completa, só servidor) ────────────────────────
export interface Question {
  id: string
  category: string
  super_topic?: QuestionSuperTopic
  topic?: string
  difficulty: Difficulty
  type: QuestionType
  question: string
  options: string[]
  correct_index: number
  explanation?: string
  code_snippet?: string
  meme_context?: string
  image_urls?: string[] | null
  is_ai_generated: boolean
  times_used: number
  created_at: string
}

// Versão pública enviada ao client (sem correct_index)
export type QuestionPublic = Omit<Question, 'correct_index' | 'times_used' | 'created_at' | 'is_ai_generated'>

// ── Resposta ────────────────────────────────────────────────
export interface Answer {
  id: string
  room_id: string
  player_id: string
  round_number: number
  selected_index: number | null
  is_correct: boolean | null
  time_taken_ms: number | null
  points_earned: number
  combo_at_time: number
  ability_used: string | null
  answered_at: string
}

// ── Resultado de rodada ─────────────────────────────────────
export interface RoundResult {
  round_number: number
  correct_index: number
  explanation: string
  player_results: {
    player_id: string
    nickname: string
    character_slug: CharacterSlug | null
    is_correct: boolean
    points_earned: number
    new_score: number
    combo: number
    multiplier: number
    selected_index: number | null
    wrong_streak: number   // consecutive wrong answers (0 = just reset)
  }[]
}

// ── Resultado de fase ───────────────────────────────────────
export interface PhaseScore {
  player_id: string
  nickname: string
  phase_score: number
  total_score: number
}

// ── Eventos Broadcast do Supabase ───────────────────────────
export type BroadcastPayload =
  | { type: 'QUESTION_START';  data: { round: number; question: QuestionPublic; started_at: string; timer_seconds: number } }
  | { type: 'ROUND_REVEAL';    data: RoundResult }
  | { type: 'GAME_FINISHED';   data: { final_scores: Player[] } }
  | { type: 'PLAYER_ANSWERED'; data: { player_id: string; nickname: string; reaction_type?: string } }
  | { type: 'ABILITY_USED';    data: { player_id: string; ability: AbilityType; eliminated?: number[] } }
  | { type: 'CHOOSING_CATEGORY'; data: { phase: number; chooser_player_id: string; chooser_nickname: string; options: QuestionSuperTopic[] } }
  | { type: 'CATEGORY_CHOSEN'; data: { phase: number; super_topic: QuestionSuperTopic; category_name: string } }
  | { type: 'PHASE_END';       data: { completed_phase: number; player_scores: PhaseScore[] } }
  | { type: 'GAME_PAUSED';     data: { paused_by_id: string; paused_by_nickname: string } }
  | { type: 'GAME_RESUMED';    data: { resumed_by_id: string } }

// ── Estado local do jogo (client-side) ──────────────────────
export type GamePhase = 'lobby' | 'choosing_category' | 'question' | 'reveal' | 'phase_end' | 'finished'

export interface GameState {
  room: Room | null
  players: Player[]
  currentQuestion: QuestionPublic | null
  myPlayer: Player | null
  phase: GamePhase
  timeLeft: number
  roundResult: RoundResult | null
  answeredThisRound: boolean
  playersAnswered: string[]
  eliminatedOptions: number[]
  peekData: Record<number, number>
  doubleActive: boolean
  // Fase
  currentFase: number
  chooserPlayerId: string
  chooserOptions: QuestionSuperTopic[]
  phaseScores: PhaseScore[]
  completedPhase: number
  pendingPhaseSetup: { phase: number; super_topic: QuestionSuperTopic; category_name: string } | null
  // Pausa
  isPaused: boolean
  pausedById: string
  pausedByNickname: string
  // Reações de resposta (pose aleatória quando o player aperta o botão)
  playerAnswerReactions: Record<string, string>
}

// ── Resultado de pontuação ───────────────────────────────────
export interface ScoreResult {
  points: number
  new_score: number
  new_combo: number
  new_multiplier: number
  breakdown: string[]
}

// ── Categorias jogáveis (legado) ─────────────────────────────
export const CHOOSABLE_CATEGORIES: { id: QuestionCategory; name: string; emoji: string; color: string; min_questions: number }[] = [
  { id: 'ml',       name: 'Machine Learning & DS',  emoji: '🤖', color: '#a855f7', min_questions: 10 },
  { id: 'python',   name: 'Python & IA Generativa', emoji: '🐍', color: '#3b82f6', min_questions: 10 },
  { id: 'sql',      name: 'SQL & Banco de Dados',    emoji: '🗃️', color: '#00d4ff', min_questions: 10 },
  { id: 'stats',    name: 'Estatística',             emoji: '📊', color: '#f59e0b', min_questions: 10 },
  { id: 'data_eng', name: 'Engenharia de Dados',     emoji: '⚙️', color: '#10b981', min_questions: 10 },
]
