import React, { createContext, useContext, useState, useEffect } from 'react';

type ConsentStatus = 'pending' | 'accepted' | 'declined';

interface CookieConsentContextType {
  consentStatus: ConsentStatus;
  acceptCookies: () => void;
  declineCookies: () => void;
  resetConsent: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

const CONSENT_KEY = 'roomvibe_cookie_consent';

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [consentStatus, setConsentStatus] = useState<ConsentStatus>('pending');

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored === 'accepted' || stored === 'declined') {
      setConsentStatus(stored as ConsentStatus);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setConsentStatus('accepted');
  };

  const declineCookies = () => {
    localStorage.setItem(CONSENT_KEY, 'declined');
    setConsentStatus('declined');
  };

  const resetConsent = () => {
    localStorage.removeItem(CONSENT_KEY);
    setConsentStatus('pending');
  };

  return (
    <CookieConsentContext.Provider value={{ consentStatus, acceptCookies, declineCookies, resetConsent }}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (context === undefined) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider');
  }
  return context;
}
