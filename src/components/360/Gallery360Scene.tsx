import React, { useRef, useState, useEffect, useCallback, Suspense, useMemo, Component, ErrorInfo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { Gallery360Preset, Slot, Hotspot, Viewpoint } from '../../config/gallery360Presets';
import { SlotAssignment } from './useArtworkSlots';

interface TextureErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
  slotLabel?: string;
}

interface TextureErrorBoundaryState {
  hasError: boolean;
}

class TextureErrorBoundary extends Component<TextureErrorBoundaryProps, TextureErrorBoundaryState> {
  constructor(props: TextureErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error): TextureErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[TextureErrorBoundary] Artwork texture failed to load:', {
      slotLabel: this.props.slotLabel,
      error: error.message,
      componentStack: errorInfo.componentStack
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function isValidArtworkUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  if (typeof url !== 'string') return false;
  if (url.trim() === '') return false;
  if (url.startsWith('data:image/')) return true;
  if (url.startsWith('/') && url.length > 1) return true;
  try {
    const parsed = new URL(url);
    if (!parsed.hostname || parsed.hostname.length < 3) return false;
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * VISUAL-STABLE: Classic Gallery 360 Scene
 * Do not modify lighting/materials in this scene without staging verification.
 * Last stabilized: 2024-12-13
 * 
 * IMPORTANT: Classic Gallery uses MeshBasicMaterial to avoid WebGL sampler limits.
 * There are two floor meshes: outerEnclosureFloor and tiledFloorMain; both guarded by FloorGuard.
 */

const GALLERY_WALL_COLOR = '#D5CFC5';     // Lighter warm beige for artwork walls
const GALLERY_CEILING_COLOR = '#E6E6E2'; // Warm light cream ceiling
const GALLERY_FLOOR_COLOR = '#D6D4CC';   // Warm light gray floor
const GALLERY_LIGHT_COLOR = '#FFF3E0';   // Warm light temperature
const ANTHRACITE_COLOR = '#3A3A3A';      // Premium anthracite for frames/accents

function DebugOverlay() {
  const { scene, gl } = useThree();
  const [info, setInfo] = useState<{
    lightsCount: number;
    lights: Array<{ type: string; intensity: number; color: string }>;
    toneMapping: string;
    exposure: number;
    outputColorSpace: string;
    wallMaterials: Array<{ type: string; color: string }>;
  } | null>(null);

  useEffect(() => {
    const lights: Array<{ type: string; intensity: number; color: string }> = [];
    const wallMaterials: Array<{ type: string; color: string }> = [];
    
    scene.traverse((obj) => {
      if (obj instanceof THREE.Light) {
        lights.push({
          type: obj.type,
          intensity: (obj as any).intensity || 0,
          color: obj.color ? `#${obj.color.getHexString()}` : 'N/A'
        });
      }
      if (obj instanceof THREE.Mesh && obj.material) {
        const mat = obj.material as THREE.MeshStandardMaterial;
        if (mat.type === 'MeshStandardMaterial' && mat.color) {
          const colorHex = `#${mat.color.getHexString()}`;
          if (!wallMaterials.find(w => w.color === colorHex)) {
            wallMaterials.push({ type: mat.type, color: colorHex });
          }
        }
      }
    });

    const toneMappingNames: Record<number, string> = {
      [THREE.NoToneMapping]: 'NoToneMapping',
      [THREE.LinearToneMapping]: 'LinearToneMapping',
      [THREE.ReinhardToneMapping]: 'ReinhardToneMapping',
      [THREE.CineonToneMapping]: 'CineonToneMapping',
      [THREE.ACESFilmicToneMapping]: 'ACESFilmicToneMapping',
    };

    setInfo({
      lightsCount: lights.length,
      lights: lights.slice(0, 10),
      toneMapping: toneMappingNames[gl.toneMapping] || `Unknown(${gl.toneMapping})`,
      exposure: gl.toneMappingExposure,
      outputColorSpace: gl.outputColorSpace,
      wallMaterials: wallMaterials.slice(0, 5)
    });
  }, [scene, gl]);

  if (!info) return null;

  return (
    <Html position={[0, 3, 0]} center style={{ pointerEvents: 'none' }}>
      <div style={{
        background: 'rgba(0,0,0,0.85)',
        color: '#0f0',
        padding: '12px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '11px',
        minWidth: '280px',
        border: '1px solid #0f0'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#ff0' }}>
          DEBUG: Gallery360 Diagnostics
        </div>
        <div><strong>Lights:</strong> {info.lightsCount} total</div>
        {info.lights.map((l, i) => (
          <div key={i} style={{ paddingLeft: '10px', fontSize: '10px' }}>
            {l.type}: intensity={l.intensity.toFixed(2)}, color={l.color}
          </div>
        ))}
        <div style={{ marginTop: '6px' }}>
          <strong>Renderer:</strong>
        </div>
        <div style={{ paddingLeft: '10px', fontSize: '10px' }}>
          ToneMapping: {info.toneMapping}
        </div>
        <div style={{ paddingLeft: '10px', fontSize: '10px' }}>
          Exposure: {info.exposure.toFixed(2)}
        </div>
        <div style={{ paddingLeft: '10px', fontSize: '10px' }}>
          ColorSpace: {info.outputColorSpace}
        </div>
        <div style={{ marginTop: '6px' }}>
          <strong>Materials ({info.wallMaterials.length}):</strong>
        </div>
        {info.wallMaterials.map((m, i) => (
          <div key={i} style={{ paddingLeft: '10px', fontSize: '10px' }}>
            {m.type}: {m.color}
          </div>
        ))}
      </div>
    </Html>
  );
}

function SafeWallMaterial({ color }: { color?: string }) {
  const safeColor = (color && color !== '#000000' && color !== '#000' && color !== 'black') ? color : GALLERY_WALL_COLOR;
  return <meshStandardMaterial color={safeColor} roughness={0.8} metalness={0} side={THREE.DoubleSide} />;
}

function SafeCeilingMaterial({ color }: { color?: string }) {
  const safeColor = (color && color !== '#000000' && color !== '#000' && color !== 'black') ? color : GALLERY_CEILING_COLOR;
  return <meshStandardMaterial color={safeColor} roughness={0.9} metalness={0} side={THREE.DoubleSide} />;
}

function SafeFloorMaterial({ color }: { color?: string }) {
  const safeColor = (color && color !== '#000000' && color !== '#000' && color !== 'black') ? color : GALLERY_FLOOR_COLOR;
  return <meshStandardMaterial color={safeColor} roughness={0.7} metalness={0} />;
}

// Hybrid Studio Gallery Materials - Subtle procedural textures for physical depth
// Uses MirroredRepeatWrapping to eliminate seams in tiled textures

// Enhanced plaster wall material with texture and roughness map for visual depth
function HybridPlasterWallMaterial({ color = '#F5F3F0' }: { color?: string }) {
  const { colorMap, roughnessMap } = useMemo(() => {
    const size = 512;
    
    // Color map with fine plaster texture
    const colorCanvas = document.createElement('canvas');
    colorCanvas.width = size;
    colorCanvas.height = size;
    const colorCtx = colorCanvas.getContext('2d')!;
    
    // Base warm off-white lime plaster
    colorCtx.fillStyle = '#F6F4F0';
    colorCtx.fillRect(0, 0, size, size);
    
    // Fine lime plaster grain with subtle warm variation
    const colorData = colorCtx.getImageData(0, 0, size, size);
    const cData = colorData.data;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        // Subtle warm-tinted noise (±3 levels)
        const noise = (Math.random() - 0.5) * 6;
        // Very slight vertical gradient for depth perception
        const verticalFade = (y / size) * 1.5;
        cData[i] = Math.min(255, Math.max(0, cData[i] + noise - verticalFade));
        cData[i + 1] = Math.min(255, Math.max(0, cData[i + 1] + noise * 0.95 - verticalFade));
        cData[i + 2] = Math.min(255, Math.max(0, cData[i + 2] + noise * 0.9 - verticalFade * 0.8));
      }
    }
    colorCtx.putImageData(colorData, 0, 0);
    
    // Subtle mineral grain and plaster texture
    colorCtx.globalAlpha = 0.015;
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = Math.random() * 2.5 + 0.5;
      colorCtx.fillStyle = Math.random() > 0.5 ? '#EAE7E2' : '#FDFCFA';
      colorCtx.beginPath();
      colorCtx.arc(x, y, r, 0, Math.PI * 2);
      colorCtx.fill();
    }
    
    // Roughness map - walls are more matte than floor for visual separation
    const roughCanvas = document.createElement('canvas');
    roughCanvas.width = size;
    roughCanvas.height = size;
    const roughCtx = roughCanvas.getContext('2d')!;
    
    // Higher roughness base for matte plaster look (darker = rougher)
    roughCtx.fillStyle = '#D0D0D0'; // ~81% roughness - noticeably more matte than floor
    roughCtx.fillRect(0, 0, size, size);
    
    // Subtle roughness variation
    const roughData = roughCtx.getImageData(0, 0, size, size);
    const rData = roughData.data;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        const noise = (Math.random() - 0.5) * 12;
        const val = Math.min(255, Math.max(0, 208 + noise));
        rData[i] = val;
        rData[i + 1] = val;
        rData[i + 2] = val;
      }
    }
    roughCtx.putImageData(roughData, 0, 0);
    
    const cTex = new THREE.CanvasTexture(colorCanvas);
    cTex.wrapS = THREE.MirroredRepeatWrapping;
    cTex.wrapT = THREE.MirroredRepeatWrapping;
    cTex.repeat.set(4, 4);
    cTex.minFilter = THREE.LinearMipmapLinearFilter;
    cTex.magFilter = THREE.LinearFilter;
    cTex.anisotropy = 4;
    
    const rTex = new THREE.CanvasTexture(roughCanvas);
    rTex.wrapS = THREE.MirroredRepeatWrapping;
    rTex.wrapT = THREE.MirroredRepeatWrapping;
    rTex.repeat.set(4, 4);
    rTex.minFilter = THREE.LinearMipmapLinearFilter;
    rTex.magFilter = THREE.LinearFilter;
    
    return { colorMap: cTex, roughnessMap: rTex };
  }, []);

  return (
    <meshStandardMaterial 
      color={color}
      map={colorMap}
      roughnessMap={roughnessMap}
      roughness={0.88}
      metalness={0}
      side={THREE.DoubleSide}
    />
  );
}

// Creates polished concrete floor with PBR properties - subtle reflection, texture grain
function HybridPolishedConcreteFloor({ color = '#E5E2DD' }: { color?: string }) {
  const { colorMap, roughnessMap } = useMemo(() => {
    const size = 512;
    
    // Color/Diffuse map
    const colorCanvas = document.createElement('canvas');
    colorCanvas.width = size;
    colorCanvas.height = size;
    const colorCtx = colorCanvas.getContext('2d')!;
    
    // Base polished concrete - warm light grey
    colorCtx.fillStyle = '#E8E5E0';
    colorCtx.fillRect(0, 0, size, size);
    
    // Polished concrete grain with subtle color variation
    const colorData = colorCtx.getImageData(0, 0, size, size);
    const cData = colorData.data;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        // Fine grain texture (±4 levels)
        const noise = (Math.random() - 0.5) * 8;
        // Slight warm tint variation
        cData[i] = Math.min(255, Math.max(0, cData[i] + noise));
        cData[i + 1] = Math.min(255, Math.max(0, cData[i + 1] + noise * 0.98));
        cData[i + 2] = Math.min(255, Math.max(0, cData[i + 2] + noise * 0.94));
      }
    }
    colorCtx.putImageData(colorData, 0, 0);
    
    // Polished aggregate spots - characteristic of polished concrete
    colorCtx.globalAlpha = 0.02;
    for (let i = 0; i < 120; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = Math.random() * 3 + 0.8;
      // Mix of lighter and slightly darker aggregate
      const tone = Math.random();
      if (tone < 0.4) colorCtx.fillStyle = '#D5D1CB';
      else if (tone < 0.7) colorCtx.fillStyle = '#F0EDE8';
      else colorCtx.fillStyle = '#C8C4BE';
      colorCtx.beginPath();
      colorCtx.arc(x, y, r, 0, Math.PI * 2);
      colorCtx.fill();
    }
    
    // Roughness map - controls reflection variation
    const roughCanvas = document.createElement('canvas');
    roughCanvas.width = size;
    roughCanvas.height = size;
    const roughCtx = roughCanvas.getContext('2d')!;
    
    // Base roughness (grey = mid roughness, lighter = smoother/more reflective)
    roughCtx.fillStyle = '#A8A8A8'; // ~66% roughness base
    roughCtx.fillRect(0, 0, size, size);
    
    // Subtle roughness variation for realistic polished look
    const roughData = roughCtx.getImageData(0, 0, size, size);
    const rData = roughData.data;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        // Variation in roughness (smoother spots = lighter)
        const noise = (Math.random() - 0.5) * 20;
        const val = Math.min(255, Math.max(0, 168 + noise));
        rData[i] = val;
        rData[i + 1] = val;
        rData[i + 2] = val;
      }
    }
    roughCtx.putImageData(roughData, 0, 0);
    
    const cTex = new THREE.CanvasTexture(colorCanvas);
    cTex.wrapS = THREE.MirroredRepeatWrapping;
    cTex.wrapT = THREE.MirroredRepeatWrapping;
    cTex.repeat.set(6, 6);
    cTex.minFilter = THREE.LinearMipmapLinearFilter;
    cTex.magFilter = THREE.LinearFilter;
    cTex.anisotropy = 8;
    
    const rTex = new THREE.CanvasTexture(roughCanvas);
    rTex.wrapS = THREE.MirroredRepeatWrapping;
    rTex.wrapT = THREE.MirroredRepeatWrapping;
    rTex.repeat.set(6, 6);
    rTex.minFilter = THREE.LinearMipmapLinearFilter;
    rTex.magFilter = THREE.LinearFilter;
    
    return { colorMap: cTex, roughnessMap: rTex };
  }, []);

  return (
    <meshStandardMaterial 
      color={color}
      map={colorMap}
      roughnessMap={roughnessMap}
      roughness={0.65}
      metalness={0.02}
    />
  );
}

