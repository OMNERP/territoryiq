import { Pool, PoolClient, QueryResultRow } from 'pg';
import { logger } from '../utils/logger';

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

db.on('error', (err) => {
  logger.error('Unexpected database pool error', err);
});

// Helper: run a query with automatic client acquisition
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number | null }> {
  const start = Date.now();
  const result = await db.query<T>(text, params as any[]);
  const duration = Date.now() - start;
  if (duration > 200) {
    logger.warn(`Slow query (${duration}ms): ${text.slice(0, 80)}`);
  }
  return result;
}

// Helper: run multiple queries in a single transaction
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
