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
          color={hovered ? '#e0e0e0' : '#d0d0d0'}
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
            presetId={presetId}
            wallHeight={wallHeight}
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
    </group>
  );
}

// Global artwork scale multiplier - makes all artworks larger relative to room
const ARTWORK_GLOBAL_SCALE = 1.6;

// Frame and canvas configuration for realistic gallery look
const FRAME_CONFIG = {
  thickness: 0.035,      // 3.5cm frame border width
  depth: 0.045,          // 4.5cm total depth (frame + canvas)
  canvasDepth: 0.025,    // 2.5cm canvas body depth
  color: '#1a1a1a',      // Dark charcoal/black frame
  canvasEdge: '#f0ede6', // Off-white canvas edge visible between frame and image
  wallOffset: 0.02       // 2cm offset from wall
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
      {/* Frame - solid box behind canvas, slightly larger */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[
          dimensions.width + frameT * 2, 
          dimensions.height + frameT * 2, 
          frameD
        ]} />
        <meshStandardMaterial 
          color={FRAME_CONFIG.color} 
          roughness={0.35} 
          metalness={0.1} 
        />
      </mesh>

      {/* Canvas body - off-white edge visible between frame and image */}
      <mesh position={[0, 0, frameD / 2 + canvasD / 2 - 0.001]} castShadow>
        <boxGeometry args={[dimensions.width, dimensions.height, canvasD]} />
        <meshStandardMaterial 
          color={FRAME_CONFIG.canvasEdge} 
          roughness={0.85} 
          metalness={0.0} 
        />
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
      
      {/* Subtle hover ring - only visible on hover */}
      {hovered && (
        <mesh 
          position={[0, 0.005, 0]} 
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.35, 0.5, 32]} />
          <meshBasicMaterial 
            color="#5a8cb8" 
            transparent 
            opacity={0.4} 
            depthWrite={false}
          />
        </mesh>
      )}
      
      {/* Small center dot - subtle indicator */}
      <mesh 
        position={[0, 0.003, 0]} 
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[0.08, 16]} />
        <meshBasicMaterial 
          color={hovered ? '#C9A24A' : '#888888'} 
          transparent 
          opacity={hovered ? 0.7 : 0.25} 
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

