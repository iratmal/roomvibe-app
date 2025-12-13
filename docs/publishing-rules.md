# RoomVibe Publishing Rules

## Environment Overview

RoomVibe operates in two environments:

| Environment | Domain | Database | Purpose |
|-------------|--------|----------|---------|
| **Staging** | staging.roomvibe.app | Replit PostgreSQL | Testing new features before production |
| **Production** | app.roomvibe.app | External Neon PostgreSQL | Live user-facing application |

## Deployment Principles

### 1. Never Skip Staging
All changes must be tested on staging before production deployment.

### 2. Database Isolation
- Staging uses Replit's built-in PostgreSQL (DATABASE_URL environment variable)
- Production uses external Neon PostgreSQL (configured separately in production deployment)
- **Never connect staging to production database**

### 3. Feature Flags
Use feature flags to control feature availability:
- `FEATURE_GALLERY_ENABLED` - Controls Gallery/Virtual Exhibition features
- `STRIPE_ENABLED` - Controls payment processing

Set in staging to test new features without affecting production.

## Pre-Deployment Checklist

### Before Staging Deployment
- [ ] All code changes committed
- [ ] Feature flags configured appropriately
- [ ] No hardcoded production URLs
- [ ] Environment variables documented

### Before Production Deployment
- [ ] Staging tested and verified working
- [ ] Database migrations tested on staging first
- [ ] Feature flags set correctly for production
- [ ] Rollback plan documented

## Environment Variables

### Backend (Server)
| Variable | Staging | Production |
|----------|---------|------------|
| `DATABASE_URL` | Replit PostgreSQL | Neon PostgreSQL |
| `NODE_ENV` | production | production |
| `FRONTEND_URL` | https://staging.roomvibe.app | https://app.roomvibe.app |
| `FEATURE_GALLERY_ENABLED` | true/false | true/false |
| `STRIPE_ENABLED` | false | true |
| `STAGING_ENVIRONMENT` | true | false |

### Frontend (Vite)
| Variable | Staging | Production |
|----------|---------|------------|
| `VITE_API_URL` | (uses same origin) | (uses same origin) |
| `VITE_FEATURE_GALLERY_ENABLED` | true/false | true/false |
| `VITE_STRIPE_ENABLED` | false | true |

## Domain Configuration

Both environments are configured in:
- `vite.config.ts` - allowedHosts includes both domains
- `server/server.ts` - CORS allowedOrigins includes both domains
- `server/api/billing.ts` - getBaseUrl() returns environment-appropriate URL

## Forbidden Actions

1. **DO NOT** use production DATABASE_URL in staging
2. **DO NOT** enable Stripe in staging without test keys
3. **DO NOT** deploy to production without staging verification
4. **DO NOT** modify `public/presets` folder
5. **DO NOT** modify `server.js` file
