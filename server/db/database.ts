import pg from 'pg';
import crypto from 'crypto';
import { getDatabaseUrl, validateDatabaseEnvironment } from './envGuard.js';

const { Pool } = pg;

const connectionString = getDatabaseUrl();
const dbConfig = validateDatabaseEnvironment();

function extractDbInfo(url: string): { host: string; name: string; urlHash: string } {
  try {
    const parsed = new URL(url);
    const host = parsed.host;
    const name = parsed.pathname.split('/')[1] || 'unknown';
    const urlHash = crypto.createHash('sha256').update(url).digest('hex').substring(0, 12);
    return { host, name, urlHash };
  } catch {
    return { host: 'unknown', name: 'unknown', urlHash: 'unknown' };
  }
}

const dbInfo = extractDbInfo(connectionString);

console.log(`[DB] Pool initialized: host=${dbInfo.host}, db=${dbInfo.name}, env=${dbConfig.environment}, hash=${dbInfo.urlHash}`);

const pool = new Pool({
  connectionString,
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

export function getDbIdentity(): { host: string; name: string; urlHash: string; environment: string } {
  return {
    ...dbInfo,
    environment: dbConfig.environment
  };
}

export default pool;