// Floor brightness gradient overlay - lighter center, darker edges
function HybridFloorBrightnessGradient({ width, depth }: { width: number; depth: number }) {
  const gradientTexture = useMemo(() => {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    
    // Radial gradient - light center fading to slightly darker edges
    const gradient = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size * 0.7
    );
    gradient.addColorStop(0, 'rgba(255, 252, 248, 0.08)');   // Warm light center
    gradient.addColorStop(0.5, 'rgba(255, 252, 248, 0.03)'); // Fade
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');            // Transparent at edges
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }, []);

  return (
    <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width * 0.85, depth * 0.85]} />
      <meshBasicMaterial 
        map={gradientTexture}
        transparent
        opacity={1}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// Soft daylight studio lighting for Hybrid Studio
function HybridStudioLighting({ width, height, depth }: { width: number; height: number; depth: number }) {
  return (
    <>
      {/* Primary hemisphere light - soft sky/ground ambient */}
      <hemisphereLight
        args={['#F8F6F2', '#E8E4DC', 0.6]}
        position={[0, height, 0]}
      />
      
      {/* Soft overhead fill - simulates diffused daylight from above */}
      <directionalLight
        position={[0, height + 5, 0]}
        intensity={0.35}
        color="#FFFBF5"
        castShadow={false}
      />
      
      {/* Ambient fill - ensures no harsh shadows */}
      <ambientLight intensity={0.25} color="#FFF8F0" />
      
      {/* Soft rect area light from ceiling - even diffused studio light */}
      <rectAreaLight
        position={[0, height - 0.3, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        width={width * 0.7}
        height={depth * 0.7}
        intensity={0.4}
        color="#FFFAF5"
      />
      
      {/* Gentle side fill lights - prevent wall flatness */}
      <pointLight
        position={[width * 0.3, height * 0.6, depth * 0.3]}
        intensity={0.12}
        color="#FFF8F2"
        distance={width}
        decay={2}
      />
      <pointLight
        position={[-width * 0.3, height * 0.6, -depth * 0.3]}
        intensity={0.12}
        color="#FFF8F2"
        distance={width}
        decay={2}
      />
    </>
  );
}

// Hybrid Studio Micro Depth Shading - Phase 1B
// Extremely subtle gradients for grounded, physical feeling without lights/shadows

// Vertical wall gradient overlay - darker at bottom, lighter at top
// Creates grounded feeling without being consciously noticeable
function HybridWallGradientOverlay({ 
  width, 
  height, 
  position, 
  rotation = [0, 0, 0] 
}: { 
  width: number; 
  height: number; 
  position: [number, number, number]; 
  rotation?: [number, number, number];
}) {
  const gradientTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    
    // Extremely subtle vertical gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 64);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');      // Top - transparent
    gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.008)'); // Mid - barely visible
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.025)');   // Bottom - very subtle darkening
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 4, 64);
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }, []);

  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial 
        map={gradientTexture}
        transparent
        opacity={1}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Floor edge grounding - soft darkening where floor meets walls
// Removes "paper cutout" feeling with micro depth
function HybridFloorEdgeGrounding({ width, depth }: { width: number; depth: number }) {
  const edgeTexture = useMemo(() => {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    
    // Transparent center, very subtle darkening at edges
    const gradient = ctx.createRadialGradient(
      size / 2, size / 2, size * 0.35,  // Inner circle (transparent)
      size / 2, size / 2, size / 2       // Outer circle (subtle dark)
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.85, 'rgba(0, 0, 0, 0.012)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.028)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }, []);

  return (
    <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width, depth]} />
      <meshBasicMaterial 
        map={edgeTexture}
        transparent
        opacity={1}
        depthWrite={false}
      />
    </mesh>
  );
}

const FLOOR_MESH_NAMES = [
  'tiledFloorMain',
  'woodFloorMain', 
  'defaultFloorMain',
  'outerEnclosureFloor',
  'corridorFloor',
  'secondaryGalleryFloor',
  'floorClickArea'
];

function FloorGuard() {
  const { scene } = useThree();
  const hasRun = useRef(false);
  
  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    
    const fixedMeshes: string[] = [];
    const fallbackColor = new THREE.Color(GALLERY_FLOOR_COLOR);
    
    scene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      
      const meshName = obj.name || '';
      const isFloorMesh = FLOOR_MESH_NAMES.some(name => meshName.includes(name) || meshName.toLowerCase().includes('floor'));
      
      if (!isFloorMesh) return;
      if (meshName === 'floorClickArea') return;
      // Exempt Hybrid Studio floor - it uses PBR material with proper lighting
      if (meshName === 'hybridFloorMain') return;
      
      const mat = obj.material as THREE.Material;
      const hasColor = mat && 'color' in mat && (mat as any).color;
      const existingColor = hasColor ? (mat as any).color.clone() : null;
      
      const isBlackColor = existingColor && 
        (existingColor.getHexString() === '000000' || 
         existingColor.getHexString() === '000' ||
         (existingColor.r < 0.05 && existingColor.g < 0.05 && existingColor.b < 0.05));
      const isNotBasic = mat && mat.type !== 'MeshBasicMaterial';
      
      if (isBlackColor) {
        obj.material = new THREE.MeshBasicMaterial({ color: fallbackColor });
        fixedMeshes.push(`${meshName || `unnamed-${obj.uuid.slice(0, 8)}`} (black->safe)`);
      } else if (isNotBasic && existingColor) {
        obj.material = new THREE.MeshBasicMaterial({ color: existingColor });
        fixedMeshes.push(`${meshName || `unnamed-${obj.uuid.slice(0, 8)}`} (std->basic)`);
      } else if (isNotBasic) {
        obj.material = new THREE.MeshBasicMaterial({ color: fallbackColor });
        fixedMeshes.push(`${meshName || `unnamed-${obj.uuid.slice(0, 8)}`} (unknown->safe)`);
      }
    });
    
    // FloorGuard runs in all environments but logs only in development
    if (process.env.NODE_ENV === 'development' && fixedMeshes.length > 0) {
      console.log(`[FLOOR_GUARD] applied to ${fixedMeshes.length} meshes: ${fixedMeshes.join(', ')}`);
    }
  }, [scene]);
  
  return null;
}

export interface ArtworkFocusTarget {
  position: [number, number, number];
  rotation: [number, number, number];
  slotId: string;
}

interface Gallery360SceneProps {
  preset: Gallery360Preset;
  slotAssignments: SlotAssignment[];
  currentViewpoint: Viewpoint;
  onNavigate: (viewpointId: string) => void;
  onArtworkClick?: (slotId: string, assignment: SlotAssignment, slot: Slot) => void;
  isEditor?: boolean;
  selectedSlotId?: string;
  onSlotSelect?: (slotId: string) => void;
  focusTarget?: ArtworkFocusTarget | null;
  onFocusDismiss?: () => void;
}

function getProxiedImageUrl(url: string): string {
  if (url.startsWith('/') || url.startsWith('data:')) {
    return url;
  }
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

function FootstepMarker({ positionRef, visibleRef }: { positionRef: React.MutableRefObject<[number, number, number]>; visibleRef: React.MutableRefObject<boolean> }) {
  const groupRef = useRef<THREE.Group>(null);
  const opacityRef = useRef(0);
  
  useFrame(() => {
    if (!groupRef.current) return;
    
    // Instant position update - no lerp for position
    groupRef.current.position.set(positionRef.current[0], positionRef.current[1], positionRef.current[2]);
    
    // Fast opacity transition
    const targetOpacity = visibleRef.current ? 0.85 : 0;
    opacityRef.current = THREE.MathUtils.lerp(opacityRef.current, targetOpacity, 0.35);
    
    groupRef.current.children.forEach((child) => {
      if ((child as THREE.Mesh).material) {
        const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        mat.opacity = opacityRef.current;
      }
    });
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Outer ring - dark RoomVibe blue */}
      <mesh>
        <ringGeometry args={[0.28, 0.35, 32]} />
        <meshBasicMaterial color="#264C61" transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>
      {/* Inner circle - subtle fill */}
      <mesh position={[0, 0, 0.001]}>
        <circleGeometry args={[0.28, 32]} />
        <meshBasicMaterial color="#1a3040" transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>
      {/* Left footstep - gold */}
      <mesh position={[-0.06, 0.02, 0.002]}>
        <capsuleGeometry args={[0.035, 0.08, 4, 8]} />
        <meshBasicMaterial color="#D4AF37" transparent opacity={0} />
      </mesh>
      {/* Right footstep - gold */}
      <mesh position={[0.06, -0.02, 0.002]}>
        <capsuleGeometry args={[0.035, 0.08, 4, 8]} />
        <meshBasicMaterial color="#D4AF37" transparent opacity={0} />
      </mesh>
    </group>
  );
}

function Column({ position, height, color }: { 
  position: [number, number, number]; 
  height: number;
  color: string;
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={[0.35, height, 0.35]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

function Skylight({ position, width, depth }: {
  position: [number, number, number];
  width: number;
  depth: number;
}) {
  return (
    <group position={position}>
      <rectAreaLight
        position={[0, -0.1, 0]}
        width={width * 0.9}
        height={depth * 0.9}
        intensity={1.75}
        color={GALLERY_LIGHT_COLOR}
      />
    </group>
  );
}

function WallSpotlight({ position, targetY }: {
  position: [number, number, number];
  targetY: number;
}) {
  const spotlightRef = useRef<THREE.SpotLight>(null);
  const { scene } = useThree();

  useEffect(() => {
    if (spotlightRef.current) {
      const target = new THREE.Object3D();
      target.position.set(position[0], targetY, position[2]);
      scene.add(target);
      spotlightRef.current.target = target;
      return () => {
        scene.remove(target);
      };
    }
  }, [position, targetY, scene]);

  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.06, 0.10, 0.12, 16]} />
        <meshBasicMaterial color="#2a2a2a" />
      </mesh>
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.02, 16]} />
        <meshBasicMaterial color="#fff8e0" />
      </mesh>
    </group>
  );
}

function TiledFloor({ width, depth, color }: { width: number; depth: number; color: string }) {
  const tileData = useMemo(() => {
    const tileSize = 0.8;
    const groutWidth = 0.02;
    const tileActual = tileSize - groutWidth;
    const rows = Math.ceil(depth / tileSize);
    const cols = Math.ceil(width / tileSize);
    const tiles: Array<{ x: number; z: number; shade: number }> = [];
    
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
      return x - Math.floor(x);
    };
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const seed = row * 1000 + col;
        const x = -width / 2 + col * tileSize + tileSize / 2;
        const z = -depth / 2 + row * tileSize + tileSize / 2;
        if (x < width / 2 && x > -width / 2 && z < depth / 2 && z > -depth / 2) {
          const shade = 0.97 + seededRandom(seed) * 0.06;
          tiles.push({ x, z, shade });
        }
      }
    }
    return { tiles, tileActual, tileSize };
  }, [width, depth]);

  const baseColor = useMemo(() => new THREE.Color(GALLERY_FLOOR_COLOR), []);
  const groutColor = useMemo(() => new THREE.Color(GALLERY_FLOOR_COLOR).multiplyScalar(0.88), []);

  return (
    <group position={[0, 0.001, 0]}>
      {/* Grout base layer */}
      <mesh name="tiledFloorMain" rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshBasicMaterial color={groutColor} />
      </mesh>
      {/* Individual tiles with subtle shade variation */}
      {tileData.tiles.slice(0, 800).map((tile, i) => {
        const tileColor = baseColor.clone().multiplyScalar(tile.shade);
        return (
          <mesh
            key={i}
            position={[tile.x, 0.002, tile.z]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[tileData.tileActual, tileData.tileActual]} />
            <meshBasicMaterial color={tileColor} />
          </mesh>
        );
      })}
    </group>
  );
}

