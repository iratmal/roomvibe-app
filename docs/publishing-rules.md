# RoomVibe Publishing Rules

## Environment Overview

RoomVibe operates in two completely separate environments:

| Environment | Domain | Database | Purpose |
|-------------|--------|----------|---------|
| **Staging** | staging.roomvibe.app | Replit PostgreSQL | Testing new features before production |
| **Production** | app.roomvibe.app | External Neon PostgreSQL | Live user-facing application |

## 🔴 CRITICAL: Database Separation

### Staging Database
- **Provider:** Replit PostgreSQL (built-in)
- **Connection:** `DATABASE_URL` secret in Replit's development environment
- **Created:** Automatically provisioned by Replit

### Production Database
- **Provider:** External Neon PostgreSQL
- **Connection:** Separate `DATABASE_URL` set ONLY in production deployment
- **NEVER** share the same DATABASE_URL between staging and production

### Why Separate Databases?
- Staging data corruption cannot affect production users
- Safe to test destructive operations
- Clear separation of test vs real data

---

## Feature Flags (Kill Switches)

### Available Flags

| Flag | Purpose | Default |
|------|---------|---------|
| `FEATURE_GALLERY_ENABLED` | Gallery dashboard access | true |
| `FEATURE_EXHIBITION_PUBLIC_ENABLED` | Public exhibition pages + 360° viewers | true |
| `STRIPE_ENABLED` | Payment processing | false |

### Emergency Disable (Under 2 Minutes)

To instantly disable gallery/exhibition features:

1. **Open Replit Project**
2. **Click "Secrets" in left sidebar** (lock icon)
3. **Find or Add the flag:**
   - `FEATURE_GALLERY_ENABLED` → set to `false`
   - `FEATURE_EXHIBITION_PUBLIC_ENABLED` → set to `false`
4. **Click "Redeploy" button** (if deployed) OR workflows auto-restart

---

## Environment Variables Per Deployment

### Development (Replit Editor)
Set in: **Secrets** panel (left sidebar, lock icon)

| Variable | Value |
|----------|-------|
| `FEATURE_GALLERY_ENABLED` | true |
| `FEATURE_EXHIBITION_PUBLIC_ENABLED` | true |
| `STRIPE_ENABLED` | false |
| `DATABASE_URL` | (auto-set by Replit PostgreSQL) |

### Staging Deployment
Set in: **Deployments → Configure → Environment Variables**

| Variable | Value |
|----------|-------|
| `STAGING_ENVIRONMENT` | true |
| `FEATURE_GALLERY_ENABLED` | true/false (your choice) |
| `FEATURE_EXHIBITION_PUBLIC_ENABLED` | true/false (your choice) |
| `STRIPE_ENABLED` | false |
| `DATABASE_URL` | (Replit PostgreSQL connection string) |
| `NODE_ENV` | production |

### Production Deployment
Set in: **Separate production deployment environment**

| Variable | Value |
|----------|-------|
| `STAGING_ENVIRONMENT` | false |
| `FEATURE_GALLERY_ENABLED` | true/false |
| `FEATURE_EXHIBITION_PUBLIC_ENABLED` | true/false |
| `STRIPE_ENABLED` | false (keep disabled) |
| `DATABASE_URL` | (Neon PostgreSQL - DIFFERENT from staging) |
| `NODE_ENV` | production |

---

## Replit Click-by-Click: Setting Environment Variables

### For Development Environment:
1. Open your Replit project
2. Click the **lock icon (Secrets)** in the left sidebar
3. Click **"New Secret"**
4. Enter key (e.g., `FEATURE_GALLERY_ENABLED`)
5. Enter value (e.g., `true` or `false`)
6. Click **"Add Secret"**
7. Workflows auto-restart with new value

### For Deployment Environment:
1. Click **"Deploy"** button (top right)
2. Click **"Configure deployment"** or gear icon
3. Scroll to **"Environment Variables"** section
4. Add each variable with its value
5. Click **"Deploy"** to apply

---

## Forbidden Actions

1. ❌ **DO NOT** use production DATABASE_URL in staging
2. ❌ **DO NOT** enable Stripe (`STRIPE_ENABLED=true`) without explicit approval
3. ❌ **DO NOT** deploy to production without staging verification
4. ❌ **DO NOT** modify `public/presets` folder
5. ❌ **DO NOT** modify `server.js` file
6. ❌ **DO NOT** flip env vars on a single deployment - use separate deployments

---

## Verification Checklist

Before any deployment:

- [ ] Correct DATABASE_URL for environment
- [ ] STAGING_ENVIRONMENT correctly set
- [ ] Feature flags configured appropriately
- [ ] STRIPE_ENABLED=false (unless explicitly approved)
- [ ] Tested on staging first (for production deploys)
