# Banco de Questões — DataShow

Coloque aqui os arquivos JSON de questões antes de executar o seed script.

## Formato de cada arquivo

```json
[
  {
    "category": "data_science",
    "difficulty": "easy",
    "type": "multiple_choice",
    "super_topic": "regressao",
    "topic": "linear",
    "question": "Texto da pergunta...",
    "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
    "correct_index": 2,
    "explanation": "Explicação da resposta correta...",
    "image_urls": ["https://.../exhibit1.png"]
  }
]
```

`image_urls` é opcional — só inclua quando a pergunta referenciar um exhibit/print (ex: AZ-104). Pode ter mais de uma URL. Requer a migration `supabase/migration_005_question_images.sql` aplicada no banco.

## Supertópicos válidos

| super_topic                       | Nome exibido no jogo      |
|-----------------------------------|---------------------------|
| `ciencia_de_dados`                | Ciência de Dados          |
| `machine_learning`                | Machine Learning          |
| `separacao_validacao_generalizacao` | Validação & Generalização |
| `classificacao`                   | Classificação             |
| `clustering`                      | Clustering                |
| `regressao`                       | Regressão                 |
| `estatistica`                     | Estatística               |
| `algebra_linear`                  | Álgebra Linear            |
| `programacao`                     | Programação               |
| `metricas_de_validacao`           | Métricas de Validação     |
| `data_preparation`                | Preparação de Dados       |
| `generative_ai`                   | IA Generativa             |
| `az104`                           | AZ-104 (Azure Admin)      |

## Como executar o seed

```bash
# Da raiz do projeto game-show/
node scripts/seed-questions.mjs
```

## Meta: 75 questões por supertópico (25 easy + 25 medium + 25 hard)
