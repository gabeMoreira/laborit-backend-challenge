import OpenAI from "openai";
import { config } from "../config.js";

export type LlmResult = {
  sql: string;
  explanation: string;
};

const baseUrl =
  config.llm.baseUrl ||
  (config.llm.provider === "openrouter"
    ? "https://openrouter.ai/api/v1"
    : config.llm.provider === "groq"
      ? "https://api.groq.com/openai/v1"
      : undefined);

const defaultHeaders: Record<string, string> = {};
if (config.llm.referer) defaultHeaders["HTTP-Referer"] = config.llm.referer;
if (config.llm.title) defaultHeaders["X-Title"] = config.llm.title;

const client = config.llm.apiKey
  ? new OpenAI({
      apiKey: config.llm.apiKey,
      baseURL: baseUrl,
      defaultHeaders: Object.keys(defaultHeaders).length
        ? defaultHeaders
        : undefined
    })
  : null;

export async function generateSqlWithLlm(
  question: string,
  schemaSummary: string,
  feedback?: { previousSql?: string; error?: string }
): Promise<LlmResult> {
  if (config.llm.provider === "mock") {
    return {
      sql: "SELECT 1 AS result",
      explanation: "Mock response. Configure OPENAI_API_KEY to use a real LLM."
    };
  }

  if (!client) {
    throw new Error("OPENAI_API_KEY not set.");
  }

  const systemPrompt =
    "You are a senior data analyst. Convert user questions into safe, read-only MySQL queries. " +
    "Return JSON with keys 'sql' and 'explanation'. Use only SELECT statements. " +
    "Prefer explicit joins. Avoid selecting unnecessary columns. " +
    "Use only tables and columns present in the provided schema summary. Do not invent fields.";

  const feedbackBlock = feedback?.error
    ? `\nPrevious SQL failed:\n${feedback.previousSql ?? ""}\nError: ${feedback.error}\nPlease fix the SQL using only valid tables/columns.\n`
    : "";

  const userPrompt = `Database schema:\n${schemaSummary}\n\nQuestion: ${question}\n${feedbackBlock}\nOutput JSON with {"sql": "...", "explanation": "..."}.`;

  let completion;
  try {
    completion = await client.chat.completions.create({
      model: config.llm.model,
      temperature: config.llm.temperature,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    });
  } catch (error) {
    const status =
      (error as { status?: number })?.status ??
      (error as { response?: { status?: number } })?.response?.status;
    if (status === 429) {
      return {
        sql: "SELECT 1 AS result",
        explanation:
          "Fallback para mock por limite de uso do provedor (HTTP 429)."
      };
    }
    throw error;
  }

  const content = completion.choices[0]?.message?.content ?? "";
  const parsed = JSON.parse(content) as LlmResult;

  return {
    sql: parsed.sql?.trim() ?? "",
    explanation: parsed.explanation?.trim() ?? ""
  };
}
