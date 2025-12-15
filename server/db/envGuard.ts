import dotenv from 'dotenv';
dotenv.config();

export interface DatabaseConfig {
  connectionString: string;
  environment: 'staging' | 'production';
}

const PRODUCTION_HOST_PATTERNS = [
  'neon.tech',
  'prod.neon',
  'production',
];

const STAGING_HOST_PATTERNS = [
  'replit',
  'staging',
  'dev.',
  'localhost',
  'neon.tech',
];

function isProductionHost(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return PRODUCTION_HOST_PATTERNS.some(pattern => lowerUrl.includes(pattern));
}

function isStagingHost(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return STAGING_HOST_PATTERNS.some(pattern => lowerUrl.includes(pattern));
}

function maskConnectionString(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.host}/${parsed.pathname.split('/')[1] || '***'}`;
  } catch {
    return '***masked***';
  }
}

export function validateDatabaseEnvironment(): DatabaseConfig {
  const isStaging = process.env.STAGING_ENVIRONMENT === 'true';
  const isLocalDev = process.env.NODE_ENV !== 'production';
  const bypassGuard = process.env.DB_GUARD_BYPASS === 'true';
  const environment = isStaging ? 'staging' : 'production';
  
  const stagingUrl = process.env.DATABASE_URL_STAGING;
  const productionUrl = process.env.DATABASE_URL_PRODUCTION;
  const legacyUrl = process.env.DATABASE_URL;
  
  console.log(`[DB Guard] Environment: ${environment.toUpperCase()}`);
  console.log(`[DB Guard] STAGING_ENVIRONMENT=${process.env.STAGING_ENVIRONMENT || 'undefined'}`);
  console.log(`[DB Guard] NODE_ENV=${process.env.NODE_ENV || 'undefined'}`);
  
  if (bypassGuard && isLocalDev) {
    console.log('[DB Guard] ⚠️  BYPASS ENABLED (local development only)');
    console.log('[DB Guard] This bypass is IGNORED in production deployments.');
    const connectionString = stagingUrl || productionUrl || legacyUrl;
    if (!connectionString) {
      console.error('[DB Guard] FATAL: No database URL provided');
      process.exit(1);
    }
    console.log(`[DB Guard] Using database (host: ${maskConnectionString(connectionString)})`);
    return { connectionString, environment };
  }
  
  if (isStaging) {
    const connectionString = stagingUrl || legacyUrl;
    
    if (!connectionString) {
      console.error('[DB Guard] FATAL: STAGING_ENVIRONMENT=true but no DATABASE_URL_STAGING or DATABASE_URL provided');
      process.exit(1);
    }
    
    if (productionUrl && connectionString === productionUrl) {
      console.error('[DB Guard] FATAL: STAGING environment is using PRODUCTION database URL!');
      console.error('[DB Guard] DATABASE_URL_STAGING or DATABASE_URL matches DATABASE_URL_PRODUCTION');
      console.error('[DB Guard] This would allow staging to read/write production data.');
      process.exit(1);
    }
    
    if (isProductionHost(connectionString) && !isStagingHost(connectionString)) {
      console.error('[DB Guard] FATAL: STAGING environment detected PRODUCTION database host!');
      console.error(`[DB Guard] URL host: ${maskConnectionString(connectionString)}`);
      console.error('[DB Guard] Production patterns detected: neon.tech, prod., production');
      console.error('[DB Guard] Set DATABASE_URL_STAGING to your Replit PostgreSQL or staging database.');
      process.exit(1);
    }
    
    console.log(`[DB Guard] ✓ Using STAGING database (host: ${maskConnectionString(connectionString)})`);
    return { connectionString, environment: 'staging' };
    
  } else {
    const connectionString = productionUrl || legacyUrl;
    
    if (!connectionString) {
      console.error('[DB Guard] FATAL: STAGING_ENVIRONMENT=false but no DATABASE_URL_PRODUCTION or DATABASE_URL provided');
      process.exit(1);
    }
    
    if (stagingUrl && connectionString === stagingUrl) {
      console.error('[DB Guard] FATAL: PRODUCTION environment is using STAGING database URL!');
      console.error('[DB Guard] DATABASE_URL_PRODUCTION or DATABASE_URL matches DATABASE_URL_STAGING');
      console.error('[DB Guard] This could cause data inconsistency between environments.');
      process.exit(1);
    }
    
    if (isStagingHost(connectionString) && !isProductionHost(connectionString)) {
      console.error('[DB Guard] FATAL: PRODUCTION environment detected STAGING database host!');
      console.error(`[DB Guard] URL host: ${maskConnectionString(connectionString)}`);
      console.error('[DB Guard] Staging patterns detected: replit, staging, dev., localhost');
      console.error('[DB Guard] Set DATABASE_URL_PRODUCTION to your Neon PostgreSQL or production database.');
      process.exit(1);
    }
    
    console.log(`[DB Guard] ✓ Using PRODUCTION database (host: ${maskConnectionString(connectionString)})`);
    return { connectionString, environment: 'production' };
  }
}

export function getDatabaseUrl(): string {
  const config = validateDatabaseEnvironment();
  return config.connectionString;
}
