import React, { useRef, useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Gallery360Preset, Slot, Hotspot, Viewpoint } from '../../config/gallery360Presets';
import { SlotAssignment } from './useArtworkSlots';

interface Gallery360SceneProps {
  preset: Gallery360Preset;
  slotAssignments: SlotAssignment[];
  currentViewpoint: Viewpoint;
  onNavigate: (viewpointId: string) => void;
  onArtworkClick?: (slotId: string, assignment: SlotAssignment) => void;
  isEditor?: boolean;
  selectedSlotId?: string;
  onSlotSelect?: (slotId: string) => void;
}

function CeilingBeam({ position, rotation, width, height, depth }: { 
  position: [number, number, number]; 
  rotation?: [number, number, number];
  width: number;
  height: number;
  depth: number;
}) {
  return (
    <mesh position={position} rotation={rotation || [0, 0, 0]} castShadow>
      <boxGeometry args={[width, height, depth]} />
      <meshStandardMaterial color="#2a2a2a" roughness={0.7} metalness={0.1} />
    </mesh>
  );
}

function CeilingSpotlight({ position, targetPosition }: { 
  position: [number, number, number]; 
  targetPosition: [number, number, number];
}) {
  const spotlightRef = useRef<THREE.SpotLight>(null);
  const { scene } = useThree();
  
  useEffect(() => {
    if (spotlightRef.current) {
      spotlightRef.current.target.position.set(...targetPosition);
      scene.add(spotlightRef.current.target);
      spotlightRef.current.target.updateMatrixWorld();
    }
    return () => {
      if (spotlightRef.current) {
        scene.remove(spotlightRef.current.target);
      }
    };
  }, [targetPosition, scene]);

  return (
    <group position={position}>
      {/* Track rail segment */}
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[0.04, 0.04, 0.6]} />
        <meshStandardMaterial color="#2a2725" roughness={0.6} metalness={0.4} />
      </mesh>
      {/* Spotlight housing */}
      <mesh>
        <cylinderGeometry args={[0.06, 0.09, 0.12, 12]} />
        <meshStandardMaterial color="#1a1816" roughness={0.35} metalness={0.7} />
      </mesh>
      {/* Light cone rim */}
      <mesh position={[0, -0.07, 0]}>
        <ringGeometry args={[0.04, 0.065, 16]} />
        <meshBasicMaterial color="#fff8f0" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      <spotLight
        ref={spotlightRef}
        position={[0, -0.08, 0]}
        angle={0.42}
        penumbra={0.9}
        intensity={1.8}
        distance={7}
        color="#fff8f0"
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-bias={-0.0001}
      />
    </group>
  );
}

