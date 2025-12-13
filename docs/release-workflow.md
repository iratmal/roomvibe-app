# RoomVibe Release Workflow

## Overview

This document provides step-by-step instructions for releasing new features to staging and production.

---

## 🔴 CRITICAL: Database Environment Guard

RoomVibe uses a **fail-fast database environment guard** that prevents staging from accessing production data (and vice versa).

### How It Works

On server startup, the guard:
1. Reads `STAGING_ENVIRONMENT` (true/false)
2. Selects the appropriate database URL
3. **Exits immediately** if environment/database mismatch is detected

### Environment Variables

| Variable | Staging Deployment | Production Deployment |
|----------|-------------------|----------------------|
| `STAGING_ENVIRONMENT` | `true` | `false` |
| `DATABASE_URL_STAGING` | Replit PostgreSQL URL | (optional) |
| `DATABASE_URL_PRODUCTION` | (optional) | Neon PostgreSQL URL |
| `DATABASE_URL` | Fallback (Replit PG) | Fallback (Neon PG) |

### Selection Logic

```
If STAGING_ENVIRONMENT=true:
  → Use DATABASE_URL_STAGING (or DATABASE_URL as fallback)
  → FAIL if URL matches DATABASE_URL_PRODUCTION

If STAGING_ENVIRONMENT=false:
  → Use DATABASE_URL_PRODUCTION (or DATABASE_URL as fallback)
  → FAIL if URL matches DATABASE_URL_STAGING
```

### Quick Verification

Check server logs on startup:
```
[DB Guard] Environment: STAGING
[DB Guard] Using STAGING database (host: ***.replit.co/***)
```

or

```
[DB Guard] Environment: PRODUCTION  
[DB Guard] Using PRODUCTION database (host: ***.neon.tech/***)
```

### Development Bypass

For local development where you may need to use production data temporarily:
- Set `DB_GUARD_BYPASS` = `true` in development
- This ONLY works when `NODE_ENV` is not `production`
- **Never set this in deployed environments**

### Setting Up in Replit

**For Development (Replit Editor):**
1. Click **Secrets** (lock icon) in left sidebar
2. Set `STAGING_ENVIRONMENT` = `true`
3. Set `DB_GUARD_BYPASS` = `true` (for local dev only)
4. `DATABASE_URL` is auto-set by Replit PostgreSQL

**For Staging Deployment:**
1. Click **Deploy** → **Configure**
2. Add: `STAGING_ENVIRONMENT` = `true`
3. Add: `DATABASE_URL_STAGING` = (copy from Secrets → DATABASE_URL)

**For Production Deployment:**
1. Click **Deploy** → **Configure**  
2. Add: `STAGING_ENVIRONMENT` = `false`
3. Add: `DATABASE_URL_PRODUCTION` = (your Neon connection string)

---

## Phase 1: Development Testing

### Before Deployment

1. **Verify workflows are running:**
   - Backend API shows "Server is now ready"
   - Frontend Vite shows no errors

2. **Test locally in Replit:**
   - Open the Webview panel
   - Navigate through key user flows
   - Check browser console for errors

---

## Phase 2: Staging Deployment

### Step-by-Step: Deploy to Staging

1. **Open Replit Project**

2. **Click "Deploy" button** (top right, rocket icon)

3. **Click "Configure deployment"** (gear icon)

4. **Set Environment Variables:**
   - Scroll to "Environment Variables" section
   - Add the following:

   | Key | Value |
   |-----|-------|
   | `STAGING_ENVIRONMENT` | `true` |
   | `DATABASE_URL_STAGING` | (Replit PostgreSQL URL from Secrets) |
   | `FEATURE_GALLERY_ENABLED` | `true` or `false` |
   | `FEATURE_EXHIBITION_PUBLIC_ENABLED` | `true` or `false` |
   | `STRIPE_ENABLED` | `false` |
   | `NODE_ENV` | `production` |

5. **Verify Database Guard:**
   - Check deployment logs for: `[DB Guard] Using STAGING database`
   - If you see FATAL error, the database URL is misconfigured

6. **Click "Deploy"**

7. **Wait for deployment to complete**

8. **Test on staging.roomvibe.app:**
   - [ ] Application loads
   - [ ] Login works
   - [ ] Dashboard accessible
   - [ ] Feature flags respected
   - [ ] No console errors

---

## Phase 3: Production Deployment

### Pre-Production Checklist

- [ ] Staging tested and verified
- [ ] Feature flags configured for production
- [ ] Database is PRODUCTION Neon (not staging)
- [ ] STRIPE_ENABLED=false confirmed

### Step-by-Step: Deploy to Production

1. **Prepare production DATABASE_URL:**
   - Get Neon PostgreSQL connection string
   - This MUST be different from staging

2. **Click "Deploy" button** (top right)

3. **Configure for Production:**
   
   | Key | Value |
   |-----|-------|
   | `STAGING_ENVIRONMENT` | `false` |
   | `DATABASE_URL_PRODUCTION` | (Neon production string) |
   | `FEATURE_GALLERY_ENABLED` | `true` or `false` |
   | `FEATURE_EXHIBITION_PUBLIC_ENABLED` | `true` or `false` |
   | `STRIPE_ENABLED` | `false` |
   | `NODE_ENV` | `production` |

4. **Verify Database Guard:**
   - Check deployment logs for: `[DB Guard] Using PRODUCTION database`
   - If you see FATAL error, the database URL is misconfigured

5. **Click "Deploy"**

6. **Monitor for 30 minutes:**
   - Check app.roomvibe.app loads
   - Monitor error logs
   - Verify key user flows

---

## Emergency: Disable Features in Production

### Disable Gallery Dashboard (Under 2 Minutes)

1. Go to **Deployments** in Replit
2. Click **"Edit"** or gear icon on production deployment
3. Change: `FEATURE_GALLERY_ENABLED` → `false`
4. Click **"Redeploy"**

### Disable ALL Public Exhibitions (Under 2 Minutes)

1. Go to **Deployments** in Replit
2. Click **"Edit"** or gear icon on production deployment
3. Change: `FEATURE_EXHIBITION_PUBLIC_ENABLED` → `false`
4. Click **"Redeploy"**

### Disable Both Gallery + Exhibitions

Set both flags to `false` and redeploy.

---

## Verify Current Deployment

### Check Which Deployment is Live

1. **Click "Deploy"** button
2. **Look at "Deployments" list**
3. **Green checkmark** = currently live deployment
4. Check the domain column for staging vs production

### Check Feature Flag Status

Visit: `https://[your-domain]/api/feature-flags`

Response shows current flag states:
```json
{
  "galleryEnabled": true,
  "exhibitionPublicEnabled": true,
  "stripeEnabled": false
}
```

---

## Rollback (See rollback-plan.md)

If issues occur, refer to `docs/rollback-plan.md` for emergency procedures.
