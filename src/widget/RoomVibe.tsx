import React, { useState, useEffect } from 'react';
import { RoomVibeProps, RoomPreset, Artwork, FrameOption, Mode, AnalyticsEvent } from '../types';
import { trackEvent } from '../lib/analytics';
import { generateCheckoutLink } from '../lib/checkout';
import { generateShareLink, parseShareLink } from '../lib/shareLink';
import { submitEmailLead } from '../lib/mailerlite';
import RoomViewer from './RoomViewer';
import ArtworkSelector from './ArtworkSelector';
import Controls from './Controls';
import Pricing from './Pricing';

const RoomVibe: React.FC<RoomVibeProps> = ({
  mode = 'showcase',
  collection = 'all',
  theme = 'azure',
  oneClickBuy = true,
  checkoutType,
  checkoutLinkTemplate,
  onEvent
}) => {
  const currentTheme = theme;
  const [currentMode, setCurrentMode] = useState(mode);
  const [room, setRoom] = useState<RoomPreset>('living');
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [selectedArt, setSelectedArt] = useState<Artwork | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<FrameOption>('none');
  const [wallColor, setWallColor] = useState<string>('#FFFFFF');
  const [designerWidth, setDesignerWidth] = useState<number | undefined>();
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Load artworks
  useEffect(() => {
    fetch('/artworks.json')
      .then(res => res.json())
      .then(data => {
        // Filter by collection if specified
        const filtered = collection === 'all' 
          ? data 
          : data.filter((art: Artwork) => art.tags.includes(collection));
        
        setArtworks(filtered);
        if (filtered.length > 0) {
          setSelectedArt(filtered[0]);
        }
      })
      .catch(err => console.error('Failed to load artworks:', err));
  }, [collection]);

  // Parse share link on mount
  useEffect(() => {
    const sharedState = parseShareLink();
    if (sharedState) {
      if (sharedState.room) setRoom(sharedState.room);
      if (sharedState.wallColor) setWallColor(sharedState.wallColor);
      if (sharedState.width) setDesignerWidth(sharedState.width);
      
      if (sharedState.artId) {
        const art = artworks.find(a => a.id === sharedState.artId);
        if (art) {
          setSelectedArt(art);
          if (sharedState.frame) setSelectedFrame(sharedState.frame);
        }
      }
    }
  }, [artworks]);

  // Helper to emit events to both trackEvent and onEvent prop
  const emitEvent = (eventData: Omit<AnalyticsEvent, 'ts'>) => {
    const eventWithTs = { ...eventData, ts: Date.now() };
    
    // Track internally
    trackEvent(eventData);
    
    // Call prop callback if provided
    if (onEvent) {
      onEvent(eventWithTs);
    }
  };

  // Track view event (once on mount)
  useEffect(() => {
    emitEvent({ type: 'rv_view' as const, theme: currentTheme, mode: currentMode });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  const handleArtSelect = (art: Artwork) => {
    setSelectedArt(art);
    emitEvent({ type: 'rv_art_select' as const, artId: art.id, theme: currentTheme, mode: currentMode });
  };

  const handleFrameChange = (frame: FrameOption) => {
    setSelectedFrame(frame);
    emitEvent({ type: 'rv_frame_change' as const, artId: selectedArt?.id, frame, theme: currentTheme, mode: currentMode });
  };

  const handleWallColorChange = (color: string) => {
    setWallColor(color);
    emitEvent({ type: 'rv_wall_color_change' as const, wallColor: color, theme: currentTheme, mode: currentMode });
  };

  const handleRoomChange = (newRoom: RoomPreset) => {
    setRoom(newRoom);
    emitEvent({ type: 'rv_room_change' as const, room: newRoom, theme: currentTheme, mode: currentMode });
  };

  const handleBuyNow = () => {
    if (!selectedArt || !oneClickBuy) return;
    
    // Ensure checkout configuration exists
    if (!selectedArt.checkout.template && !checkoutLinkTemplate) {
      alert('Checkout configuration is missing. Please contact support.');
      return;
    }
    
    const link = generateCheckoutLink(selectedArt, selectedFrame, checkoutType, checkoutLinkTemplate);
    emitEvent({ type: 'rv_buy_click' as const, artId: selectedArt.id, theme: currentTheme, mode: currentMode });
    
    window.open(link, '_blank');
  };

  const handleEmailSubmit = async (email: string) => {
    if (!selectedArt) return;
    
    await submitEmailLead(email, selectedArt, currentTheme);
    emitEvent({ type: 'rv_email_submit' as const, artId: selectedArt.id, theme: currentTheme, mode: currentMode });
    
    setShowEmailModal(false);
  };

  const handleCopyLink = () => {
    if (!selectedArt) return;
    
    const link = generateShareLink({
      room,
      artId: selectedArt.id,
      frame: selectedFrame,
      wallColor,
      width: designerWidth
    });
    
    navigator.clipboard.writeText(link);
    emitEvent({ type: 'rv_share_copy' as const, artId: selectedArt.id, theme: currentTheme, mode: currentMode });
    
    alert('Link copied to clipboard!');
  };

  const handleDesignerModeToggle = () => {
    const newMode: Mode = currentMode === 'showcase' ? 'designer' : 'showcase';
    setCurrentMode(newMode);
    emitEvent({ type: 'rv_designer_mode_toggle' as const, mode: newMode, theme: currentTheme });
  };

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Header */}
      <header className="bg-surface border-b border-gray-200 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="8" fill="var(--primary)" fillOpacity="0.1"/>
              <path d="M12 15L20 10L28 15V27C28 28.1 27.1 29 26 29H14C12.9 29 12 28.1 12 27V15Z" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 29V20H25V29" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h1 className="text-2xl font-bold text-black">
              Visualize Your Space in Seconds
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Room Viewer - Left/Top */}
          <div className="lg:col-span-2">
            <RoomViewer
              room={room}
              artwork={selectedArt}
              frame={selectedFrame}
              wallColor={wallColor}
              designerWidth={designerWidth}
            />
            
            {/* Room Selector */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => handleRoomChange('living')}
                className={`flex-1 py-2 px-4 rounded ${room === 'living' ? 'bg-primary text-white' : 'bg-surface'}`}
              >
                Living Room
              </button>
              <button
                onClick={() => handleRoomChange('hallway')}
                className={`flex-1 py-2 px-4 rounded ${room === 'hallway' ? 'bg-primary text-white' : 'bg-surface'}`}
              >
                Hallway
              </button>
              <button
                onClick={() => handleRoomChange('bedroom')}
                className={`flex-1 py-2 px-4 rounded ${room === 'bedroom' ? 'bg-primary text-white' : 'bg-surface'}`}
              >
                Bedroom
              </button>
            </div>
          </div>

          {/* Controls - Right/Bottom */}
          <div className="space-y-6">
            <Controls
              artwork={selectedArt}
              selectedFrame={selectedFrame}
              wallColor={wallColor}
              designerMode={currentMode === 'designer'}
              designerWidth={designerWidth}
              onFrameChange={handleFrameChange}
              onWallColorChange={handleWallColorChange}
              onDesignerWidthChange={setDesignerWidth}
              onDesignerModeToggle={handleDesignerModeToggle}
            />
            
            {/* Actions */}
            <div className="space-y-3">
              {oneClickBuy && (
                <button
                  onClick={handleBuyNow}
                  disabled={!selectedArt}
                  className="w-full bg-primary text-white py-3 px-6 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  Buy Now - €{selectedArt?.price || 0}
                </button>
              )}
              
              <button
                onClick={() => setShowEmailModal(true)}
                disabled={!selectedArt}
                className="w-full bg-surface text-text py-2 px-6 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                Email me this
              </button>
              
              <button
                onClick={handleCopyLink}
                disabled={!selectedArt}
                className="w-full bg-surface text-text py-2 px-6 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                Copy share link
              </button>
            </div>
          </div>
        </div>

        {/* Artwork Selector */}
        <div className="mt-12">
          <ArtworkSelector
            artworks={artworks}
            selectedArt={selectedArt}
            onSelect={handleArtSelect}
          />
        </div>

        {/* Pricing Section */}
        <div className="mt-16">
          <Pricing />
        </div>
      </main>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Get this look via email</h3>
            <input
              type="email"
              placeholder="your@email.com"
              className="w-full px-4 py-2 border border-gray-300 rounded mb-4"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleEmailSubmit((e.target as HTMLInputElement).value);
                }
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  handleEmailSubmit(input.value);
                }}
                className="flex-1 bg-primary text-white py-2 px-4 rounded hover:opacity-90"
              >
                Send
              </button>
              <button
                onClick={() => setShowEmailModal(false)}
                className="flex-1 bg-gray-200 py-2 px-4 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomVibe;
