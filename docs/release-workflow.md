# Release Workflow - Classic Gallery 360

## Pre-Release Smoke Test Checklist

### 360 Editor Verification
1. Open 360 editor with any exhibition
2. Test all 4 camera positions:
   - [ ] Entrance - floor visible and dark grey
   - [ ] Center - floor visible and dark grey
   - [ ] Back Left - floor visible and dark grey
   - [ ] Back Right - floor visible and dark grey
3. Confirm floor is stable (never black)
4. Check browser console for WebGL errors (should be none)

### Development Console Check
In development mode, verify:
- [ ] `[FLOOR_GUARD]` log appears if guard fixes any meshes
- [ ] No WebGL sampler overflow errors

### Visual Verification
- [ ] Walls render white (#f2f2f2)
- [ ] Ceiling renders white (#f2f2f2)
- [ ] Floor renders dark grey (#2a2a2a)
- [ ] Artwork frames display correctly
- [ ] Navigation hotspots work

### Post-Publish Verification
1. Hard refresh browser (Ctrl+Shift+R)
2. Re-test all 4 camera positions
3. Confirm no console errors in production
