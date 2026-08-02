export interface ExamConfig {
  key: string
  super_topic: string
  name: string
  official: boolean
  questionCount: number
  timeLimitMinutes: number
  /** 0-1000 pros oficiais (aproxima o formato Microsoft), 0-100 pros genéricos */
  passingScore: number
  disclaimer?: string
}

/** Certificações com prova oficial de verdade por trás. Hoje só AZ-104. */
export const OFFICIAL_EXAMS: ExamConfig[] = [
  {
    key: 'az104',
    super_topic: 'az104',
    name: 'AZ-104: Microsoft Azure Administrator',
    official: true,
    questionCount: 50,
    timeLimitMinutes: 120,
    passingScore: 700,
    disclaimer:
      'Simulação baseada em parâmetros públicos do exame oficial da Microsoft (~40-60 questões, 120 min, nota de corte 700/1000). A pontuação exibida é uma aproximação — a Microsoft não publica o algoritmo exato de correção.',
  },
]

const MIN_PER_QUESTION_MINUTES = 1.5
const GENERIC_PASSING_SCORE = 70

/** Monta a config de um simulado genérico (sem certificação oficial) a partir
 * da quantidade de questões escolhida pelo usuário. */
export function buildGenericExamConfig(superTopic: string, name: string, questionCount: number): ExamConfig {
  return {
    key: superTopic,
    super_topic: superTopic,
    name,
    official: false,
    questionCount,
    timeLimitMinutes: Math.ceil(questionCount * MIN_PER_QUESTION_MINUTES),
    passingScore: GENERIC_PASSING_SCORE,
    disclaimer: 'Simulado genérico — não existe uma certificação oficial associada a este tópico. Parâmetros (quantidade de questões e tempo) definidos pelo app, não por uma prova real.',
  }
}

export const GENERIC_QUESTION_COUNT_OPTIONS = [20, 40, 60] as const

export function findOfficialExam(key: string): ExamConfig | undefined {
  return OFFICIAL_EXAMS.find(e => e.key === key)
}
