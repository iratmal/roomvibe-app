# Release Workflow - Staging-First Deployment

## Golden Rule

**ALL changes must go to staging first. No exceptions.**

```
Development → Staging → Smoke Tests → Production
```

---

## Environment Overview

| Environment | Domain | Database | Stripe |
|-------------|--------|----------|--------|
| Development | localhost:5000 | Local/Dev DB | Disabled |
| Staging | staging.roomvibe.app | Staging DB | Disabled |
| Production | app.roomvibe.app | Production DB | Enabled |

### Staging Environment Variables
```
STAGING_ENVIRONMENT=true
VITE_STAGING_ENVIRONMENT=true
STRIPE_ENABLED=false
DATABASE_URL=<staging-database-url>
```

### Production Environment Variables
```
STAGING_ENVIRONMENT=false
VITE_STAGING_ENVIRONMENT=false
STRIPE_ENABLED=true
DATABASE_URL=<production-database-url>
```

---

## Deployment Process

### Step 1: Deploy to Staging

1. Commit all changes to main branch
2. Deploy to staging deployment (staging.roomvibe.app)
3. Wait for deployment to complete
4. Verify STAGING badge is visible

### Step 2: Run Smoke Tests

Complete the full checklist in `docs/smoke-tests.md`:

#### Quick Verification (Required)
- [ ] STAGING badge visible
- [ ] `/api/feature-flags` returns `stripeEnabled: false`
- [ ] No console errors on load

#### 360 Gallery Verification (Required)
- [ ] Gallery loads without black room
- [ ] All 4 camera positions show dark grey floor
- [ ] Navigation hotspots work
- [ ] No WebGL errors

#### Core Features (Required)
- [ ] Login/logout works
- [ ] Dashboard loads
- [ ] Studio editor functions

### Step 3: Sign-Off

Before production deployment:
- [ ] All smoke tests pass
- [ ] No critical bugs found
- [ ] Tested for at least 10 minutes
- [ ] Hard refresh verified (Ctrl+Shift+R)

### Step 4: Deploy to Production

1. Deploy to production deployment (app.roomvibe.app)
2. Wait for deployment to complete
3. Verify STAGING badge is NOT visible
4. Run abbreviated smoke test

#### Production Quick Check
- [ ] No STAGING badge
- [ ] Stripe enabled (`stripeEnabled: true`)
- [ ] 360 gallery renders correctly
- [ ] Login works

---

## Database Safety

### DB Guard Rules
- Staging must NEVER connect to production database
- Server logs must confirm correct database connection
- If unsure, check `DATABASE_URL` environment variable

### Database Sync
- Staging and production databases are independent
- Schema changes must be applied to both
- Test migrations on staging first

---

## Rollback Procedure

If issues are found in production:

1. **Immediate**: Rollback to previous deployment in Replit
2. **Document**: Note the issue in a bug report
3. **Fix**: Apply fix in development
4. **Re-deploy**: Follow staging-first workflow again

See `docs/rollback-plan.md` for detailed rollback procedures.

---

## 360 Gallery Specific Checks

These checks are MANDATORY for any release:

### Camera Positions (All Must Pass)
| Position | Expected Floor Color | Status |
|----------|---------------------|--------|
| Entrance | Dark grey (#2a2a2a) | [ ] |
| Center | Dark grey (#2a2a2a) | [ ] |
| Back Left | Dark grey (#2a2a2a) | [ ] |
| Back Right | Dark grey (#2a2a2a) | [ ] |

### Visual Elements
- [ ] Walls: White (#f2f2f2)
- [ ] Ceiling: White (#f2f2f2)
- [ ] Floor: Dark grey (#2a2a2a) - **NEVER BLACK**
- [ ] Artwork frames: Visible
- [ ] Navigation hotspots: Pulsing

### Console Verification
- [ ] No WebGL errors
- [ ] No sampler overflow errors
- [ ] No texture loading failures

---

## Locked Components

**DO NOT MODIFY** without explicit approval:
- Camera movement logic
- Camera controls
- 360 navigation / Street View feel
- Floor material strategy (MeshBasicMaterial)
- FloorGuard runtime protection

---

## Release Checklist Summary

```
[ ] Code complete and committed
[ ] Deployed to staging
[ ] STAGING badge visible
[ ] Smoke tests passed (see docs/smoke-tests.md)
[ ] 360 gallery verified (all 4 positions)
[ ] No console errors
[ ] Sign-off obtained
[ ] Deployed to production
[ ] Production quick check passed
[ ] Release complete
```

---

**Last Updated**: December 2024
