(function() {
  'use strict';

  var ROOMVIBE_BASE_URL = (function() {
    var scripts = document.querySelectorAll('script[data-artwork-id], script[data-artist-id]');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].getAttribute('src');
      if (src && src.indexOf('widget.js') !== -1) {
        try {
          var url = new URL(src, window.location.href);
          return url.origin;
        } catch (e) {
          return window.location.origin;
        }
      }
    }
    return window.location.origin;
  })();

  var STUDIO_URL = ROOMVIBE_BASE_URL + '/#/studio';

  function createStyles() {
    if (document.getElementById('roomvibe-widget-styles')) return;
    
    var style = document.createElement('style');
    style.id = 'roomvibe-widget-styles';
    style.textContent = [
      '.rv-widget-btn {',
      '  display: inline-flex;',
      '  align-items: center;',
      '  gap: 8px;',
      '  padding: 12px 20px;',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;',
      '  font-size: 14px;',
      '  font-weight: 600;',
      '  color: #ffffff;',
      '  background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);',
      '  border: none;',
      '  border-radius: 8px;',
      '  cursor: pointer;',
      '  text-decoration: none;',
      '  transition: transform 0.15s ease, box-shadow 0.15s ease;',
      '  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);',
      '}',
      '.rv-widget-btn:hover {',
      '  transform: translateY(-1px);',
      '  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);',
      '}',
      '.rv-widget-btn:active {',
      '  transform: translateY(0);',
      '}',
      '.rv-widget-btn svg {',
      '  width: 18px;',
      '  height: 18px;',
      '  flex-shrink: 0;',
      '}',
      '.rv-widget-modal-overlay {',
      '  position: fixed;',
      '  top: 0;',
      '  left: 0;',
      '  right: 0;',
      '  bottom: 0;',
      '  background: rgba(0, 0, 0, 0.7);',
      '  z-index: 999999;',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  padding: 20px;',
      '  opacity: 0;',
      '  transition: opacity 0.2s ease;',
      '}',
      '.rv-widget-modal-overlay.rv-visible {',
      '  opacity: 1;',
      '}',
      '.rv-widget-modal {',
      '  position: relative;',
      '  width: 100%;',
      '  max-width: 1200px;',
      '  height: 90vh;',
      '  max-height: 800px;',
      '  background: #fff;',
      '  border-radius: 16px;',
      '  overflow: hidden;',
      '  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);',
      '  transform: scale(0.95);',
      '  transition: transform 0.2s ease;',
      '}',
      '.rv-widget-modal-overlay.rv-visible .rv-widget-modal {',
      '  transform: scale(1);',
      '}',
      '.rv-widget-modal-close {',
      '  position: absolute;',
      '  top: 12px;',
      '  right: 12px;',
      '  z-index: 10;',
      '  width: 36px;',
      '  height: 36px;',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  background: rgba(255, 255, 255, 0.9);',
      '  border: none;',
      '  border-radius: 50%;',
      '  cursor: pointer;',
      '  font-size: 20px;',
      '  color: #374151;',
      '  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);',
      '  transition: background 0.15s ease;',
      '}',
      '.rv-widget-modal-close:hover {',
      '  background: #fff;',
      '}',
      '.rv-widget-iframe {',
      '  width: 100%;',
      '  height: 100%;',
      '  border: none;',
      '}',
      '.rv-widget-error {',
      '  display: inline-flex;',
      '  align-items: center;',
      '  gap: 6px;',
      '  padding: 8px 12px;',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;',
      '  font-size: 12px;',
      '  color: #6B7280;',
      '  background: #F3F4F6;',
      '  border-radius: 6px;',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function createRoomIcon() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>';
  }

  function createModal(studioUrl) {
    var overlay = document.createElement('div');
    overlay.className = 'rv-widget-modal-overlay';
    overlay.innerHTML = [
      '<div class="rv-widget-modal">',
      '  <button class="rv-widget-modal-close" aria-label="Close">&times;</button>',
      '  <iframe class="rv-widget-iframe" src="' + studioUrl + '" allow="camera; microphone; gyroscope; accelerometer; fullscreen; xr-spatial-tracking"></iframe>',
      '</div>'
    ].join('');

    var closeBtn = overlay.querySelector('.rv-widget-modal-close');
    
    function closeModal() {
      overlay.classList.remove('rv-visible');
      setTimeout(function() {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 200);
    }

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeModal();
    });

    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escHandler);
      }
    });

    document.body.appendChild(overlay);
    
    setTimeout(function() {
      overlay.classList.add('rv-visible');
    }, 10);
  }

  function createWidget(scriptEl) {
    var artistId = scriptEl.getAttribute('data-artist-id');
    var artworkId = scriptEl.getAttribute('data-artwork-id');
    var buttonText = scriptEl.getAttribute('data-button-text') || 'See in your room';
    var containerId = scriptEl.getAttribute('data-container');

    if (!ROOMVIBE_BASE_URL) {
      console.warn('[RoomVibe Widget] Could not determine base URL');
      return;
    }

    var studioUrl = STUDIO_URL;
    var params = [];
    if (artistId) params.push('artistId=' + encodeURIComponent(artistId));
    if (artworkId) params.push('artworkId=' + encodeURIComponent(artworkId));
    if (params.length > 0) {
      studioUrl += '?' + params.join('&');
    }

    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'rv-widget-btn';
    button.innerHTML = createRoomIcon() + '<span>' + buttonText + '</span>';

    button.addEventListener('click', function(e) {
      e.preventDefault();
      createModal(studioUrl);
    });

    var container;
    if (containerId) {
      container = document.getElementById(containerId);
    }
    
    if (!container) {
      container = document.createElement('div');
      container.className = 'rv-widget-container';
      container.style.margin = '16px 0';
      scriptEl.parentNode.insertBefore(container, scriptEl.nextSibling);
    }
    
    container.appendChild(button);
  }

  function init() {
    try {
      createStyles();

      var scripts = document.querySelectorAll('script[data-artist-id], script[data-artwork-id]');
      
      for (var i = 0; i < scripts.length; i++) {
        var scriptEl = scripts[i];
        if (scriptEl.getAttribute('data-rv-initialized')) continue;
        scriptEl.setAttribute('data-rv-initialized', 'true');
        
        try {
          createWidget(scriptEl);
        } catch (err) {
          console.error('[RoomVibe Widget] Error creating widget:', err);
        }
      }
    } catch (err) {
      console.error('[RoomVibe Widget] Initialization error:', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  if (typeof window.RoomVibeWidget === 'undefined') {
    window.RoomVibeWidget = {
      init: init,
      version: '1.0.0'
    };
  }

})();
