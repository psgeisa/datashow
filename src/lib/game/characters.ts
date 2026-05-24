import type { Character } from '@/types/game'

export const CHARACTERS: Character[] = [
  {
    slug: 'data_scientist',
    name: 'Cientista de Dados',
    emoji: '🧪',
    color: '#00d4ff',
    role: 'Especialista em hipóteses e modelos',
    ability_name: 'Hipótese',
    ability_description: 'Elimina 2 alternativas erradas',
    ability_type: 'eliminate',
  },
  {
    slug: 'data_engineer',
    name: 'Data Engineer',
    emoji: '⚙️',
    color: '#ff6b35',
    role: 'Mestre dos pipelines de dados',
    ability_name: 'Pipeline',
    ability_description: 'Pula uma pergunta sem penalidade',
    ability_type: 'skip',
  },
  {
    slug: 'bi_analyst',
    name: 'Analista BI',
    emoji: '📊',
    color: '#a855f7',
    role: 'Insights e dashboards estratégicos',
    ability_name: 'Dashboard',
    ability_description: 'Vê quantos jogadores escolheram cada opção',
    ability_type: 'peek',
  },
  {
    slug: 'ml_engineer',
    name: 'ML Engineer',
    emoji: '🤖',
    color: '#22c55e',
    role: 'Modelos, algoritmos e prod',
    ability_name: 'Double Down',
    ability_description: 'Dobra os pontos da próxima resposta certa',
    ability_type: 'double',
  },
]

export function getCharacter(slug: string | null | undefined): Character | undefined {
  return CHARACTERS.find(c => c.slug === slug)
}
