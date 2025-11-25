declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

let isGA4Loaded = false;

export function resetGA4() {
  isGA4Loaded = false;
}

export function initGA4(measurementId: string) {
  if (isGA4Loaded || !measurementId) {
    return;
  }

  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script1);

  const script2 = document.createElement('script');
  script2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${measurementId}');
  `;
  document.head.appendChild(script2);

  isGA4Loaded = true;
  console.log('[GA4] Google Analytics initialized');
}

export function trackEvent(eventName: string, params?: Record<string, any>) {
  if (!window.gtag) {
    if (import.meta.env.DEV) {
      console.warn('[GA4] Event not tracked - gtag not available:', eventName);
    }
    return;
  }

  window.gtag('event', eventName, params);
  if (import.meta.env.DEV) {
    console.log('[GA4] Event tracked:', eventName, params);
  }
}

export const GA4Events = {
  visitStudio: () => trackEvent('visit_studio'),
  uploadWall: () => trackEvent('upload_wall'),
  changeArtwork: (artworkId?: string) =>
    trackEvent('artwork_change', artworkId ? { artwork_id: artworkId } : undefined),
  buyClick: (productUrl?: string) =>
    trackEvent('click_buy', productUrl ? { product_url: productUrl } : undefined),
};
