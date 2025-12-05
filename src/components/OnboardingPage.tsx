import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface OnboardingPageProps {
  onComplete: () => void;
}

function PaletteIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="8" cy="10" r="1.5" fill="currentColor" />
      <circle cx="16" cy="10" r="1.5" fill="currentColor" />
      <circle cx="12" cy="16" r="1.5" fill="currentColor" />
      <circle cx="6" cy="14" r="1" fill="currentColor" />
      <circle cx="18" cy="14" r="1" fill="currentColor" />
    </svg>
  );
}

function LayoutIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
    </svg>
  );
}

function ImageIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}

function UploadIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function WandIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 4-1 1 4 4 1-1a2.83 2.83 0 1 0-4-4z" />
      <path d="m14 5-9 9" />
      <path d="M5 14l-1 1a2.83 2.83 0 1 0 4 4l1-1" />
      <path d="m9 10 4 4" />
    </svg>
  );
}

function CodeIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function CheckIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { completeOnboarding, hasEntitlement } = useAuth();

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
    onComplete();
  };

  const handleFinish = async () => {
    await completeOnboarding();
    onComplete();
  };

  const handleGoToStudio = async () => {
    await completeOnboarding();
    window.location.hash = '#/studio';
  };

  const hasLockedModules = !hasEntitlement('artist_access') || !hasEntitlement('designer_access') || !hasEntitlement('gallery_access');

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-2xl">
        <div className="flex justify-end mb-4">
          <button
            onClick={handleSkip}
            className="text-sm font-medium underline transition-colors"
            style={{ color: '#264C61', opacity: 0.7 }}
          >
            Skip onboarding
          </button>
        </div>

        <div className="bg-white rounded-xl" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          {currentStep === 0 && <Screen1 />}
          {currentStep === 1 && <Screen2 />}
          {currentStep === 2 && <Screen3 hasLockedModules={hasLockedModules} />}
          
          <div className="px-6 pb-6">
            {currentStep < 2 ? (
              <button
                onClick={handleNext}
                className="w-full py-3 text-white font-medium rounded-lg transition-colors"
                style={{ backgroundColor: '#264C61' }}
              >
                Next →
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleFinish}
                  className="w-full py-3 text-white font-medium rounded-lg transition-colors"
                  style={{ backgroundColor: '#264C61' }}
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={handleGoToStudio}
                  className="w-full py-2 font-medium transition-colors text-center"
                  style={{ color: '#264C61' }}
                >
                  Open Studio →
                </button>
              </div>
            )}

            <StepIndicator currentStep={currentStep} totalSteps={3} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex justify-center gap-1.5 mt-4">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-colors"
          style={{
            backgroundColor: index === currentStep ? '#264C61' : '#DDE1E7',
          }}
        />
      ))}
    </div>
  );
}

