const forbidden = /(\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bALTER\b|\bTRUNCATE\b|\bCREATE\b|\bREPLACE\b|\bGRANT\b|\bREVOKE\b)/i;

export function validateSql(sql: string) {
  const trimmed = sql.trim();
  if (!/^SELECT\b/i.test(trimmed)) {
    throw new Error("Only SELECT queries are allowed.");
  }
  if (forbidden.test(trimmed)) {
    throw new Error("Forbidden SQL keyword detected.");
  }
  if (/;/.test(trimmed)) {
    throw new Error("Semicolons are not allowed in generated SQL.");
  }
}
