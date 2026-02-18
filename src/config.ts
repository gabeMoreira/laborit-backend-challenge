import dotenv from "dotenv";

dotenv.config();

const env = (key: string, fallback?: string) =>
  process.env[key] ?? fallback ?? "";

export const config = {
  port: Number(env("PORT", "3000")),
  db: {
    host: env("DB_HOST", "northwind-mysql-db.ccghzwgwh2c7.us-east-1.rds.amazonaws.com"),
    port: Number(env("DB_PORT", "3306")),
    user: env("DB_USER", "user_read_only"),
    password: env("DB_PASSWORD", "laborit_teste_2789"),
    database: env("DB_NAME", "northwind")
  },
  llm: {
    provider: env("LLM_PROVIDER", "openai"),
    apiKey: env("OPENAI_API_KEY", ""),
    model: env("OPENAI_MODEL", "gpt-4o-mini"),
    temperature: Number(env("OPENAI_TEMPERATURE", "0.2")),
    baseUrl: env("OPENAI_BASE_URL", ""),
    referer: env("OPENAI_REFERER", ""),
    title: env("OPENAI_TITLE", "")
  },
  limits: {
    maxRows: Number(env("MAX_ROWS", "200")),
    schemaTtlMinutes: Number(env("SCHEMA_TTL_MINUTES", "10"))
  }
};
