import pg from 'pg';
import { getDatabaseUrl } from './envGuard.js';

const { Pool } = pg;

const pool = new Pool({
  connectionString: getDatabaseUrl(),
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  allowExitOnIdle: true,
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

export const query = async (text: string, params?: any[]) => {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
};

export default pool;
