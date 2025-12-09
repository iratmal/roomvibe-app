import React, { useRef, useState, useEffect, Suspense } from 'react';
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
        <meshStandardMaterial color={preset.floorColor} />
      </mesh>

      <mesh position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={preset.ceilingColor} />
      </mesh>

      <mesh position={[0, height / 2, -halfD]} receiveShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={preset.wallColor} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[0, height / 2, halfD]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={preset.wallColor} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[halfW, height / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial color={preset.wallColor} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[-halfW, height / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial color={preset.wallColor} side={THREE.DoubleSide} />
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
        <meshStandardMaterial 
          color={isSelected ? '#C9A24A' : (hovered ? '#e0e0e0' : '#d0d0d0')}
          transparent
          opacity={hasArtwork ? 0 : 0.3}
        />
      </mesh>

      {hasArtwork && (
        <Suspense fallback={
          <mesh>
            <planeGeometry args={[slot.width, slot.height]} />
            <meshBasicMaterial color="#cccccc" />
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
      )}

      {!hasArtwork && isEditor && (
        <Html center>
          <div className="bg-white/80 px-2 py-1 rounded text-xs text-gray-600 whitespace-nowrap pointer-events-none">
            {slot.label}
          </div>
        </Html>
      )}

      {(isSelected || (hovered && isEditor)) && (
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[slot.width + 0.1, slot.height + 0.1]} />
          <meshBasicMaterial color="#C9A24A" transparent opacity={0.5} />
        </mesh>
      )}
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
      position={[0, 0, 0.01]}
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
        emissive={hovered ? '#333333' : '#000000'}
        emissiveIntensity={hovered ? 0.2 : 0}
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

  useEffect(() => {
    camera.position.set(...viewpoint.position);
    if (controlsRef.current) {
      controlsRef.current.target.set(...viewpoint.lookAt);
      controlsRef.current.update();
    }
  }, [viewpoint, camera]);

  return (
    <OrbitControls 
      ref={controlsRef}
      enableZoom={isEditor}
      enablePan={isEditor}
      minPolarAngle={Math.PI / 4}
      maxPolarAngle={Math.PI * 0.65}
      rotateSpeed={0.5}
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
      camera={{ fov: 60, near: 0.1, far: 100 }}
      style={{ background: '#1a1a1a' }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} />
      <pointLight position={[0, 3.5, 0]} intensity={0.4} />

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
