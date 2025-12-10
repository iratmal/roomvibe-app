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

function getProxiedImageUrl(url: string): string {
  if (url.startsWith('/') || url.startsWith('data:')) {
    return url;
  }
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

function Column({ position, height, color }: { 
  position: [number, number, number]; 
  height: number;
  color: string;
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={[0.4, height, 0.4]} />
      <meshStandardMaterial color={color} roughness={0.8} metalness={0.1} />
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
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshBasicMaterial color="#e8f4ff" transparent opacity={0.9} />
      </mesh>
      <rectAreaLight
        position={[0, -0.1, 0]}
        width={width * 0.8}
        height={depth * 0.8}
        intensity={3}
        color="#fff8f0"
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
        <cylinderGeometry args={[0.08, 0.12, 0.15, 16]} />
        <meshStandardMaterial color="#505050" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[0, -0.06, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.03, 16]} />
        <meshBasicMaterial color="#fffbe6" />
      </mesh>
      <pointLight
        position={[0, -0.08, 0]}
        intensity={0.3}
        distance={0.5}
        color="#fff8e0"
      />
      <spotLight
        ref={spotlightRef}
        position={[0, -0.08, 0]}
        angle={0.35}
        penumbra={0.97}
        intensity={5}
        distance={10}
        color="#fffaf0"
        castShadow
        shadow-mapSize={[512, 512]}
      />
    </group>
  );
}

