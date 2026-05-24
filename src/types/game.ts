// ============================================================
// DATASHOW — Types centrais
// ============================================================

export type GameStatus = 'waiting' | 'playing' | 'finished'
export type CharacterSlug = 'data_scientist' | 'data_engineer' | 'bi_analyst' | 'ml_engineer'
export type QuestionCategory = 'sql' | 'python' | 'ml' | 'stats' | 'powerbi' | 'azure' | 'data_eng' | 'databricks' | 'meme'
export type QuestionType = 'multiple_choice' | 'code' | 'debug' | 'chart' | 'meme'
export type AbilityType = 'eliminate' | 'skip' | 'peek' | 'double'
export type Difficulty = 'easy' | 'medium' | 'hard'

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
}

// ── Pergunta (completa, só servidor) ────────────────────────
export interface Question {
  id: string
  category: QuestionCategory
  difficulty: Difficulty
  type: QuestionType
  question: string
  options: string[]
  correct_index: number
  explanation?: string
  code_snippet?: string
  meme_context?: string
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
  }[]
}

// ── Eventos Broadcast do Supabase ───────────────────────────
export type BroadcastPayload =
  | { type: 'QUESTION_START';  data: { round: number; question: QuestionPublic; started_at: string; timer_seconds: number } }
  | { type: 'ROUND_REVEAL';    data: RoundResult }
  | { type: 'GAME_FINISHED';   data: { final_scores: Player[] } }
  | { type: 'PLAYER_ANSWERED'; data: { player_id: string; nickname: string } }
  | { type: 'ABILITY_USED';    data: { player_id: string; ability: AbilityType; eliminated?: number[] } }

// ── Estado local do jogo (client-side) ──────────────────────
export type GamePhase = 'lobby' | 'countdown' | 'question' | 'reveal' | 'leaderboard' | 'finished'

export interface GameState {
  room: Room | null
  players: Player[]
  currentQuestion: QuestionPublic | null
  myPlayer: Player | null
  phase: GamePhase
  timeLeft: number
  roundResult: RoundResult | null
  answeredThisRound: boolean
  playersAnswered: string[]        // IDs dos jogadores que já responderam
  eliminatedOptions: number[]      // habilidade data_scientist
  peekData: Record<number, number> // habilidade bi_analyst
  doubleActive: boolean            // habilidade ml_engineer
}

// ── Resultado de pontuação ───────────────────────────────────
export interface ScoreResult {
  points: number
  new_score: number
  new_combo: number
  new_multiplier: number
  breakdown: string[]
}
