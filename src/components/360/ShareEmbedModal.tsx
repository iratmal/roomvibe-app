import React, { useState } from 'react';

interface ShareEmbedModalProps {
  exhibitionId: string | number;
  exhibitionTitle?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareEmbedModal({ 
  exhibitionId, 
  exhibitionTitle,
  isOpen, 
  onClose 
}: ShareEmbedModalProps) {
  const [activeTab, setActiveTab] = useState<'link' | 'embed'>('link');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const baseUrl = window.location.origin;
  const publicUrl = `${baseUrl}/#/app/exhibitions/${exhibitionId}`;
  const embedUrl = `${baseUrl}/#/embed/exhibitions/${exhibitionId}`;
  
  const embedCode = `<iframe
  src="${embedUrl}"
  width="100%"
  height="600"
  style="border:none; border-radius:12px; overflow:hidden;"
  allowfullscreen
  loading="lazy"
></iframe>`;

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-50 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[#264C61]">
              Share Exhibition
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {exhibitionTitle && (
            <p className="text-sm text-slate-500 mt-1">{exhibitionTitle}</p>
          )}
        </div>

        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setActiveTab('link')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'link'
                ? 'text-[#264C61] border-b-2 border-[#264C61] bg-slate-50'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Public Link
            </span>
          </button>
          <button
            onClick={() => setActiveTab('embed')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'embed'
                ? 'text-[#264C61] border-b-2 border-[#264C61] bg-slate-50'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Embed Widget
            </span>
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'link' ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Share this link with anyone to let them view your 360° exhibition:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={publicUrl}
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none"
                />
                <button
                  onClick={() => handleCopy(publicUrl)}
                  className="px-4 py-3 bg-[#264C61] text-white rounded-xl hover:bg-[#1D3A4A] transition-colors text-sm font-medium whitespace-nowrap"
                >
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
              <p className="text-xs text-slate-400">
                Note: The exhibition must be published for visitors to view it.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Add this code to your website to embed the 360° exhibition:
              </p>
              <textarea
                readOnly
                value={embedCode}
                rows={6}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-mono focus:outline-none resize-none"
              />
              <button
                onClick={() => handleCopy(embedCode)}
                className="w-full px-4 py-3 bg-[#264C61] text-white rounded-xl hover:bg-[#1D3A4A] transition-colors text-sm font-medium"
              >
                {copied ? 'Copied!' : 'Copy Embed Code'}
              </button>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs text-amber-700">
                  <strong>Tip:</strong> Adjust the height value to fit your website layout. 
                  The exhibition must be published for the embed to work.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