function TiledFloor({ width, depth, color }: { width: number; depth: number; color: string }) {
  const tiles = useMemo(() => {
    const tileSize = 0.6;
    const groutWidth = 0.015;
    const tileActual = tileSize - groutWidth;
    const rows = Math.ceil(depth / tileSize);
    const cols = Math.ceil(width / tileSize);
    const result: Array<{ x: number; z: number; shade: number; roughnessVar: number }> = [];
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = -width / 2 + col * tileSize + tileSize / 2;
        const z = -depth / 2 + row * tileSize + tileSize / 2;
        if (x < width / 2 && x > -width / 2 && z < depth / 2 && z > -depth / 2) {
          const shade = 0.96 + Math.random() * 0.08;
          const roughnessVar = 0.55 + Math.random() * 0.15;
          result.push({ x, z, shade, roughnessVar });
        }
      }
    }
    return { tiles: result, tileActual };
  }, [width, depth]);

  const baseColor = new THREE.Color(color);
  const groutColor = baseColor.clone().multiplyScalar(0.85);

  return (
    <group position={[0, 0.001, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial 
          color={groutColor}
          roughness={0.95}
          metalness={0.0}
        />
      </mesh>
      {tiles.tiles.map((tile, i) => {
        const tileColor = baseColor.clone().multiplyScalar(tile.shade);
        return (
          <mesh
            key={i}
            position={[tile.x, 0.002, tile.z]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
          >
            <planeGeometry args={[tiles.tileActual, tiles.tileActual]} />
            <meshStandardMaterial
              color={tileColor}
              roughness={tile.roughnessVar}
              metalness={0.02}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function OuterEnclosure({ width, height, depth }: { width: number; height: number; depth: number }) {
  const size = Math.max(width, depth) + 80;
  const verticalSize = height + 60;
  
  return (
    <group>
      <mesh>
        <boxGeometry args={[size, verticalSize, size]} />
        <meshBasicMaterial color="#1a1a1a" side={THREE.BackSide} />
      </mesh>
      <mesh position={[0, -0.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.98} />
      </mesh>
    </group>
  );
}

function WoodFloor({ width, depth, color }: { width: number; depth: number; color: string }) {
  const planks = useMemo(() => {
    const plankWidth = 0.2;
    const plankLength = 2;
    const rows = Math.ceil(depth / plankWidth);
    const cols = Math.ceil(width / plankLength);
    const result: Array<{ x: number; z: number; shade: number }> = [];
    
    for (let row = 0; row < rows; row++) {
      const offset = (row % 2) * (plankLength / 2);
      for (let col = 0; col < cols + 1; col++) {
        const x = -width / 2 + col * plankLength + offset;
        const z = -depth / 2 + row * plankWidth;
        if (x < width / 2 + plankLength && x > -width / 2 - plankLength) {
          const shade = 0.85 + Math.random() * 0.3;
          result.push({ x, z, shade });
        }
      }
    }
    return result;
  }, [width, depth]);

  const baseColor = new THREE.Color(color);

  return (
    <group position={[0, 0.001, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial 
          color={color}
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>
      {planks.slice(0, 200).map((plank, i) => {
        const plankColor = baseColor.clone().multiplyScalar(plank.shade);
        return (
          <mesh
            key={i}
            position={[plank.x, 0.001, plank.z]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[1.98, 0.18]} />
            <meshStandardMaterial
              color={plankColor}
              roughness={0.65 + Math.random() * 0.1}
              metalness={0.02}
              transparent
              opacity={0.4}
            />
          </mesh>
        );
      })}
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
    return [
      { position: [-4, height - 0.01, 0] as [number, number, number], width: 3, depth: 4 },
      { position: [4, height - 0.01, 0] as [number, number, number], width: 3, depth: 4 },
      { position: [0, height - 0.01, -3] as [number, number, number], width: 2.5, depth: 3 },
      { position: [0, height - 0.01, 3] as [number, number, number], width: 2.5, depth: 3 },
    ];
  }, [preset.hasSkylights, height]);

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
      ) : (
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[width, depth]} />
          <meshStandardMaterial color={preset.floorColor} roughness={0.8} />
        </mesh>
      )}

      <mesh position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={preset.ceilingColor} roughness={0.95} />
      </mesh>

      <mesh position={[0, height / 2, -halfD]} receiveShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial 
          color={preset.wallColor} 
          side={THREE.DoubleSide} 
          roughness={0.9}
        />
      </mesh>

      <mesh position={[0, height / 2, halfD]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial 
          color={preset.wallColor} 
          side={THREE.DoubleSide}
          roughness={0.9}
        />
      </mesh>

      <mesh position={[halfW, height / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial 
          color={preset.wallColor} 
          side={THREE.DoubleSide}
          roughness={0.9}
        />
      </mesh>

      <mesh position={[-halfW, height / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial 
          color={preset.wallColor} 
          side={THREE.DoubleSide}
          roughness={0.9}
        />
      </mesh>

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
        <mesh position={[0, 0, -0.02]}>
          <planeGeometry args={[slot.width + 0.1, slot.height + 0.1]} />
          <meshBasicMaterial color="#C9A24A" transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
}

function ArtworkImage({ 
  url, 
  slotWidth,
  slotHeight,
  assignmentWidth,
  assignmentHeight,
  onClick,
  hovered,
  setHovered
}: { 
  url: string; 
  slotWidth: number;
  slotHeight: number;
  assignmentWidth?: number;
  assignmentHeight?: number;
  onClick?: () => void;
  hovered: boolean;
  setHovered: (h: boolean) => void;
}) {
  const proxiedUrl = getProxiedImageUrl(url);
  const texture = useTexture(proxiedUrl);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  
  useEffect(() => {
    if (texture) {
      texture.colorSpace = THREE.SRGBColorSpace;
      if (texture.image) {
        const img = texture.image as HTMLImageElement;
        setImageDimensions({
          width: img.width || img.naturalWidth || 100,
          height: img.height || img.naturalHeight || 100
        });
      }
    }
  }, [texture]);

  const dimensions = useMemo(() => {
    let sourceWidth: number;
    let sourceHeight: number;

    if (assignmentWidth && assignmentHeight && assignmentWidth > 0 && assignmentHeight > 0) {
      sourceWidth = assignmentWidth / 100;
      sourceHeight = assignmentHeight / 100;
    } else if (imageDimensions && imageDimensions.width > 0 && imageDimensions.height > 0) {
      const aspect = imageDimensions.width / imageDimensions.height;
      const BASE_SIZE = 0.8;
      if (aspect >= 1) {
        sourceWidth = BASE_SIZE * aspect;
        sourceHeight = BASE_SIZE;
      } else {
        sourceWidth = BASE_SIZE;
        sourceHeight = BASE_SIZE / aspect;
      }
    } else {
      return { width: slotWidth * 0.9, height: slotHeight * 0.9 };
    }

    const widthRatio = slotWidth / sourceWidth;
    const heightRatio = slotHeight / sourceHeight;
    const scaleFactor = Math.min(widthRatio, heightRatio, 1);

    return {
      width: sourceWidth * scaleFactor,
      height: sourceHeight * scaleFactor
    };
  }, [assignmentWidth, assignmentHeight, imageDimensions, slotWidth, slotHeight]);

  return (
    <group>
      <mesh position={[0, 0, -0.015]} castShadow>
        <boxGeometry args={[dimensions.width + 0.05, dimensions.height + 0.05, 0.03]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.1} />
      </mesh>
      <mesh 
        position={[0, 0, 0.01]}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <planeGeometry args={[dimensions.width, dimensions.height]} />
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
  const pulseRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (pulseRef.current) {
      const pulse = Math.sin(clock.elapsedTime * 2) * 0.5 + 0.5;
      pulseRef.current.scale.setScalar(1 + pulse * 0.1);
    }
  });
  
  if (hotspot.targetViewpoint === currentViewpointId) return null;

  return (
    <group 
      position={hotspot.position}
      rotation={[0, hotspot.rotation, 0]}
    >
      <mesh
        ref={pulseRef}
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
        <coneGeometry args={[0.12, 0.25, 3]} />
        <meshBasicMaterial color={hovered ? '#C9A24A' : '#ffffff'} />
      </mesh>
    </group>
  );
}

function CameraController({ 
  viewpoint,
  isEditor,
  galleryDimensions
}: { 
  viewpoint: Viewpoint;
  isEditor?: boolean;
  galleryDimensions: { width: number; height: number; depth: number };
}) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const [controlsReady, setControlsReady] = useState(false);
  
  const targetPosition = useRef(new THREE.Vector3(...viewpoint.position));
  const initialLookDirection = useRef(new THREE.Vector3());
  const lastViewpointId = useRef(viewpoint.id);
  const isAnimating = useRef(false);
  const needsInitialSync = useRef(true);
  
  const bounds = useMemo(() => ({
    minX: -galleryDimensions.width / 2 + 1,
    maxX: galleryDimensions.width / 2 - 1,
    minY: 1.4,
    maxY: galleryDimensions.height - 0.3,
    minZ: -galleryDimensions.depth / 2 + 1,
    maxZ: galleryDimensions.depth / 2 - 1
  }), [galleryDimensions]);
  
  useEffect(() => {
    const lookAt = new THREE.Vector3(...viewpoint.lookAt);
    const pos = new THREE.Vector3(...viewpoint.position);
    initialLookDirection.current.copy(lookAt).sub(pos).normalize();
  }, [viewpoint]);

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
      const targetPoint = targetPosition.current.clone().add(initialLookDirection.current);
      controlsRef.current.target.copy(targetPoint);
      controlsRef.current.update();
      needsInitialSync.current = false;
      isAnimating.current = false;
    }
  }, [controlsReady, camera]);

  useEffect(() => {
    const isNewViewpoint = lastViewpointId.current !== viewpoint.id;
    
    targetPosition.current.set(...viewpoint.position);
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
    
    const clampPosition = () => {
      camera.position.x = Math.max(bounds.minX, Math.min(bounds.maxX, camera.position.x));
      camera.position.y = Math.max(bounds.minY, Math.min(bounds.maxY, camera.position.y));
      camera.position.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, camera.position.z));
      
      const cameraToTarget = controlsRef.current.target.clone().sub(camera.position);
      const distance = cameraToTarget.length();
      if (distance > 0.1) {
        const newTarget = camera.position.clone().add(cameraToTarget.normalize());
        controlsRef.current.target.copy(newTarget);
      }
    };
    
    if (needsInitialSync.current) {
      camera.position.copy(targetPosition.current);
      const targetPoint = targetPosition.current.clone().add(initialLookDirection.current);
      controlsRef.current.target.copy(targetPoint);
      controlsRef.current.update();
      needsInitialSync.current = false;
      isAnimating.current = false;
      return;
    }
    
    if (isAnimating.current) {
      const lerpFactor = Math.min(5 * delta, 0.2);
      camera.position.lerp(targetPosition.current, lerpFactor);
      
      const newTarget = camera.position.clone().add(initialLookDirection.current);
      controlsRef.current.target.lerp(newTarget, lerpFactor);
      controlsRef.current.update();
      
      if (camera.position.distanceTo(targetPosition.current) < 0.03) {
        camera.position.copy(targetPosition.current);
        const finalTarget = targetPosition.current.clone().add(initialLookDirection.current);
        controlsRef.current.target.copy(finalTarget);
        controlsRef.current.update();
        isAnimating.current = false;
      }
    }
    
    if (!isEditor) {
      clampPosition();
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls 
      ref={controlsCallback}
      enableZoom={isEditor}
      enablePan={isEditor}
      minDistance={0.5}
      maxDistance={1.5}
      minPolarAngle={Math.PI * 0.25}
      maxPolarAngle={Math.PI * 0.75}
      rotateSpeed={0.4}
      zoomSpeed={0.3}
      enableDamping={true}
      dampingFactor={0.1}
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
      style={{ background: '#e8e8e8' }}
    >
      <ambientLight intensity={0.4} />
      <hemisphereLight args={['#ffffff', '#b0a090', 0.5]} />
      <directionalLight 
        position={[0, preset.dimensions.height + 5, 0]} 
        intensity={0.6}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      <directionalLight position={[10, 8, 5]} intensity={0.3} />
      <directionalLight position={[-10, 8, -5]} intensity={0.2} />

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

      <CameraController viewpoint={currentViewpoint} isEditor={isEditor} galleryDimensions={preset.dimensions} />
    </Canvas>
  );
}
