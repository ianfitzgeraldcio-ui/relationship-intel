import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function query<T>(sql: string, params?: any[]): Promise<T[]> {
  const result = await pool.query(sql, params);
  return result.rows as T[];
}

export async function queryOne<T>(sql: string, params?: any[]): Promise<T | null> {
  const result = await pool.query(sql, params);
  return (result.rows[0] as T) || null;
}

export async function execute(sql: string, params?: any[]): Promise<number> {
  const result = await pool.query(sql, params);
  return result.rowCount || 0;
}

export async function getConnection() {
  return pool.connect();
}

export async function closePool(): Promise<void> {
  await pool.end();
}

export { pool };
