# RoomVibe Rollback Plan

## Overview

Emergency procedures for rolling back when issues occur in production or staging.

---

## Quick Reference: Disable Features

### Disable Gallery/Exhibitions in Under 2 Minutes

| What to Disable | Flag to Change | Set To |
|-----------------|----------------|--------|
| Gallery Dashboard only | `FEATURE_GALLERY_ENABLED` | `false` |
| Public Exhibitions + 360° Viewers | `FEATURE_EXHIBITION_PUBLIC_ENABLED` | `false` |
| All Gallery Features | Both flags | `false` |
| Payments | `STRIPE_ENABLED` | `false` |

### Replit Click Path:
1. **Deployments** → Click active deployment
2. **Edit Environment Variables**
3. Change flag value
4. **Redeploy** (< 1 minute)

---

## Rollback Methods

### Method 1: Feature Flag Toggle (Fastest - Under 2 Min)

**When to use:** Feature-specific issues, need immediate disable

**Steps:**
1. Open Replit project
2. Click **"Deploy"** button (top right)
3. Find your active deployment (green checkmark)
4. Click **"Edit"** or gear icon
5. In Environment Variables:
   - `FEATURE_GALLERY_ENABLED` → `false`
   - OR `FEATURE_EXHIBITION_PUBLIC_ENABLED` → `false`
6. Click **"Redeploy"**
7. Wait ~30 seconds for deployment

**Verification:**
- Visit `https://[domain]/api/feature-flags`
- Confirm flag shows `false`

---

### Method 2: Replit Checkpoints (Code Rollback - 5 Min)

**When to use:** Code bug, need to revert to previous version

**Steps:**
1. Open Replit project
2. Click **"Version History"** in left sidebar (clock icon)
3. Browse checkpoints by date/time
4. Find last known good checkpoint
5. Click **"Restore this version"**
6. Confirm restore
7. **Redeploy** if deployed

**Note:** Replit auto-creates checkpoints during development.

---

### Method 3: Previous Deployment (Instant Rollback - 2 Min)

**When to use:** New deployment broke something

**Steps:**
1. Click **"Deploy"** button
2. Find previous deployment in list
3. Click **"Promote"** or **"Rollback to this version"**
4. Wait for rollback to complete

---

## Database Rollback

### Staging Database (Replit PostgreSQL)

1. Open Replit project
2. Click **"Database"** in left sidebar
3. Look for **"Restore"** or **"Rollback"** option
4. Select restore point
5. Confirm restore

### Production Database (Neon PostgreSQL)

1. Log into Neon console
2. Go to your project
3. Click **"Branches"** or **"Backups"**
4. Select point-in-time recovery
5. Follow Neon's restore wizard

**⚠️ WARNING:** Database rollback affects all data since the restore point.

---

## Decision Tree

```
Issue Detected in Production
            │
            ├─> Is it a feature-specific issue?
            │         │
            │         └─> YES → Disable feature flag → Redeploy
            │
            ├─> Is it a code bug from recent deploy?
            │         │
            │         └─> YES → Use previous deployment or Replit checkpoint
            │
            ├─> Is it a database issue?
            │         │
            │         └─> YES → Contact Neon support for PITR
            │
            └─> Unknown cause?
                      │
                      └─> Disable all features → Investigate
```

---

## Severity Response Times

| Severity | Response | Rollback Trigger |
|----------|----------|------------------|
| **Critical** (app down) | Immediately | Within 5 minutes |
| **High** (major feature broken) | < 15 minutes | If fix not found in 15 min |
| **Medium** (minor feature broken) | < 1 hour | If fix is complex |
| **Low** (cosmetic) | Next business day | Usually not needed |

---

## Post-Rollback Actions

### Immediate (Within 1 Hour)
1. **Notify stakeholders** - Inform team of rollback
2. **Document** - Write what was rolled back and why
3. **Monitor** - Watch for any remaining issues

### Follow-Up (Within 24 Hours)
1. **Root Cause Analysis** - Identify what caused the issue
2. **Fix Forward** - Create proper fix in development
3. **Test on Staging** - Verify fix before production
4. **Update Docs** - Add learnings to prevent recurrence

---

## Emergency Contacts

- **Replit Support:** Via Replit dashboard (? icon)
- **Neon Support:** Via Neon console (production DB)

---

## Prevention Checklist

Before every deployment:
- [ ] Tested on staging first
- [ ] Feature flags configured correctly
- [ ] Database is correct for environment
- [ ] STRIPE_ENABLED=false confirmed
- [ ] Rollback plan understood
- [ ] Team notified of deployment
