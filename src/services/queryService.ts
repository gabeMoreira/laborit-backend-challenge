import { config } from "../config.js";
import { MemoryCache } from "./cache.js";
import { generateSqlWithLlm } from "./llm.js";
import { query } from "./db.js";
import { getSchemaSummary } from "./schema.js";
import { validateSql } from "./sqlValidator.js";

const sqlCache = new MemoryCache<{ sql: string; explanation: string }>();
const sqlCacheTtlMs = 10 * 60 * 1000;

function ensureLimit(sql: string) {
  const trimmed = sql.trim().replace(/;+\s*$/, "");
  if (/\bLIMIT\b/i.test(trimmed)) {
    return trimmed;
  }
  return `${trimmed} LIMIT ${config.limits.maxRows}`;
}

export async function runQuestion(question: string) {
  const cached = sqlCache.get(question);
  let sql: string;
  let explanation: string;

  if (cached) {
    sql = cached.sql;
    explanation = `${cached.explanation} (cached)`;
  } else {
    const schema = await getSchemaSummary();
    const result = await generateSqlWithLlm(question, schema);
    sql = result.sql;
    explanation = result.explanation;
    validateSql(sql);
    sql = ensureLimit(sql);
    sqlCache.set(question, { sql, explanation }, sqlCacheTtlMs);
  }

  const rows = await query(sql);
  return { sql, explanation, rows };
}
