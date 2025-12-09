import React, { useRef, useState, useEffect, useCallback, Suspense } from 'react';
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

function GalleryRoom({ preset }: { preset: Gallery360Preset }) {
  const { width, height, depth } = preset.dimensions;
  const halfW = width / 2;
  const halfD = depth / 2;

  return (
    <group>
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={preset.floorColor} roughness={0.8} />
      </mesh>

      <mesh position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={preset.ceilingColor} roughness={0.9} />
      </mesh>

      <mesh position={[0, height / 2, -halfD]} receiveShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={preset.wallColor} side={THREE.DoubleSide} roughness={0.95} />
      </mesh>

      <mesh position={[0, height / 2, halfD]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={preset.wallColor} side={THREE.DoubleSide} roughness={0.95} />
      </mesh>

      <mesh position={[halfW, height / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial color={preset.wallColor} side={THREE.DoubleSide} roughness={0.95} />
      </mesh>

      <mesh position={[-halfW, height / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial color={preset.wallColor} side={THREE.DoubleSide} roughness={0.95} />
      </mesh>
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
  const frameDepth = 0.025;
  const frameWidth = 0.035;
  const wallOffset = 0.015;

  return (
    <group position={slot.position} rotation={slot.rotation}>
      <group position={[0, 0, wallOffset]}>
        {hasArtwork ? (
          <>
            <mesh castShadow position={[0, 0, -frameDepth / 2]}>
              <boxGeometry args={[slot.width + frameWidth * 2, slot.height + frameWidth * 2, frameDepth]} />
              <meshStandardMaterial color="#303030" roughness={0.7} metalness={0.05} />
            </mesh>

            <mesh position={[0, 0, 0.001]}>
              <planeGeometry args={[slot.width, slot.height]} />
              <meshStandardMaterial color="#fafafa" />
            </mesh>

            <Suspense fallback={
              <mesh position={[0, 0, 0.002]}>
                <planeGeometry args={[slot.width, slot.height]} />
                <meshBasicMaterial color="#e0e0e0" />
              </mesh>
            }>
              <ArtworkImage 
                url={assignment!.artworkUrl!} 
                width={slot.width} 
                height={slot.height}
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
              color={isSelected ? '#C9A24A' : (hovered ? '#e8e8e8' : '#e0e0e0')}
              transparent
              opacity={0.5}
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
          <mesh position={[0, 0, hasArtwork ? 0.01 : 0.001]}>
            <planeGeometry args={[slot.width + 0.08, slot.height + 0.08]} />
            <meshBasicMaterial color="#C9A24A" transparent opacity={0.35} depthTest={false} />
          </mesh>
        )}
      </group>
    </group>
  );
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
  const texture = useTexture(url);
  
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
      <meshStandardMaterial 
        map={texture} 
        transparent
        emissive={hovered ? '#444444' : '#000000'}
        emissiveIntensity={hovered ? 0.15 : 0}
        roughness={0.4}
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
  
  if (hotspot.targetViewpoint === currentViewpointId) return null;

  return (
    <group 
      position={hotspot.position}
      rotation={[0, hotspot.rotation, 0]}
    >
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onNavigate(hotspot.targetViewpoint);
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[0.4, 32]} />
        <meshBasicMaterial 
          color={hovered ? '#C9A24A' : '#264C61'} 
          transparent 
          opacity={hovered ? 0.9 : 0.7} 
        />
      </mesh>
      
      <mesh 
        position={[0, 0.01, -0.15]} 
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <coneGeometry args={[0.15, 0.3, 3]} />
        <meshBasicMaterial color={hovered ? '#C9A24A' : '#ffffff'} />
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

  useEffect(() => {
    const isNewViewpoint = lastViewpointId.current !== viewpoint.id;
    
    targetPosition.current.set(...viewpoint.position);
    targetLookAt.current.set(...viewpoint.lookAt);
    lastViewpointId.current = viewpoint.id;
    
    if (isNewViewpoint) {
      if (controlsReady && controlsRef.current && !needsInitialSync.current) {
        isAnimating.current = true;
      } else {
        needsInitialSync.current = true;
      }
    }
  }, [viewpoint, controlsReady]);

  useFrame((_, delta) => {
    if (!controlsRef.current || !controlsReady) return;
    
    if (needsInitialSync.current) {
      camera.position.copy(targetPosition.current);
      controlsRef.current.target.copy(targetLookAt.current);
      controlsRef.current.update();
      needsInitialSync.current = false;
      isAnimating.current = false;
      return;
    }
    
    if (!isAnimating.current) return;
    
    const lerpFactor = Math.min(5 * delta, 0.2);
    camera.position.lerp(targetPosition.current, lerpFactor);
    controlsRef.current.target.lerp(targetLookAt.current, lerpFactor);
    controlsRef.current.update();
    
    if (camera.position.distanceTo(targetPosition.current) < 0.03) {
      camera.position.copy(targetPosition.current);
      controlsRef.current.target.copy(targetLookAt.current);
      controlsRef.current.update();
      isAnimating.current = false;
    }
  });

  return (
    <OrbitControls 
      ref={controlsCallback}
      enableZoom={isEditor}
      enablePan={false}
      minPolarAngle={Math.PI * 0.35}
      maxPolarAngle={Math.PI * 0.65}
      minDistance={0.5}
      maxDistance={isEditor ? 10 : 5}
      rotateSpeed={0.4}
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
      camera={{ fov: 60, near: 0.1, far: 100 }}
      style={{ background: '#f0f0f0' }}
    >
      <ambientLight intensity={0.9} />
      <hemisphereLight
        args={['#fffef8', '#e0e0e8', 0.6]}
        position={[0, preset.dimensions.height, 0]}
      />
      <directionalLight 
        position={[3, preset.dimensions.height - 0.5, 2]} 
        intensity={0.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      />
      <directionalLight 
        position={[-3, preset.dimensions.height - 0.5, -2]} 
        intensity={0.3}
      />
      <pointLight position={[0, preset.dimensions.height - 0.5, 0]} intensity={0.4} />

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
