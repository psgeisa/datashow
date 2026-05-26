# DataShow — Prompt de Geração de Questões

Cole o prompt abaixo no Gemini / ChatGPT / Claude.
Substitua os campos entre `[ ]` antes de enviar.

---

## Prompt

```
Você é um especialista criando questões para o DataShow, um quiz show multiplayer de Data Science.

Gere EXATAMENTE [N] questões sobre [TEMA ESPECÍFICO] com dificuldade [easy | medium | hard].

═══ REGRAS OBRIGATÓRIAS ═══

1. EQUILÍBRIO DE TAMANHO (mais importante):
   - Todas as 4 alternativas devem ter comprimento SIMILAR
   - Se a resposta correta tem 60 caracteres, cada distrator deve ter entre 45 e 75 caracteres
   - NUNCA use distratores curtos como "Sim", "Não", "Nenhuma das anteriores", "Todas as anteriores"

2. QUALIDADE DOS DISTRATORES:
   - Alternativas incorretas devem ser erros comuns, conceitos próximos ou confusões frequentes
   - Um especialista deve hesitar; um leigo não deve adivinhar pela alternativa mais longa

3. FORMATO:
   - Perguntas claras e diretas, sem ambiguidade
   - Explicação: 1-2 frases explicando POR QUE a resposta é correta
   - Nível easy: conceitos fundamentais, perguntas diretas
   - Nível medium: aplicação prática, interpretação de resultados
   - Nível hard: casos extremos, nuances técnicas, armadilhas

4. CAMPO super_topic: use EXATAMENTE um dos valores abaixo (sem espaços, sem acentos):
   - ciencia_de_dados
   - machine_learning
   - separacao_validacao_generalizacao
   - classificacao
   - clustering
   - regressao
   - estatistica
   - algebra_linear
   - programacao
   - metricas_de_validacao
   - data_preparation
   - generative_ai

Retorne APENAS JSON puro (sem markdown, sem ```):
[
  {
    "question": "Texto da pergunta?",
    "options": ["Opção A com tamanho similar", "Opção B com tamanho similar", "Opção C com tamanho similar", "Opção D — esta é a correta"],
    "correct_index": 3,
    "explanation": "Explicação de por que esta é a resposta correta.",
    "difficulty": "medium",
    "type": "multiple_choice",
    "super_topic": "regressao",
    "topic": "regressao_linear"
  }
]
```

---

## Fluxo para adicionar novas questões

```
1. Gere as questões com o prompt acima
2. Salve em data/questions/<supertopico>_<dificuldade>.json
3. npm run seed
```

O `npm run seed` é idempotente — apaga e reinsereLuas questões do mesmo super_topic,
então pode rodar quantas vezes quiser.

---

## Metas por supertópico (75 questões = 25 easy + 25 medium + 25 hard)

| Supertópico                        | Atual | Faltam |
|------------------------------------|-------|--------|
| regressao                          |    65 |     10 |
| programacao                        |    50 |     25 |
| algebra_linear                     |    45 |     30 |
| data_preparation                   |    45 |     30 |
| estatistica                        |    45 |     30 |
| metricas_de_validacao              |    45 |     30 |
| generative_ai                      |    30 |     45 |
| classificacao                      |     0 |     75 |
| clustering                         |     0 |     75 |
| machine_learning                   |     0 |     75 |
| ciencia_de_dados                   |     0 |     75 |
| separacao_validacao_generalizacao  |     0 |     75 |

---

## Exemplo de questão bem equilibrada

```json
{
  "question": "Qual é o principal problema do overfitting em modelos de ML?",
  "options": [
    "O modelo aprende os dados de treino mas não generaliza para dados novos",
    "O modelo tem acurácia baixa tanto no treino quanto na validação",
    "O modelo demora muito tempo para convergir durante o treinamento",
    "O modelo usa mais memória do que o necessário para fazer predições"
  ],
  "correct_index": 0,
  "explanation": "Overfitting ocorre quando o modelo memoriza os dados de treino, incluindo ruído, perdendo capacidade de generalização.",
  "difficulty": "easy",
  "type": "multiple_choice",
  "super_topic": "machine_learning",
  "topic": "overfitting_underfitting"
}
```

*Todas as 4 opções têm comprimento similar (~65-75 caracteres).*