function ConcreteFloor({ width, depth, color }: { width: number; depth: number; color: string }) {
  const concreteData = useMemo(() => {
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
      return x - Math.floor(x);
    };
    
    const patches: Array<{ x: number; z: number; shade: number; size: number }> = [];
    for (let i = 0; i < 60; i++) {
      patches.push({
        x: (seededRandom(i * 3) - 0.5) * width * 0.95,
        z: (seededRandom(i * 5 + 1) - 0.5) * depth * 0.95,
        shade: 0.94 + seededRandom(i * 7 + 2) * 0.10,
        size: 1.2 + seededRandom(i * 11) * 2.5
      });
    }
    return patches;
  }, [width, depth]);

  const baseColor = useMemo(() => new THREE.Color(color), [color]);

  return (
    <group position={[0, 0.001, 0]}>
      {/* Main concrete floor - polished PBR */}
      <mesh name="concreteFloorMain" rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.50} 
          metalness={0.14}
          envMapIntensity={0.6}
        />
      </mesh>
      {/* Concrete variation patches - subtle texture */}
      {concreteData.map((patch, i) => {
        const patchColor = baseColor.clone().multiplyScalar(patch.shade);
        return (
          <mesh
            key={i}
            position={[patch.x, 0.002, patch.z]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <circleGeometry args={[patch.size, 12]} />
            <meshStandardMaterial color={patchColor} transparent opacity={0.12} roughness={0.8} metalness={0.05} />
          </mesh>
        );
      })}
      {/* Subtle floor joints/seams - polished concrete look */}
      {Array.from({ length: 5 }, (_, i) => (
        <mesh key={`joint-x-${i}`} position={[(i - 2) * (width / 4), 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.02, depth * 0.9]} />
          <meshBasicMaterial color="#A0A0A0" transparent opacity={0.25} />
        </mesh>
      ))}
      {Array.from({ length: 4 }, (_, i) => (
        <mesh key={`joint-z-${i}`} position={[0, 0.003, (i - 1.5) * (depth / 3)]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[width * 0.9, 0.02]} />
          <meshBasicMaterial color="#A0A0A0" transparent opacity={0.25} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshBasicMaterial color="#888888" transparent opacity={0.08} />
      </mesh>
    </group>
  );
}

function BrickWall({ 
  width, 
  height, 
  position, 
  rotation = [0, 0, 0],
  color = '#9A7B5A'
}: { 
  width: number; 
  height: number; 
  position: [number, number, number]; 
  rotation?: [number, number, number];
  color?: string;
}) {
  const brickData = useMemo(() => {
    const brickW = 0.22;
    const brickH = 0.065;
    const mortarGap = 0.012;
    const rows = Math.ceil(height / (brickH + mortarGap));
    const cols = Math.ceil(width / (brickW + mortarGap)) + 1;
    const bricks: Array<{ x: number; y: number; shade: number; hueShift: number }> = [];
    
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
      return x - Math.floor(x);
    };
    
    for (let row = 0; row < rows; row++) {
      const offset = (row % 2) * (brickW / 2 + mortarGap / 2);
      for (let col = 0; col < cols; col++) {
        const seed = row * 1000 + col;
        const x = -width / 2 + col * (brickW + mortarGap) + offset + brickW / 2;
        const y = row * (brickH + mortarGap) + brickH / 2;
        if (x < width / 2 && x > -width / 2 && y < height) {
          const shade = 0.88 + seededRandom(seed) * 0.18;
          const hueShift = seededRandom(seed + 500) * 0.05;
          bricks.push({ x, y, shade, hueShift });
        }
      }
    }
    return { bricks, brickW, brickH };
  }, [width, height]);

  const baseBrickColor = useMemo(() => new THREE.Color(color), [color]);
  const mortarColor = useMemo(() => new THREE.Color('#E0DAD0'), []);

  return (
    <group position={position} rotation={rotation}>
      {/* Mortar base - light-responsive */}
      <mesh receiveShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={mortarColor} roughness={0.85} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      {brickData.bricks.map((brick, i) => {
        const brickColor = baseBrickColor.clone().multiplyScalar(brick.shade);
        brickColor.offsetHSL(brick.hueShift - 0.06, 0, 0);
        return (
          <mesh
            key={i}
            position={[brick.x, brick.y - height / 2, 0.003]}
            receiveShadow
          >
            <planeGeometry args={[brickData.brickW, brickData.brickH]} />
            <meshStandardMaterial
              color={brickColor}
              roughness={0.82}
              metalness={0.01}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function PartitionWall({
  position,
  rotation,
  width,
  height,
  color
}: {
  position: [number, number, number];
  rotation: number;
  width: number;
  height: number;
  color: string;
}) {
  const thickness = 0.18;
  
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Main partition wall - enhanced PBR with shadows */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, thickness]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.92} 
          metalness={0.02} 
          side={THREE.DoubleSide}
          envMapIntensity={0.15}
        />
      </mesh>
      {/* Subtle base shadow/ambient occlusion */}
      <mesh position={[0, -height / 2 + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width + 0.3, thickness + 0.4]} />
        <meshBasicMaterial color="#888888" transparent opacity={0.15} />
      </mesh>
      {/* Top cap - subtle edge */}
      <mesh position={[0, height / 2 + 0.02, 0]} castShadow>
        <boxGeometry args={[width + 0.04, 0.04, thickness + 0.04]} />
        <meshStandardMaterial color="#4A4640" roughness={0.5} metalness={0.3} />
      </mesh>
    </group>
  );
}

/**
 * OuterEnclosure creates TWO floor meshes:
 * 1. outerEnclosureFloor - large plane below gallery (-0.8 Y offset)
 * 2. The gallery's main floor (tiledFloorMain/woodFloorMain) from TiledFloor/WoodFloor
 * Both must use MeshBasicMaterial to avoid WebGL sampler overflow.
 * FloorGuard provides runtime protection if materials regress.
 */
function OuterEnclosure({ width, height, depth }: { width: number; height: number; depth: number }) {
  const size = Math.max(width, depth) + 80;
  const verticalSize = height + 60;
  
  return (
    <group>
      <mesh name="outerEnclosureBox">
        <boxGeometry args={[size, verticalSize, size]} />
        <meshBasicMaterial color="#c0c0c0" side={THREE.BackSide} />
      </mesh>
      <mesh name="outerEnclosureFloor" position={[0, -0.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size, size]} />
        <meshBasicMaterial color={GALLERY_FLOOR_COLOR} />
      </mesh>
    </group>
  );
}

function WoodFloor({ width, depth, color }: { width: number; depth: number; color: string }) {
  const floorData = useMemo(() => {
    const plankWidth = 0.15;
    const plankLength = 1.2;
    const gapSize = 0.004;
    const rows = Math.ceil(depth / (plankWidth + gapSize)) + 1;
    const cols = Math.ceil(width / plankLength) + 3;
    const planks: Array<{ x: number; z: number; shade: number; roughVar: number; grainAngle: number }> = [];
    
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
      return x - Math.floor(x);
    };
    
    for (let row = 0; row < rows; row++) {
      const offset = (row % 4) * (plankLength / 4);
      for (let col = 0; col < cols; col++) {
        const seed = row * 1000 + col;
        const x = -width / 2 + col * plankLength + offset - plankLength / 2;
        const z = -depth / 2 + row * (plankWidth + gapSize) + plankWidth / 2;
        if (x < width / 2 + plankLength && x > -width / 2 - plankLength && 
            z < depth / 2 && z > -depth / 2) {
          const shade = 0.88 + seededRandom(seed) * 0.24;
          const roughVar = 0.45 + seededRandom(seed + 100) * 0.2;
          const grainAngle = (seededRandom(seed + 200) - 0.5) * 0.02;
          planks.push({ x, z, shade, roughVar, grainAngle });
        }
      }
    }
    return { planks, plankWidth, plankLength, gapSize };
  }, [width, depth]);

  return (
    <group position={[0, 0.001, 0]}>
      <mesh name="woodFloorMain" rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshBasicMaterial color={GALLERY_FLOOR_COLOR} />
      </mesh>
    </group>
  );
}

function WoodFloorOriginal({ width, depth, color }: { width: number; depth: number; color: string }) {
  // Original WoodFloor code preserved for future restoration
  const floorData = useMemo(() => {
    const plankWidth = 0.15;
    const plankLength = 1.2;
    const gapSize = 0.004;
    const rows = Math.ceil(depth / (plankWidth + gapSize)) + 1;
    const cols = Math.ceil(width / plankLength) + 3;
    const planks: Array<{ x: number; z: number; shade: number; roughVar: number; grainAngle: number }> = [];
    
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
      return x - Math.floor(x);
    };
    
    for (let row = 0; row < rows; row++) {
      const offset = (row % 4) * (plankLength / 4);
      for (let col = 0; col < cols; col++) {
        const seed = row * 1000 + col;
        const x = -width / 2 + col * plankLength + offset - plankLength / 2;
        const z = -depth / 2 + row * (plankWidth + gapSize) + plankWidth / 2;
        if (x < width / 2 + plankLength && x > -width / 2 - plankLength && 
            z < depth / 2 && z > -depth / 2) {
          const shade = 0.88 + seededRandom(seed) * 0.24;
          const roughVar = 0.45 + seededRandom(seed + 100) * 0.2;
          const grainAngle = (seededRandom(seed + 200) - 0.5) * 0.02;
          planks.push({ x, z, shade, roughVar, grainAngle });
        }
      }
    }
    return { planks, plankWidth, plankLength, gapSize };
  }, [width, depth]);

  const baseColor = useMemo(() => new THREE.Color('#c4a882'), []);
  const gapColor = useMemo(() => new THREE.Color('#3a3530'), []);

  return (
    <group position={[0, 0.001, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshBasicMaterial color={gapColor} />
      </mesh>
      
      {floorData.planks.slice(0, 600).map((plank, i) => {
        const plankColor = baseColor.clone().multiplyScalar(plank.shade);
        return (
          <mesh
            key={i}
            position={[plank.x, 0.002, plank.z]}
            rotation={[-Math.PI / 2, plank.grainAngle, 0]}
          >
            <planeGeometry args={[floorData.plankLength - 0.006, floorData.plankWidth - 0.003]} />
            <meshBasicMaterial color={plankColor} />
          </mesh>
        );
      })}
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0025, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshBasicMaterial color="#d4c4a8" transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

function GalleryRoom({ preset }: { preset: Gallery360Preset }) {
  const { width, height, depth } = preset.dimensions;
  const halfW = width / 2;
  const halfD = depth / 2;

  const columnPositions = useMemo(() => {
    if (!preset.hasColumns) return [];
    const positions: [number, number, number][] = [];
    const colSpacingX = width / 4;
    const colSpacingZ = depth / 3;
    
    for (let x = -1; x <= 1; x += 2) {
      for (let z = -1; z <= 1; z++) {
        positions.push([x * colSpacingX * 0.7, height / 2, z * colSpacingZ * 0.5]);
      }
    }
    return positions;
  }, [preset.hasColumns, width, height, depth]);

  const skylightPositions = useMemo(() => {
    if (!preset.hasSkylights) return [];
    const cofferW = width / 3 - 0.6;
    const cofferD = depth / 3 - 0.6;
    return [
      { position: [-width/3, height + 0.06, -depth/3] as [number, number, number], width: cofferW, depth: cofferD },
      { position: [width/3, height + 0.06, -depth/3] as [number, number, number], width: cofferW, depth: cofferD },
      { position: [-width/3, height + 0.06, depth/3] as [number, number, number], width: cofferW, depth: cofferD },
      { position: [width/3, height + 0.06, depth/3] as [number, number, number], width: cofferW, depth: cofferD },
    ];
  }, [preset.hasSkylights, height, depth, width]);

  const spotlightPositions = useMemo(() => {
    const spots: Array<{ position: [number, number, number]; targetY: number }> = [];
    
    for (let x = -halfW + 3; x < halfW; x += 4) {
      spots.push({ position: [x, height - 0.3, -halfD + 0.5], targetY: 1.6 });
      spots.push({ position: [x, height - 0.3, halfD - 0.5], targetY: 1.6 });
    }
    spots.push({ position: [-halfW + 0.5, height - 0.3, -2], targetY: 1.6 });
    spots.push({ position: [-halfW + 0.5, height - 0.3, 2], targetY: 1.6 });
    spots.push({ position: [halfW - 0.5, height - 0.3, -2], targetY: 1.6 });
    spots.push({ position: [halfW - 0.5, height - 0.3, 2], targetY: 1.6 });
    
    return spots;
  }, [width, height, depth, halfW, halfD]);

  return (
    <group>
      <OuterEnclosure width={width} height={height} depth={depth} />
      
      {preset.floorType === 'wood' ? (
        <WoodFloor width={width} depth={depth} color={preset.floorColor} />
      ) : preset.floorType === 'tile' ? (
        <TiledFloor width={width} depth={depth} color={preset.floorColor} />
      ) : preset.floorType === 'concrete' ? (
        <ConcreteFloor width={width} depth={depth} color={preset.floorColor} />
      ) : preset.id === 'hybrid-studio' ? (
        <>
          <mesh name="hybridFloorMain" position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[width, depth]} />
            <HybridPolishedConcreteFloor color={preset.floorColor} />
          </mesh>
          {/* Brightness gradient - lighter center, darker edges */}
          <HybridFloorBrightnessGradient width={width} depth={depth} />
        </>
      ) : (
        <mesh name="defaultFloorMain" position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[width, depth]} />
          <SafeFloorMaterial color={preset.floorColor} />
        </mesh>
      )}
      
      {/* Invisible clickable floor for walk-to navigation */}
      <mesh 
        name="floorClickArea"
        position={[0, 0.01, 0]} 
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[width - 1, depth - 1]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Ceiling - different style based on preset */}
      {preset.id === 'industrial-loft' ? (
        <>
          {/* INDUSTRIAL LOFT: Enhanced PBR ceiling with panels and ambient occlusion */}
          {/* Main ceiling with subtle concrete texture */}
          <mesh position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[width, depth]} />
            <meshStandardMaterial 
              color="#F5F3EF" 
              roughness={0.85} 
              metalness={0.02}
            />
          </mesh>
          
          {/* Ceiling panel grid - subtle depth and ambient occlusion effect */}
          {Array.from({ length: 5 }, (_, xi) => 
            Array.from({ length: 4 }, (_, zi) => ({
              x: (xi - 2) * (width / 5),
              z: (zi - 1.5) * (depth / 4),
              key: `panel-${xi}-${zi}`
            }))
          ).flat().map((panel) => (
            <group key={panel.key} position={[panel.x, height - 0.01, panel.z]}>
              {/* Panel recess - creates depth */}
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <planeGeometry args={[width / 5.5, depth / 4.5]} />
                <meshStandardMaterial color="#EFEDE8" roughness={0.9} metalness={0} />
              </mesh>
              {/* Panel edge shadow - ambient occlusion simulation */}
              <mesh position={[0, 0.005, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <planeGeometry args={[width / 5.2, depth / 4.2]} />
                <meshBasicMaterial color="#E8E5E0" transparent opacity={0.4} />
              </mesh>
            </group>
          ))}
          
          {/* Steel trusses with PBR material - light silver like reference */}
          {[-depth/3, 0, depth/3].map((zPos, i) => (
            <group key={`truss-${i}`}>
              {/* Bottom chord - silvery steel */}
              <mesh position={[0, height - 0.55, zPos]} castShadow>
                <boxGeometry args={[width + 0.3, 0.08, 0.08]} />
                <meshStandardMaterial color="#8A8E96" roughness={0.35} metalness={0.75} />
              </mesh>
              {/* Top chord */}
              <mesh position={[0, height - 0.05, zPos]} castShadow>
                <boxGeometry args={[width + 0.3, 0.05, 0.05]} />
                <meshStandardMaterial color="#8A8E96" roughness={0.35} metalness={0.75} />
              </mesh>
              {/* Diagonal V-members */}
              {Array.from({ length: 7 }, (_, j) => {
                const xStart = -width/2 + (j + 0.5) * (width / 7);
                const isUp = j % 2 === 0;
                return (
                  <mesh 
                    key={`v-diag-${i}-${j}`} 
                    position={[xStart, height - 0.30, zPos]} 
                    rotation={[0, 0, isUp ? 0.55 : -0.55]}
                    castShadow
                  >
                    <boxGeometry args={[0.05, 0.55, 0.05]} />
                    <meshStandardMaterial color="#8A8E96" roughness={0.35} metalness={0.75} />
                  </mesh>
                );
              })}
              {/* Vertical posts */}
              {[-width/3, 0, width/3].map((xPos, k) => (
                <mesh key={`vert-${i}-${k}`} position={[xPos, height - 0.30, zPos]} castShadow>
                  <boxGeometry args={[0.05, 0.50, 0.05]} />
                  <meshStandardMaterial color="#8A8E96" roughness={0.35} metalness={0.75} />
                </mesh>
              ))}
            </group>
          ))}
          
          {/* Cross braces - silvery */}
          {[-width/3, 0, width/3].map((xPos, i) => (
            <mesh key={`cross-brace-${i}`} position={[xPos, height - 0.5, 0]} castShadow>
              <boxGeometry args={[0.06, 0.06, depth - 3]} />
              <meshStandardMaterial color="#8A8E96" roughness={0.35} metalness={0.75} />
            </mesh>
          ))}
          
          {/* ENHANCED WINDOWS - North wall with realistic glass and external light */}
          {[-6, 6].map((xPos, i) => (
            <group key={`window-north-${i}`} position={[xPos, height * 0.55, -halfD]}>
              {/* Deep window recess - concrete/brick jamb */}
              <mesh position={[0, 0, 0.30]}>
                <boxGeometry args={[3.4, 3.8, 0.6]} />
                <meshStandardMaterial color="#5A5652" roughness={0.85} metalness={0.1} />
              </mesh>
              {/* Window sill */}
              <mesh position={[0, -1.7, 0.35]}>
                <boxGeometry args={[3.2, 0.12, 0.5]} />
                <meshStandardMaterial color="#6A6662" roughness={0.75} metalness={0.15} />
              </mesh>
              {/* Steel window frame - outer */}
              <mesh position={[0, 0, 0.12]}>
                <boxGeometry args={[3.1, 3.5, 0.1]} />
                <meshStandardMaterial color="#2A2826" roughness={0.35} metalness={0.8} />
              </mesh>
              {/* Glass pane - realistic with reflection */}
              <mesh position={[0, 0, 0.18]}>
                <planeGeometry args={[2.9, 3.3]} />
                <meshStandardMaterial 
                  color="#C8D8E4" 
                  transparent 
                  opacity={0.25} 
                  roughness={0.05} 
                  metalness={0.4}
                  envMapIntensity={0.8}
                />
              </mesh>
              {/* Sky/daylight behind glass - very bright */}
              <mesh position={[0, 0.3, 0.02]}>
                <planeGeometry args={[3.0, 3.4]} />
                <meshBasicMaterial color="#F4FAFF" />
              </mesh>
              <mesh position={[0, -0.8, 0.025]}>
                <planeGeometry args={[3.0, 1.8]} />
                <meshBasicMaterial color="#FFFFFF" />
              </mesh>
              {/* Steel mullions - industrial grid */}
              <mesh position={[0, 0, 0.20]}>
                <boxGeometry args={[0.06, 3.4, 0.04]} />
                <meshStandardMaterial color="#2A2826" roughness={0.35} metalness={0.8} />
              </mesh>
              <mesh position={[0, 0, 0.20]}>
                <boxGeometry args={[3.0, 0.06, 0.04]} />
                <meshStandardMaterial color="#2A2826" roughness={0.35} metalness={0.8} />
              </mesh>
              {[-1.0, 1.0].map((yOff, j) => (
                <mesh key={`hmull-n-${i}-${j}`} position={[0, yOff, 0.20]}>
                  <boxGeometry args={[3.0, 0.05, 0.04]} />
                  <meshStandardMaterial color="#2A2826" roughness={0.35} metalness={0.8} />
                </mesh>
              ))}
              {[-0.75, 0.75].map((xOff, j) => (
                <mesh key={`vmull-n-${i}-${j}`} position={[xOff, 0, 0.20]}>
                  <boxGeometry args={[0.05, 3.4, 0.04]} />
                  <meshStandardMaterial color="#2A2826" roughness={0.35} metalness={0.8} />
                </mesh>
              ))}
            </group>
          ))}
          
          {/* Daylight patches on floor from North windows - realistic falloff */}
          {[-6, 6].map((xPos, i) => (
            <group key={`daylight-north-${i}`}>
              {/* Main light patch - brighter */}
              <mesh position={[xPos, 0.008, -halfD + 3.5]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[3.5, 5]} />
                <meshBasicMaterial color="#FFFEF8" transparent opacity={0.30} />
              </mesh>
              {/* Gradient falloff */}
              <mesh position={[xPos, 0.006, -halfD + 6]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[4.5, 4]} />
                <meshBasicMaterial color="#FAFAF4" transparent opacity={0.18} />
              </mesh>
            </group>
          ))}
          
          {/* ENHANCED WINDOWS - Side walls */}
          {[-halfW, halfW].map((xPos, wallIdx) => (
            <group key={`window-side-${wallIdx}`}>
              {[-4, 4].map((zPos, j) => (
                <group key={`window-${wallIdx}-${j}`} position={[xPos, height * 0.55, zPos]} rotation={[0, wallIdx === 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
                  {/* Deep window recess */}
                  <mesh position={[0, 0, 0.30]}>
                    <boxGeometry args={[3.0, 3.6, 0.6]} />
                    <meshStandardMaterial color="#5A5652" roughness={0.85} metalness={0.1} />
                  </mesh>
                  {/* Window sill */}
                  <mesh position={[0, -1.6, 0.35]}>
                    <boxGeometry args={[2.8, 0.12, 0.5]} />
                    <meshStandardMaterial color="#6A6662" roughness={0.75} metalness={0.15} />
                  </mesh>
                  {/* Steel frame */}
                  <mesh position={[0, 0, 0.12]}>
                    <boxGeometry args={[2.7, 3.3, 0.1]} />
                    <meshStandardMaterial color="#2A2826" roughness={0.35} metalness={0.8} />
                  </mesh>
                  {/* Glass pane */}
                  <mesh position={[0, 0, 0.18]}>
                    <planeGeometry args={[2.5, 3.1]} />
                    <meshStandardMaterial 
                      color="#C8D8E4" 
                      transparent 
                      opacity={0.25} 
                      roughness={0.05} 
                      metalness={0.4}
                      envMapIntensity={0.8}
                    />
                  </mesh>
                  {/* Daylight behind - very bright */}
                  <mesh position={[0, 0.2, 0.02]}>
                    <planeGeometry args={[2.6, 3.2]} />
                    <meshBasicMaterial color="#F4FAFF" />
                  </mesh>
                  {/* Mullions */}
                  <mesh position={[0, 0, 0.20]}>
                    <boxGeometry args={[0.05, 3.2, 0.04]} />
                    <meshStandardMaterial color="#2A2826" roughness={0.35} metalness={0.8} />
                  </mesh>
                  <mesh position={[0, 0, 0.20]}>
                    <boxGeometry args={[2.6, 0.05, 0.04]} />
                    <meshStandardMaterial color="#2A2826" roughness={0.35} metalness={0.8} />
                  </mesh>
                </group>
              ))}
            </group>
          ))}
          
          {/* Side window daylight patches with falloff */}
          {[
            { x: -halfW + 2.5, z: -4, dir: 1 },
            { x: -halfW + 2.5, z: 4, dir: 1 },
            { x: halfW - 2.5, z: -4, dir: -1 },
            { x: halfW - 2.5, z: 4, dir: -1 }
          ].map((pos, i) => (
            <group key={`daylight-side-${i}`}>
              <mesh position={[pos.x, 0.008, pos.z]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[3.5, 3]} />
                <meshBasicMaterial color="#FFFEF8" transparent opacity={0.15} />
              </mesh>
              <mesh position={[pos.x + pos.dir * 1.5, 0.006, pos.z]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[3, 3.5]} />
                <meshBasicMaterial color="#FAFAF4" transparent opacity={0.08} />
              </mesh>
            </group>
          ))}
          
          {/* INDUSTRIAL LOFT LIGHTING - bright daylit warehouse feel */}
          {/* Soft ambient base - warm white */}
          <ambientLight intensity={0.65} color="#FFF8F2" />
          {/* Hemisphere - bright sky top, warm ground */}
          <hemisphereLight args={['#EEF4FF', '#C8BEB0', 1.3]} position={[0, height, 0]} />
          {/* Main directional daylight from north windows */}
          <directionalLight
            position={[0, height * 0.85, -halfD + 2]}
            intensity={1.1}
            color="#FFF5E8"
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-near={0.5}
            shadow-camera-far={60}
            shadow-camera-left={-16}
            shadow-camera-right={16}
            shadow-camera-top={12}
            shadow-camera-bottom={-2}
            shadow-bias={-0.0005}
            shadow-radius={5}
          />
          {/* North wall window fill lights - bright daylight entering */}
          <pointLight position={[-6, height * 0.55, -halfD + 1.5]} intensity={1.2} color="#F0F6FF" distance={16} decay={2} />
          <pointLight position={[6, height * 0.55, -halfD + 1.5]} intensity={1.2} color="#F0F6FF" distance={16} decay={2} />
          {/* East side window fill lights */}
          <pointLight position={[halfW - 1.5, height * 0.55, -4]} intensity={0.9} color="#FFF8F0" distance={14} decay={2} />
          <pointLight position={[halfW - 1.5, height * 0.55, 4]} intensity={0.9} color="#FFF8F0" distance={14} decay={2} />
          {/* West side window fill lights */}
          <pointLight position={[-halfW + 1.5, height * 0.55, -4]} intensity={0.9} color="#FFF8F0" distance={14} decay={2} />
          <pointLight position={[-halfW + 1.5, height * 0.55, 4]} intensity={0.9} color="#FFF8F0" distance={14} decay={2} />
          {/* Ceiling fill - simulate industrial track lighting glow */}
          <pointLight position={[0, height - 0.4, 0]} intensity={0.5} color="#FFF9F0" distance={20} decay={1.5} />
        </>
      ) : preset.id === 'modern-gallery-v2' ? (
        <>
          {/* MODERN GALLERY: Light minimalist ceiling - PERFORMANCE OPTIMIZED */}
          {/* Main ceiling - light off-white */}
          <mesh position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[width, depth]} />
            <meshBasicMaterial color={preset.ceilingColor} />
          </mesh>
          
          {/* Single large skylight - visual only, no dynamic lights */}
          <group>
            {/* Skylight recess/frame */}
            <mesh position={[0, height - 0.03, 0]}>
              <boxGeometry args={[width * 0.6, 0.1, depth * 0.4]} />
              <meshBasicMaterial color="#E8E4E0" />
            </mesh>
            {/* Skylight glass - bright white for daylight impression */}
            <mesh position={[0, height - 0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <planeGeometry args={[width * 0.55, depth * 0.35]} />
              <meshBasicMaterial color="#FFFFFF" />
            </mesh>
          </group>
          
          {/* Subtle ceiling edge trim */}
          {[
            { pos: [0, height - 0.04, -halfD + 0.08] as [number, number, number], size: [width, 0.08, 0.16] as [number, number, number] },
            { pos: [0, height - 0.04, halfD - 0.08] as [number, number, number], size: [width, 0.08, 0.16] as [number, number, number] },
            { pos: [-halfW + 0.08, height - 0.04, 0] as [number, number, number], size: [0.16, 0.08, depth] as [number, number, number] },
            { pos: [halfW - 0.08, height - 0.04, 0] as [number, number, number], size: [0.16, 0.08, depth] as [number, number, number] },
          ].map((trim, i) => (
            <mesh key={`ceil-trim-${i}`} position={trim.pos}>
              <boxGeometry args={trim.size} />
              <meshBasicMaterial color="#E0DCD8" />
            </mesh>
          ))}
          
          {/* Minimal track fixtures - visual only, NO lights */}
          {[-halfW + 3, halfW - 3].map((xPos, i) => (
            <group key={`modern-track-${i}`}>
              <mesh position={[xPos, height - 0.02, 0]}>
                <boxGeometry args={[0.02, 0.02, depth - 4]} />
                <meshBasicMaterial color="#3A3A3A" />
              </mesh>
              {[-depth/3, 0, depth/3].map((zPos, j) => (
                <mesh key={`fixture-${i}-${j}`} position={[xPos, height - 0.06, zPos]}>
                  <cylinderGeometry args={[0.03, 0.04, 0.05, 6]} />
                  <meshBasicMaterial color="#2A2A2A" />
                </mesh>
              ))}
            </group>
          ))}
          
          {/* Simple uniform lighting - like Classic Gallery for smooth performance */}
          <hemisphereLight args={['#FAFCFF', '#E0DCD8', 0.9]} position={[0, height, 0]} />
          <ambientLight intensity={0.5} color="#FAFAFA" />
        </>
      ) : preset.id === 'hybrid-studio' ? (
        <>
          {/* HYBRID STUDIO: Premium ceiling with darker beams, lighter panels, soft ambient shading */}
          {/* Main ceiling base - light warm white */}
          <mesh position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[width, depth]} />
            <meshStandardMaterial color="#FAF8F5" roughness={0.92} metalness={0} />
          </mesh>
          
          {/* Ceiling panel grid - lighter recessed panels with darker beam shadows */}
          {Array.from({ length: 4 }, (_, xi) => 
            Array.from({ length: 3 }, (_, zi) => ({
              x: (xi - 1.5) * (width / 4),
              z: (zi - 1) * (depth / 3),
              key: `hybrid-panel-${xi}-${zi}`
            }))
          ).flat().map((panel) => (
            <group key={panel.key} position={[panel.x, height - 0.005, panel.z]}>
              {/* Recessed panel - lighter than surrounding */}
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <planeGeometry args={[width / 4.8, depth / 3.6]} />
                <meshStandardMaterial color="#FFFFFF" roughness={0.95} metalness={0} />
              </mesh>
            </group>
          ))}
          
          {/* Ceiling beam grid - darker grey beams */}
          {/* Horizontal beams (along X axis) */}
          {[-depth/3, 0, depth/3].map((zPos, i) => (
            <mesh key={`hybrid-beam-x-${i}`} position={[0, height - 0.06, zPos]}>
              <boxGeometry args={[width - 0.2, 0.12, 0.14]} />
              <meshStandardMaterial color="#4A4845" roughness={0.75} metalness={0.05} />
            </mesh>
          ))}
          {/* Vertical beams (along Z axis) */}
          {[-width/4, 0, width/4].map((xPos, i) => (
            <mesh key={`hybrid-beam-z-${i}`} position={[xPos, height - 0.06, 0]}>
              <boxGeometry args={[0.14, 0.12, depth - 0.2]} />
              <meshStandardMaterial color="#4A4845" roughness={0.75} metalness={0.05} />
            </mesh>
          ))}
          
          {/* Edge cove - subtle perimeter shadow */}
          {[
            { pos: [0, height - 0.04, -halfD + 0.06] as [number, number, number], size: [width, 0.08, 0.12] as [number, number, number] },
            { pos: [0, height - 0.04, halfD - 0.06] as [number, number, number], size: [width, 0.08, 0.12] as [number, number, number] },
            { pos: [-halfW + 0.06, height - 0.04, 0] as [number, number, number], size: [0.12, 0.08, depth] as [number, number, number] },
            { pos: [halfW - 0.06, height - 0.04, 0] as [number, number, number], size: [0.12, 0.08, depth] as [number, number, number] },
          ].map((cove, i) => (
            <mesh key={`hybrid-cove-${i}`} position={cove.pos}>
              <boxGeometry args={cove.size} />
              <meshStandardMaterial color="#5A5855" roughness={0.8} metalness={0} />
            </mesh>
          ))}
          
          {/* Hybrid Studio Soft Daylight Lighting */}
          <HybridStudioLighting width={width} height={height} depth={depth} />
        </>
      ) : (
        <>
          {/* CLASSIC GALLERY: Warm coffered ceiling */}
          <mesh position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[width, depth]} />
            <SafeCeilingMaterial color={GALLERY_CEILING_COLOR} />
          </mesh>
          
          {/* Cove edge - lighter dark grey for contrast */}
          {[
            { pos: [0, height - 0.12, -halfD + 0.12] as [number, number, number], size: [width - 0.24, 0.24, 0.24] as [number, number, number] },
            { pos: [0, height - 0.12, halfD - 0.12] as [number, number, number], size: [width - 0.24, 0.24, 0.24] as [number, number, number] },
            { pos: [-halfW + 0.12, height - 0.12, 0] as [number, number, number], size: [0.24, 0.24, depth - 0.48] as [number, number, number] },
            { pos: [halfW - 0.12, height - 0.12, 0] as [number, number, number], size: [0.24, 0.24, depth - 0.48] as [number, number, number] },
          ].map((cove, i) => (
            <mesh key={`cove-${i}`} position={cove.pos}>
              <boxGeometry args={cove.size} />
              <meshBasicMaterial color="#3A3A3A" />
            </mesh>
          ))}
          
          {/* Coffered ceiling grid - 3x3 sections */}
          {/* Main beams - premium dark grey */}
          {[-depth/3, 0, depth/3].map((zPos, i) => (
            <mesh key={`beam-main-x-${i}`} position={[0, height - 0.12, zPos]}>
              <boxGeometry args={[width - 0.3, 0.24, 0.20]} />
              <meshBasicMaterial color="#2F2F2F" />
            </mesh>
          ))}
          {/* Cross beams - premium dark grey */}
          {[-width/3, 0, width/3].map((xPos, i) => (
            <mesh key={`beam-main-z-${i}`} position={[xPos, height - 0.12, 0]}>
              <boxGeometry args={[0.20, 0.24, depth - 0.3]} />
              <meshBasicMaterial color="#2F2F2F" />
            </mesh>
          ))}
          
          {/* Recessed coffer panels - 9 sections - light warm off-white */}
          {[-1, 0, 1].flatMap(xi => [-1, 0, 1].map(zi => ({
            x: xi * (width / 3),
            z: zi * (depth / 3),
            w: width / 3 - 0.25,
            d: depth / 3 - 0.25
          }))).map((panel, i) => (
            <group key={`coffer-${i}`} position={[panel.x, height, panel.z]}>
              {/* Recessed ceiling panel */}
              <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                <planeGeometry args={[panel.w, panel.d]} />
                <SafeCeilingMaterial color={GALLERY_CEILING_COLOR} />
              </mesh>
            </group>
          ))}
          
          {/* Track lines - lighter dark grey */}
          {[-width/3 - width/6, -width/6, width/6, width/3 + width/6].map((xPos, i) => (
            <mesh key={`track-${i}`} position={[xPos, height - 0.01, 0]}>
              <boxGeometry args={[0.03, 0.03, depth - 0.8]} />
              <meshBasicMaterial color="#3A3A3A" />
            </mesh>
          ))}
        </>
      )}

      {/* Gallery walls - different style per preset */}
      {preset.wallType === 'brick' ? (
        <>
          {/* North wall - brick */}
          <BrickWall width={width} height={height} position={[0, height / 2, -halfD]} color={preset.wallColor} />
          {/* East wall - brick */}
          <BrickWall width={depth} height={height} position={[halfW, height / 2, 0]} rotation={[0, -Math.PI / 2, 0]} color={preset.wallColor} />
          {/* West wall - brick */}
          <BrickWall width={depth} height={height} position={[-halfW, height / 2, 0]} rotation={[0, Math.PI / 2, 0]} color={preset.wallColor} />
        </>
      ) : (
        <>
          <mesh position={[0, height / 2, -halfD]} receiveShadow>
            <planeGeometry args={[width, height]} />
            {preset.id === 'modern-gallery-v2' ? (
              <meshStandardMaterial color={preset.wallColor} roughness={0.85} metalness={0} side={THREE.DoubleSide} />
            ) : preset.id === 'hybrid-studio' ? (
              <HybridPlasterWallMaterial color={preset.wallColor} />
            ) : (
              <SafeWallMaterial color={GALLERY_WALL_COLOR} />
            )}
          </mesh>
          <mesh position={[halfW, height / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
            <planeGeometry args={[depth, height]} />
            {preset.id === 'modern-gallery-v2' ? (
              <meshStandardMaterial color={preset.wallColor} roughness={0.85} metalness={0} side={THREE.DoubleSide} />
            ) : preset.id === 'hybrid-studio' ? (
              <HybridPlasterWallMaterial color={preset.wallColor} />
            ) : (
              <SafeWallMaterial color={GALLERY_WALL_COLOR} />
            )}
          </mesh>
          <mesh position={[-halfW, height / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
            <planeGeometry args={[depth, height]} />
            {preset.id === 'modern-gallery-v2' ? (
              <meshStandardMaterial color={preset.wallColor} roughness={0.85} metalness={0} side={THREE.DoubleSide} />
            ) : preset.id === 'hybrid-studio' ? (
              <HybridPlasterWallMaterial color={preset.wallColor} />
            ) : (
              <SafeWallMaterial color={GALLERY_WALL_COLOR} />
            )}
          </mesh>
        </>
      )}

      {/* South wall with entrance opening */}
      <SouthWallWithOpening 
        width={width} 
        height={height} 
        halfD={halfD}
        portalW={3.5}
        portalH={3.5}
        wallColor={preset.wallType === 'brick' ? preset.wallColor : (preset.id === 'modern-gallery-v2' ? preset.wallColor : (preset.id === 'hybrid-studio' ? preset.wallColor : GALLERY_WALL_COLOR))}
        isModern={preset.id === 'modern-gallery-v2'}
        isHybrid={preset.id === 'hybrid-studio'}
        isBrick={preset.wallType === 'brick'}
      />

      {/* Hybrid Studio Micro Depth Shading - Phase 1B */}
      {preset.id === 'hybrid-studio' && (
        <>
          {/* Vertical wall gradients - darker at bottom, lighter at top */}
          <HybridWallGradientOverlay 
            width={width} 
            height={height} 
            position={[0, height / 2, -halfD + 0.01]} 
          />
          <HybridWallGradientOverlay 
            width={depth} 
            height={height} 
            position={[halfW - 0.01, height / 2, 0]} 
            rotation={[0, -Math.PI / 2, 0]}
          />
          <HybridWallGradientOverlay 
            width={depth} 
            height={height} 
            position={[-halfW + 0.01, height / 2, 0]} 
            rotation={[0, Math.PI / 2, 0]}
          />
          <HybridWallGradientOverlay 
            width={width} 
            height={height} 
            position={[0, height / 2, halfD - 0.01]} 
            rotation={[0, Math.PI, 0]}
          />
          {/* Floor edge grounding - soft darkening at wall/floor junction */}
          <HybridFloorEdgeGrounding width={width} depth={depth} />
        </>
      )}

      {/* Partition walls for Industrial Loft */}
      {preset.hasPartitionWalls && preset.partitionWalls?.map((wall) => (
        <PartitionWall
          key={wall.id}
          position={wall.position}
          rotation={wall.rotation}
          width={wall.width}
          height={wall.height}
          color={preset.partitionWallColor || '#E8E0D5'}
        />
      ))}

      {columnPositions.map((pos, i) => (
        <Column
          key={`col-${i}`}
          position={pos}
          height={height}
          color={preset.columnColor || '#1a1a1a'}
        />
      ))}

      {skylightPositions.map((skylight, i) => (
        <Skylight
          key={`sky-${i}`}
          position={skylight.position}
          width={skylight.width}
          depth={skylight.depth}
        />
      ))}

      {spotlightPositions.map((spot, i) => (
        <WallSpotlight
          key={`spot-${i}`}
          position={spot.position}
          targetY={spot.targetY}
        />
      ))}

      {/* Gallery Benches & Decorative Vases - only for Classic Gallery */}
      {preset.id === 'white-cube-v1' && (
        <>
          {/* Ceiling ambient light - illuminates ceiling beams and panels */}
          <hemisphereLight 
            args={[GALLERY_LIGHT_COLOR, '#a09080', 0.4]} 
            position={[0, height + 2, 0]}
          />
          <rectAreaLight
            position={[0, height - 0.5, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            width={width * 0.8}
            height={depth * 0.8}
            intensity={0.28}
            color={GALLERY_LIGHT_COLOR}
          />
          
          {/* Designer benches with premium dark grey */}
          <GalleryBench position={[-3.0, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
          <GalleryBench position={[3.0, 0, 0]} rotation={[0, -Math.PI / 2, 0]} />
          
          {/* Decorative vases in all 4 corners */}
          <DecorativeVase position={[-(halfW - 0.8), 0, -(halfD - 0.8)]} />
          <DecorativeVase position={[(halfW - 0.8), 0, -(halfD - 0.8)]} />
          <DecorativeVase position={[-(halfW - 0.8), 0, (halfD - 0.8)]} />
          <DecorativeVase position={[(halfW - 0.8), 0, (halfD - 0.8)]} />
        </>
      )}

      {/* Entrance Portal - realistic opening with depth on south wall */}
      <EntrancePortal 
        position={[0, 0, halfD - 0.01]} 
        rotation={[0, Math.PI, 0]}
      />
    </group>
  );
}

function GalleryBench({ position, rotation }: { position: [number, number, number]; rotation: [number, number, number] }) {
  const BENCH_L = 2.0;   // 200cm length
  const BENCH_W = 0.50;  // 50cm depth
  const BENCH_H = 0.45;  // 45cm seat height

  return (
    <group position={position} rotation={rotation}>
      {/* Minimalist premium dark grey cube bench - no legs, pure block form */}
      <mesh position={[0, BENCH_H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[BENCH_L, BENCH_H, BENCH_W]} />
        <meshBasicMaterial color="#2F2F2F" />
      </mesh>
    </group>
  );
}

function DecorativeVase({ position }: { position: [number, number, number] }) {
  const VASE_H = 1.8;     // 180cm height - elegant proportions
  const BASE_R = 0.18;    // base radius
  const MID_R = 0.22;     // widest point
  const TOP_R = 0.12;     // narrow neck

  return (
    <group position={position}>
      {/* Main body - premium anthracite ceramic */}
      <mesh position={[0, VASE_H * 0.4, 0]}>
        <cylinderGeometry args={[MID_R, BASE_R, VASE_H * 0.8, 32]} />
        <meshStandardMaterial color={ANTHRACITE_COLOR} roughness={0.4} metalness={0.1} />
      </mesh>
      
      {/* Neck - tapered top section */}
      <mesh position={[0, VASE_H * 0.85, 0]}>
        <cylinderGeometry args={[TOP_R, MID_R, VASE_H * 0.3, 32]} />
        <meshStandardMaterial color={ANTHRACITE_COLOR} roughness={0.4} metalness={0.1} />
      </mesh>
      
      {/* Rim at top */}
      <mesh position={[0, VASE_H, 0]}>
        <torusGeometry args={[TOP_R, 0.015, 16, 32]} />
        <meshStandardMaterial color="#2A2A2A" roughness={0.3} metalness={0.15} />
      </mesh>
      
      {/* Base ring for grounding */}
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[BASE_R, BASE_R + 0.02, 0.02, 32]} />
        <meshStandardMaterial color="#2A2A2A" roughness={0.35} metalness={0.1} />
      </mesh>
    </group>
  );
}

function EntrancePortal({ position, rotation }: { position: [number, number, number]; rotation: [number, number, number] }) {
  const PORTAL_W = 3.5;
  const PORTAL_H = 3.5;
  const FRAME_T = 0.12;
  const CORRIDOR_DEPTH = 4.0;
  const SECONDARY_W = 8.0;
  const SECONDARY_D = 6.0;

  return (
    <group position={position} rotation={rotation}>
      {/* Portal Frame - premium anthracite architectural frame */}
      <group>
        {/* Left post - wider for realism */}
        <mesh position={[-(PORTAL_W / 2) - (FRAME_T / 2), PORTAL_H / 2, 0]} castShadow>
          <boxGeometry args={[FRAME_T * 1.5, PORTAL_H, FRAME_T * 1.5]} />
          <meshStandardMaterial color={ANTHRACITE_COLOR} roughness={0.6} metalness={0.05} />
        </mesh>
        {/* Right post */}
        <mesh position={[(PORTAL_W / 2) + (FRAME_T / 2), PORTAL_H / 2, 0]} castShadow>
          <boxGeometry args={[FRAME_T * 1.5, PORTAL_H, FRAME_T * 1.5]} />
          <meshStandardMaterial color={ANTHRACITE_COLOR} roughness={0.6} metalness={0.05} />
        </mesh>
        {/* Top lintel - thicker header */}
        <mesh position={[0, PORTAL_H + (FRAME_T * 0.75), 0]} castShadow>
          <boxGeometry args={[PORTAL_W + FRAME_T * 3, FRAME_T * 1.5, FRAME_T * 1.5]} />
          <meshStandardMaterial color={ANTHRACITE_COLOR} roughness={0.6} metalness={0.05} />
        </mesh>
        {/* Inner chamfer/reveal on left */}
        <mesh position={[-(PORTAL_W / 2) + 0.02, PORTAL_H / 2, -0.03]}>
          <boxGeometry args={[0.04, PORTAL_H, 0.06]} />
          <meshStandardMaterial color="#2F2F2F" roughness={0.5} metalness={0.05} />
        </mesh>
        {/* Inner chamfer/reveal on right */}
        <mesh position={[(PORTAL_W / 2) - 0.02, PORTAL_H / 2, -0.03]}>
          <boxGeometry args={[0.04, PORTAL_H, 0.06]} />
          <meshStandardMaterial color="#2F2F2F" roughness={0.5} metalness={0.05} />
        </mesh>
      </group>

      {/* Entrance corridor */}
      <group>
        {/* Corridor left wall - warm gallery color */}
        <mesh position={[-(PORTAL_W / 2) - (FRAME_T / 2), PORTAL_H / 2, -CORRIDOR_DEPTH / 2]}>
          <boxGeometry args={[FRAME_T, PORTAL_H, CORRIDOR_DEPTH]} />
          <SafeWallMaterial color={GALLERY_WALL_COLOR} />
        </mesh>
        {/* Corridor right wall - warm gallery color */}
        <mesh position={[(PORTAL_W / 2) + (FRAME_T / 2), PORTAL_H / 2, -CORRIDOR_DEPTH / 2]}>
          <boxGeometry args={[FRAME_T, PORTAL_H, CORRIDOR_DEPTH]} />
          <SafeWallMaterial color={GALLERY_WALL_COLOR} />
        </mesh>
        {/* Corridor ceiling */}
        <mesh position={[0, PORTAL_H, -CORRIDOR_DEPTH / 2]}>
          <boxGeometry args={[PORTAL_W + FRAME_T * 2, 0.08, CORRIDOR_DEPTH]} />
          <SafeCeilingMaterial color={GALLERY_CEILING_COLOR} />
        </mesh>
        {/* Corridor floor - matching gallery tiles */}
        <mesh name="corridorFloor" position={[0, 0.005, -CORRIDOR_DEPTH / 2]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[PORTAL_W, CORRIDOR_DEPTH]} />
          <SafeFloorMaterial color={GALLERY_FLOOR_COLOR} />
        </mesh>
      </group>

      {/* Secondary gallery space visible through corridor */}
      <group position={[0, 0, -CORRIDOR_DEPTH]}>
        {/* Secondary gallery floor - same tiles, extends further */}
        <mesh name="secondaryGalleryFloor" position={[0, 0.003, -SECONDARY_D / 2]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[SECONDARY_W, SECONDARY_D]} />
          <SafeFloorMaterial color={GALLERY_FLOOR_COLOR} />
        </mesh>
        
        {/* Secondary gallery back wall - slightly darker */}
        <mesh position={[0, PORTAL_H / 2, -SECONDARY_D]}>
          <boxGeometry args={[SECONDARY_W, PORTAL_H + 0.5, 0.15]} />
          <SafeWallMaterial color={GALLERY_WALL_COLOR} />
        </mesh>
        
        {/* Secondary gallery left wall */}
        <mesh position={[-SECONDARY_W / 2, PORTAL_H / 2, -SECONDARY_D / 2]}>
          <boxGeometry args={[0.15, PORTAL_H + 0.5, SECONDARY_D]} />
          <SafeWallMaterial color={GALLERY_WALL_COLOR} />
        </mesh>
        
        {/* Secondary gallery right wall */}
        <mesh position={[SECONDARY_W / 2, PORTAL_H / 2, -SECONDARY_D / 2]}>
          <boxGeometry args={[0.15, PORTAL_H + 0.5, SECONDARY_D]} />
          <SafeWallMaterial color={GALLERY_WALL_COLOR} />
        </mesh>
        
        {/* Secondary gallery ceiling */}
        <mesh position={[0, PORTAL_H + 0.2, -SECONDARY_D / 2]}>
          <boxGeometry args={[SECONDARY_W, 0.1, SECONDARY_D]} />
          <SafeCeilingMaterial color={GALLERY_CEILING_COLOR} />
        </mesh>

        {/* Dimmer ambient lighting in secondary space */}
        <pointLight 
          position={[0, PORTAL_H * 0.85, -SECONDARY_D * 0.4]} 
          intensity={0.18} 
          distance={10} 
          color={GALLERY_LIGHT_COLOR}
        />
        <pointLight 
          position={[-2, PORTAL_H * 0.7, -SECONDARY_D * 0.6]} 
          intensity={0.1} 
          distance={6} 
          color={GALLERY_LIGHT_COLOR}
        />
        <pointLight 
          position={[2, PORTAL_H * 0.7, -SECONDARY_D * 0.6]} 
          intensity={0.1} 
          distance={6} 
          color={GALLERY_LIGHT_COLOR}
        />
      </group>

      {/* Corridor lighting - subtle */}
      <pointLight 
        position={[0, PORTAL_H * 0.8, -CORRIDOR_DEPTH * 0.3]} 
        intensity={0.2} 
        distance={5} 
        color={GALLERY_LIGHT_COLOR}
      />
    </group>
  );
}

function SouthWallWithOpening({ 
  width, 
  height, 
  halfD,
  portalW,
  portalH,
  wallColor,
  isModern,
  isHybrid = false,
  isBrick = false
}: { 
  width: number; 
  height: number; 
  halfD: number;
  portalW: number;
  portalH: number;
  wallColor: string;
  isModern: boolean;
  isHybrid?: boolean;
  isBrick?: boolean;
}) {
  const leftWidth = (width - portalW) / 2;
  const rightWidth = (width - portalW) / 2;
  const topHeight = height - portalH;

  if (isBrick) {
    return (
      <group position={[0, 0, halfD]}>
        <BrickWall width={leftWidth} height={height} position={[-(width / 2 - leftWidth / 2), height / 2, 0]} rotation={[0, Math.PI, 0]} color={wallColor} />
        <BrickWall width={rightWidth} height={height} position={[(width / 2 - rightWidth / 2), height / 2, 0]} rotation={[0, Math.PI, 0]} color={wallColor} />
        <BrickWall width={portalW} height={topHeight} position={[0, portalH + topHeight / 2, 0]} rotation={[0, Math.PI, 0]} color={wallColor} />
      </group>
    );
  }

  // Select material based on gallery type
  const WallMaterialComponent = isModern 
    ? ({ color }: { color: string }) => <meshStandardMaterial color={color} roughness={0.85} metalness={0} side={THREE.DoubleSide} />
    : isHybrid 
    ? HybridPlasterWallMaterial
    : SafeWallMaterial;

  return (
    <group position={[0, 0, halfD]}>
      {/* Left section of wall */}
      <mesh position={[-(width / 2 - leftWidth / 2), height / 2, 0]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[leftWidth, height]} />
        <WallMaterialComponent color={wallColor} />
      </mesh>

      {/* Right section of wall */}
      <mesh position={[(width / 2 - rightWidth / 2), height / 2, 0]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[rightWidth, height]} />
        <WallMaterialComponent color={wallColor} />
      </mesh>

      {/* Top section above portal */}
      <mesh position={[0, portalH + topHeight / 2, 0]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[portalW, topHeight]} />
        <WallMaterialComponent color={wallColor} />
      </mesh>
    </group>
  );
}

function ArtworkPlane({ 
  slot, 
  assignment, 
  onClick,
  isSelected,
  isEditor,
  presetId,
  wallHeight
}: { 
  slot: Slot; 
  assignment?: SlotAssignment;
  onClick?: () => void;
  isSelected?: boolean;
  isEditor?: boolean;
  presetId?: string;
  wallHeight?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const hasValidArtwork = isValidArtworkUrl(assignment?.artworkUrl);

  const errorFallback = (
    <group>
      <mesh>
        <planeGeometry args={[slot.width * 0.9, slot.height * 0.9]} />
        <meshBasicMaterial color="#f0e0e0" />
      </mesh>
      <Html center>
        <div className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs whitespace-nowrap pointer-events-none">
          Failed to load
        </div>
      </Html>
    </group>
  );

  return (
    <group position={slot.position} rotation={slot.rotation}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <planeGeometry args={[slot.width, slot.height]} />
        <meshBasicMaterial 
          color={hovered ? '#e0e0e0' : '#d0d0d0'}
          transparent
          opacity={hasValidArtwork ? 0 : 0.3}
        />
      </mesh>

      {hasValidArtwork && (
        <TextureErrorBoundary key={assignment?.artworkUrl} fallback={errorFallback} slotLabel={slot.label}>
          <Suspense fallback={
            <mesh>
              <planeGeometry args={[slot.width * 0.9, slot.height * 0.9]} />
              <meshBasicMaterial color="#cccccc" />
            </mesh>
          }>
            <ArtworkImage 
              url={assignment!.artworkUrl!} 
              slotWidth={slot.width}
              slotHeight={slot.height}
              assignmentWidth={assignment?.width}
              assignmentHeight={assignment?.height}
              onClick={onClick}
              hovered={hovered}
              setHovered={setHovered}
              presetId={presetId}
              wallHeight={wallHeight}
            />
          </Suspense>
        </TextureErrorBoundary>
      )}

      {!hasValidArtwork && isEditor && (
        <Html center>
          <div className="bg-white/80 px-2 py-1 rounded text-xs text-gray-600 whitespace-nowrap pointer-events-none">
            {slot.label}
          </div>
        </Html>
      )}
    </group>
  );
}

// Global artwork scale multiplier - makes all artworks larger relative to room
const ARTWORK_GLOBAL_SCALE = 1.6;

// Frame and canvas configuration for realistic gallery look
const FRAME_CONFIG = {
  thickness: 0.035,      // 3.5cm frame border width
  depth: 0.05,           // 5cm total depth (frame + canvas) - increased for better shadow
  canvasDepth: 0.025,    // 2.5cm canvas body depth
  color: '#1a1a1a',      // Dark charcoal/black frame
  canvasEdge: '#f0ede6', // Off-white canvas edge visible between frame and image
  wallOffset: 0.035      // 3.5cm offset from wall - increased for better shadow visibility
};

function ArtworkImage({ 
  url, 
  slotWidth,
  slotHeight,
  assignmentWidth,
  assignmentHeight,
  onClick,
  hovered,
  setHovered,
  presetId,
  wallHeight
}: { 
  url: string; 
  slotWidth: number;
  slotHeight: number;
  assignmentWidth?: number;
  assignmentHeight?: number;
  onClick?: () => void;
  hovered: boolean;
  setHovered: (h: boolean) => void;
  presetId?: string;
  wallHeight?: number;
}) {
  const { gl } = useThree();
  const proxiedUrl = getProxiedImageUrl(url);
  const texture = useTexture(proxiedUrl);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  
  useEffect(() => {
    if (texture) {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = gl.capabilities.getMaxAnisotropy();
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;
      texture.needsUpdate = true;
      
      if (texture.image) {
        const img = texture.image as HTMLImageElement;
        setImageDimensions({
          width: img.width || img.naturalWidth || 100,
          height: img.height || img.naturalHeight || 100
        });
      }
    }
  }, [texture, gl]);

  const dimensions = useMemo(() => {
    // Max constraints based on wall height
    const maxHeight = wallHeight ? wallHeight * 0.55 : 2.5;
    const maxWidth = wallHeight ? wallHeight * 0.9 : 4.0;
    
    let baseWidth: number;
    let baseHeight: number;
    let source: string;

    // Priority 1: Use stored artwork dimensions (cm -> meters)
    if (assignmentWidth && assignmentHeight && assignmentWidth > 0 && assignmentHeight > 0) {
      baseWidth = assignmentWidth / 100;
      baseHeight = assignmentHeight / 100;
      source = 'stored_cm';
    } 
    // Priority 2: Derive from actual image aspect ratio
    else if (imageDimensions && imageDimensions.width > 0 && imageDimensions.height > 0) {
      const aspect = imageDimensions.width / imageDimensions.height;
      const BASE_SIZE = 1.0;
      
      if (imageDimensions.height > imageDimensions.width) {
        baseHeight = BASE_SIZE;
        baseWidth = BASE_SIZE * aspect;
      } else {
        baseWidth = BASE_SIZE;
        baseHeight = BASE_SIZE / aspect;
      }
      source = 'image_aspect';
    } 
    // Fallback
    else {
      console.log('[DebugSize] FALLBACK - no dimensions available', { assignmentWidth, assignmentHeight, imageDimensions });
      return { width: 1.0 * ARTWORK_GLOBAL_SCALE, height: 1.0 * ARTWORK_GLOBAL_SCALE };
    }

    // Apply global scale multiplier to make artworks larger in the room
    const scaledWidth = baseWidth * ARTWORK_GLOBAL_SCALE;
    const scaledHeight = baseHeight * ARTWORK_GLOBAL_SCALE;

    // Constrain to wall limits
    const widthRatio = maxWidth / scaledWidth;
    const heightRatio = maxHeight / scaledHeight;
    const constraintFactor = Math.min(widthRatio, heightRatio, 1);

    const finalWidth = scaledWidth * constraintFactor;
    const finalHeight = scaledHeight * constraintFactor;

    // Check if this is a portrait orientation (height > width)
    const isPortrait = finalHeight > finalWidth;
    
    console.log('[DebugSize]', {
      source,
      inputCm: `${assignmentWidth}x${assignmentHeight}`,
      orientation: isPortrait ? 'PORTRAIT (vertical)' : 'LANDSCAPE (horizontal)',
      baseMeters: `${baseWidth.toFixed(2)}x${baseHeight.toFixed(2)}`,
      scaled: `${scaledWidth.toFixed(2)}x${scaledHeight.toFixed(2)}`,
      wallHeight,
      maxLimits: `${maxWidth.toFixed(2)}x${maxHeight.toFixed(2)}`,
      constraintFactor: constraintFactor.toFixed(2),
      finalMeters: `${finalWidth.toFixed(2)}x${finalHeight.toFixed(2)}`
    });

    return {
      width: finalWidth,
      height: finalHeight
    };
  }, [assignmentWidth, assignmentHeight, imageDimensions, wallHeight]);

  const frameT = FRAME_CONFIG.thickness;
  const frameD = FRAME_CONFIG.depth;
  const canvasD = FRAME_CONFIG.canvasDepth;
  const wallOffset = FRAME_CONFIG.wallOffset;

  return (
    <group position={[0, 0, wallOffset]}>
      {/* Shadow caster - invisible plane behind frame for stronger shadow */}
      <mesh position={[0, 0, -0.005]} castShadow>
        <planeGeometry args={[
          dimensions.width + frameT * 2.5, 
          dimensions.height + frameT * 2.5
        ]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      
      {/* Frame - solid box behind canvas, slightly larger */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[
          dimensions.width + frameT * 2, 
          dimensions.height + frameT * 2, 
          frameD
        ]} />
        <meshBasicMaterial color={FRAME_CONFIG.color} />
      </mesh>

      {/* Canvas body - off-white edge visible between frame and image */}
      <mesh position={[0, 0, frameD / 2 + canvasD / 2 - 0.001]}>
        <boxGeometry args={[dimensions.width, dimensions.height, canvasD]} />
        <meshBasicMaterial color={FRAME_CONFIG.canvasEdge} />
      </mesh>
      
      {/* Artwork image - on front of canvas */}
      <mesh 
        position={[0, 0, frameD / 2 + canvasD + 0.001]}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <planeGeometry args={[dimensions.width * 0.98, dimensions.height * 0.98]} />
        <meshBasicMaterial 
          map={texture} 
          transparent
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function HotspotMarker({ 
  hotspot, 
  onNavigate,
  currentViewpointId
}: { 
  hotspot: Hotspot; 
  onNavigate: (id: string) => void;
  currentViewpointId: string;
}) {
  const [hovered, setHovered] = useState(false);
  
  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = 'pointer';
    } else {
      document.body.style.cursor = 'default';
    }
    return () => {
      document.body.style.cursor = 'default';
    };
  }, [hovered]);
  
  if (hotspot.targetViewpoint === currentViewpointId) return null;

  return (
    <group 
      position={hotspot.position}
      rotation={[0, hotspot.rotation, 0]}
    >
      {/* Invisible clickable area for raycasting */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onNavigate(hotspot.targetViewpoint);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
        }}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[0.5, 32]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      
      {/* Hover indicator - completely invisible by default, only shows on hover */}
      {hovered && (
        <>
          {/* Subtle outer ring */}
          <mesh 
            position={[0, 0.005, 0]} 
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[0.3, 0.4, 32]} />
            <meshBasicMaterial 
              color="#ffffff" 
              transparent 
              opacity={0.35} 
              depthWrite={false}
            />
          </mesh>
          {/* Small center dot */}
          <mesh 
            position={[0, 0.006, 0]} 
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <circleGeometry args={[0.06, 16]} />
            <meshBasicMaterial 
              color="#C9A24A" 
              transparent 
              opacity={0.6} 
              depthWrite={false}
            />
          </mesh>
        </>
      )}
    </group>
  );
}

// Camera movement: smooth 0.35s transitions (responsive yet cinematic)
const CAMERA_MOVE_DURATION = 0.35;
const SCROLL_SPEED = 0.0004;  // Slowed down from 0.002 (5x slower)
const MIN_WALL_DISTANCE = 0.25;  // Allow getting close to walls (25cm)
// Wheel zoom limits (distance from center of room)
const MIN_ZOOM_DISTANCE = 0.3;   // Allow zoom close to artworks (30cm from center)
const MAX_ZOOM_DISTANCE = 12.0;  // Don't go too far back
// Vertical look limits (polar angle in radians):
const MIN_POLAR_ANGLE = 1.40;  // ~10° above horizontal (slight ceiling view)
const MAX_POLAR_ANGLE = 1.74;  // ~10° below horizontal (slight floor view)
// Direct rotation sensitivity - SLOWED DOWN to prevent "runaway" mouse
const MOUSE_SENSITIVITY = 0.0007;
// Keyboard rotation speed (radians per frame when key held)
const KEYBOARD_ROTATION_SPEED = 0.008;

// Hard-coded camera presets - DO NOT compute at runtime
export type CamPreset = {
  pos: [number, number, number];
  target: [number, number, number];
  fov: number;
};

export const CAM_PRESETS: Record<string, CamPreset> = {
  entrance: {
    pos: [0, 1.75, 8.5],
    target: [0, 1.4, 0],
    fov: 55,
  },
  center: {
    pos: [0, 1.7, 4.0],
    target: [0, 1.5, -9],
    fov: 50,
  },
  'back-left': {
    pos: [-7, 1.7, -4],
    target: [-12, 1.5, -4],
    fov: 50,
  },
  'back-right': {
    pos: [7, 1.7, -4],
    target: [12, 1.5, -4],
    fov: 50,
  },
};

// Smoothstep easing - t * t * (3 - 2 * t) - proven stable
function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

const ARTWORK_FOCUS_DURATION = 0.7;
const ARTWORK_FOCUS_DISTANCE = 3.5;

// Click-to-walk configuration
const CLICK_THRESHOLD = 5; // pixels - distinguishes click from drag
const WALK_TO_DURATION = 0.6; // seconds for walk animation
const EYE_HEIGHT = 1.7; // camera height when walking

function FirstPersonController({ 
  viewpoint,
  galleryDimensions,
  focusTarget,
  onFocusDismiss
}: { 
  viewpoint: Viewpoint;
  galleryDimensions: { width: number; height: number; depth: number };
  focusTarget?: ArtworkFocusTarget | null;
  onFocusDismiss?: () => void;
}) {
  const { camera, gl, scene } = useThree();
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const mouseDownPosition = useRef({ x: 0, y: 0 });
  const raycaster = useRef(new THREE.Raycaster());
  const spherical = useRef(new THREE.Spherical());
  
  // Hover refs for footstep marker - using refs for instant updates without re-renders
  const hoverPositionRef = useRef<[number, number, number]>([0, 0.02, 0]);
  const isHoveringFloorRef = useRef(false);
  
  // SINGLE transition state - one owner principle
  const isTransitioning = useRef(false);
  const transitionStartTime = useRef<number | null>(null);
  const transitionDuration = useRef(CAMERA_MOVE_DURATION);
  const transitionFromPos = useRef(new THREE.Vector3());
  const transitionToPos = useRef(new THREE.Vector3());
  const transitionFromSpherical = useRef(new THREE.Spherical());
  const transitionToSpherical = useRef(new THREE.Spherical());
  
  const lastViewpointId = useRef(viewpoint.id);
  const keysPressed = useRef<Set<string>>(new Set());
  const lastFocusTargetId = useRef<string | null>(null);
  
  const bounds = useMemo(() => ({
    minX: -galleryDimensions.width / 2 + MIN_WALL_DISTANCE,
    maxX: galleryDimensions.width / 2 - MIN_WALL_DISTANCE,
    minY: 1.3,
    maxY: galleryDimensions.height - 0.2,
    minZ: -galleryDimensions.depth / 2 + MIN_WALL_DISTANCE,
    maxZ: galleryDimensions.depth / 2 - MIN_WALL_DISTANCE
  }), [galleryDimensions]);
  
  const clampPosition = useCallback((pos: THREE.Vector3) => {
    pos.x = Math.max(bounds.minX, Math.min(bounds.maxX, pos.x));
    pos.y = Math.max(bounds.minY, Math.min(bounds.maxY, pos.y));
    pos.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, pos.z));
    return pos;
  }, [bounds]);
  
  const isWithinBounds = useCallback((pos: THREE.Vector3) => {
    return pos.x >= bounds.minX && pos.x <= bounds.maxX &&
           pos.y >= bounds.minY && pos.y <= bounds.maxY &&
           pos.z >= bounds.minZ && pos.z <= bounds.maxZ;
  }, [bounds]);
  
  // Start camera transition - unified handler for viewpoint navigation
  const startTransition = useCallback((
    toPos: THREE.Vector3,
    toSpherical: THREE.Spherical,
    duration: number = CAMERA_MOVE_DURATION
  ) => {
    // Cancel any existing transition and start new one immediately
    isTransitioning.current = true;
    transitionStartTime.current = performance.now();
    transitionDuration.current = duration;
    transitionFromPos.current.copy(camera.position);
    transitionToPos.current.copy(toPos);
    transitionFromSpherical.current.copy(spherical.current);
    transitionToSpherical.current.copy(toSpherical);
  }, [camera]);

  // Walk to a floor position - maintains current view direction
  const walkToPosition = useCallback((targetX: number, targetZ: number) => {
    const targetPos = new THREE.Vector3(targetX, EYE_HEIGHT, targetZ);
    clampPosition(targetPos);
    
    // Calculate distance for variable duration
    const distance = camera.position.distanceTo(targetPos);
    const duration = Math.min(Math.max(distance * 0.15, 0.3), WALK_TO_DURATION);
    
    // Keep current view direction
    const currentSpherical = spherical.current.clone();
    
    startTransition(targetPos, currentSpherical, duration);
    console.log('[WalkTo] Moving to:', targetPos.x.toFixed(2), targetPos.z.toFixed(2));
  }, [camera, clampPosition, startTransition]);

  // Raycast to check if click hit the floor
  const checkFloorClick = useCallback((clientX: number, clientY: number): THREE.Vector3 | null => {
    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    
    raycaster.current.setFromCamera(mouse, camera);
    
    // Find floor mesh by name
    const floorMesh = scene.getObjectByName('floorClickArea');
    if (!floorMesh) return null;
    
    const intersects = raycaster.current.intersectObject(floorMesh, false);
    if (intersects.length > 0) {
      return intersects[0].point;
    }
    return null;
  }, [gl, camera, scene]);

  // Track viewpoint change count to trigger navigation even for same viewpoint
  const viewpointTrigger = useRef(0);
  
  // Track if this is the first mount (initial load)
  const isFirstMount = useRef(true);
  // Track viewpoint object reference to detect button clicks (even same viewpoint)
  const lastViewpointRef = useRef<Viewpoint | null>(null);
  
  useEffect(() => {
    // Use hard-coded preset if available, otherwise fall back to viewpoint data
    const preset = CAM_PRESETS[viewpoint.id];
    const pos = preset 
      ? new THREE.Vector3(...preset.pos) 
      : new THREE.Vector3(...viewpoint.position);
    const lookAt = preset 
      ? new THREE.Vector3(...preset.target) 
      : new THREE.Vector3(...viewpoint.lookAt);
    const targetFov = preset?.fov || 50;
    
    clampPosition(pos);
    
    const direction = lookAt.clone().sub(pos).normalize();
    const newTargetSpherical = new THREE.Spherical();
    newTargetSpherical.setFromVector3(direction);
    
    // On first mount: instant positioning, no transition
    if (isFirstMount.current) {
      camera.position.copy(pos);
      spherical.current.copy(newTargetSpherical);
      // Set FOV immediately
      if ((camera as THREE.PerspectiveCamera).fov !== undefined) {
        (camera as THREE.PerspectiveCamera).fov = targetFov;
        (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
      }
      lastViewpointId.current = viewpoint.id;
      lastViewpointRef.current = viewpoint;
      isFirstMount.current = false;
      console.log('[CameraNav] initialLoad', viewpoint.id, 'pos:', pos.toArray(), 'fov:', targetFov);
      return;
    }
    
    // After first mount: trigger transition if viewpoint object changed (button click creates new object)
    if (lastViewpointRef.current !== viewpoint) {
      // Set FOV for the new viewpoint
      if ((camera as THREE.PerspectiveCamera).fov !== undefined) {
        (camera as THREE.PerspectiveCamera).fov = targetFov;
        (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
      }
      startTransition(pos, newTargetSpherical, CAMERA_MOVE_DURATION);
      lastViewpointId.current = viewpoint.id;
      lastViewpointRef.current = viewpoint;
      console.log('[CameraNav] goToView', viewpoint.id, 'fov:', targetFov);
    }
  }, [viewpoint, camera, clampPosition, startTransition]);
  
  useEffect(() => {
    if (!focusTarget) {
      lastFocusTargetId.current = null;
      return;
    }
    
    if (lastFocusTargetId.current === focusTarget.slotId) {
      return;
    }
    
    const artworkPos = new THREE.Vector3(...focusTarget.position);
    const artworkRotY = focusTarget.rotation[1];
    
    // Calculate the direction the artwork is facing (normal pointing OUTWARD from wall)
    const facingDirection = new THREE.Vector3(
      Math.sin(artworkRotY),
      0,
      Math.cos(artworkRotY)
    );
    
    // Camera position: 3.5m in front of artwork, at SAME HEIGHT as artwork center
    const cameraTargetPos = new THREE.Vector3(
      artworkPos.x + facingDirection.x * ARTWORK_FOCUS_DISTANCE,
      artworkPos.y,
      artworkPos.z + facingDirection.z * ARTWORK_FOCUS_DISTANCE
    );
    clampPosition(cameraTargetPos);
    
    // Calculate theta (horizontal angle) to look directly at artwork
    const dx = artworkPos.x - cameraTargetPos.x;
    const dz = artworkPos.z - cameraTargetPos.z;
    const theta = Math.atan2(dx, dz);
    const phi = Math.PI / 2; // Exactly horizontal
    
    const newTargetSpherical = new THREE.Spherical(1, phi, theta);
    
    // Use unified transition system
    startTransition(cameraTargetPos, newTargetSpherical, ARTWORK_FOCUS_DURATION);
    lastFocusTargetId.current = focusTarget.slotId;
    
    console.log('[CameraNav] focusOnArtwork', focusTarget.slotId);
  }, [focusTarget, clampPosition, startTransition]);
  
  useEffect(() => {
    const canvas = gl.domElement;
    
    const handleMouseDown = (e: MouseEvent) => {
      // Block input during camera transition
      if (isTransitioning.current) return;
      // If focused on artwork, dismiss focus on any mouse interaction
      if (focusTarget && onFocusDismiss) {
        onFocusDismiss();
        return;
      }
      isDragging.current = true;
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
      mouseDownPosition.current = { x: e.clientX, y: e.clientY };
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      const wasDragging = isDragging.current;
      isDragging.current = false;
      
      // Check if this was a click (not a drag)
      if (wasDragging && !isTransitioning.current) {
        const dx = e.clientX - mouseDownPosition.current.x;
        const dy = e.clientY - mouseDownPosition.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If mouse moved less than threshold, treat as click
        if (distance < CLICK_THRESHOLD) {
          const floorHit = checkFloorClick(e.clientX, e.clientY);
          if (floorHit) {
            walkToPosition(floorHit.x, floorHit.z);
          }
        }
      }
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      // Handle floor hover detection when not dragging - instant ref updates
      if (!isDragging.current && !isTransitioning.current && !focusTarget) {
        const floorHit = checkFloorClick(e.clientX, e.clientY);
        if (floorHit) {
          hoverPositionRef.current = [floorHit.x, 0.02, floorHit.z];
          isHoveringFloorRef.current = true;
        } else {
          isHoveringFloorRef.current = false;
        }
      } else {
        isHoveringFloorRef.current = false;
      }
      
      // Block drag rotation during camera transition
      if (isTransitioning.current || !isDragging.current) return;
      
      const deltaX = e.clientX - previousMousePosition.current.x;
      const deltaY = e.clientY - previousMousePosition.current.y;
      
      // Direct rotation - grab-to-pan behavior (camera follows drag direction)
      spherical.current.theta += deltaX * MOUSE_SENSITIVITY;
      spherical.current.phi -= deltaY * MOUSE_SENSITIVITY;
      spherical.current.phi = Math.max(MIN_POLAR_ANGLE, Math.min(MAX_POLAR_ANGLE, spherical.current.phi));
      
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };
    
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Block input during camera transition
      if (isTransitioning.current) return;
      // If focused on artwork, dismiss focus on scroll
      if (focusTarget && onFocusDismiss) {
        onFocusDismiss();
        return;
      }
      
      // Slow, symmetrical zoom with clamping
      // Normalize deltaY to prevent huge jumps on some mice/trackpads
      const normalizedDelta = Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY), 100);
      const delta = -normalizedDelta * SCROLL_SPEED;
      
      if (Math.abs(delta) > 0.00005) {
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);
        dir.y = 0;
        dir.normalize();
        
        // Calculate step size (smaller = slower zoom)
        const stepSize = delta * 25;
        const newPos = camera.position.clone().add(dir.multiplyScalar(stepSize));
        
        // Check distance from room center for zoom limits
        const distFromCenter = Math.sqrt(newPos.x * newPos.x + newPos.z * newPos.z);
        const currentDist = Math.sqrt(camera.position.x * camera.position.x + camera.position.z * camera.position.z);
        
        // Apply zoom limits: prevent getting too close or too far
        const isZoomingIn = stepSize > 0;
        const canZoomIn = distFromCenter >= MIN_ZOOM_DISTANCE || !isZoomingIn;
        const canZoomOut = distFromCenter <= MAX_ZOOM_DISTANCE || isZoomingIn;
        
        if (isWithinBounds(newPos) && canZoomIn && canZoomOut) {
          camera.position.copy(newPos);
        }
      }
    };
    
    const handleTouchStart = (e: TouchEvent) => {
      // Block input during camera transition
      if (isTransitioning.current) return;
      // If focused on artwork, dismiss focus on touch
      if (focusTarget && onFocusDismiss) {
        onFocusDismiss();
        return;
      }
      if (e.touches.length === 1) {
        isDragging.current = true;
        previousMousePosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        mouseDownPosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      const wasDragging = isDragging.current;
      isDragging.current = false;
      
      // Check if this was a tap (not a drag)
      if (wasDragging && !isTransitioning.current && e.changedTouches.length === 1) {
        const touch = e.changedTouches[0];
        const dx = touch.clientX - mouseDownPosition.current.x;
        const dy = touch.clientY - mouseDownPosition.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If touch moved less than threshold, treat as tap
        if (distance < CLICK_THRESHOLD) {
          const floorHit = checkFloorClick(touch.clientX, touch.clientY);
          if (floorHit) {
            walkToPosition(floorHit.x, floorHit.z);
          }
        }
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      // Block input during camera transition
      if (isTransitioning.current || !isDragging.current || e.touches.length !== 1) return;
      
      const deltaX = e.touches[0].clientX - previousMousePosition.current.x;
      const deltaY = e.touches[0].clientY - previousMousePosition.current.y;
      
      // Direct rotation - grab-to-pan behavior (camera follows drag direction)
      spherical.current.theta += deltaX * MOUSE_SENSITIVITY;
      spherical.current.phi -= deltaY * MOUSE_SENSITIVITY;
      spherical.current.phi = Math.max(MIN_POLAR_ANGLE, Math.min(MAX_POLAR_ANGLE, spherical.current.phi));
      
      previousMousePosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
        e.preventDefault();
        keysPressed.current.add(e.key);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key);
    };
    
    const handleMouseLeave = () => {
      isDragging.current = false;
      isHoveringFloorRef.current = false;
    };
    
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchend', handleTouchEnd);
    canvas.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gl, focusTarget, onFocusDismiss, checkFloorClick, walkToPosition]);
  
  useFrame(() => {
    // UNIFIED TRANSITION - single source of truth for camera animation
    if (isTransitioning.current && transitionStartTime.current !== null) {
      const elapsed = (performance.now() - transitionStartTime.current) / 1000;
      const tRaw = Math.min(elapsed / transitionDuration.current, 1);
      const t = smoothstep(tRaw);
      
      // Lerp position
      camera.position.lerpVectors(transitionFromPos.current, transitionToPos.current, t);
      
      // Lerp spherical angles
      spherical.current.theta = transitionFromSpherical.current.theta + 
        (transitionToSpherical.current.theta - transitionFromSpherical.current.theta) * t;
      spherical.current.phi = transitionFromSpherical.current.phi + 
        (transitionToSpherical.current.phi - transitionFromSpherical.current.phi) * t;
      
      // End transition
      if (tRaw >= 1) {
        camera.position.copy(transitionToPos.current);
        spherical.current.copy(transitionToSpherical.current);
        isTransitioning.current = false;
        transitionStartTime.current = null;
      }
    } else {
      // Only handle keyboard input when NOT transitioning
      const keys = keysPressed.current;
      if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) {
        spherical.current.theta += KEYBOARD_ROTATION_SPEED;
      }
      if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) {
        spherical.current.theta -= KEYBOARD_ROTATION_SPEED;
      }
      if (keys.has('ArrowUp') || keys.has('w') || keys.has('W')) {
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        direction.y = 0;
        direction.normalize();
        const newPos = camera.position.clone().add(direction.multiplyScalar(0.08));
        if (isWithinBounds(newPos)) {
          camera.position.copy(newPos);
        }
      }
      if (keys.has('ArrowDown') || keys.has('s') || keys.has('S')) {
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        direction.y = 0;
        direction.normalize();
        const newPos = camera.position.clone().sub(direction.multiplyScalar(0.08));
        if (isWithinBounds(newPos)) {
          camera.position.copy(newPos);
        }
      }
    }
    
    clampPosition(camera.position);
    
    const direction = new THREE.Vector3();
    direction.setFromSpherical(spherical.current);
    const lookAtPoint = camera.position.clone().add(direction);
    camera.lookAt(lookAtPoint);
  });
  
  // Render footstep marker - always render, visibility controlled by ref
  return (
    <FootstepMarker 
      positionRef={hoverPositionRef} 
      visibleRef={isHoveringFloorRef} 
    />
  );
}

export function Gallery360Scene({
  preset,
  slotAssignments,
  currentViewpoint,
  onNavigate,
  onArtworkClick,
  isEditor = false,
  selectedSlotId,
  onSlotSelect,
  focusTarget,
  onFocusDismiss
}: Gallery360SceneProps) {
  return (
    <Canvas
      shadows="soft"
      camera={{ fov: 55, near: 0.1, far: 100 }}
      style={{ background: '#d8d4d0' }}
      gl={{ 
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.85
      }}
      onCreated={({ gl }) => {
        // Enable legacy lights for consistent intensity values
        (gl as any).useLegacyLights = true;
      }}
    >
      <ambientLight intensity={0.4} color={GALLERY_LIGHT_COLOR} />
      <hemisphereLight args={[GALLERY_LIGHT_COLOR, '#a09080', 0.55]} />
      
      <directionalLight 
        position={[0, preset.dimensions.height + 8, 0]} 
        intensity={0.7}
        color={GALLERY_LIGHT_COLOR}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={60}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-bias={-0.0002}
        shadow-radius={4}
      />
      
      <directionalLight position={[12, 6, 6]} intensity={0.28} color={GALLERY_LIGHT_COLOR} />
      <directionalLight position={[-12, 6, -6]} intensity={0.21} color={GALLERY_LIGHT_COLOR} />

      <GalleryRoom preset={preset} />
      <FloorGuard />

      {preset.slots.map(slot => {
        const assignment = slotAssignments.find(sa => sa.slotId === slot.id);
        return (
          <ArtworkPlane
            key={slot.id}
            slot={slot}
            assignment={assignment}
            isSelected={selectedSlotId === slot.id}
            isEditor={isEditor}
            presetId={preset.id}
            wallHeight={preset.dimensions.height}
            onClick={() => {
              if (isEditor && onSlotSelect) {
                onSlotSelect(slot.id);
              }
              if (assignment?.artworkId && onArtworkClick) {
                onArtworkClick(slot.id, assignment, slot);
              }
            }}
          />
        );
      })}

      {preset.hotspots.map(hotspot => (
        <HotspotMarker
          key={hotspot.id}
          hotspot={hotspot}
          onNavigate={onNavigate}
          currentViewpointId={currentViewpoint.id}
        />
      ))}

      <FirstPersonController 
        viewpoint={currentViewpoint} 
        galleryDimensions={preset.dimensions} 
        focusTarget={focusTarget}
        onFocusDismiss={onFocusDismiss}
      />
      
    </Canvas>
  );
}
