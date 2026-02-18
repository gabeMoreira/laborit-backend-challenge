import { config } from "../config.js";
import { query } from "./db.js";
import { schemaHints } from "./schemaHints.js";

let cachedSchema: { value: string; expiresAt: number } | null = null;

export async function getSchemaSummary() {
  if (cachedSchema && Date.now() < cachedSchema.expiresAt) {
    return cachedSchema.value;
  }

  const columns = await query<{
    TABLE_NAME: string;
    COLUMN_NAME: string;
    DATA_TYPE: string;
    COLUMN_COMMENT: string | null;
  }>(
    `SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, COLUMN_COMMENT
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ?
     ORDER BY TABLE_NAME, ORDINAL_POSITION`,
    [config.db.database]
  );

  const relations = await query<{
    TABLE_NAME: string;
    COLUMN_NAME: string;
    REFERENCED_TABLE_NAME: string;
    REFERENCED_COLUMN_NAME: string;
  }>(
    `SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
     FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = ? AND REFERENCED_TABLE_NAME IS NOT NULL
     ORDER BY TABLE_NAME`,
    [config.db.database]
  );

  const grouped: Record<
    string,
    { column: string; type: string; comment: string }[]
  > = {};
  for (const row of columns) {
    grouped[row.TABLE_NAME] ??= [];
    grouped[row.TABLE_NAME].push({
      column: row.COLUMN_NAME,
      type: row.DATA_TYPE,
      comment: row.COLUMN_COMMENT ?? ""
    });
  }

  const autoSummary = Object.entries(grouped)
    .map(([table, cols]) => {
      const columnsLine = cols
        .map((c) =>
          c.comment
            ? `${c.column} (${c.type}) - ${c.comment}`
            : `${c.column} (${c.type})`
        )
        .join(", ");
      return `Table ${table}: ${columnsLine}`;
    })
    .join("\n");

  const relationsSummary = relations.length
    ? "\n\nRelationships:\n" +
      relations
        .map(
          (r) =>
            `${r.TABLE_NAME}.${r.COLUMN_NAME} -> ${r.REFERENCED_TABLE_NAME}.${r.REFERENCED_COLUMN_NAME}`
        )
        .join("\n")
    : "";

  const summary = `${schemaHints}\n\n${autoSummary}${relationsSummary}`;

  cachedSchema = {
    value: summary,
    expiresAt: Date.now() + config.limits.schemaTtlMinutes * 60 * 1000
  };

  return summary;
}
