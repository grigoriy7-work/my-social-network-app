import { Pool } from "pg";

export const pool = new Pool({
  host: process.env.DB_HOST || "",
  port: Number(process.env.DB_PORT) || 0,
  user: process.env.DB_USER || "",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "",
});

// Автоматическое создание таблицы при старте (для примера)
export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      first_name VARCHAR(100) NOT NULL,
      second_name VARCHAR(100) NOT NULL,
      birthdate DATE NOT NULL,
      biography VARCHAR(100),
      city VARCHAR(100),
      password VARCHAR(100) NOT NULL
    );
  `);
}
