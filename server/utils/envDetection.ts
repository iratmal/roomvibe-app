import { Request } from 'express';

export type AppEnvironment = 'production' | 'staging' | 'development';

export function getRequestHost(req: Request): string {
  return (req.headers['x-forwarded-host'] || req.headers.host || '').toString().toLowerCase();
}

export function isProdHost(host: string): boolean {
  return host.includes('app.roomvibe.app');
}

export function isStagingHost(host: string): boolean {
  return host.includes('staging.roomvibe.app');
}

export function getAppEnv(req: Request): AppEnvironment {
  const host = getRequestHost(req);
  
  if (isProdHost(host)) {
    return 'production';
  }
  
  if (isStagingHost(host)) {
    return 'staging';
  }
  
  if (process.env.STAGING_ENVIRONMENT === 'true') {
    return 'staging';
  }
  
  if (process.env.APP_ENV === 'production') {
    return 'production';
  }
  
  if (process.env.APP_ENV === 'staging') {
    return 'staging';
  }
  
  return process.env.NODE_ENV === 'production' ? 'production' : 'development';
}

export function isProductionEnv(req: Request): boolean {
  return getAppEnv(req) === 'production';
}

export function isStagingEnv(req: Request): boolean {
  return getAppEnv(req) === 'staging';
}
