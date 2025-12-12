import React, { useRef, useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { Gallery360Preset, Slot, Hotspot, Viewpoint } from '../../config/gallery360Presets';
import { SlotAssignment } from './useArtworkSlots';

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
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={[0.35, height, 0.35]} />
      <meshStandardMaterial 
        color={color} 
        roughness={0.25} 
        metalness={0.15}
        envMapIntensity={0.4}
      />
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
        intensity={2.5}
        color="#fffef5"
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
        <meshStandardMaterial color="#2a2a2a" roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.02, 16]} />
        <meshBasicMaterial color="#fff8e0" />
      </mesh>
      <pointLight
        position={[0, -0.06, 0]}
        intensity={0.15}
        distance={0.4}
        color="#fff5e0"
      />
      <spotLight
        ref={spotlightRef}
        position={[0, -0.06, 0]}
        angle={0.45}
        penumbra={0.8}
        intensity={5}
        distance={12}
        color="#fffaf5"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0003}
        shadow-radius={2}
        shadow-normalBias={0.02}
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial 
          color={gapColor}
          roughness={0.95}
          metalness={0.0}
        />
      </mesh>
      
      {floorData.planks.slice(0, 600).map((plank, i) => {
        const plankColor = baseColor.clone().multiplyScalar(plank.shade);
        return (
          <mesh
            key={i}
            position={[plank.x, 0.002, plank.z]}
            rotation={[-Math.PI / 2, plank.grainAngle, 0]}
            receiveShadow
          >
            <planeGeometry args={[floorData.plankLength - 0.006, floorData.plankWidth - 0.003]} />
            <meshStandardMaterial
              color={plankColor}
              roughness={plank.roughVar}
              metalness={0.02}
            />
          </mesh>
        );
      })}
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0025, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial 
          color="#d4c4a8"
          roughness={0.6}
          metalness={0.0}
          transparent
          opacity={0.15}
        />
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
      ) : (
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[width, depth]} />
          <meshStandardMaterial color={preset.floorColor} roughness={0.8} />
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

      {/* Main ceiling plane - warm gallery white */}
      <mesh position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#F2F2EF" roughness={0.9} metalness={0} />
      </mesh>
      
      {/* Cove edge - brown perimeter ledge */}
      {[
        { pos: [0, height - 0.12, -halfD + 0.12] as [number, number, number], size: [width - 0.24, 0.24, 0.24] as [number, number, number] },
        { pos: [0, height - 0.12, halfD - 0.12] as [number, number, number], size: [width - 0.24, 0.24, 0.24] as [number, number, number] },
        { pos: [-halfW + 0.12, height - 0.12, 0] as [number, number, number], size: [0.24, 0.24, depth - 0.48] as [number, number, number] },
        { pos: [halfW - 0.12, height - 0.12, 0] as [number, number, number], size: [0.24, 0.24, depth - 0.48] as [number, number, number] },
      ].map((cove, i) => (
        <mesh key={`cove-${i}`} position={cove.pos}>
          <boxGeometry args={cove.size} />
          <meshStandardMaterial color="#5c4033" roughness={0.8} metalness={0} />
        </mesh>
      ))}
      
      {/* Coffered ceiling grid - 3x3 sections */}
      {/* Main beams - black */}
      {[-depth/3, 0, depth/3].map((zPos, i) => (
        <mesh key={`beam-main-x-${i}`} position={[0, height - 0.12, zPos]}>
          <boxGeometry args={[width - 0.3, 0.24, 0.20]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} metalness={0} />
        </mesh>
      ))}
      {/* Cross beams - black */}
      {[-width/3, 0, width/3].map((xPos, i) => (
        <mesh key={`beam-main-z-${i}`} position={[xPos, height - 0.12, 0]}>
          <boxGeometry args={[0.20, 0.24, depth - 0.3]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} metalness={0} />
        </mesh>
      ))}
      
      {/* Recessed coffer panels - 9 sections */}
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
            <meshStandardMaterial color="#F2F2EF" roughness={0.9} metalness={0} />
          </mesh>
        </group>
      ))}
      
      {/* Track lines - brown rail for spotlights */}
      {[-width/3 - width/6, -width/6, width/6, width/3 + width/6].map((xPos, i) => (
        <mesh key={`track-${i}`} position={[xPos, height - 0.01, 0]}>
          <boxGeometry args={[0.03, 0.03, depth - 0.8]} />
          <meshStandardMaterial color="#5c4033" roughness={0.7} metalness={0.1} />
        </mesh>
      ))}

      {/* Gallery walls - clean gallery white */}
      <mesh position={[0, height / 2, -halfD]} receiveShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial 
          color="#F4F3EF"
          side={THREE.DoubleSide} 
          roughness={0.95}
          metalness={0.0}
        />
      </mesh>

      {/* South wall with entrance opening */}
      <SouthWallWithOpening 
        width={width} 
        height={height} 
        halfD={halfD}
        portalW={3.5}
        portalH={3.5}
      />

      <mesh position={[halfW, height / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial 
          color="#F4F3EF"
          side={THREE.DoubleSide}
          roughness={0.95}
          metalness={0.0}
        />
      </mesh>

      <mesh position={[-halfW, height / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial 
          color="#F4F3EF"
          side={THREE.DoubleSide}
          roughness={0.95}
          metalness={0.0}
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

      {/* Gallery Benches & Decorative Vases - only for Classic Gallery */}
      {preset.id === 'white-cube-v1' && (
        <>
          {/* Designer benches with emerald velvet + brass frame */}
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
      {/* Minimalist dark grey cube bench - no legs, pure block form */}
      <mesh position={[0, BENCH_H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[BENCH_L, BENCH_H, BENCH_W]} />
        <meshStandardMaterial color="#42413c" roughness={0.9} metalness={0} />
      </mesh>
    </group>
  );
}

function DecorativeVase({ position }: { position: [number, number, number] }) {
  const VASE_H = 2.0;     // 200cm height
  const BASE_R = 0.20;    // base radius
  const TOP_R = 0.15;     // top radius (slightly tapered)

  return (
    <group position={position}>
      {/* Main body - neutral stone-beige */}
      <mesh position={[0, VASE_H / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[TOP_R, BASE_R, VASE_H, 32]} />
        <meshStandardMaterial 
          color="#e0d8cc" 
          roughness={0.92} 
          metalness={0}
          flatShading={false}
        />
      </mesh>
      
      {/* Subtle inner shadow ring at top */}
      <mesh position={[0, VASE_H - 0.02, 0]}>
        <cylinderGeometry args={[TOP_R - 0.02, TOP_R, 0.04, 32]} />
        <meshStandardMaterial color="#ccc4b8" roughness={0.95} metalness={0} />
      </mesh>
      
      {/* Base ring for grounding */}
      <mesh position={[0, 0.015, 0]} castShadow>
        <cylinderGeometry args={[BASE_R + 0.01, BASE_R + 0.02, 0.03, 32]} />
        <meshStandardMaterial color="#d4ccc0" roughness={0.88} metalness={0} />
      </mesh>
      
      {/* Subtle vertical texture bands (6 bands around vase) */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh 
          key={i} 
          position={[
            Math.cos((i / 6) * Math.PI * 2) * (BASE_R * 0.85 + TOP_R * 0.15) / 2,
            VASE_H / 2,
            Math.sin((i / 6) * Math.PI * 2) * (BASE_R * 0.85 + TOP_R * 0.15) / 2
          ]}
          rotation={[0, -(i / 6) * Math.PI * 2, 0]}
        >
          <boxGeometry args={[0.008, VASE_H * 0.85, 0.06]} />
          <meshStandardMaterial 
            color={i % 2 === 0 ? "#d4ccc0" : "#e8e0d4"} 
            roughness={0.95} 
            metalness={0}
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}
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
      {/* Portal Frame - warm light concrete/paint */}
      <group>
        {/* Left post */}
        <mesh position={[-(PORTAL_W / 2) - (FRAME_T / 2), PORTAL_H / 2, 0]} castShadow>
          <boxGeometry args={[FRAME_T, PORTAL_H, FRAME_T]} />
          <meshStandardMaterial color="#d7d4cf" roughness={0.9} metalness={0} />
        </mesh>
        {/* Right post */}
        <mesh position={[(PORTAL_W / 2) + (FRAME_T / 2), PORTAL_H / 2, 0]} castShadow>
          <boxGeometry args={[FRAME_T, PORTAL_H, FRAME_T]} />
          <meshStandardMaterial color="#d7d4cf" roughness={0.9} metalness={0} />
        </mesh>
        {/* Top lintel */}
        <mesh position={[0, PORTAL_H + (FRAME_T / 2), 0]} castShadow>
          <boxGeometry args={[PORTAL_W + FRAME_T * 2, FRAME_T, FRAME_T]} />
          <meshStandardMaterial color="#d7d4cf" roughness={0.9} metalness={0} />
        </mesh>
      </group>

      {/* Entrance corridor */}
      <group>
        {/* Corridor left wall */}
        <mesh position={[-(PORTAL_W / 2) - (FRAME_T / 2), PORTAL_H / 2, -CORRIDOR_DEPTH / 2]}>
          <boxGeometry args={[FRAME_T, PORTAL_H, CORRIDOR_DEPTH]} />
          <meshStandardMaterial color="#e8e5e0" roughness={0.95} metalness={0} />
        </mesh>
        {/* Corridor right wall */}
        <mesh position={[(PORTAL_W / 2) + (FRAME_T / 2), PORTAL_H / 2, -CORRIDOR_DEPTH / 2]}>
          <boxGeometry args={[FRAME_T, PORTAL_H, CORRIDOR_DEPTH]} />
          <meshStandardMaterial color="#e8e5e0" roughness={0.95} metalness={0} />
        </mesh>
        {/* Corridor ceiling */}
        <mesh position={[0, PORTAL_H, -CORRIDOR_DEPTH / 2]}>
          <boxGeometry args={[PORTAL_W + FRAME_T * 2, 0.08, CORRIDOR_DEPTH]} />
          <meshStandardMaterial color="#ebe8e3" roughness={0.9} metalness={0} />
        </mesh>
        {/* Corridor floor - matching gallery tiles */}
        <mesh position={[0, 0.005, -CORRIDOR_DEPTH / 2]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[PORTAL_W, CORRIDOR_DEPTH]} />
          <meshStandardMaterial color="#e8e4dc" roughness={0.8} metalness={0} />
        </mesh>
      </group>

      {/* Secondary gallery space visible through corridor */}
      <group position={[0, 0, -CORRIDOR_DEPTH]}>
        {/* Secondary gallery floor - same tiles, extends further */}
        <mesh position={[0, 0.003, -SECONDARY_D / 2]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[SECONDARY_W, SECONDARY_D]} />
          <meshStandardMaterial color="#e5e1d9" roughness={0.85} metalness={0} />
        </mesh>
        
        {/* Secondary gallery back wall - slightly darker */}
        <mesh position={[0, PORTAL_H / 2, -SECONDARY_D]}>
          <boxGeometry args={[SECONDARY_W, PORTAL_H + 0.5, 0.15]} />
          <meshStandardMaterial color="#d8d5d0" roughness={0.95} metalness={0} />
        </mesh>
        
        {/* Secondary gallery left wall */}
        <mesh position={[-SECONDARY_W / 2, PORTAL_H / 2, -SECONDARY_D / 2]}>
          <boxGeometry args={[0.15, PORTAL_H + 0.5, SECONDARY_D]} />
          <meshStandardMaterial color="#dcd9d4" roughness={0.95} metalness={0} />
        </mesh>
        
        {/* Secondary gallery right wall */}
        <mesh position={[SECONDARY_W / 2, PORTAL_H / 2, -SECONDARY_D / 2]}>
          <boxGeometry args={[0.15, PORTAL_H + 0.5, SECONDARY_D]} />
          <meshStandardMaterial color="#dcd9d4" roughness={0.95} metalness={0} />
        </mesh>
        
        {/* Secondary gallery ceiling */}
        <mesh position={[0, PORTAL_H + 0.2, -SECONDARY_D / 2]}>
          <boxGeometry args={[SECONDARY_W, 0.1, SECONDARY_D]} />
          <meshStandardMaterial color="#e0ddd8" roughness={0.9} metalness={0} />
        </mesh>

        {/* Dimmer ambient lighting in secondary space */}
        <pointLight 
          position={[0, PORTAL_H * 0.85, -SECONDARY_D * 0.4]} 
          intensity={0.25} 
          distance={10} 
          color="#f5f0e8"
        />
        <pointLight 
          position={[-2, PORTAL_H * 0.7, -SECONDARY_D * 0.6]} 
          intensity={0.15} 
          distance={6} 
          color="#f0ebe3"
        />
        <pointLight 
          position={[2, PORTAL_H * 0.7, -SECONDARY_D * 0.6]} 
          intensity={0.15} 
          distance={6} 
          color="#f0ebe3"
        />
      </group>

      {/* Corridor lighting - subtle */}
      <pointLight 
        position={[0, PORTAL_H * 0.8, -CORRIDOR_DEPTH * 0.3]} 
        intensity={0.3} 
        distance={5} 
        color="#fff8f2"
      />
    </group>
  );
}

function SouthWallWithOpening({ 
  width, 
  height, 
  halfD,
  portalW,
  portalH
}: { 
  width: number; 
  height: number; 
  halfD: number;
  portalW: number;
  portalH: number;
}) {
  const leftWidth = (width - portalW) / 2;
  const rightWidth = (width - portalW) / 2;
  const topHeight = height - portalH;

  return (
    <group position={[0, 0, halfD]}>
      {/* Left section of wall */}
      <mesh position={[-(width / 2 - leftWidth / 2), height / 2, 0]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[leftWidth, height]} />
        <meshStandardMaterial 
          color="#F4F3EF"
          side={THREE.DoubleSide}
          roughness={0.95}
          metalness={0.0}
        />
      </mesh>

      {/* Right section of wall */}
      <mesh position={[(width / 2 - rightWidth / 2), height / 2, 0]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[rightWidth, height]} />
        <meshStandardMaterial 
          color="#F4F3EF"
          side={THREE.DoubleSide}
          roughness={0.95}
          metalness={0.0}
        />
      </mesh>

      {/* Top section above portal */}
      <mesh position={[0, portalH + topHeight / 2, 0]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[portalW, topHeight]} />
        <meshStandardMaterial 
          color="#F4F3EF"
          side={THREE.DoubleSide}
          roughness={0.95}
          metalness={0.0}
        />
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
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[
          dimensions.width + frameT * 2, 
          dimensions.height + frameT * 2, 
          frameD
        ]} />
        <meshStandardMaterial 
          color={FRAME_CONFIG.color} 
          roughness={0.3} 
          metalness={0.15} 
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
        toneMappingExposure: 1.15
      }}
    >
      <ambientLight intensity={0.25} color="#fff8f2" />
      <hemisphereLight args={['#faf8f5', '#a09080', 0.4]} />
      
      <directionalLight 
        position={[0, preset.dimensions.height + 8, 0]} 
        intensity={0.5}
        color="#fffcf8"
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
      
      <directionalLight position={[12, 6, 6]} intensity={0.2} color="#fff5e8" />
      <directionalLight position={[-12, 6, -6]} intensity={0.15} color="#f8f5ff" />

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
