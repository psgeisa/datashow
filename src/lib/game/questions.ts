import type { QuestionCategory } from '@/types/game'

// Banco local de perguntas — fallback quando IA não disponível.
// Adicionar mais perguntas antes de produção (meta: 15+ por categoria).
export const LOCAL_QUESTIONS: {
  category: QuestionCategory
  difficulty: 'easy' | 'medium' | 'hard'
  type: 'multiple_choice' | 'code' | 'debug' | 'chart' | 'meme'
  question: string
  options: string[]
  correct_index: number
  explanation: string
  code_snippet?: string
  meme_context?: string
}[] = [
  // ─────────────────── SQL ───────────────────────────────────
  {
    category: 'sql', difficulty: 'easy', type: 'multiple_choice',
    question: 'Qual cláusula filtra grupos depois de um GROUP BY?',
    options: ['WHERE', 'HAVING', 'FILTER BY', 'GROUP FILTER'],
    correct_index: 1,
    explanation: 'HAVING filtra após agrupamento. WHERE filtra linhas antes do GROUP BY.',
  },
  {
    category: 'sql', difficulty: 'medium', type: 'code',
    question: 'Qual é o resultado desta query?',
    code_snippet: `SELECT department, AVG(salary) as avg_sal
FROM employees
GROUP BY department
HAVING AVG(salary) > 5000
ORDER BY avg_sal DESC
LIMIT 3;`,
    options: [
      'Os 3 departamentos com maior média salarial, apenas os acima de 5000',
      'Os 3 funcionários mais bem pagos',
      'Todos os departamentos com salário > 5000',
      'Erro: não pode usar alias no HAVING',
    ],
    correct_index: 0,
    explanation: 'HAVING filtra departamentos cuja média é > 5000, ORDER BY ordena e LIMIT pega os top 3.',
  },
  {
    category: 'sql', difficulty: 'hard', type: 'multiple_choice',
    question: 'Window function: ROW_NUMBER() vs RANK() vs DENSE_RANK(). Com empate em 2º lugar, qual retorna [1,2,2,4]?',
    options: ['ROW_NUMBER()', 'RANK()', 'DENSE_RANK()', 'Nenhuma das três'],
    correct_index: 1,
    explanation: 'RANK() pula números após empate (1,2,2,4). DENSE_RANK() não pula (1,2,2,3). ROW_NUMBER() nunca empata.',
  },
  {
    category: 'sql', difficulty: 'easy', type: 'multiple_choice',
    question: 'Diferença entre INNER JOIN e LEFT JOIN:',
    options: [
      'Não há diferença, são sinônimos',
      'INNER JOIN retorna só registros com match nas duas tabelas; LEFT JOIN retorna todos da esquerda',
      'LEFT JOIN é mais rápido que INNER JOIN',
      'INNER JOIN retorna todos os registros de ambas as tabelas',
    ],
    correct_index: 1,
    explanation: 'INNER JOIN = intersecção. LEFT JOIN = todos da tabela esquerda + match direita (NULL onde não há match).',
  },
  {
    category: 'sql', difficulty: 'medium', type: 'debug',
    question: 'O que está errado nesta query?',
    code_snippet: `SELECT customer_id, SUM(amount)
FROM orders
WHERE SUM(amount) > 1000
GROUP BY customer_id;`,
    options: [
      'Falta ORDER BY',
      'WHERE não pode usar funções de agregação — usar HAVING',
      'SUM não funciona com amount',
      'Não há erro, a query está correta',
    ],
    correct_index: 1,
    explanation: 'Funções de agregação (SUM, COUNT, AVG) não podem ser usadas no WHERE. Use HAVING após GROUP BY.',
  },

  // ─────────────────── PYTHON ────────────────────────────────
  {
    category: 'python', difficulty: 'easy', type: 'code',
    question: 'Qual é o output?',
    code_snippet: `x = [1, 2, 3, 4, 5]
print(x[1:4])`,
    options: ['[1, 2, 3, 4]', '[2, 3, 4]', '[1, 2, 3]', '[2, 3, 4, 5]'],
    correct_index: 1,
    explanation: 'Slicing [1:4] pega do índice 1 (inclusivo) ao 4 (exclusivo): elementos 2, 3, 4.',
  },
  {
    category: 'python', difficulty: 'medium', type: 'code',
    question: 'O que essa list comprehension retorna?',
    code_snippet: `result = [x**2 for x in range(6) if x % 2 == 0]
print(result)`,
    options: ['[0, 4, 16]', '[0, 1, 4, 9, 16, 25]', '[4, 16]', '[0, 4, 16, 36]'],
    correct_index: 3,
    explanation: 'range(6) = 0..5. Pares: 0,2,4. Quadrados: 0**2=0, 2**2=4, 4**2=16. Mas range(6) inclui 0! [0,4,16] seria range(5). Aqui é range(6), então também inclui... espera: 0,2,4 ainda são os únicos pares em range(6). Resultado: [0, 4, 16].',
  },
  {
    category: 'python', difficulty: 'easy', type: 'multiple_choice',
    question: 'Como você remove duplicatas de uma lista preservando a ordem?',
    options: [
      'list(set(my_list))',
      'list(dict.fromkeys(my_list))',
      'my_list.unique()',
      'my_list.deduplicate()',
    ],
    correct_index: 1,
    explanation: 'dict.fromkeys() preserva ordem (Python 3.7+). set() é mais rápido mas não garante ordem.',
  },
  {
    category: 'python', difficulty: 'medium', type: 'code',
    question: 'Qual é o output?',
    code_snippet: `def f(x, lst=[]):
    lst.append(x)
    return lst

print(f(1))
print(f(2))`,
    options: ['[1] e [2]', '[1] e [1, 2]', 'Erro', '[1, 2] e [1, 2]'],
    correct_index: 1,
    explanation: 'Mutable default argument! A lista é criada UMA vez e reutilizada. Bug clássico de Python. f(1) → [1], f(2) → [1,2].',
  },
  {
    category: 'python', difficulty: 'hard', type: 'multiple_choice',
    question: 'Qual é a complexidade temporal de buscar um elemento em um set Python?',
    options: ['O(n)', 'O(log n)', 'O(1) amortizado', 'O(n²)'],
    correct_index: 2,
    explanation: 'Sets em Python usam hash tables. Busca é O(1) amortizado — O(n) no pior caso com muitas colisões.',
  },

  // ─────────────────── ML ────────────────────────────────────
  {
    category: 'ml', difficulty: 'medium', type: 'multiple_choice',
    question: 'Seu modelo tem 99% acurácia mas péssimo recall. O que provavelmente está acontecendo?',
    options: [
      'Overfitting severo',
      'Dataset desbalanceado — modelo prevê sempre a classe majoritária',
      'Underfitting — modelo muito simples',
      'Vazamento de dados (data leakage)',
    ],
    correct_index: 1,
    explanation: 'Com 99% da classe majoritária, prever sempre ela dá 99% de acurácia mas recall ~0 na minoria. Clássica armadilha.',
  },
  {
    category: 'ml', difficulty: 'easy', type: 'multiple_choice',
    question: 'Qual é a diferença entre overfitting e underfitting?',
    options: [
      'Overfitting = erro alto em treino; underfitting = erro alto em teste',
      'Overfitting = modelo decorou treino, falha no teste; underfitting = modelo falha em ambos',
      'Overfitting é exclusivo de redes neurais',
      'Underfitting acontece só com dados pequenos',
    ],
    correct_index: 1,
    explanation: 'Overfitting: low bias, high variance — decorou ruído. Underfitting: high bias — modelo muito simples para capturar o padrão.',
  },
  {
    category: 'ml', difficulty: 'hard', type: 'multiple_choice',
    question: 'Você tem um modelo de classificação. AUC-ROC = 0.95. O que isso significa?',
    options: [
      'O modelo acerta 95% das predições',
      '95% de chance de ranquear um positivo acima de um negativo aleatório',
      'Precision e recall estão balanceados em 0.95',
      'O modelo tem 95% de especificidade',
    ],
    correct_index: 1,
    explanation: 'AUC-ROC mede a probabilidade de um exemplo positivo aleatório ser ranqueado acima de um negativo aleatório.',
  },

  // ─────────────────── STATS ─────────────────────────────────
  {
    category: 'stats', difficulty: 'medium', type: 'multiple_choice',
    question: 'P-valor de 0.03 significa:',
    options: [
      'A hipótese alternativa tem 97% de chance de ser verdadeira',
      '3% de probabilidade de observar dados tão extremos se H₀ for verdadeira',
      'O efeito é clinicamente significativo',
      'Você rejeitou H₀ com 97% de confiança',
    ],
    correct_index: 1,
    explanation: 'P-valor = P(dados | H₀ verdadeira). NÃO é P(H₀ verdadeira | dados). Interpretação errada é o erro mais comum em estatística.',
  },
  {
    category: 'stats', difficulty: 'easy', type: 'multiple_choice',
    question: 'Qual medida de tendência central é mais robusta a outliers?',
    options: ['Média', 'Mediana', 'Moda', 'Variância'],
    correct_index: 1,
    explanation: 'A mediana usa apenas posição ordinal, não o valor dos extremos. Um outlier de 1 bilhão não altera a mediana.',
  },

  // ─────────────────── POWER BI ──────────────────────────────
  {
    category: 'powerbi', difficulty: 'easy', type: 'multiple_choice',
    question: 'No Power BI, qual é a diferença entre uma medida (measure) e uma coluna calculada?',
    options: [
      'Não há diferença técnica, só de nomenclatura',
      'Medida é calculada em tempo de query; coluna calculada é materializada no modelo',
      'Medidas são criadas no Power Query; colunas calculadas no DAX',
      'Colunas calculadas são mais rápidas sempre',
    ],
    correct_index: 1,
    explanation: 'Medidas (DAX) são calculadas on-the-fly com contexto de filtro. Colunas calculadas são salvas no modelo e ocupam memória.',
  },
  {
    category: 'powerbi', difficulty: 'medium', type: 'code',
    question: 'O que essa medida DAX calcula?',
    code_snippet: `Vendas YTD =
TOTALYTD(SUM(Vendas[Valor]), Datas[Date])`,
    options: [
      'Vendas do ano anterior',
      'Vendas acumuladas do início do ano até a data atual no contexto',
      'Total de vendas de todos os anos',
      'Média de vendas por mês no ano',
    ],
    correct_index: 1,
    explanation: 'TOTALYTD calcula o acumulado Year-To-Date usando a tabela de datas como referência de contexto temporal.',
  },

  // ─────────────────── AZURE ─────────────────────────────────
  {
    category: 'azure', difficulty: 'medium', type: 'multiple_choice',
    question: 'Qual serviço Azure você usaria para um pipeline ETL serverless com orquestração visual?',
    options: ['Azure Databricks', 'Azure Data Factory', 'Azure Stream Analytics', 'Azure Synapse Pipelines'],
    correct_index: 1,
    explanation: 'Azure Data Factory é o serviço de ETL/ELT gerenciado com interface visual, conectores prontos e orquestração. Synapse Pipelines é baseado nele.',
  },

  // ─────────────────── DATABRICKS ────────────────────────────
  {
    category: 'databricks', difficulty: 'medium', type: 'multiple_choice',
    question: 'Delta Lake é:',
    options: [
      'Um banco de dados relacional no Databricks',
      'Uma camada de storage open-source com ACID transactions sobre arquivos Parquet',
      'Um serviço de streaming em tempo real',
      'O nome do cluster manager do Databricks',
    ],
    correct_index: 1,
    explanation: 'Delta Lake adiciona ACID, time travel, schema enforcement e otimização em cima de arquivos Parquet no data lake.',
  },

  // ─────────────────── DATA ENG ──────────────────────────────
  {
    category: 'data_eng', difficulty: 'medium', type: 'multiple_choice',
    question: 'Qual é a diferença entre ETL e ELT?',
    options: [
      'ETL é mais moderno que ELT',
      'No ETL, transformação ocorre antes de carregar; no ELT, carrega cru e transforma no destino',
      'ELT é exclusivo de ambientes cloud',
      'ETL usa SQL; ELT usa Python',
    ],
    correct_index: 1,
    explanation: 'ELT virou padrão com cloud warehouses (BigQuery, Snowflake, Redshift) que têm poder de processamento suficiente para transformar na destino.',
  },

  // ─────────────────── MEME ──────────────────────────────────
  {
    category: 'meme', difficulty: 'easy', type: 'meme',
    question: 'O cliente pediu "só um dashboardzinho simples". Depois de 4 reuniões de alinhamento, o escopo agora inclui:',
    meme_context: '📊 scope creep speedrun any%',
    options: [
      'Machine learning preditivo em tempo real com alertas por WhatsApp e integração com SAP',
      'Um gráfico de barras no Excel',
      'Dois cards no Power BI',
      'Um print do Google Analytics colado no Notion',
    ],
    correct_index: 0,
    explanation: 'A resposta mais assustadoramente real vence. Scope creep é uma constante do universo.',
  },
  {
    category: 'meme', difficulty: 'easy', type: 'meme',
    question: 'Qual é a primeira etapa real de todo projeto de Data Science?',
    options: [
      'Treinar o modelo com AutoML',
      'Fazer deploy na AWS com Kubernetes',
      'Limpar os dados (e questionar suas escolhas de carreira)',
      'Criar apresentação no PowerPoint para o stakeholder',
    ],
    correct_index: 2,
    explanation: '80% do tempo em Data Science é limpeza de dados. Os 20% restantes são depurar a limpeza.',
  },
  {
    category: 'meme', difficulty: 'easy', type: 'meme',
    question: 'Seu pipeline quebrou em produção às 23h de sexta. O erro é:',
    options: [
      'NullPointerException na linha 1 do arquivo que você tocou hoje',
      'Um CSV com encoding diferente que ninguém sabia que existia',
      'O servidor do cliente foi reiniciado e perdeu a sessão',
      'Todas as anteriores, em sequência',
    ],
    correct_index: 3,
    explanation: 'Murphy não dorme. Tudo que pode dar errado dará errado, especialmente na sexta à noite.',
  },
  {
    category: 'meme', difficulty: 'medium', type: 'meme',
    question: 'Um stakeholder te manda uma planilha com "dados limpos para análise". Você abre e encontra:',
    options: [
      'Dados perfeitamente estruturados com tipos corretos e documentação',
      'Merges de células, totais na metade, datas como texto e notas em amarelo neon',
      'Um arquivo vazio com a aba certa',
      'Dados do ano errado rotulados como corretos',
    ],
    correct_index: 1,
    explanation: '"Dados limpos" para stakeholder ≠ "dados limpos" para análise. É universal, é lei.',
  },
]

export function getRandomQuestions(
  count: number,
  categories?: QuestionCategory[]
): typeof LOCAL_QUESTIONS {
  let pool = categories?.length
    ? LOCAL_QUESTIONS.filter(q => categories.includes(q.category))
    : LOCAL_QUESTIONS

  // Shuffle Fisher-Yates
  const shuffled = [...pool]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  return shuffled.slice(0, count)
}
