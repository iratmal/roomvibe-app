import { useEffect, useRef, useState, useCallback } from 'react';
import type { Gallery360Preset, Slot, Viewpoint } from '../../config/gallery360Presets';
import type { SlotAssignment } from './useArtworkSlots';
import { 
  hybridPanoramaConfig, 
  type PanoramaViewpoint,
  getPanoramaResolution,
  getPanoramaLabel
} from '../../config/hybridPanoramaConfig';
import { getHybridSlotsForViewpoint, HYBRID_SLOT_DEBUG } from '../../config/hybridStudioSlots';

const panoramaCache = new Map<string, string>();
const loadedPanoramaUrls = new Map<string, { url: string; isPlaceholder: boolean }>();

function logPanorama(viewpointId: string, message: string, isPlaceholder = false) {
  const label = getPanoramaLabel(viewpointId);
  const prefix = isPlaceholder ? '[Placeholder]' : '[Panorama]';
  console.log(`${prefix} ${label}: ${message}`);
}

// Navigation map for Hybrid Studio Gallery
// Defines spatial relationships between viewpoints
interface NavigationLinks {
  forward?: string;
  back?: string;
  left?: string;
  right?: string;
}

const HYBRID_NAVIGATION_MAP: Record<string, NavigationLinks> = {
  'entrance': {
    forward: 'center',
    left: undefined,
    right: undefined,
    back: undefined
  },
  'center': {
    forward: undefined, // At center, user chooses left or right
    back: 'entrance',
    left: 'back-left',
    right: 'back-right'
  },
  'back-left': {
    forward: undefined,
    back: 'center',
    left: undefined,
    right: 'back-right'
  },
  'back-right': {
    forward: undefined,
    back: 'center',
    left: 'back-left',
    right: undefined
  }
};

function getNavigationLinks(viewpointId: string): NavigationLinks {
  return HYBRID_NAVIGATION_MAP[viewpointId] || {};
}

function generatePlaceholderPanorama(viewpointId: string): string {
  const cacheKey = `placeholder-${viewpointId}`;
  if (panoramaCache.has(cacheKey)) {
    return panoramaCache.get(cacheKey)!;
  }
  
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;
  
  const colors: Record<string, { wall: string; floor: string; ceiling: string; accent: string }> = {
    'entrance': { wall: '#F5F3F0', floor: '#E0DCD8', ceiling: '#FAFAF8', accent: '#D4B896' },
    'center': { wall: '#F3F1EE', floor: '#DED9D5', ceiling: '#F8F8F6', accent: '#C4A882' },
    'back-left': { wall: '#F1EFEC', floor: '#DCD7D3', ceiling: '#F6F6F4', accent: '#B8A078' },
    'back-right': { wall: '#EFECEA', floor: '#DAD5D1', ceiling: '#F4F4F2', accent: '#AC986E' }
  };
  
  const c = colors[viewpointId] || colors['entrance'];
  
  const ceilingHeight = canvas.height * 0.32;
  ctx.fillStyle = c.ceiling;
  ctx.fillRect(0, 0, canvas.width, ceilingHeight);
  
  const floorStart = canvas.height * 0.68;
  const floorGradient = ctx.createLinearGradient(0, floorStart, 0, canvas.height);
  floorGradient.addColorStop(0, c.floor);
  floorGradient.addColorStop(1, '#C8C4C0');
  ctx.fillStyle = floorGradient;
  ctx.fillRect(0, floorStart, canvas.width, canvas.height - floorStart);
  
  const wallGradient = ctx.createLinearGradient(0, ceilingHeight, 0, floorStart);
  wallGradient.addColorStop(0, c.wall);
  wallGradient.addColorStop(0.5, c.wall);
  wallGradient.addColorStop(1, '#EAE7E3');
  ctx.fillStyle = wallGradient;
  ctx.fillRect(0, ceilingHeight, canvas.width, floorStart - ceilingHeight);
  
  ctx.strokeStyle = '#D8D4D0';
  ctx.lineWidth = 1;
  
  const wallSections = 12;
  for (let i = 0; i <= wallSections; i++) {
    const x = (canvas.width / wallSections) * i;
    ctx.beginPath();
    ctx.moveTo(x, ceilingHeight);
    ctx.lineTo(x, floorStart);
    ctx.stroke();
  }
  
  ctx.strokeStyle = c.accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, ceilingHeight + 2);
  ctx.lineTo(canvas.width, ceilingHeight + 2);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(0, floorStart - 2);
  ctx.lineTo(canvas.width, floorStart - 2);
  ctx.stroke();
  
  ctx.fillStyle = '#999';
  ctx.font = '20px system-ui, sans-serif';
  ctx.textAlign = 'center';
  const label = viewpointId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  ctx.fillText(`Hybrid Studio - ${label}`, canvas.width / 2, canvas.height / 2);
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillStyle = '#AAA';
  ctx.fillText('Gallery Panorama Preview', canvas.width / 2, canvas.height / 2 + 24);
  
  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
  panoramaCache.set(cacheKey, dataUrl);
  return dataUrl;
}

