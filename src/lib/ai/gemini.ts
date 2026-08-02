import { GoogleGenerativeAI } from '@google/generative-ai'
import type { QuestionCategory } from '@/types/game'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

function buildPrompt(category: QuestionCategory, count: number): string {
  const categoryContext: Record<QuestionCategory, string> = {
    sql: 'SQL: queries, JOINs, window functions, índices, performance, edge cases engraçados, CTEs, subqueries',
    python: 'Python: output de código, pandas, numpy, bugs clássicos (mutable defaults, closures), list comprehensions, generators',
    ml: 'Machine Learning: métricas, overfitting, bias-variance, feature engineering, armadilhas clássicas, modelos',
    stats: 'Estatística: p-valor mal interpretado, distribuições, correlação vs causalidade, vieses, intervalos de confiança',
    powerbi: 'Power BI: DAX, medidas vs colunas calculadas, relacionamentos, contexto de filtro, melhores práticas',
    azure: 'Azure Data: ADF, Synapse, Data Lake, Blob Storage, pricing surpresa (humor), arquitetura',
    databricks: 'Databricks: Spark, Delta Lake, clusters, notebooks, MLflow, Unity Catalog',
    data_eng: 'Engenharia de Dados: ETL vs ELT, orquestração (Airflow/Prefect), streaming, modelagem dimensional, qualidade de dados',
    meme: 'Situações cotidianas engraçadas e dolorosamente reais do mundo de dados e tecnologia',
  }

  return `Você é um game designer criando perguntas para um quiz show divertido e caótico sobre tecnologia de dados chamado KnowHow.

CONTEXTO DA CATEGORIA: ${categoryContext[category]}

REGRAS OBRIGATÓRIAS:
- Perguntas técnicas MAS com personalidade e humor
- Evite tom de prova/concurso — prefira situações do mundo real, armadilhas clássicas, casos absurdos
- Use linguagem direta, emojis ocasionais, referências à cultura de dados
- Misture dificuldades: algumas fáceis para engajar, algumas difíceis para filtrar
- Para categoria "meme": situações engraçadas e reconhecíveis por quem trabalha com dados
- Para "code": inclua snippets curtos e concisos (máximo 8 linhas)
- Alternativas erradas devem ser plausíveis (não óbvias demais)

Gere EXATAMENTE ${count} perguntas em JSON puro (sem markdown, sem \`\`\`):

[
  {
    "question": "texto da pergunta (pode ter emoji)",
    "options": ["opção A", "opção B", "opção C", "opção D"],
    "correct_index": 0,
    "explanation": "explicação divertida de por que esta é a resposta",
    "code_snippet": null,
    "meme_context": null,
    "difficulty": "easy",
    "type": "multiple_choice"
  }
]

Valores válidos:
- difficulty: "easy" | "medium" | "hard"
- type: "multiple_choice" | "code" | "debug" | "meme"
- code_snippet: string com código ou null
- meme_context: descrição engraçada do cenário ou null`
}

export async function generateQuestions(
  category: QuestionCategory,
  count: number = 5
): Promise<any[]> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.9,       // mais criativo
        maxOutputTokens: 4096,
      },
    })

    const result = await model.generateContent(buildPrompt(category, count))
    const text = result.response.text()

    // Extrair JSON da resposta (remove possível markdown)
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.error('Gemini: no JSON found in response', text.slice(0, 200))
      return []
    }

    const parsed = JSON.parse(jsonMatch[0])
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('Gemini generation error:', error)
    return []
  }
}
