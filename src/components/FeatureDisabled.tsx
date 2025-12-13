import React from 'react';

interface FeatureDisabledProps {
  featureName: string;
  message?: string;
}

export function FeatureDisabled({ featureName, message }: FeatureDisabledProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m9.364-10.364l-1.414 1.414M6.05 6.05l1.414 1.414M21 12h-2M5 12H3m16.95 7.95l-1.414-1.414M6.05 17.95l1.414-1.414M12 5V3" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          {featureName} Coming Soon
        </h2>
        <p className="text-gray-600 mb-6">
          {message || `The ${featureName} feature is currently being prepared for launch. Check back soon!`}
        </p>
        <a
          href="#/dashboard"
          className="inline-flex items-center justify-center px-6 py-3 bg-rv-primary text-white font-medium rounded-lg hover:bg-rv-primaryDark transition-colors"
        >
          Return to Dashboard
        </a>
      </div>
    </div>
  );
}
