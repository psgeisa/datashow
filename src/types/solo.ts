// ============================================================
// Treino Solo — Types
// ============================================================

export interface SoloQuestion {
  id: string
  category: string
  super_topic: string
  topic: string | null
  difficulty: 'easy' | 'medium' | 'hard'
  type: string
  question: string
  options: string[]
  code_snippet?: string | null
  meme_context?: string | null
  image_urls?: string[] | null
}

export interface SoloAnswerResult {
  is_correct: boolean
  correct_index: number
  explanation: string | null
}

export interface SoloTopicStat {
  topic: string
  correct: number
  total: number
  accuracy: number
}

export interface SoloStats {
  super_topic: string
  overall: { correct: number; total: number; accuracy: number }
  topics: SoloTopicStat[]
  has_topic_data: boolean
  untracked: { correct: number; total: number } | null
}

export interface SoloTopicAvailability {
  id: string
  count: number
}
