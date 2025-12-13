# RoomVibe Rollback Plan

## Overview

This document provides procedures for rolling back the application when issues occur in production.

## Rollback Methods

### Method 1: Replit Checkpoints (Recommended)

Replit automatically creates checkpoints during development. To rollback:

1. **Access Checkpoints**
   - Open Replit project
   - Navigate to Version History / Checkpoints
   - Select a stable checkpoint

2. **Restore Checkpoint**
   - Click "Restore to this checkpoint"
   - Verify code reverted correctly
   - Redeploy to production

### Method 2: Feature Flag Toggle

For feature-specific issues:

1. **Disable Feature**
   ```bash
   # Set in production environment
   FEATURE_GALLERY_ENABLED=false
   ```

2. **Redeploy**
   - Restart the deployment
   - Feature will be hidden without code changes

### Method 3: Git Revert

For code-level rollback:

1. **Identify Last Good Commit**
   ```bash
   git log --oneline
   ```

2. **Create Revert**
   ```bash
   git revert HEAD
   # or revert specific commit
   git revert <commit-hash>
   ```

3. **Deploy Reverted Code**
   - Push changes
   - Redeploy application

## Database Rollback

### Staging Database
- Replit PostgreSQL supports rollback through Replit's database panel
- Can restore to previous state if needed

### Production Database (Neon)
- Contact Neon support for point-in-time recovery
- **Never** attempt manual schema changes during incident

## Rollback Decision Tree

```
Issue Detected
     │
     ├─> Feature-specific issue?
     │        │
     │        └─> YES → Toggle feature flag OFF
     │
     ├─> Code bug introduced recently?
     │        │
     │        └─> YES → Use Replit checkpoint or git revert
     │
     ├─> Database issue?
     │        │
     │        └─> YES → Contact database provider, do NOT make schema changes
     │
     └─> Unknown cause?
              │
              └─> Rollback to last known good checkpoint
```

## Rollback Timing Guidelines

| Severity | Response Time | Rollback Trigger |
|----------|---------------|------------------|
| Critical (app down) | Immediate | Within 5 minutes |
| High (major feature broken) | < 15 minutes | If fix not identified in 15 min |
| Medium (minor feature broken) | < 1 hour | If fix complex |
| Low (cosmetic issue) | Next business day | Usually not needed |

## Post-Rollback Actions

1. **Notify Stakeholders**
   - Inform team of rollback
   - Document what was rolled back

2. **Root Cause Analysis**
   - Identify what caused the issue
   - Document in incident report

3. **Fix Forward**
   - Create proper fix in development
   - Test thoroughly on staging
   - Re-deploy when confident

## Emergency Contacts

- Replit Support: Via Replit dashboard
- Neon Support: Via Neon console (for production database)

## Prevention Measures

1. Always test on staging first
2. Use feature flags for new features
3. Deploy during low-traffic periods
4. Have rollback plan ready before deploying
5. Monitor closely after deployments
