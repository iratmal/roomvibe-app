declare global {
  interface Window {
    hj?: (...args: any[]) => void;
    _hjSettings?: { hjid: number; hjsv: number };
  }
}

let isHotjarLoaded = false;

export function initHotjar(hotjarId: number, hotjarSv: number = 6) {
  if (isHotjarLoaded || !hotjarId) {
    return;
  }

  (function (h: any, o: any, t: any, j: any, a?: any, r?: any) {
    h.hj =
      h.hj ||
      function () {
        (h.hj.q = h.hj.q || []).push(arguments);
      };
    h._hjSettings = { hjid: hotjarId, hjsv: hotjarSv };
    a = o.getElementsByTagName('head')[0];
    r = o.createElement('script');
    r.async = 1;
    r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
    a.appendChild(r);
  })(window, document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=');

  isHotjarLoaded = true;
  console.log('[Hotjar] Hotjar initialized');
}

export function triggerHotjarEvent(eventName: string) {
  if (!isHotjarLoaded || !window.hj) {
    console.warn('[Hotjar] Event not tracked - Hotjar not loaded:', eventName);
    return;
  }

  window.hj('event', eventName);
  console.log('[Hotjar] Event tracked:', eventName);
}
