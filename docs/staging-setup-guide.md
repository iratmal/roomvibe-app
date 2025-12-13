# RoomVibe Staging Environment Setup Guide

## Overview

This guide walks through setting up a separate Replit app for staging (`RoomVibe-staging`) with its own database, connected to `staging.roomvibe.app`.

---

## A) Create Staging Repl (Fork)

### Steps in Replit UI:

1. Open existing repl **RoomVibe**
2. Click the **three dots menu (⋯)** → **Fork**
3. Name the new repl: **RoomVibe-staging**
4. Wait for fork to complete
5. Verify it builds and runs

**Verification:** New repl exists, named `RoomVibe-staging`, app can be run.

---

## B) Database Setup

### Option 1: Use Replit's Built-in PostgreSQL (Recommended)

In **RoomVibe-staging**:
1. Go to **Tools** → **PostgreSQL** (or Database tab)
2. Click **Create database**
3. Replit will automatically create `DATABASE_URL` environment variable

The DB Guard will detect "replit" in the URL and allow staging mode.

### Option 2: Create Separate Neon Database

1. Go to [Neon Console](https://console.neon.tech)
2. Create new project: `roomvibe-staging`
3. Copy connection string
4. Add to staging repl as `DATABASE_URL`

**Important:** Include "staging" in the database name so DB Guard recognizes it.

---

## C) Environment Variables for RoomVibe-staging

In **RoomVibe-staging** → **Secrets** tab, set:

### Required Variables

| Key | Value | Purpose |
|-----|-------|---------|
| `STAGING_ENVIRONMENT` | `true` | Enables staging mode |
| `VITE_STAGING_ENVIRONMENT` | `true` | Shows STAGING badge in UI |
| `STRIPE_ENABLED` | `false` | Disables Stripe payments |
| `NODE_ENV` | `production` | For deployed app |

### Database Variables

**If using Replit PostgreSQL:**
- `DATABASE_URL` is auto-set by Replit (keep it)

**If using separate URLs:**
| Key | Value |
|-----|-------|
| `DATABASE_URL` | `<your-staging-db-url>` |

### DO NOT Include in Staging:
- `DATABASE_URL_PRODUCTION` (don't put production DB in staging secrets)
- `STRIPE_SECRET_KEY` (until explicitly needed)
- `STRIPE_WEBHOOK_SECRET` (until explicitly needed)

---

## D) Publish Staging Repl

1. In **RoomVibe-staging**, click **Publish** (or Deploy)
2. Complete deployment wizard
3. Note the Replit public URL: `roomvibe-staging.replit.app` (example)

**Verification:** App is published and accessible at `*.replit.app` URL.

---

## E) Connect Custom Domain in Replit

1. In **RoomVibe-staging** → **Deployments** tab
2. Click **Domains** or **Connect domain**
3. Enter: `staging.roomvibe.app`
4. Replit will show you the **CNAME target** (e.g., `cname.replit.dev` or similar)
5. Copy this target exactly

**Save this CNAME target for DNS setup!**

---

## F) Namecheap DNS Configuration

In Namecheap → Domain → **Advanced DNS** → **Host Records**:

### Add CNAME Record

| Type | Host | Value | TTL |
|------|------|-------|-----|
| CNAME | staging | `<CNAME target from Replit>` | Automatic |

### Common Replit CNAME Targets

The exact target depends on what Replit shows you. Common formats:
- `cname.replit.dev`
- `<deployment-id>.id.repl.co`
- Custom target shown in Replit's domain wizard

**Wait for DNS propagation (5-30 minutes)**

Then return to Replit and click **Verify** on the domain.

---

## G) Smoke Test Checklist

After `staging.roomvibe.app` is live, verify:

### Environment
- [ ] STAGING badge visible in UI
- [ ] URL shows `staging.roomvibe.app`

### DB Guard (Check Server Logs)
- [ ] `[DB Guard] Environment: STAGING` appears
- [ ] `[DB Guard] ✓ Using STAGING database` appears
- [ ] No FATAL errors

### 360 Gallery
- [ ] Gallery loads without errors
- [ ] Floor is dark grey (#2a2a2a), never black
- [ ] All 4 camera positions work (Entrance/Center/Back Left/Back Right)
- [ ] No WebGL sampler errors in console

### Stripe
- [ ] `/api/feature-flags` returns `stripeEnabled: false`
- [ ] No Stripe buttons visible (or disabled)

### Full Checklist
See `docs/smoke-tests.md` for complete verification.

---

## H) Expected Output

After completing setup, you should have:

1. **Staging Repl Link:** `https://replit.com/@YourUsername/RoomVibe-staging`
2. **Staging Public URL:** `https://roomvibe-staging.replit.app` (example)
3. **Custom Domain:** `https://staging.roomvibe.app`
4. **CNAME Target:** (from Replit domain wizard)
5. **Environment Variables Set:**
   - `STAGING_ENVIRONMENT=true`
   - `VITE_STAGING_ENVIRONMENT=true`
   - `STRIPE_ENABLED=false`
   - `DATABASE_URL=<staging-db>`

---

## DB Guard Behavior

The existing DB Guard (`server/db/envGuard.ts`) will:

### When `STAGING_ENVIRONMENT=true`:
- ✅ Allow: URLs containing "replit", "staging", "dev.", "localhost"
- ❌ Block: URLs containing "neon.tech", "prod", "production"
- 💀 FATAL EXIT if staging tries to use production database

### Example Log Output (Success):
```
[DB Guard] Environment: STAGING
[DB Guard] STAGING_ENVIRONMENT=true
[DB Guard] ✓ Using STAGING database (host: db.replit.com/roomvibe_staging)
```

### Example Log Output (Blocked):
```
[DB Guard] FATAL: STAGING environment detected PRODUCTION database host!
[DB Guard] URL host: prod.neon.tech/roomvibe
[DB Guard] Production patterns detected: neon.tech, prod., production
```

---

## Troubleshooting

### "FATAL: No database URL provided"
→ Create PostgreSQL database in Replit or set `DATABASE_URL`

### "FATAL: STAGING environment detected PRODUCTION database host!"
→ You're using production DB in staging. Change `DATABASE_URL` to staging DB.

### STAGING badge not showing
→ Ensure `VITE_STAGING_ENVIRONMENT=true` is set and app is rebuilt

### DNS not working
→ Wait 30 minutes for propagation, then verify in Replit domain settings

---

## I) One-Time Data Clone: Production → Staging

To copy your production user account and gallery data to staging (so you can log in with the same password and see your exhibitions):

### Prerequisites

In **RoomVibe-staging**, temporarily add these environment variables:

| Key | Value | Purpose |
|-----|-------|---------|
| `DATABASE_URL_PRODUCTION` | `<your-production-neon-url>` | Read-only access to production |
| `ALLOW_PROD_TO_STAGING_CLONE` | `true` | Safety flag to allow clone |

### Run the Clone Command

In the **RoomVibe-staging** shell:

```bash
npm run staging:clone:irena
```

### What Gets Copied

For the user `irena.ratkovicmalbasa@gmail.com`:
- ✅ User profile (with same password hash)
- ✅ Artworks (artist module)
- ✅ Projects & room images (designer module)
- ✅ Gallery collections (with 360 scene data)
- ✅ Gallery artworks

### Safety Protections

The script will **ABORT** if:
- `STAGING_ENVIRONMENT` is not `true`
- `ALLOW_PROD_TO_STAGING_CLONE` is not `true`
- Production and staging DB URLs are the same
- User email not found in production

### After Clone

1. **Remove** `ALLOW_PROD_TO_STAGING_CLONE` from staging secrets
2. Optionally remove `DATABASE_URL_PRODUCTION` from staging
3. Log in to `staging.roomvibe.app` with your production password
4. Verify your galleries and artworks are visible

### Re-Running the Clone

If you run the clone again:
- Existing staging data for this user will be **deleted and replaced**
- Fresh copy from production will be created
- This is safe and idempotent

### Verification Checklist

After running `npm run staging:clone:irena`:

- [ ] Console shows "CLONE COMPLETE"
- [ ] Summary shows correct counts (artworks, collections, etc.)
- [ ] Can log in to staging with production password
- [ ] Galleries and exhibitions are visible
- [ ] 360 editor shows artworks on walls

---

## Rules Reminder

- ❌ DO NOT modify production repl `RoomVibe`
- ❌ DO NOT use production database in staging
- ❌ DO NOT enable Stripe in staging (keep `STRIPE_ENABLED=false`)
- ❌ DO NOT leave `ALLOW_PROD_TO_STAGING_CLONE=true` after clone
- ✅ Keep camera/navigation logic unchanged