function GalleryRoom({ preset }: { preset: Gallery360Preset }) {
  const { width, height, depth } = preset.dimensions;
  const halfW = width / 2;
  const halfD = depth / 2;

  const beamPositions = useMemo(() => {
    const beams: Array<{ pos: [number, number, number]; rot?: [number, number, number]; w: number; h: number; d: number }> = [];
    const beamSpacing = 4;
    const numBeams = Math.floor(depth / beamSpacing);
    
    for (let i = 0; i <= numBeams; i++) {
      const z = -halfD + 2 + (i * beamSpacing);
      if (z > halfD - 1.5) break;
      beams.push({ pos: [0, height - 0.1, z], w: width - 0.6, h: 0.18, d: 0.3 });
    }
    
    beams.push({ pos: [-halfW + 0.18, height - 0.1, 0], rot: [0, Math.PI / 2, 0], w: depth - 0.6, h: 0.18, d: 0.3 });
    beams.push({ pos: [halfW - 0.18, height - 0.1, 0], rot: [0, Math.PI / 2, 0], w: depth - 0.6, h: 0.18, d: 0.3 });
    
    return beams;
  }, [width, height, depth, halfW, halfD]);

  const spotlightPositions = useMemo(() => {
    const spots: Array<{ pos: [number, number, number]; target: [number, number, number] }> = [];
    
    for (let x = -halfW + 4; x < halfW - 3; x += 4.5) {
      spots.push({ pos: [x, height - 0.35, -halfD + 1.8], target: [x, 1.5, -halfD + 0.15] });
    }
    for (let x = -halfW + 4; x < halfW - 3; x += 4.5) {
      spots.push({ pos: [x, height - 0.35, halfD - 1.8], target: [x, 1.5, halfD - 0.15] });
    }
    
    spots.push({ pos: [-halfW + 1.8, height - 0.35, -2.5], target: [-halfW + 0.15, 1.5, -2.5] });
    spots.push({ pos: [-halfW + 1.8, height - 0.35, 2.5], target: [-halfW + 0.15, 1.5, 2.5] });
    spots.push({ pos: [halfW - 1.8, height - 0.35, -2.5], target: [halfW - 0.15, 1.5, -2.5] });
    spots.push({ pos: [halfW - 1.8, height - 0.35, 2.5], target: [halfW - 0.15, 1.5, 2.5] });
    
    return spots;
  }, [width, height, depth, halfW, halfD]);

  return (
    <group>
      {/* Floor - polished concrete look with subtle warmth */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial 
          color="#a8a095"
          roughness={0.75}
          metalness={0.08}
        />
      </mesh>
      
      {/* Subtle floor grid lines for realism */}
      {[-halfW + 3, -halfW + 6, -halfW + 9, -halfW + 12, -halfW + 15].filter(x => x < halfW - 1).map((x, i) => (
        <mesh key={`floor-line-v-${i}`} position={[x, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.015, depth - 0.5]} />
          <meshBasicMaterial color="#8a837a" transparent opacity={0.25} />
        </mesh>
      ))}
      {[-halfD + 3, -halfD + 6, -halfD + 9, -halfD + 12].filter(z => z < halfD - 1).map((z, i) => (
        <mesh key={`floor-line-h-${i}`} position={[0, 0.002, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[width - 0.5, 0.015]} />
          <meshBasicMaterial color="#8a837a" transparent opacity={0.25} />
        </mesh>
      ))}

      {/* Ceiling - soft warm white */}
      <mesh position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#f5f2ed" roughness={0.95} metalness={0} />
      </mesh>

      {/* Ceiling beams */}
      {beamPositions.map((beam, i) => (
        <CeilingBeam 
          key={`beam-${i}`}
          position={beam.pos}
          rotation={beam.rot}
          width={beam.w}
          height={beam.h}
          depth={beam.d}
        />
      ))}

      {/* Walls with subtle warmth - soft gallery white-gray */}
      <mesh position={[0, height / 2, -halfD]} receiveShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color="#e8e4df" side={THREE.DoubleSide} roughness={0.88} metalness={0} />
      </mesh>

      <mesh position={[0, height / 2, halfD]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color="#e8e4df" side={THREE.DoubleSide} roughness={0.88} metalness={0} />
      </mesh>

      <mesh position={[halfW, height / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial color="#e8e4df" side={THREE.DoubleSide} roughness={0.88} metalness={0} />
      </mesh>

      <mesh position={[-halfW, height / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial color="#e8e4df" side={THREE.DoubleSide} roughness={0.88} metalness={0} />
      </mesh>
      
      {/* Baseboard trim - subtle dark line at floor level */}
      <mesh position={[0, 0.04, -halfD + 0.02]}>
        <boxGeometry args={[width - 0.1, 0.08, 0.02]} />
        <meshStandardMaterial color="#4a4540" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.04, halfD - 0.02]}>
        <boxGeometry args={[width - 0.1, 0.08, 0.02]} />
        <meshStandardMaterial color="#4a4540" roughness={0.7} />
      </mesh>
      <mesh position={[-halfW + 0.02, 0.04, 0]}>
        <boxGeometry args={[0.02, 0.08, depth - 0.1]} />
        <meshStandardMaterial color="#4a4540" roughness={0.7} />
      </mesh>
      <mesh position={[halfW - 0.02, 0.04, 0]}>
        <boxGeometry args={[0.02, 0.08, depth - 0.1]} />
        <meshStandardMaterial color="#4a4540" roughness={0.7} />
      </mesh>

      {spotlightPositions.map((spot, i) => (
        <CeilingSpotlight key={`spot-${i}`} position={spot.pos} targetPosition={spot.target} />
      ))}
    </group>
  );
}

function ArtworkPlane({ 
  slot, 
  assignment, 
  onClick,
  isSelected,
  isEditor
}: { 
  slot: Slot; 
  assignment?: SlotAssignment;
  onClick?: () => void;
  isSelected?: boolean;
  isEditor?: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const hasArtwork = assignment?.artworkUrl;
  
  const frameWidth = 0.025;
  const passepartoutWidth = 0.05;
  const frameDepth = 0.03;
  const wallOffset = 0.025;
  
  const CM_TO_METERS = 0.01;
  const artworkDimensions = useMemo(() => {
    if (!hasArtwork || !assignment?.width || !assignment?.height) {
      return { width: slot.width, height: slot.height };
    }
    
    let artW = assignment.width * CM_TO_METERS;
    let artH = assignment.height * CM_TO_METERS;
    
    if (artW > slot.width) {
      const scale = slot.width / artW;
      artW *= scale;
      artH *= scale;
    }
    
    if (artH > slot.height) {
      const scale = slot.height / artH;
      artW *= scale;
      artH *= scale;
    }
    
    return { width: artW, height: artH };
  }, [hasArtwork, assignment?.width, assignment?.height, slot.width, slot.height]);
  
  const { width: artWidth, height: artHeight } = artworkDimensions;
  const totalFrameW = artWidth + (passepartoutWidth * 2) + (frameWidth * 2);
  const totalFrameH = artHeight + (passepartoutWidth * 2) + (frameWidth * 2);

  return (
    <group position={slot.position} rotation={slot.rotation}>
      {hasArtwork && (
        <mesh position={[0, -0.02, 0.005]} rotation={[0, 0, 0]}>
          <planeGeometry args={[totalFrameW * 1.1, totalFrameH * 0.15]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.12} />
        </mesh>
      )}
      
      <group position={[0, 0, wallOffset]}>
        {hasArtwork ? (
          <>
            <mesh castShadow position={[0, 0, -frameDepth / 2]}>
              <boxGeometry args={[totalFrameW, totalFrameH, frameDepth]} />
              <meshStandardMaterial color="#1a1816" roughness={0.55} metalness={0.05} />
            </mesh>

            <mesh position={[0, 0, -0.001]}>
              <boxGeometry args={[totalFrameW - frameWidth * 0.5, totalFrameH - frameWidth * 0.5, frameDepth * 0.6]} />
              <meshStandardMaterial color="#2d2926" roughness={0.5} metalness={0.08} />
            </mesh>

            <mesh position={[0, 0, 0.001]}>
              <planeGeometry args={[artWidth + (passepartoutWidth * 2), artHeight + (passepartoutWidth * 2)]} />
              <meshStandardMaterial color="#faf9f6" roughness={0.92} />
            </mesh>

            <Suspense fallback={
              <mesh position={[0, 0, 0.003]}>
                <planeGeometry args={[artWidth, artHeight]} />
                <meshBasicMaterial color="#e8e4e0" />
              </mesh>
            }>
              <ArtworkImage 
                url={assignment!.artworkUrl!} 
                width={artWidth} 
                height={artHeight}
                onClick={onClick}
                hovered={hovered}
                setHovered={setHovered}
              />
            </Suspense>
          </>
        ) : (
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
            <meshStandardMaterial 
              color={isSelected ? '#C9A24A' : (hovered ? '#d5d0c8' : '#ccc8c0')}
              transparent
              opacity={0.6}
            />
          </mesh>
        )}

        {isEditor && !hasArtwork && (
          <Html center>
            <div className="bg-white/90 px-3 py-1.5 rounded-lg text-xs text-gray-600 whitespace-nowrap pointer-events-none shadow-sm border border-gray-200">
              {slot.label}
            </div>
          </Html>
        )}

        {(isSelected || (hovered && isEditor)) && (
          <mesh position={[0, 0, hasArtwork ? 0.015 : 0.001]}>
            <planeGeometry args={[hasArtwork ? totalFrameW + 0.1 : slot.width + 0.1, hasArtwork ? totalFrameH + 0.1 : slot.height + 0.1]} />
            <meshBasicMaterial color="#C9A24A" transparent opacity={0.35} depthTest={false} />
          </mesh>
        )}
      </group>
    </group>
  );
}

// Artwork image component using manual TextureLoader with CORS handling
function ArtworkImage({ 
  url, 
  width, 
  height,
  onClick,
  hovered,
  setHovered
}: { 
  url: string; 
  width: number; 
  height: number;
  onClick?: () => void;
  hovered: boolean;
  setHovered: (h: boolean) => void;
}) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  
  useEffect(() => {
    if (!url) {
      console.warn('[ArtworkImage] No URL provided');
      setStatus('error');
      return;
    }
    
    console.log('[ArtworkImage] === STARTING TEXTURE LOAD ===');
    console.log('[ArtworkImage] URL:', url);
    console.log('[ArtworkImage] Dimensions: width=', width, 'height=', height);
    setStatus('loading');
    setTexture(null);
    
    // Create loader with CORS support for WebGL
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';
    
    loader.load(
      url,
      (loadedTexture) => {
        console.log('[ArtworkImage] === TEXTURE LOADED SUCCESS ===');
        console.log('[ArtworkImage] URL:', url);
        console.log('[ArtworkImage] Image element:', loadedTexture.image);
        console.log('[ArtworkImage] Image size:', loadedTexture.image?.width, 'x', loadedTexture.image?.height);
        console.log('[ArtworkImage] Texture UUID:', loadedTexture.uuid);
        
        // Configure texture for proper WebGL rendering
        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        loadedTexture.magFilter = THREE.LinearFilter;
        loadedTexture.minFilter = THREE.LinearFilter;
        loadedTexture.generateMipmaps = false;
        loadedTexture.flipY = true;
        loadedTexture.needsUpdate = true;
        
        console.log('[ArtworkImage] Texture configured, setting state...');
        setTexture(loadedTexture);
        setStatus('loaded');
        console.log('[ArtworkImage] State updated to loaded');
      },
      (progress) => {
        console.log('[ArtworkImage] Loading progress for', url, ':', progress);
      },
      (error) => {
        console.error('[ArtworkImage] === TEXTURE LOAD FAILED ===');
        console.error('[ArtworkImage] URL:', url);
        console.error('[ArtworkImage] Error:', error);
        setStatus('error');
      }
    );
    
    return () => {
      if (texture) {
        console.log('[ArtworkImage] Disposing texture for:', url);
        texture.dispose();
      }
    };
  }, [url]);

  console.log('[ArtworkImage] RENDER - URL:', url, 'status:', status, 'texture:', texture ? 'EXISTS' : 'NULL');

  return (
    <mesh 
      position={[0, 0, 0.005]}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <planeGeometry args={[width, height]} />
      {status === 'loaded' && texture ? (
        <meshBasicMaterial 
          map={texture} 
          color="#ffffff"
          toneMapped={false}
        />
      ) : (
        <meshBasicMaterial color={status === 'error' ? '#ffcccc' : '#e8e4e0'} />
      )}
    </mesh>
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
  const pulseRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (pulseRef.current) {
      const pulse = Math.sin(clock.elapsedTime * 2.5) * 0.5 + 0.5;
      pulseRef.current.scale.setScalar(1 + pulse * 0.15);
      (pulseRef.current.material as THREE.MeshBasicMaterial).opacity = 0.4 + pulse * 0.3;
    }
    if (ringRef.current) {
      const ringPulse = Math.sin(clock.elapsedTime * 1.8 + 0.5) * 0.5 + 0.5;
      ringRef.current.scale.setScalar(1.3 + ringPulse * 0.2);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.15 + ringPulse * 0.2;
    }
  });
  
  if (hotspot.targetViewpoint === currentViewpointId) return null;

  return (
    <group 
      position={hotspot.position}
      rotation={[0, hotspot.rotation, 0]}
    >
      <mesh
        ref={ringRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.005, 0]}
      >
        <ringGeometry args={[0.42, 0.52, 32]} />
        <meshBasicMaterial 
          color="#C9A24A"
          transparent 
          opacity={0.25}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      <mesh
        ref={pulseRef}
        onClick={(e) => {
          e.stopPropagation();
          onNavigate(hotspot.targetViewpoint);
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
      >
        <circleGeometry args={[0.38, 32]} />
        <meshBasicMaterial 
          color={hovered ? '#C9A24A' : '#264C61'} 
          transparent 
          opacity={hovered ? 0.95 : 0.7} 
        />
      </mesh>
      
      <mesh 
        position={[0, 0.015, -0.18]} 
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <coneGeometry args={[0.12, 0.25, 3]} />
        <meshBasicMaterial color={hovered ? '#C9A24A' : '#ffffff'} transparent opacity={0.9} />
      </mesh>
    </group>
  );
}

function CameraController({ 
  viewpoint,
  isEditor
}: { 
  viewpoint: Viewpoint;
  isEditor?: boolean;
}) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const [controlsReady, setControlsReady] = useState(false);
  
  const targetPosition = useRef(new THREE.Vector3(...viewpoint.position));
  const targetLookAt = useRef(new THREE.Vector3(...viewpoint.lookAt));
  const lastViewpointId = useRef(viewpoint.id);
  const isAnimating = useRef(false);
  const needsInitialSync = useRef(true);

  const controlsCallback = useCallback((controls: any) => {
    controlsRef.current = controls;
    if (controls) {
      needsInitialSync.current = true;
      isAnimating.current = false;
      setControlsReady(true);
    } else {
      needsInitialSync.current = true;
      setControlsReady(false);
    }
  }, []);

  useEffect(() => {
    if (!controlsReady || !controlsRef.current) return;
    
    if (needsInitialSync.current) {
      camera.position.copy(targetPosition.current);
      controlsRef.current.target.copy(targetLookAt.current);
      controlsRef.current.update();
      needsInitialSync.current = false;
      isAnimating.current = false;
    }
  }, [controlsReady, camera]);

  const animationProgress = useRef(0);
  
  useEffect(() => {
    const isNewViewpoint = lastViewpointId.current !== viewpoint.id;
    
    targetPosition.current.set(...viewpoint.position);
    targetLookAt.current.set(...viewpoint.lookAt);
    lastViewpointId.current = viewpoint.id;
    
    if (isNewViewpoint) {
      animationProgress.current = 0;
      if (controlsReady && controlsRef.current && !needsInitialSync.current) {
        isAnimating.current = true;
      } else {
        needsInitialSync.current = true;
      }
    }
  }, [viewpoint, controlsReady]);
  
  const animationDuration = 0.5;
  
  useFrame((_, delta) => {
    if (!controlsRef.current || !controlsReady) return;
    
    if (needsInitialSync.current) {
      camera.position.copy(targetPosition.current);
      controlsRef.current.target.copy(targetLookAt.current);
      controlsRef.current.update();
      needsInitialSync.current = false;
      isAnimating.current = false;
      animationProgress.current = 0;
      return;
    }
    
    if (!isAnimating.current) return;
    
    animationProgress.current = Math.min(animationProgress.current + delta / animationDuration, 1);
    const t = animationProgress.current;
    const easeT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    
    const lerpAmount = easeT > 0.99 ? 1 : easeT * 0.08 + 0.04;
    camera.position.lerp(targetPosition.current, lerpAmount);
    controlsRef.current.target.lerp(targetLookAt.current, lerpAmount);
    controlsRef.current.update();
    
    if (animationProgress.current >= 1 || camera.position.distanceTo(targetPosition.current) < 0.02) {
      camera.position.copy(targetPosition.current);
      controlsRef.current.target.copy(targetLookAt.current);
      controlsRef.current.update();
      isAnimating.current = false;
      animationProgress.current = 0;
    }
  });

  return (
    <OrbitControls 
      ref={controlsCallback}
      enableZoom={isEditor}
      enablePan={false}
      minPolarAngle={Math.PI * 0.38}
      maxPolarAngle={Math.PI * 0.62}
      minDistance={0.5}
      maxDistance={isEditor ? 8 : 4}
      rotateSpeed={0.35}
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
  onSlotSelect
}: Gallery360SceneProps) {
  return (
    <Canvas
      shadows
      camera={{ fov: 55, near: 0.1, far: 100 }}
      style={{ background: '#ddd9d4' }}
      gl={(canvas) => {
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.NoToneMapping;
        renderer.toneMappingExposure = 1.0;
        return renderer;
      }}
    >
      {/* Soft ambient fill - prevents harsh black areas */}
      <ambientLight intensity={0.55} color="#f5f3f0" />
      
      {/* Hemisphere light - sky/ground color blending for natural feel */}
      <hemisphereLight
        args={['#f8f6f2', '#c8c4bc', 0.5]}
        position={[0, preset.dimensions.height, 0]}
      />
      
      {/* Main soft directional light - simulates diffuse ceiling light */}
      <directionalLight 
        position={[0, preset.dimensions.height - 0.5, 0]} 
        intensity={0.4}
        color="#fff9f4"
      />
      
      {/* Subtle fill lights from corners - reduce harsh shadows */}
      <pointLight 
        position={[-preset.dimensions.width/2 + 1, preset.dimensions.height - 1, -preset.dimensions.depth/2 + 1]} 
        intensity={0.15}
        color="#fff5e8"
        distance={12}
      />
      <pointLight 
        position={[preset.dimensions.width/2 - 1, preset.dimensions.height - 1, preset.dimensions.depth/2 - 1]} 
        intensity={0.15}
        color="#fff5e8"
        distance={12}
      />

      <GalleryRoom preset={preset} />

      {preset.slots.map(slot => {
        const assignment = slotAssignments.find(sa => sa.slotId === slot.id);
        return (
          <ArtworkPlane
            key={slot.id}
            slot={slot}
            assignment={assignment}
            isSelected={selectedSlotId === slot.id}
            isEditor={isEditor}
            onClick={() => {
              if (isEditor && onSlotSelect) {
                onSlotSelect(slot.id);
              } else if (assignment?.artworkId && onArtworkClick) {
                onArtworkClick(slot.id, assignment);
              }
            }}
          />
        );
      })}

      {!isEditor && preset.hotspots.map(hotspot => (
        <HotspotMarker
          key={hotspot.id}
          hotspot={hotspot}
          onNavigate={onNavigate}
          currentViewpointId={currentViewpoint.id}
        />
      ))}

      <CameraController viewpoint={currentViewpoint} isEditor={isEditor} />
    </Canvas>
  );
}
