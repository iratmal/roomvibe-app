import React from 'react';

interface ExportSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  currentPlan: string;
  exportType: 'image' | 'pdf';
}

const PLAN_NAMES: Record<string, string> = {
  user: 'Free',
  artist: 'Artist',
  designer: 'Designer',
  gallery: 'Gallery',
  admin: 'Admin',
};

export function ExportSuccessModal({
  isOpen,
  onClose,
  onUpgrade,
  currentPlan,
  exportType,
}: ExportSuccessModalProps) {
  if (!isOpen) return null;

  const isFreeUser = currentPlan === 'user';
  const isArtistUser = currentPlan === 'artist';
  
  const getMessage = () => {
    if (isFreeUser) {
      return "Upgrade to unlock high-resolution exports, PDF proposals, and premium features.";
    }
    if (isArtistUser) {
      return "Upgrade to Designer to unlock PDF proposals, full branding control, and advanced tools.";
    }
    return "";
  };

  const getSuggestedPlan = () => {
    if (isFreeUser) return 'artist';
    if (isArtistUser) return 'designer';
    return 'designer';
  };

  const suggestedPlan = getSuggestedPlan();
  const suggestedPlanName = PLAN_NAMES[suggestedPlan];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-rvLg shadow-rvElevated max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-rv-primary mb-2">Your export is ready!</h3>
          <p className="text-rv-textMuted text-sm">
            {exportType === 'image' ? 'Your visualization has been downloaded.' : 'Your PDF has been downloaded.'}
          </p>
        </div>

        <div className="bg-gradient-to-r from-rv-primary/5 to-rv-accent/5 border border-rv-primary/20 rounded-rvMd p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-rv-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-rv-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm text-rv-text font-medium mb-1">Want more from RoomVibe?</p>
              <p className="text-xs text-rv-textMuted">{getMessage()}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border-2 border-rv-neutral rounded-rvMd text-rv-text font-semibold hover:bg-rv-surface transition-colors"
          >
            Close
          </button>
          <button
            onClick={onUpgrade}
            className="flex-1 px-4 py-2.5 bg-rv-primary text-white rounded-rvMd font-semibold hover:bg-rv-primaryHover transition-colors shadow-rvSoft"
          >
            Upgrade to {suggestedPlanName}
          </button>
        </div>
      </div>
    </div>
  );
}