async function loadPanoramaImage(viewpoint: PanoramaViewpoint): Promise<{ url: string; isPlaceholder: boolean; resolution: number }> {
  const { id, panoramaUrl } = viewpoint;
  const resolution = getPanoramaResolution(id);
  
  if (loadedPanoramaUrls.has(id)) {
    const cached = loadedPanoramaUrls.get(id)!;
    logPanorama(id, `Loaded from cache`, cached.isPlaceholder);
    return { url: cached.url, isPlaceholder: cached.isPlaceholder, resolution };
  }
  
  if (!panoramaUrl) {
    logPanorama(id, 'No URL configured, using placeholder', true);
    const placeholder = generatePlaceholderPanorama(id);
    loadedPanoramaUrls.set(id, { url: placeholder, isPlaceholder: true });
    return { url: placeholder, isPlaceholder: true, resolution: 2048 };
  }
  
  logPanorama(id, `Loading from: ${panoramaUrl}`);
  
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    const timeoutId = setTimeout(() => {
      logPanorama(id, 'Load timeout (10s), using placeholder', true);
      const placeholder = generatePlaceholderPanorama(id);
      loadedPanoramaUrls.set(id, { url: placeholder, isPlaceholder: true });
      resolve({ url: placeholder, isPlaceholder: true, resolution: 2048 });
    }, 10000);
    
    img.onload = () => {
      clearTimeout(timeoutId);
      const actualResolution = img.naturalWidth;
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      
      // Validate equirectangular 2:1 aspect ratio
      if (Math.abs(aspectRatio - 2.0) > 0.01) {
        console.warn(`[Panorama] ${getPanoramaLabel(id)}: Non-standard aspect ratio ${aspectRatio.toFixed(2)}:1 (expected 2:1 equirectangular)`);
      }
      
      logPanorama(id, `Loaded successfully (${actualResolution}x${img.naturalHeight})`);
      loadedPanoramaUrls.set(id, { url: panoramaUrl, isPlaceholder: false });
      resolve({ url: panoramaUrl, isPlaceholder: false, resolution: actualResolution });
    };
    
    img.onerror = () => {
      clearTimeout(timeoutId);
      logPanorama(id, `Failed to load (${panoramaUrl}), using placeholder`, true);
      const placeholder = generatePlaceholderPanorama(id);
      loadedPanoramaUrls.set(id, { url: placeholder, isPlaceholder: true });
      resolve({ url: placeholder, isPlaceholder: true, resolution: 2048 });
    };
    
    img.src = panoramaUrl;
  });
}

interface HybridPanoramaGalleryRendererProps {
  preset: Gallery360Preset;
  slotAssignments: SlotAssignment[];
  currentViewpoint: Viewpoint;
  onNavigate: (viewpointId: string) => void;
  onArtworkClick?: (slotId: string, assignment: SlotAssignment, slot: Slot) => void;
  isEditor?: boolean;
  selectedSlotId?: string;
  onSlotSelect?: (slotId: string) => void;
}

interface MarzipanoViewer {
  createScene: (options: any) => any;
  scene: () => any;
  switchScene: (scene: any, options?: any, done?: () => void) => void;
  destroy: () => void;
  updateSize: () => void;
  controls: () => any;
  view: () => any;
}

