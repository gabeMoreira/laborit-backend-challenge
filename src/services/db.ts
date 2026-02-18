import mysql from "mysql2/promise";
import { config } from "../config.js";

export const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000
});

export async function query<T = unknown>(sql: string, params: unknown[] = []) {
  const [rows] = await pool.query(sql, params);
  return rows as T[];
}
