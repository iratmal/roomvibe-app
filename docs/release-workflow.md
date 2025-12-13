# RoomVibe Release Workflow

## Overview

This document outlines the step-by-step process for releasing new features to production.

## Release Process

### Phase 1: Development

1. **Develop Feature**
   - Work in the development environment
   - Use feature flags for new features
   - Write tests where applicable

2. **Local Testing**
   - Test feature with workflows running
   - Verify no console errors
   - Check responsive design

### Phase 2: Staging Deployment

1. **Prepare Staging**
   ```bash
   # Ensure staging environment variables are set
   FEATURE_GALLERY_ENABLED=true/false
   STRIPE_ENABLED=false
   STAGING_ENVIRONMENT=true
   ```

2. **Deploy to Staging**
   - Click "Deploy" in Replit
   - Select staging deployment configuration
   - Verify deployment completes successfully

3. **Staging Verification**
   - [ ] Application loads correctly
   - [ ] Authentication works
   - [ ] Core features functional
   - [ ] New feature works as expected
   - [ ] No console errors
   - [ ] API responses correct
   - [ ] Mobile responsiveness verified

### Phase 3: Production Deployment

1. **Pre-Production Checklist**
   - [ ] Staging verification complete
   - [ ] All team members notified
   - [ ] Rollback plan ready
   - [ ] Feature flags configured for production

2. **Production Environment Variables**
   ```bash
   FEATURE_GALLERY_ENABLED=true/false
   STRIPE_ENABLED=true
   STAGING_ENVIRONMENT=false
   ```

3. **Deploy to Production**
   - Update production deployment configuration
   - Deploy with production environment
   - Monitor for errors

4. **Post-Deployment Verification**
   - [ ] Application loads at app.roomvibe.app
   - [ ] Authentication works
   - [ ] Payment processing works (if enabled)
   - [ ] Monitor error logs for 30 minutes
   - [ ] Verify key user flows

## Feature Flag Release Strategy

### Soft Launch (Recommended)
1. Deploy with feature flag OFF
2. Enable for internal testing
3. Enable for beta users
4. Full rollout

### Hard Launch
1. Deploy with feature flag ON
2. Monitor closely
3. Be ready to rollback

## Hotfix Process

For critical bugs in production:

1. **Assess Impact**
   - Determine severity
   - Identify affected users

2. **Quick Fix**
   - Create minimal fix
   - Skip extensive staging if critical

3. **Deploy Hotfix**
   - Deploy to production immediately
   - Create follow-up ticket for proper testing

4. **Post-Mortem**
   - Document what went wrong
   - Update processes to prevent recurrence

## Communication

- Notify team before production deployments
- Document all deployments in project changelog
- Update replit.md with significant changes
