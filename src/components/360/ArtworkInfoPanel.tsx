import React, { useEffect, useState } from 'react';

export interface ArtworkPanelData {
  slotId: string;
  artworkId: string | null;
  artworkUrl?: string;
  artworkTitle?: string;
  artistName?: string;
  width?: number;
  height?: number;
  medium?: string;
  collection?: string;
  description?: string;
  story?: string;
  price?: string;
  externalUrl?: string;
  sourceArtworkId?: string;
}

interface ArtworkInfoPanelProps {
  artwork: ArtworkPanelData | null;
  open: boolean;
  onClose: () => void;
}

const STORY_MAX_LINES = 4;

export function ArtworkInfoPanel({ artwork, open, onClose }: ArtworkInfoPanelProps) {
  const [storyExpanded, setStoryExpanded] = useState(false);

  useEffect(() => {
    setStoryExpanded(false);
  }, [artwork?.artworkId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!artwork) return null;

  const studioUrl = artwork.sourceArtworkId
    ? `#/studio?artworkId=${artwork.sourceArtworkId}&from=${encodeURIComponent(window.location.hash || '#/')}`
    : null;

  const storyLines = artwork.story
    ? artwork.story.split('\n').filter(l => l.trim())
    : [];
  const isLongStory = storyLines.length > STORY_MAX_LINES ||
    (artwork.story && artwork.story.length > 300);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-10"
          onClick={onClose}
        />
      )}

      <div
        className={`
          fixed top-0 left-0 h-full w-[320px] bg-white shadow-2xl z-20
          flex flex-col transition-transform duration-300 ease-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600"
          onClick={onClose}
          aria-label="Close panel"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="overflow-y-auto flex-1 pb-6">
          {/* Artwork thumbnail */}
          {artwork.artworkUrl && (
            <div className="bg-gray-50 flex items-center justify-center" style={{ minHeight: '180px', maxHeight: '240px' }}>
              <img
                src={artwork.artworkUrl}
                alt={artwork.artworkTitle || 'Artwork'}
                className="w-full h-full object-contain"
                style={{ maxHeight: '240px' }}
              />
            </div>
          )}

          <div className="px-5 pt-5">
            {/* Title */}
            <h2 className="text-[1.1rem] font-bold text-[#1A2A38] leading-tight mb-1">
              {artwork.artworkTitle || 'Untitled'}
            </h2>

            {/* Artist name */}
            {artwork.artistName && (
              <p className="text-sm text-gray-500 mb-3">{artwork.artistName}</p>
            )}

            {/* Divider */}
            <div className="border-t border-gray-100 mb-3" />

            {/* Dimensions */}
            {artwork.width && artwork.height && (
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                <span className="text-sm text-gray-700">
                  {artwork.width} × {artwork.height} cm
                </span>
              </div>
            )}

            {/* Price */}
            {artwork.price && (
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 10v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-semibold text-[#264C61]">{artwork.price}</span>
              </div>
            )}

            {/* Story Behind */}
            {artwork.story && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Story Behind
                </p>
                <div
                  className={`text-sm text-gray-600 leading-relaxed whitespace-pre-line ${
                    !storyExpanded && isLongStory ? 'line-clamp-4' : ''
                  }`}
                >
                  {artwork.story}
                </div>
                {isLongStory && (
                  <button
                    onClick={() => setStoryExpanded(prev => !prev)}
                    className="mt-1 text-xs text-[#264C61] font-medium hover:underline focus:outline-none"
                  >
                    {storyExpanded ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action buttons — pinned to bottom */}
        <div className="px-5 pb-5 pt-3 border-t border-gray-100 flex flex-col gap-2.5">
          {studioUrl && (
            <a
              href={studioUrl}
              className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-[#264C61] text-white rounded-xl text-sm font-semibold hover:bg-[#1D3A4A] transition-all shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View in Studio
            </a>
          )}

          {artwork.externalUrl && (
            <a
              href={artwork.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-5 py-3 border border-[#264C61] text-[#264C61] bg-white rounded-xl text-sm font-semibold hover:bg-[#264C61]/5 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View &amp; Buy
            </a>
          )}
        </div>
      </div>
    </>
  );
}
