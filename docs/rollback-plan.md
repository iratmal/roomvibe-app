# Classic Gallery 360 - Rollback Plan

## Stabilization Notes (Dec 13, 2025)

### Material Strategy
- **Classic Gallery uses MeshBasicMaterial to avoid WebGL sampler limits.**
- MeshStandardMaterial was causing "Implementation limit of 16 active fragment shader samplers exceeded" errors.
- All walls, floors, ceilings, frames, and decorative elements now use MeshBasicMaterial.

### Floor Architecture
- **There are two floor meshes: outerEnclosureFloor and tiledFloorMain; both guarded.**
- `outerEnclosureFloor`: Large background plane at Y=-0.8 (in OuterEnclosure component)
- `tiledFloorMain` / `woodFloorMain`: Main gallery floor (in TiledFloor/WoodFloor components)

### FloorGuard Runtime Protection
- FloorGuard component (lines 146-194 in Gallery360Scene.tsx) runs on every scene mount
- Traverses scene and forces MeshBasicMaterial on any floor mesh with black color or non-Basic material
- Logs only in development mode; runs silently in production

### If Black Floor Regression Occurs
1. Check browser console for WebGL sampler errors
2. Verify no MeshStandardMaterial was reintroduced
3. Confirm FloorGuard is still in the Canvas component
4. Check that floor meshes have correct names (outerEnclosureFloor, tiledFloorMain, etc.)

### Key Files
- `src/components/360/Gallery360Scene.tsx` - Main scene with FloorGuard