export function HybridPanoramaGalleryRenderer({
  preset,
  slotAssignments,
  currentViewpoint,
  onNavigate,
  onArtworkClick,
  isEditor = false,
  selectedSlotId,
  onSlotSelect
}: HybridPanoramaGalleryRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<MarzipanoViewer | null>(null);
  const scenesRef = useRef<Map<string, any>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marzipanoLoaded, setMarzipanoLoaded] = useState(false);

  const initializeMarzipano = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      const Marzipano = await import('marzipano');
      setMarzipanoLoaded(true);

      if (viewerRef.current) {
        viewerRef.current.destroy();
      }

      const viewer = new Marzipano.Viewer(containerRef.current, {
        controls: {
          mouseViewMode: 'drag'
        }
      });
      viewerRef.current = viewer;

      console.log('[Hybrid Studio] Initializing panorama viewer...');
      
      const panoramaLoadPromises = hybridPanoramaConfig.viewpoints.map(async (vpConfig) => {
        const { url: panoramaUrl, resolution } = await loadPanoramaImage(vpConfig);
        const source = Marzipano.ImageUrlSource.fromString(panoramaUrl);
        // Support high-resolution panoramas (4096x2048 to 8192x4096)
        const geometry = new Marzipano.EquirectGeometry([{ width: resolution }]);
        
        const limiter = Marzipano.RectilinearView.limit.traditional(
          100 * Math.PI / 180,
          120 * Math.PI / 180
        );
        
        const view = new Marzipano.RectilinearView(
          {
            yaw: vpConfig.initialYaw,
            pitch: vpConfig.initialPitch,
            fov: vpConfig.initialFov
          },
          limiter
        );

        const scene = viewer.createScene({
          source,
          geometry,
          view,
          pinFirstLevel: true
        });

        scenesRef.current.set(vpConfig.id, scene);
        return { id: vpConfig.id, scene };
      });

      await Promise.all(panoramaLoadPromises);

      const initialScene = scenesRef.current.get(currentViewpoint.id);
      if (initialScene) {
        initialScene.switchTo({ transitionDuration: 0 });
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Failed to initialize Marzipano:', err);
      setError('Failed to load panorama viewer. Please try refreshing the page.');
      setIsLoading(false);
    }
  }, [currentViewpoint.id]);

  useEffect(() => {
    initializeMarzipano();

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
      scenesRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!viewerRef.current || !marzipanoLoaded) return;

    const scene = scenesRef.current.get(currentViewpoint.id);
    if (scene) {
      const label = getPanoramaLabel(currentViewpoint.id);
      console.log(`[Panorama] Switching to: ${label}`);
      viewerRef.current.switchScene(scene, { transitionDuration: 800 });
    }
  }, [currentViewpoint.id, marzipanoLoaded]);

  useEffect(() => {
    const handleResize = () => {
      if (viewerRef.current) {
        viewerRef.current.updateSize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const slotMappings = getHybridSlotsForViewpoint(currentViewpoint.id);
  const [showDebugBoxes, setShowDebugBoxes] = useState(HYBRID_SLOT_DEBUG.showBoundingBoxes);

  const handleSlotClick = (slotId: string) => {
    const assignment = slotAssignments.find(sa => sa.slotId === slotId);
    const slot = preset.slots.find(s => s.id === slotId);
    
    if (isEditor && onSlotSelect) {
      onSlotSelect(slotId);
    } else if (assignment && slot && onArtworkClick) {
      onArtworkClick(slotId, assignment, slot);
    }
  };

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center p-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setIsLoading(true);
              initializeMarzipano();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div 
        ref={containerRef} 
        className="w-full h-full"
        style={{ touchAction: 'none' }}
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading panorama...</p>
          </div>
        </div>
      )}

      {!isLoading && slotMappings.map(mapping => {
        const assignment = slotAssignments.find(sa => sa.slotId === mapping.slotId);
        const slot = preset.slots.find(s => s.id === mapping.slotId);
        const isSelected = selectedSlotId === mapping.slotId;
        
        if (!slot) return null;

        return (
          <div
            key={`${mapping.slotId}-${mapping.viewpointId}`}
            className={`absolute cursor-pointer transition-all duration-200 ${
              isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
            } ${isEditor ? 'hover:ring-2 hover:ring-blue-300' : 'hover:scale-105'}`}
            style={{
              left: `${mapping.x * 100}%`,
              top: `${mapping.y * 100}%`,
              width: `${mapping.width * 100}%`,
              height: `${mapping.height * 100}%`,
              transform: 'translate(-50%, -50%)',
              border: showDebugBoxes ? '2px dashed rgba(255, 0, 0, 0.7)' : undefined,
              backgroundColor: showDebugBoxes && !assignment?.artworkUrl ? 'rgba(255, 0, 0, 0.1)' : undefined,
            }}
            onClick={() => handleSlotClick(mapping.slotId)}
          >
            {showDebugBoxes && (
              <span className="absolute -top-5 left-0 text-[10px] bg-red-500 text-white px-1 rounded whitespace-nowrap">
                {mapping.slotId.replace('hybrid-', '')}
              </span>
            )}
            {assignment?.artworkUrl ? (
              <img
                src={assignment.artworkUrl}
                alt={assignment.artworkTitle || 'Artwork'}
                className="w-full h-full object-contain bg-white shadow-lg"
                style={{
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                }}
              />
            ) : isEditor ? (
              <div 
                className="w-full h-full border-2 border-dashed border-gray-400 bg-gray-200/50 flex items-center justify-center"
              >
                <span className="text-xs text-gray-500 text-center px-1">
                  {slot.label}
                </span>
              </div>
            ) : null}
          </div>
        );
      })}

      {/* Artplacer-style Navigation Control Cluster - Bottom Right */}
      {(() => {
        const navLinks = getNavigationLinks(currentViewpoint.id);
        const NavButton = ({ 
          onClick, 
          disabled, 
          active,
          children,
          title 
        }: { 
          onClick: () => void; 
          disabled?: boolean;
          active?: boolean;
          children: React.ReactNode;
          title: string;
        }) => (
          <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`w-10 h-10 flex items-center justify-center rounded transition-all ${
              disabled 
                ? 'bg-gray-700/30 text-gray-500 cursor-not-allowed' 
                : active
                  ? 'bg-white text-gray-900 shadow-lg'
                  : 'bg-gray-800/80 text-white hover:bg-gray-700 hover:text-white'
            }`}
          >
            {children}
          </button>
        );
        
        return (
          <div className="absolute bottom-6 right-6 z-20">
            {/* Location name buttons - vertical stack */}
            <div className="flex flex-col gap-1 mb-3">
              <NavButton
                onClick={() => onNavigate('entrance')}
                active={currentViewpoint.id === 'entrance'}
                title="Go to Entrance"
              >
                <span className="text-xs font-medium">E</span>
              </NavButton>
              <NavButton
                onClick={() => onNavigate('center')}
                active={currentViewpoint.id === 'center'}
                title="Go to Center"
              >
                <span className="text-xs font-medium">C</span>
              </NavButton>
            </div>
            
            {/* Directional controls - 2x3 grid like Artplacer */}
            <div className="grid grid-cols-3 gap-1">
              {/* Top row: Rotate Left, Forward, Rotate Right */}
              <NavButton
                onClick={() => navLinks.left && onNavigate(navLinks.left)}
                disabled={!navLinks.left}
                title="Turn Left"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a4 4 0 0 1 4 4v0a4 4 0 0 1-4 4H3m0-8l4-4m-4 4l4 4" />
                </svg>
              </NavButton>
              <NavButton
                onClick={() => navLinks.forward && onNavigate(navLinks.forward)}
                disabled={!navLinks.forward}
                title="Move Forward"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </NavButton>
              <NavButton
                onClick={() => navLinks.right && onNavigate(navLinks.right)}
                disabled={!navLinks.right}
                title="Turn Right"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a4 4 0 0 0-4 4v0a4 4 0 0 0 4 4h10m0-8l-4-4m4 4l-4 4" />
                </svg>
              </NavButton>
              
              {/* Bottom row: Left, Back, Right */}
              <NavButton
                onClick={() => navLinks.left && onNavigate(navLinks.left)}
                disabled={!navLinks.left}
                title="Go Left"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </NavButton>
              <NavButton
                onClick={() => navLinks.back && onNavigate(navLinks.back)}
                disabled={!navLinks.back}
                title="Go Back"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </NavButton>
              <NavButton
                onClick={() => navLinks.right && onNavigate(navLinks.right)}
                disabled={!navLinks.right}
                title="Go Right"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </NavButton>
            </div>
          </div>
        );
      })()}

      {/* Instructions - top left */}
      <div className="absolute top-4 left-4 bg-black/60 px-3 py-1.5 rounded text-xs text-white/80 z-20">
        Drag to look around • Scroll to zoom
      </div>

      {isEditor && (
        <button
          onClick={() => setShowDebugBoxes(!showDebugBoxes)}
          className={`absolute top-14 right-4 px-3 py-1.5 rounded-lg text-xs font-medium z-20 transition-colors ${
            showDebugBoxes 
              ? 'bg-red-500 text-white' 
              : 'bg-white/90 text-gray-600 hover:bg-gray-100'
          }`}
        >
          {showDebugBoxes ? 'Hide Slots' : 'Show Slots'}
        </button>
      )}
    </div>
  );
}

export default HybridPanoramaGalleryRenderer;