function Screen1() {
  const modules = [
    {
      icon: <PaletteIcon className="w-8 h-8 sm:w-10 sm:h-10" />,
      title: 'Artist Module',
      description: 'Upload your artworks, preview them in real rooms, and embed the widget on your website.',
    },
    {
      icon: <LayoutIcon className="w-8 h-8 sm:w-10 sm:h-10" />,
      title: 'Designer Module',
      description: 'Use premium rooms, mockups, high-resolution export and PDF presentations.',
    },
    {
      icon: <ImageIcon className="w-8 h-8 sm:w-10 sm:h-10" />,
      title: 'Gallery Module',
      description: 'Create virtual exhibitions, build gallery walls and share public links.',
    },
  ];

  return (
    <div className="p-6 sm:p-8">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold mb-2" style={{ color: '#1A1A1A' }}>
          Welcome to RoomVibe
        </h1>
        <p className="text-sm sm:text-base" style={{ color: '#666' }}>
          RoomVibe is built as three powerful modules — choose the tools that match how you work.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {modules.map((module, index) => (
          <div
            key={index}
            className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1.5px solid #DDE1E7',
              borderRadius: '12px',
              boxShadow: '0 4px 10px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ color: '#D8B46A' }} className="flex-shrink-0">
              {module.icon}
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base mb-1" style={{ color: '#1A1A1A' }}>
                {module.title}
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: '#666' }}>
                {module.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Screen2() {
  const features = [
    {
      icon: <UploadIcon className="w-8 h-8 sm:w-10 sm:h-10" />,
      title: 'Upload your artwork',
      description: 'RoomVibe instantly places it into realistic rooms or gallery walls.',
    },
    {
      icon: <WandIcon className="w-8 h-8 sm:w-10 sm:h-10" />,
      title: 'Preview & customize',
      description: 'Change rooms, frames, lighting and orientation.',
    },
    {
      icon: <CodeIcon className="w-8 h-8 sm:w-10 sm:h-10" />,
      title: 'Embed on your website',
      description: 'Use the RoomVibe Widget to let customers preview art directly on your site.',
    },
  ];

  return (
    <div className="p-6 sm:p-8">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold mb-2" style={{ color: '#1A1A1A' }}>
          Beautiful visualizations in seconds
        </h1>
      </div>

      <div className="flex flex-col gap-4 sm:gap-5">
        {features.map((feature, index) => (
          <div
            key={index}
            className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1.5px solid #DDE1E7',
              borderRadius: '12px',
              boxShadow: '0 4px 10px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ color: '#D8B46A' }} className="flex-shrink-0">
              {feature.icon}
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base mb-1" style={{ color: '#1A1A1A' }}>
                {feature.title}
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: '#666' }}>
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs sm:text-sm text-center mt-5" style={{ color: '#999' }}>
        The tools you see depend on your active modules (Artist, Designer, Gallery).
      </p>
    </div>
  );
}

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

function Screen3({ hasLockedModules }: { hasLockedModules: boolean }) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: '1', label: 'Upload your first artwork', checked: false },
    { id: '2', label: 'Try the Studio (visualize art in different rooms)', checked: false },
    { id: '3', label: 'Explore Designer Tools or Gallery Tools (if unlocked)', checked: false },
    { id: '4', label: 'Install the widget on your website (optional)', checked: false },
  ]);

  const toggleItem = (id: string) => {
    setChecklist(prev =>
      prev.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  return (
    <div className="p-6 sm:p-8">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold mb-2" style={{ color: '#1A1A1A' }}>
          Your RoomVibe workspace is ready
        </h1>
        <p className="text-sm sm:text-base" style={{ color: '#666' }}>
          Here are the first steps to get started:
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:gap-3 mb-5">
        {checklist.map((item) => (
          <button
            key={item.id}
            onClick={() => toggleItem(item.id)}
            className="flex items-center gap-3 p-3 sm:p-4 text-left transition-colors w-full"
            style={{
              backgroundColor: item.checked ? '#f0f4f8' : '#FFFFFF',
              border: '1.5px solid #DDE1E7',
              borderRadius: '10px',
              minHeight: '44px',
            }}
          >
            <div
              className="w-5 h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center flex-shrink-0 transition-colors"
              style={{
                backgroundColor: item.checked ? '#264C61' : 'transparent',
                border: item.checked ? 'none' : '2px solid #DDE1E7',
              }}
            >
              {item.checked && <CheckIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />}
            </div>
            <span
              className="text-sm sm:text-base"
              style={{
                color: item.checked ? '#666' : '#1A1A1A',
                textDecoration: item.checked ? 'line-through' : 'none',
              }}
            >
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {hasLockedModules && (
        <div
          className="p-4 sm:p-5"
          style={{
            border: '1.5px solid #D8B46A',
            borderRadius: '12px',
            backgroundColor: '#FFFDF8',
          }}
        >
          <p className="text-sm sm:text-base font-medium" style={{ color: '#1A1A1A' }}>
            Want to unlock more tools?
          </p>
          <p className="text-xs sm:text-sm mt-1" style={{ color: '#666' }}>
            Upgrade to Designer or Gallery anytime.
          </p>
        </div>
      )}
    </div>
  );
}

export default OnboardingPage;
