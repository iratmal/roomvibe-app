import React, { useRef, useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, useTexture } from '@react-three/drei';
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
      <mesh>
        <cylinderGeometry args={[0.08, 0.12, 0.15, 16]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.8} />
      </mesh>
      <spotLight
        ref={spotlightRef}
        position={[0, -0.1, 0]}
        angle={0.45}
        penumbra={0.85}
        intensity={1.5}
        distance={8}
        color="#fff5e0"
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-bias={-0.0002}
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
    const beamSpacing = 3.5;
    const numBeams = Math.floor(depth / beamSpacing);
    
    for (let i = 0; i <= numBeams; i++) {
      const z = -halfD + 1.5 + (i * beamSpacing);
      if (z > halfD - 1) break;
      beams.push({ pos: [0, height - 0.08, z], w: width - 0.5, h: 0.15, d: 0.25 });
    }
    
    beams.push({ pos: [-halfW + 0.15, height - 0.08, 0], rot: [0, Math.PI / 2, 0], w: depth - 0.5, h: 0.15, d: 0.25 });
    beams.push({ pos: [halfW - 0.15, height - 0.08, 0], rot: [0, Math.PI / 2, 0], w: depth - 0.5, h: 0.15, d: 0.25 });
    
    return beams;
  }, [width, height, depth, halfW, halfD]);

  const spotlightPositions = useMemo(() => {
    const spots: Array<{ pos: [number, number, number]; target: [number, number, number] }> = [];
    
    for (let x = -halfW + 3; x < halfW - 2; x += 4) {
      spots.push({ pos: [x, height - 0.3, -halfD + 1.5], target: [x, 1.6, -halfD + 0.1] });
    }
    for (let x = -halfW + 3; x < halfW - 2; x += 4) {
      spots.push({ pos: [x, height - 0.3, halfD - 1.5], target: [x, 1.6, halfD - 0.1] });
    }
    
    spots.push({ pos: [-halfW + 1.5, height - 0.3, -2], target: [-halfW + 0.1, 1.6, -2] });
    spots.push({ pos: [-halfW + 1.5, height - 0.3, 2], target: [-halfW + 0.1, 1.6, 2] });
    spots.push({ pos: [halfW - 1.5, height - 0.3, -2], target: [halfW - 0.1, 1.6, -2] });
    spots.push({ pos: [halfW - 1.5, height - 0.3, 2], target: [halfW - 0.1, 1.6, 2] });
    
    return spots;
  }, [width, height, depth, halfW, halfD]);

  return (
    <group>
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial 
          color="#c4b8a8"
          roughness={0.85}
          metalness={0.02}
        />
      </mesh>

      <mesh position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#f0ede8" roughness={0.9} />
      </mesh>

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

      <mesh position={[0, height / 2, -halfD]} receiveShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color="#ddd8d0" side={THREE.DoubleSide} roughness={0.92} />
      </mesh>

      <mesh position={[0, height / 2, halfD]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color="#ddd8d0" side={THREE.DoubleSide} roughness={0.92} />
      </mesh>

      <mesh position={[halfW, height / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial color="#ddd8d0" side={THREE.DoubleSide} roughness={0.92} />
      </mesh>

      <mesh position={[-halfW, height / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial color="#ddd8d0" side={THREE.DoubleSide} roughness={0.92} />
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

function getProxiedImageUrl(url: string): string {
  // If it's already a local URL or data URL, use it directly
  if (url.startsWith('/') || url.startsWith('data:')) {
    return url;
  }
  // For external URLs, route through our proxy
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

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
  const proxiedUrl = getProxiedImageUrl(url);
  const texture = useTexture(proxiedUrl);
  
  useEffect(() => {
    if (texture) {
      texture.colorSpace = THREE.SRGBColorSpace;
    }
  }, [texture]);

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
      <meshBasicMaterial 
        map={texture} 
        transparent
        toneMapped={false}
      />
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
      style={{ background: '#e8e4e0' }}
    >
      <ambientLight intensity={0.7} />
      <hemisphereLight
        args={['#fffaf0', '#d0ccc4', 0.4]}
        position={[0, preset.dimensions.height, 0]}
      />
      <directionalLight 
        position={[4, preset.dimensions.height, 3]} 
        intensity={0.35}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      />
      <directionalLight 
        position={[-4, preset.dimensions.height, -3]} 
        intensity={0.25}
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
