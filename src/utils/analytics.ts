declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

let isGA4Loaded = false;

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
  if (!isGA4Loaded || !window.gtag) {
    console.warn('[GA4] Event not tracked - GA4 not loaded:', eventName);
    return;
  }

  window.gtag('event', eventName, params);
  console.log('[GA4] Event tracked:', eventName, params);
}

export const GA4Events = {
  visitStudio: () => trackEvent('visit_studio'),
  uploadWall: () => trackEvent('upload_wall'),
  changeArtwork: (artworkId: string, artworkTitle: string) =>
    trackEvent('change_artwork', { artwork_id: artworkId, artwork_title: artworkTitle }),
  buyClick: (artworkId: string, artworkTitle: string, url: string) =>
    trackEvent('buy_click', { artwork_id: artworkId, artwork_title: artworkTitle, buy_url: url }),
};
