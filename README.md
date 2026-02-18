# laborit-backend-challenge

API inteligente baseada em LLM para transformar perguntas em SQL e consultar o banco Northwind.

## Visão geral
- **Entrada:** pergunta em linguagem natural.
- **Processo:** LLM gera SQL com validação de segurança + cache + contexto do schema.
- **Saída:** resultado tabular + explicação.

## Stack
- Node.js + TypeScript
- Express + Swagger (OpenAPI)
- MySQL (northwind)
- OpenAI (LLM)

## Setup
1. Instale dependências:
	 - npm install
2. Copie as variáveis de ambiente:
	 - copie .env.example para .env e ajuste o OPENAI_API_KEY
3. Rode em desenvolvimento:
	 - npm run dev

### Exemplo de .env (valores mockados)
```
PORT=3000
DB_HOST=seu-host-mysql
DB_PORT=3306
DB_USER=usuario_read_only
DB_PASSWORD=sua_senha_aqui
DB_NAME=northwind

LLM_PROVIDER=groq
OPENAI_API_KEY=seu_token_aqui
OPENAI_MODEL=llama-3.1-8b-instant
OPENAI_TEMPERATURE=0.2
OPENAI_BASE_URL=
OPENAI_REFERER=
OPENAI_TITLE=

MAX_ROWS=200
SCHEMA_TTL_MINUTES=10
```

## Endpoints
- **POST** /query
- **GET** /health
- **Swagger UI:** /docs

### Exemplo de requisição
POST /query
```json
{
	"question": "Quais são os produtos mais vendidos em termos de quantidade?",
	"includeSql": true
}
```

### Exemplo de resposta
```json
{
	"question": "Quais são os produtos mais vendidos em termos de quantidade?",
	"sql": "SELECT ...",
	"explanation": "...",
	"rows": [
		{ "ProductName": "...", "TotalQuantity": 1234 }
	]
}
```

## Arquitetura (resumo)
- **/query** chama o LLM para gerar SQL.
- **Validação**: somente SELECT e sem palavras-chave perigosas.
- **Contexto do schema**: extraído do INFORMATION_SCHEMA e cacheado.
- **Cache**: memória para perguntas repetidas.
- **Schema enriquecido**: inclui comentários de colunas e relacionamentos (FK) para melhorar a precisão das consultas.
- **Retry inteligente**: se a query falhar por coluna inexistente, o erro é enviado ao LLM e ele gera uma nova consulta automaticamente.

## Tomadas de decisão
Optei por uma API simples e direta, com foco em segurança e clareza de resultado. A ideia é reduzir o tempo de análise sem abrir mão de controle: o SQL gerado passa por validação e recebe limite de linhas para evitar consultas muito grandes. Também incluí cache de perguntas repetidas para acelerar respostas e diminuir custo de LLM.

### Prompt utilizado (explicado de forma natural)
Pedi ao modelo para agir como um analista de dados experiente e transformar perguntas em consultas MySQL somente de leitura. O retorno deve vir em JSON com o SQL e uma explicação curta. Deixei explícito que só pode usar SELECT, preferir joins claros e evitar trazer colunas desnecessárias. Essa orientação ajuda a gerar consultas seguras, fáceis de entender e mais eficientes.

## Observações
- Use **LLM_PROVIDER=mock** para testar sem chave da OpenAI.
- **Fallback automático**: se o provedor retornar HTTP 429 (limite de uso), o serviço responde com mock para evitar falhas durante demonstrações e controlar custo.
- Para usar outro provedor compatível com OpenAI (ex: **OpenRouter** ou **Groq**), defina:
	- **LLM_PROVIDER=openrouter** ou **LLM_PROVIDER=groq**
	- **OPENAI_API_KEY** com a chave do provedor
	- (opcional) **OPENAI_BASE_URL** para um endpoint customizado
	- (opcional) **OPENAI_REFERER** e **OPENAI_TITLE** (recomendado no OpenRouter)
- A credencial do banco já está no .env.example (read-only).