import React from 'react';
import { useCookieConsent } from '../context/CookieConsentContext';

export default function CookieConsentBanner() {
  const { consentStatus, acceptCookies, declineCookies } = useCookieConsent();

  if (consentStatus !== 'pending') {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-rv-neutral shadow-rvElevated">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-rv-text font-medium">
              We use cookies to improve your experience with analytics and tracking tools. You can choose to accept or decline.{' '}
              <a href="#/privacy" className="text-rv-primary hover:text-rv-primaryHover underline font-semibold">
                Learn more
              </a>
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={declineCookies}
              className="px-4 py-2 rounded-rvMd border-2 border-rv-neutral bg-white text-rv-text font-semibold hover:bg-rv-surface transition-colors"
            >
              Decline
            </button>
            <button
              onClick={acceptCookies}
              className="px-4 py-2 rounded-rvMd bg-rv-primary text-white font-semibold hover:bg-rv-primaryHover shadow-rvSoft hover:shadow-rvElevated transition-all"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
