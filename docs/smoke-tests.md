# Smoke Tests - Staging Verification Checklist

Use this checklist before promoting any changes from staging to production.

---

## Environment Verification

### Staging Badge
- [ ] STAGING badge is visible in the UI
- [ ] Badge appears in header/footer area
- [ ] Badge only shows when `VITE_STAGING_ENVIRONMENT=true`

### Environment Variables
- [ ] `STAGING_ENVIRONMENT=true` is set
- [ ] `VITE_STAGING_ENVIRONMENT=true` is set  
- [ ] `STRIPE_ENABLED=false` is set
- [ ] Using staging database (not production)

### Database Guard
- [ ] Server logs confirm staging database connection
- [ ] No production database URL in use

---

## 360 Virtual Exhibition

### Gallery Rendering
- [ ] Gallery loads without errors
- [ ] Walls render white (#f2f2f2)
- [ ] Ceiling renders white (#f2f2f2)
- [ ] Floor renders dark grey (#2a2a2a) - **never black**
- [ ] Artwork frames display correctly
- [ ] Artworks load and display properly

### Camera Positions (All 4 Must Pass)
- [ ] **Entrance** - floor visible and dark grey
- [ ] **Center** - floor visible and dark grey
- [ ] **Back Left** - floor visible and dark grey
- [ ] **Back Right** - floor visible and dark grey

### Navigation
- [ ] Floor hotspots are visible and pulsing
- [ ] Clicking hotspots transitions camera smoothly
- [ ] No jittery or broken camera movement

### Console Checks
- [ ] No WebGL errors in browser console
- [ ] No "sampler overflow" errors
- [ ] No texture loading failures
- [ ] `[FLOOR_GUARD]` log appears if guard fixes any meshes (dev only)

---

## Stripe / Payments

### Stripe Disabled Verification
- [ ] Stripe checkout buttons are hidden or disabled
- [ ] No Stripe API calls in network tab
- [ ] Billing page shows appropriate messaging (if accessible)
- [ ] `/api/feature-flags` returns `stripeEnabled: false`

---

## Core Features

### Authentication
- [ ] Login works correctly
- [ ] Registration works correctly
- [ ] Session persists across page refreshes
- [ ] Logout clears session

### Studio Editor
- [ ] Scene panel loads room presets
- [ ] Artwork can be uploaded
- [ ] Artwork can be positioned and resized
- [ ] Frame selection works
- [ ] Export functions work (if enabled for plan)

### Dashboards
- [ ] User dashboard loads
- [ ] Artist dashboard loads (if applicable)
- [ ] Gallery dashboard loads (if applicable)
- [ ] No 500 errors on any dashboard route

---

## Performance

- [ ] Page loads in under 3 seconds
- [ ] No memory leaks during 360 gallery navigation
- [ ] Smooth 60fps during camera movement

---

## Final Verification

- [ ] Hard refresh (Ctrl+Shift+R) shows correct state
- [ ] All critical paths tested
- [ ] No console errors (warnings acceptable)
- [ ] Ready for production promotion

---

**Sign-off**: __________________ Date: __________
