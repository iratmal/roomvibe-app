import dotenv from 'dotenv';
dotenv.config();

export interface DatabaseConfig {
  connectionString: string;
  environment: 'staging' | 'production';
}

function extractDatabaseName(url: string): string | null {
  try {
    const parsed = new URL(url);
    const dbName = parsed.pathname.split('/')[1];
    return dbName || null;
  } catch {
    return null;
  }
}

function maskConnectionString(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.host}/${parsed.pathname.split('/')[1] || '***'}`;
  } catch {
    return '***masked***';
  }
}

function isProdDomainAtStartup(): boolean {
  const domains = (process.env.REPLIT_DOMAINS || '').toLowerCase();
  const devDomain = (process.env.REPLIT_DEV_DOMAIN || '').toLowerCase();
  return domains.includes('app.roomvibe.app') || devDomain.includes('app.roomvibe.app');
}

function isStagingDomainAtStartup(): boolean {
  const domains = (process.env.REPLIT_DOMAINS || '').toLowerCase();
  const devDomain = (process.env.REPLIT_DEV_DOMAIN || '').toLowerCase();
  return domains.includes('staging.roomvibe.app') || devDomain.includes('staging.roomvibe.app');
}

export function validateDatabaseEnvironment(): DatabaseConfig {
  const isProdHost = isProdDomainAtStartup();
  const isStagingHost = isStagingDomainAtStartup();
  const isStaging = isStagingHost || (!isProdHost && process.env.STAGING_ENVIRONMENT === 'true');
  const isLocalDev = process.env.NODE_ENV !== 'production';
  const bypassGuard = process.env.DB_GUARD_BYPASS === 'true';
  const environment = (isProdHost || !isStaging) ? 'production' : 'staging';
  
  console.log(`[DB Guard] Host detection: isProdHost=${isProdHost}, isStagingHost=${isStagingHost}`);
  
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
    
    if (productionUrl) {
      const stagingDbName = extractDatabaseName(connectionString);
      const productionDbName = extractDatabaseName(productionUrl);
      if (stagingDbName && productionDbName && stagingDbName === productionDbName) {
        console.error('[DB Guard] FATAL: STAGING and PRODUCTION have the same database name!');
        console.error(`[DB Guard] Database name: ${stagingDbName}`);
        console.error('[DB Guard] Use separate databases for each environment.');
        process.exit(1);
      }
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
    
    if (stagingUrl) {
      const stagingDbName = extractDatabaseName(stagingUrl);
      const productionDbName = extractDatabaseName(connectionString);
      if (stagingDbName && productionDbName && stagingDbName === productionDbName) {
        console.error('[DB Guard] FATAL: PRODUCTION and STAGING have the same database name!');
        console.error(`[DB Guard] Database name: ${productionDbName}`);
        console.error('[DB Guard] Use separate databases for each environment.');
        process.exit(1);
      }
    }
    
    console.log(`[DB Guard] ✓ Using PRODUCTION database (host: ${maskConnectionString(connectionString)})`);
    return { connectionString, environment: 'production' };
  }
}

export function getDatabaseUrl(): string {
  const config = validateDatabaseEnvironment();
  return config.connectionString;
}