const CAMERA_MOVE_DURATION = 0.85;
const SCROLL_SPEED = 0.004;
const SCROLL_DAMPING = 0.92;
const MIN_WALL_DISTANCE = 1.0;
const MIN_POLAR_ANGLE = 1.05;
const MAX_POLAR_ANGLE = 2.0;

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function FirstPersonController({ 
  viewpoint,
  galleryDimensions
}: { 
  viewpoint: Viewpoint;
  galleryDimensions: { width: number; height: number; depth: number };
}) {
  const { camera, gl } = useThree();
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const spherical = useRef(new THREE.Spherical());
  
  const startPosition = useRef(new THREE.Vector3(...viewpoint.position));
  const targetPosition = useRef(new THREE.Vector3(...viewpoint.position));
  const startSpherical = useRef(new THREE.Spherical());
  const targetSpherical = useRef(new THREE.Spherical());
  const animationStartTime = useRef<number | null>(null);
  const lastViewpointId = useRef(viewpoint.id);
  
  const scrollVelocity = useRef(0);
  
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
  
  useEffect(() => {
    const pos = new THREE.Vector3(...viewpoint.position);
    const lookAt = new THREE.Vector3(...viewpoint.lookAt);
    clampPosition(pos);
    
    const direction = lookAt.clone().sub(pos).normalize();
    const newTargetSpherical = new THREE.Spherical();
    newTargetSpherical.setFromVector3(direction);
    
    if (lastViewpointId.current !== viewpoint.id) {
      startPosition.current.copy(camera.position);
      targetPosition.current.copy(pos);
      startSpherical.current.copy(spherical.current);
      targetSpherical.current.copy(newTargetSpherical);
      animationStartTime.current = performance.now();
      lastViewpointId.current = viewpoint.id;
      scrollVelocity.current = 0;
      console.log('[CameraNav] goToView', viewpoint.id);
    } else {
      camera.position.copy(pos);
      spherical.current.copy(newTargetSpherical);
    }
  }, [viewpoint, camera, clampPosition]);
  
  useEffect(() => {
    const canvas = gl.domElement;
    
    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };
    
    const handleMouseUp = () => {
      isDragging.current = false;
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      
      const deltaX = e.clientX - previousMousePosition.current.x;
      const deltaY = e.clientY - previousMousePosition.current.y;
      
      spherical.current.theta -= deltaX * 0.003;
      spherical.current.phi += deltaY * 0.003;
      spherical.current.phi = Math.max(MIN_POLAR_ANGLE, Math.min(MAX_POLAR_ANGLE, spherical.current.phi));
      
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };
    
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * SCROLL_SPEED;
      scrollVelocity.current += delta;
    };
    
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging.current = true;
        previousMousePosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    
    const handleTouchEnd = () => {
      isDragging.current = false;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current || e.touches.length !== 1) return;
      
      const deltaX = e.touches[0].clientX - previousMousePosition.current.x;
      const deltaY = e.touches[0].clientY - previousMousePosition.current.y;
      
      spherical.current.theta -= deltaX * 0.003;
      spherical.current.phi += deltaY * 0.003;
      spherical.current.phi = Math.max(MIN_POLAR_ANGLE, Math.min(MAX_POLAR_ANGLE, spherical.current.phi));
      
      previousMousePosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchend', handleTouchEnd);
    canvas.addEventListener('touchmove', handleTouchMove);
    
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchmove', handleTouchMove);
    };
  }, [gl]);
  
  useFrame(() => {
    if (animationStartTime.current !== null) {
      const elapsed = (performance.now() - animationStartTime.current) / 1000;
      const tRaw = Math.min(elapsed / CAMERA_MOVE_DURATION, 1);
      const t = smoothstep(tRaw);
      
      camera.position.lerpVectors(startPosition.current, targetPosition.current, t);
      
      spherical.current.theta = startSpherical.current.theta + 
        (targetSpherical.current.theta - startSpherical.current.theta) * t;
      spherical.current.phi = startSpherical.current.phi + 
        (targetSpherical.current.phi - startSpherical.current.phi) * t;
      
      if (tRaw >= 1) {
        camera.position.copy(targetPosition.current);
        spherical.current.copy(targetSpherical.current);
        animationStartTime.current = null;
      }
    }
    
    if (Math.abs(scrollVelocity.current) > 0.0001) {
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      
      const moveAmount = scrollVelocity.current;
      const newPosition = camera.position.clone().add(direction.multiplyScalar(moveAmount));
      
      if (isWithinBounds(newPosition)) {
        camera.position.copy(newPosition);
      }
      
      scrollVelocity.current *= SCROLL_DAMPING;
      
      if (Math.abs(scrollVelocity.current) < 0.0001) {
        scrollVelocity.current = 0;
      }
    }
    
    clampPosition(camera.position);
    
    const direction = new THREE.Vector3();
    direction.setFromSpherical(spherical.current);
    const lookAtPoint = camera.position.clone().add(direction);
    camera.lookAt(lookAtPoint);
  });
  
  return null;
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
            presetId={preset.id}
            wallHeight={preset.dimensions.height}
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

      {/* Floor navigation hotspots - shown in both editor and viewer modes */}
      {preset.hotspots.map(hotspot => (
        <HotspotMarker
          key={hotspot.id}
          hotspot={hotspot}
          onNavigate={onNavigate}
          currentViewpointId={currentViewpoint.id}
        />
      ))}

      <FirstPersonController viewpoint={currentViewpoint} galleryDimensions={preset.dimensions} />
    </Canvas>
  );
}
