import React, { useState, useEffect, useCallback } from 'react';
import { Gallery360Scene, ArtworkFocusTarget } from './Gallery360Scene';
import { ArtworkInfoPanel, ArtworkPanelData } from './ArtworkInfoPanel';
import { ShareEmbedModal } from './ShareEmbedModal';
import { useHotspots } from './useHotspots';
import { useArtworkSlots, SlotAssignment } from './useArtworkSlots';
import { gallery360Presets, getPresetById, Slot } from '../../config/gallery360Presets';

interface Artwork {
  id: number;
  artwork_id?: number;
  title: string;
  artist_name?: string;
  image_url: string;
  width?: number;
  height?: number;
  width_value?: number;
  height_value?: number;
  width_cm?: number;
  height_cm?: number;
  orientation?: 'horizontal' | 'vertical' | 'square';
}

interface Gallery360EditorProps {
  exhibitionId: string;
  presetId?: string;
  availableArtworks: Artwork[];
  initialAssignments?: SlotAssignment[];
  onSave: (presetId: string, assignments: SlotAssignment[]) => Promise<void>;
  onBack?: () => void;
  className?: string;
  viewerMode?: boolean;
  embedMode?: boolean;
}

export function Gallery360Editor({
  exhibitionId,
  presetId = 'modern-gallery-v2',
  availableArtworks,
  initialAssignments = [],
  onSave,
  onBack,
  className = '',
  viewerMode = false,
  embedMode = false
}: Gallery360EditorProps) {
  const [selectedPresetId, setSelectedPresetId] = useState(presetId);
  const preset = getPresetById(selectedPresetId) || gallery360Presets[0];
  
  const { 
    currentViewpoint, 
    navigateToViewpoint 
  } = useHotspots(preset.viewpoints, preset.hotspots, 'center');
  
  const { 
    slotAssignments, 
    assignArtwork,
    loadAssignments,
    clearSlot,
    resetToSlots
  } = useArtworkSlots(preset.slots);

  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previousPresetId, setPreviousPresetId] = useState(selectedPresetId);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  
  const [activeArtwork, setActiveArtwork] = useState<ArtworkPanelData | null>(null);
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);
  const [focusTarget, setFocusTarget] = useState<ArtworkFocusTarget | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    // Wait for both initialAssignments AND availableArtworks to be loaded
    if (initialAssignments.length > 0 && availableArtworks.length > 0 && selectedPresetId === presetId) {
      // Hydrate saved assignments with current artwork dimensions from database
      const hydratedAssignments = initialAssignments.map(assignment => {
        if (!assignment.artworkId) return assignment;
        
        // Find the artwork in availableArtworks - check both id and artwork_id for compatibility
        // Saved scenes may use gallery_artworks.id while API may return different ID structure
        const artwork = availableArtworks.find(a => 
          String(a.id) === String(assignment.artworkId) || 
          String(a.artwork_id) === String(assignment.artworkId)
        );
        
        if (artwork) {
          const widthCm = artwork.width_cm || artwork.width_value || artwork.width || assignment.width || 100;
          const heightCm = artwork.height_cm || artwork.height_value || artwork.height || assignment.height || 70;
          
          console.log('[HydrateAssignment]', artwork.title, {
            matchedId: artwork.id,
            assignmentId: assignment.artworkId,
            savedDimensions: `${assignment.width}x${assignment.height}`,
            freshDimensions: `${widthCm}x${heightCm}`,
            orientation: heightCm > widthCm ? 'PORTRAIT' : 'LANDSCAPE'
          });
          
          return {
            ...assignment,
            artworkUrl: artwork.image_url || assignment.artworkUrl,
            artworkTitle: artwork.title || assignment.artworkTitle,
            artistName: artwork.artist_name || assignment.artistName,
            width: widthCm,
            height: heightCm
          };
        } else {
          console.warn('[HydrateAssignment] No match found for artworkId:', assignment.artworkId, 
            'Available IDs:', availableArtworks.map(a => ({ id: a.id, artwork_id: a.artwork_id })));
        }
        
        return assignment;
      });
      
      loadAssignments(hydratedAssignments);
    }
  }, [initialAssignments, loadAssignments, selectedPresetId, presetId, availableArtworks]);

  useEffect(() => {
    if (selectedPresetId !== previousPresetId) {
      resetToSlots(preset.slots);
      setSelectedSlotId(null);
      setPreviousPresetId(selectedPresetId);
    }
  }, [selectedPresetId, previousPresetId, preset.slots, resetToSlots]);

  const handleAssignArtwork = (slotId: string, artwork: Artwork | null) => {
    if (artwork) {
      // Priority: width_cm > width_value > width > fallback
      const widthCm = artwork.width_cm || artwork.width_value || artwork.width || 100;
      const heightCm = artwork.height_cm || artwork.height_value || artwork.height || 70;
      
      console.log('[AssignArtwork]', artwork.title, { 
        width_cm: artwork.width_cm, 
        height_cm: artwork.height_cm,
        width_value: artwork.width_value,
        height_value: artwork.height_value,
        width: artwork.width,
        height: artwork.height,
        resolved: { widthCm, heightCm }
      });
      
      assignArtwork(slotId, String(artwork.id), {
        artworkUrl: artwork.image_url,
        artworkTitle: artwork.title,
        artistName: artwork.artist_name,
        width: widthCm,
        height: heightCm
      });
    } else {
      clearSlot(slotId);
    }
  };

  const handleArtworkClick = useCallback((slotId: string, assignment: SlotAssignment, slot: Slot) => {
    const priceLabel = assignment.priceAmount 
      ? `${assignment.priceAmount.toLocaleString('hr-HR')} ${assignment.priceCurrency || 'EUR'}`
      : undefined;
    
    const artworkData: ArtworkPanelData = {
      slotId: assignment.slotId,
      artworkId: assignment.artworkId,
      artworkUrl: assignment.artworkUrl,
      artworkTitle: assignment.artworkTitle,
      artistName: assignment.artistName,
      width: assignment.width,
      height: assignment.height,
      description: assignment.description || undefined,
      price: priceLabel,
      externalUrl: assignment.buyUrl || undefined
    };
    
    setActiveArtwork(artworkData);
    setInfoPanelOpen(true);
    
    setFocusTarget({
      position: slot.position,
      rotation: slot.rotation,
      slotId: slot.id
    });
  }, []);
  
  const handleCloseInfoPanel = useCallback(() => {
    setInfoPanelOpen(false);
    setFocusTarget(null);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await onSave(selectedPresetId, slotAssignments);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save 360 scene:', err);
    } finally {
      setSaving(false);
    }
  };

  const selectedSlot = preset.slots.find(s => s.id === selectedSlotId);
  const selectedAssignment = slotAssignments.find(sa => sa.slotId === selectedSlotId);

  if (viewerMode) {
    return (
      <div className={`h-full w-full relative ${className}`}>
        <Gallery360Scene
          preset={preset}
          slotAssignments={slotAssignments}
          currentViewpoint={currentViewpoint}
          onNavigate={navigateToViewpoint}
          isEditor={false}
          onArtworkClick={handleArtworkClick}
          focusTarget={focusTarget}
          onFocusDismiss={handleCloseInfoPanel}
        />
        
        <ArtworkInfoPanel
          artwork={activeArtwork}
          open={infoPanelOpen}
          onClose={handleCloseInfoPanel}
        />

        {!embedMode && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 rounded-lg px-3 py-2">
            {preset.viewpoints.map(vp => (
              <button
                key={vp.id}
                onClick={() => navigateToViewpoint(vp.id)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  currentViewpoint.id === vp.id
                    ? 'bg-[#C9A24A] text-white'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {vp.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex h-full ${className}`}>
      <div className={`${panelCollapsed ? 'w-12' : 'w-80'} bg-white border-r border-gray-200 flex flex-col overflow-hidden transition-all duration-300`}>
        {panelCollapsed ? (
          <button
            onClick={() => setPanelCollapsed(false)}
            className="w-full h-full flex items-center justify-center hover:bg-gray-100 transition-colors"
            title="Expand panel"
          >
            <svg className="w-5 h-5 text-[#264C61]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            {onBack && (
              <button 
                onClick={onBack}
                className="text-[#264C61] hover:text-[#1D3A4A] flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            )}
            <h2 className="text-lg font-semibold text-[#264C61]">360° Editor</h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowShareModal(true)}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="Share / Embed"
              >
                <svg className="w-5 h-5 text-[#264C61]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
              <button
                onClick={() => setPanelCollapsed(true)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Collapse panel"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>
          </div>
          
          <select
            value={selectedPresetId}
            onChange={(e) => setSelectedPresetId(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
          >
            {gallery360Presets.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Wall Slots</h3>
          <div className="space-y-2">
            {preset.slots.map(slot => {
              const assignment = slotAssignments.find(sa => sa.slotId === slot.id);
              const isSelected = selectedSlotId === slot.id;
              
              return (
                <div
                  key={slot.id}
                  onClick={() => setSelectedSlotId(slot.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    isSelected 
                      ? 'border-[#C9A24A] bg-[#C9A24A]/10' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{slot.label}</span>
                    {assignment?.artworkId && (
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    )}
                  </div>
                  {assignment?.artworkTitle && (
                    <p className="text-xs text-gray-500 mt-1 truncate">{assignment.artworkTitle}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {selectedSlot && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <h4 className="text-sm font-medium text-gray-900 mb-2">{selectedSlot.label}</h4>
            <select
              value={selectedAssignment?.artworkId || ''}
              onChange={(e) => {
                const artworkId = e.target.value;
                if (artworkId) {
                  const artwork = availableArtworks.find(a => String(a.id) === artworkId);
                  if (artwork) handleAssignArtwork(selectedSlot.id, artwork);
                } else {
                  handleAssignArtwork(selectedSlot.id, null);
                }
              }}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm mb-2"
            >
              <option value="">-- Select Artwork --</option>
              {availableArtworks.map(artwork => (
                <option key={artwork.id} value={String(artwork.id)}>
                  {artwork.title}
                </option>
              ))}
            </select>
            
            {selectedAssignment?.artworkUrl && (
              <div className="mt-2">
                <img 
                  src={selectedAssignment.artworkUrl} 
                  alt={selectedAssignment.artworkTitle}
                  className="w-full h-24 object-contain bg-gray-100 rounded"
                />
              </div>
            )}
          </div>
        )}

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2 px-4 bg-[#264C61] text-white rounded-lg hover:bg-[#1D3A4A] disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Scene'}
          </button>
        </div>
          </>
        )}
      </div>

      <div className="flex-1 relative">
        <Gallery360Scene
          preset={preset}
          slotAssignments={slotAssignments}
          currentViewpoint={currentViewpoint}
          onNavigate={navigateToViewpoint}
          isEditor={true}
          selectedSlotId={selectedSlotId || undefined}
          onSlotSelect={setSelectedSlotId}
          onArtworkClick={handleArtworkClick}
          focusTarget={focusTarget}
          onFocusDismiss={handleCloseInfoPanel}
        />
        
        <ArtworkInfoPanel
          artwork={activeArtwork}
          open={infoPanelOpen}
          onClose={handleCloseInfoPanel}
        />

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 rounded-lg px-3 py-2">
          {preset.viewpoints.map(vp => (
            <button
              key={vp.id}
              onClick={() => navigateToViewpoint(vp.id)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                currentViewpoint.id === vp.id
                  ? 'bg-[#C9A24A] text-white'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {vp.label}
            </button>
          ))}
        </div>
      </div>

      <ShareEmbedModal
        exhibitionId={exhibitionId}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  );
}
