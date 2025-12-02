(function() {
  'use strict';

  var ROOMVIBE_COLORS = {
    primary: '#283593',
    gold: '#D8B46A',
    softGrey: '#DDE1E7',
    white: '#FFFFFF',
    text: '#1A1A1A',
    error: '#EF4444'
  };

  var widgetConfig = null;
  var currentArtwork = null;
  var currentRoom = null;
  var currentFrame = 'none';
  var selectedArtworks = [];
  var exhibitionIndex = 0;

  function getBaseUrl() {
    var scripts = document.querySelectorAll('script[data-widget-id]');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].getAttribute('src');
      if (src && src.indexOf('widget.js') !== -1) {
        try {
          var url = new URL(src, window.location.href);
          return url.origin;
        } catch (e) {
          return '';
        }
      }
    }
    return '';
  }

  var BASE_URL = getBaseUrl();

  function createStyles() {
    if (document.getElementById('roomvibe-unified-widget-styles')) return;
    
    var style = document.createElement('style');
    style.id = 'roomvibe-unified-widget-styles';
    style.textContent = [
      '@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap");',
      '.rv-widget-container {',
      '  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
      '  box-sizing: border-box;',
      '  color: ' + ROOMVIBE_COLORS.text + ';',
      '}',
      '.rv-widget-container * {',
      '  box-sizing: border-box;',
      '}',
      '.rv-widget-btn {',
      '  display: inline-flex;',
      '  align-items: center;',
      '  gap: 8px;',
      '  padding: 10px 16px;',
      '  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
      '  font-size: 14px;',
      '  font-weight: 500;',
      '  color: ' + ROOMVIBE_COLORS.white + ';',
      '  background: ' + ROOMVIBE_COLORS.primary + ';',
      '  border: none;',
      '  border-radius: 8px;',
      '  cursor: pointer;',
      '  text-decoration: none;',
      '  transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;',
      '  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);',
      '}',
      '.rv-widget-btn:hover {',
      '  transform: translateY(-1px);',
      '  box-shadow: 0 4px 12px rgba(40, 53, 147, 0.25);',
      '}',
      '.rv-widget-btn:active {',
      '  transform: translateY(0);',
      '}',
      '.rv-widget-btn-secondary {',
      '  background: ' + ROOMVIBE_COLORS.white + ';',
      '  color: ' + ROOMVIBE_COLORS.primary + ';',
      '  border: 1.5px solid ' + ROOMVIBE_COLORS.primary + ';',
      '  box-shadow: none;',
      '}',
      '.rv-widget-btn-secondary:hover {',
      '  background: rgba(40, 53, 147, 0.05);',
      '}',
      '.rv-widget-btn-premium {',
      '  background: ' + ROOMVIBE_COLORS.white + ';',
      '  color: ' + ROOMVIBE_COLORS.gold + ';',
      '  border: 1.5px solid ' + ROOMVIBE_COLORS.gold + ';',
      '  box-shadow: none;',
      '}',
      '.rv-widget-btn-premium:hover {',
      '  background: rgba(216, 180, 106, 0.1);',
      '}',
      '.rv-widget-btn-text {',
      '  background: transparent;',
      '  color: ' + ROOMVIBE_COLORS.primary + ';',
      '  border: none;',
      '  box-shadow: none;',
      '  padding: 6px 8px;',
      '}',
      '.rv-widget-btn-text:hover {',
      '  text-decoration: underline;',
      '  transform: none;',
      '  box-shadow: none;',
      '}',
      '.rv-widget-btn svg {',
      '  width: 18px;',
      '  height: 18px;',
      '  flex-shrink: 0;',
      '}',
      '.rv-modal-overlay {',
      '  position: fixed;',
      '  top: 0;',
      '  left: 0;',
      '  right: 0;',
      '  bottom: 0;',
      '  background: rgba(0, 0, 0, 0.75);',
      '  z-index: 999999;',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  padding: 16px;',
      '  opacity: 0;',
      '  transition: opacity 0.2s ease;',
      '}',
      '.rv-modal-overlay.rv-visible {',
      '  opacity: 1;',
      '}',
      '.rv-modal {',
      '  position: relative;',
      '  width: 100%;',
      '  max-width: 1100px;',
      '  max-height: 90vh;',
      '  background: ' + ROOMVIBE_COLORS.white + ';',
      '  border-radius: 16px;',
      '  overflow: hidden;',
      '  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.35);',
      '  transform: translateY(4px);',
      '  opacity: 0;',
      '  transition: transform 0.2s ease, opacity 0.2s ease;',
      '  display: flex;',
      '  flex-direction: column;',
      '}',
      '.rv-modal-overlay.rv-visible .rv-modal {',
      '  transform: translateY(0);',
      '  opacity: 1;',
      '}',
      '.rv-modal-header {',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: space-between;',
      '  padding: 16px 20px;',
      '  border-bottom: 1px solid ' + ROOMVIBE_COLORS.softGrey + ';',
      '  background: ' + ROOMVIBE_COLORS.white + ';',
      '}',
      '.rv-modal-header-left {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 12px;',
      '}',
      '.rv-modal-header-right {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 8px;',
      '}',
      '.rv-modal-title {',
      '  font-size: 18px;',
      '  font-weight: 600;',
      '  color: ' + ROOMVIBE_COLORS.primary + ';',
      '  margin: 0;',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 10px;',
      '}',
      '.rv-info-btn {',
      '  width: 32px;',
      '  height: 32px;',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  background: transparent;',
      '  border: 1.5px solid ' + ROOMVIBE_COLORS.softGrey + ';',
      '  border-radius: 50%;',
      '  cursor: pointer;',
      '  color: #6B7280;',
      '  transition: border-color 0.15s ease, color 0.15s ease;',
      '}',
      '.rv-info-btn:hover {',
      '  border-color: ' + ROOMVIBE_COLORS.primary + ';',
      '  color: ' + ROOMVIBE_COLORS.primary + ';',
      '}',
      '.rv-info-btn svg {',
      '  width: 16px;',
      '  height: 16px;',
      '}',
      '.rv-modal-close {',
      '  width: 36px;',
      '  height: 36px;',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  background: ' + ROOMVIBE_COLORS.softGrey + ';',
      '  border: none;',
      '  border-radius: 50%;',
      '  cursor: pointer;',
      '  font-size: 20px;',
      '  color: ' + ROOMVIBE_COLORS.text + ';',
      '  transition: background 0.15s ease;',
      '}',
      '.rv-modal-close:hover {',
      '  background: #ccd0d6;',
      '}',
      '.rv-modal-body {',
      '  display: flex;',
      '  flex: 1;',
      '  overflow: hidden;',
      '}',
      '.rv-main {',
      '  flex: 1;',
      '  display: flex;',
      '  flex-direction: column;',
      '  overflow: hidden;',
      '  min-width: 0;',
      '}',
      '.rv-sidebar {',
      '  width: 280px;',
      '  flex-shrink: 0;',
      '  border-left: 1px solid ' + ROOMVIBE_COLORS.softGrey + ';',
      '  overflow-y: auto;',
      '  padding: 16px;',
      '  background: #FAFBFC;',
      '}',
      '.rv-canvas-area {',
      '  flex: 1;',
      '  position: relative;',
      '  background: ' + ROOMVIBE_COLORS.softGrey + ';',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  min-height: 400px;',
      '  overflow: hidden;',
      '}',
      '.rv-canvas-wrapper {',
      '  position: relative;',
      '  width: 100%;',
      '  height: 100%;',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '}',
      '.rv-room-image {',
      '  max-width: 100%;',
      '  max-height: 100%;',
      '  object-fit: contain;',
      '  transition: opacity 0.15s ease;',
      '}',
      '.rv-room-image.rv-transitioning {',
      '  opacity: 0;',
      '}',
      '.rv-artwork-overlay {',
      '  position: absolute;',
      '  cursor: move;',
      '  box-shadow: 0 8px 32px rgba(0,0,0,0.3);',
      '  transition: box-shadow 0.2s ease, opacity 0.2s ease, transform 0.2s ease;',
      '  opacity: 0;',
      '  transform: translateY(4px);',
      '}',
      '.rv-artwork-overlay.rv-visible {',
      '  opacity: 1;',
      '  transform: translateY(0);',
      '}',
      '.rv-artwork-overlay:hover {',
      '  box-shadow: 0 12px 40px rgba(0,0,0,0.35);',
      '}',
      '.rv-artwork-overlay img {',
      '  width: 100%;',
      '  height: 100%;',
      '  object-fit: cover;',
      '  display: block;',
      '}',
      '.rv-controls {',
      '  padding: 12px 16px;',
      '  border-top: 1px solid ' + ROOMVIBE_COLORS.softGrey + ';',
      '  background: ' + ROOMVIBE_COLORS.white + ';',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: space-between;',
      '  gap: 12px;',
      '}',
      '.rv-controls-left {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 8px;',
      '  flex-wrap: nowrap;',
      '  overflow-x: auto;',
      '  -webkit-overflow-scrolling: touch;',
      '  scrollbar-width: none;',
      '  -ms-overflow-style: none;',
      '}',
      '.rv-controls-left::-webkit-scrollbar {',
      '  display: none;',
      '}',
      '.rv-controls-right {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 8px;',
      '  flex-shrink: 0;',
      '}',
      '.rv-control-btn {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 6px;',
      '  padding: 8px 12px;',
      '  font-family: Inter, sans-serif;',
      '  font-size: 13px;',
      '  font-weight: 500;',
      '  color: ' + ROOMVIBE_COLORS.text + ';',
      '  background: ' + ROOMVIBE_COLORS.white + ';',
      '  border: 1.5px solid ' + ROOMVIBE_COLORS.softGrey + ';',
      '  border-radius: 8px;',
      '  cursor: pointer;',
      '  white-space: nowrap;',
      '  transition: border-color 0.15s ease, background 0.15s ease;',
      '}',
      '.rv-control-btn:hover {',
      '  border-color: ' + ROOMVIBE_COLORS.primary + ';',
      '  background: rgba(40, 53, 147, 0.03);',
      '}',
      '.rv-control-btn.rv-active {',
      '  border-color: ' + ROOMVIBE_COLORS.primary + ';',
      '  background: rgba(40, 53, 147, 0.08);',
      '  color: ' + ROOMVIBE_COLORS.primary + ';',
      '}',
      '.rv-control-btn.rv-premium {',
      '  color: ' + ROOMVIBE_COLORS.gold + ';',
      '  border-color: ' + ROOMVIBE_COLORS.gold + ';',
      '}',
      '.rv-control-btn.rv-premium:hover {',
      '  background: rgba(216, 180, 106, 0.08);',
      '}',
      '.rv-control-btn svg {',
      '  width: 18px;',
      '  height: 18px;',
      '}',
      '.rv-section {',
      '  margin-bottom: 20px;',
      '}',
      '.rv-section-title {',
      '  font-size: 11px;',
      '  font-weight: 600;',
      '  text-transform: uppercase;',
      '  letter-spacing: 0.5px;',
      '  color: #6B7280;',
      '  margin: 0 0 10px 0;',
      '}',
      '.rv-artwork-list {',
      '  display: flex;',
      '  flex-direction: column;',
      '  gap: 8px;',
      '  max-height: 200px;',
      '  overflow-y: auto;',
      '}',
      '.rv-artwork-item {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 10px;',
      '  padding: 8px;',
      '  border-radius: 8px;',
      '  border: 1px solid ' + ROOMVIBE_COLORS.softGrey + ';',
      '  background: ' + ROOMVIBE_COLORS.white + ';',
      '  cursor: pointer;',
      '  transition: border-color 0.15s ease, background 0.15s ease, opacity 0.2s ease, transform 0.2s ease;',
      '  opacity: 0;',
      '  transform: translateY(4px);',
      '}',
      '.rv-artwork-item.rv-visible {',
      '  opacity: 1;',
      '  transform: translateY(0);',
      '}',
      '.rv-artwork-item:hover {',
      '  border-color: ' + ROOMVIBE_COLORS.primary + ';',
      '}',
      '.rv-artwork-item.rv-selected {',
      '  border-color: ' + ROOMVIBE_COLORS.primary + ';',
      '  background: rgba(40, 53, 147, 0.05);',
      '}',
      '.rv-artwork-thumb {',
      '  width: 48px;',
      '  height: 48px;',
      '  border-radius: 6px;',
      '  object-fit: cover;',
      '  background: ' + ROOMVIBE_COLORS.softGrey + ';',
      '}',
      '.rv-artwork-info {',
      '  flex: 1;',
      '  min-width: 0;',
      '}',
      '.rv-artwork-name {',
      '  font-size: 13px;',
      '  font-weight: 500;',
      '  color: ' + ROOMVIBE_COLORS.text + ';',
      '  white-space: nowrap;',
      '  overflow: hidden;',
      '  text-overflow: ellipsis;',
      '}',
      '.rv-artwork-dims {',
      '  font-size: 11px;',
      '  color: #6B7280;',
      '}',
      '.rv-room-grid {',
      '  display: grid;',
      '  grid-template-columns: repeat(2, 1fr);',
      '  gap: 8px;',
      '}',
      '.rv-room-item {',
      '  position: relative;',
      '  aspect-ratio: 4/3;',
      '  border-radius: 8px;',
      '  overflow: hidden;',
      '  border: 2px solid transparent;',
      '  cursor: pointer;',
      '  transition: border-color 0.15s ease, opacity 0.2s ease, transform 0.2s ease;',
      '  opacity: 0;',
      '  transform: translateY(4px);',
      '}',
      '.rv-room-item.rv-visible {',
      '  opacity: 1;',
      '  transform: translateY(0);',
      '}',
      '.rv-room-item:hover {',
      '  border-color: ' + ROOMVIBE_COLORS.primary + ';',
      '}',
      '.rv-room-item.rv-selected {',
      '  border-color: ' + ROOMVIBE_COLORS.primary + ';',
      '}',
      '.rv-room-item img {',
      '  width: 100%;',
      '  height: 100%;',
      '  object-fit: cover;',
      '}',
      '.rv-frame-options {',
      '  display: flex;',
      '  gap: 8px;',
      '  flex-wrap: wrap;',
      '}',
      '.rv-frame-option {',
      '  padding: 6px 12px;',
      '  border-radius: 6px;',
      '  border: 1px solid ' + ROOMVIBE_COLORS.softGrey + ';',
      '  background: ' + ROOMVIBE_COLORS.white + ';',
      '  font-size: 12px;',
      '  cursor: pointer;',
      '  transition: border-color 0.15s ease, background 0.15s ease;',
      '}',
      '.rv-frame-option:hover {',
      '  border-color: ' + ROOMVIBE_COLORS.primary + ';',
      '}',
      '.rv-frame-option.rv-selected {',
      '  border-color: ' + ROOMVIBE_COLORS.primary + ';',
      '  background: rgba(40, 53, 147, 0.05);',
      '  color: ' + ROOMVIBE_COLORS.primary + ';',
      '}',
      '.rv-buy-btn {',
      '  background: ' + ROOMVIBE_COLORS.gold + ' !important;',
      '  color: ' + ROOMVIBE_COLORS.white + ' !important;',
      '  border: none !important;',
      '}',
      '.rv-buy-btn:hover {',
      '  opacity: 0.9;',
      '}',
      '.rv-upgrade-modal {',
      '  max-width: 420px;',
      '  padding: 32px;',
      '  text-align: center;',
      '}',
      '.rv-upgrade-icon {',
      '  width: 64px;',
      '  height: 64px;',
      '  margin: 0 auto 20px;',
      '  background: rgba(216, 180, 106, 0.15);',
      '  border-radius: 50%;',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '}',
      '.rv-upgrade-icon svg {',
      '  width: 32px;',
      '  height: 32px;',
      '  color: ' + ROOMVIBE_COLORS.gold + ';',
      '}',
      '.rv-upgrade-title {',
      '  font-size: 20px;',
      '  font-weight: 600;',
      '  margin: 0 0 12px;',
      '  color: ' + ROOMVIBE_COLORS.text + ';',
      '}',
      '.rv-upgrade-text {',
      '  font-size: 14px;',
      '  color: #6B7280;',
      '  margin: 0 0 24px;',
      '  line-height: 1.5;',
      '}',
      '.rv-upgrade-buttons {',
      '  display: flex;',
      '  gap: 12px;',
      '  justify-content: center;',
      '}',
      '.rv-loading {',
      '  display: flex;',
      '  flex-direction: column;',
      '  align-items: center;',
      '  justify-content: center;',
      '  padding: 40px;',
      '  color: #6B7280;',
      '}',
      '.rv-loading-spinner {',
      '  width: 40px;',
      '  height: 40px;',
      '  border: 3px solid ' + ROOMVIBE_COLORS.softGrey + ';',
      '  border-top-color: ' + ROOMVIBE_COLORS.primary + ';',
      '  border-radius: 50%;',
      '  animation: rv-spin 0.8s linear infinite;',
      '}',
      '@keyframes rv-spin {',
      '  to { transform: rotate(360deg); }',
      '}',
      '.rv-error {',
      '  padding: 20px;',
      '  text-align: center;',
      '  color: ' + ROOMVIBE_COLORS.error + ';',
      '}',
      '.rv-tooltip {',
      '  position: absolute;',
      '  top: calc(100% + 8px);',
      '  right: 0;',
      '  width: 280px;',
      '  padding: 16px;',
      '  background: ' + ROOMVIBE_COLORS.white + ';',
      '  border-radius: 8px;',
      '  box-shadow: 0 4px 20px rgba(0,0,0,0.15);',
      '  font-size: 13px;',
      '  line-height: 1.5;',
      '  color: ' + ROOMVIBE_COLORS.text + ';',
      '  z-index: 10;',
      '  opacity: 0;',
      '  transform: translateY(-4px);',
      '  transition: opacity 0.2s ease, transform 0.2s ease;',
      '  pointer-events: none;',
      '}',
      '.rv-tooltip.rv-visible {',
      '  opacity: 1;',
      '  transform: translateY(0);',
      '  pointer-events: auto;',
      '}',
      '.rv-tooltip h4 {',
      '  margin: 0 0 8px;',
      '  font-size: 14px;',
      '  font-weight: 600;',
      '  color: ' + ROOMVIBE_COLORS.primary + ';',
      '}',
      '.rv-tooltip ul {',
      '  margin: 0;',
      '  padding: 0 0 0 16px;',
      '}',
      '.rv-tooltip li {',
      '  margin-bottom: 4px;',
      '}',
      '.rv-exhibition-nav {',
      '  position: absolute;',
      '  top: 50%;',
      '  transform: translateY(-50%);',
      '  width: 44px;',
      '  height: 44px;',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  background: rgba(255,255,255,0.9);',
      '  border: none;',
      '  border-radius: 50%;',
      '  cursor: pointer;',
      '  box-shadow: 0 2px 8px rgba(0,0,0,0.15);',
      '  z-index: 5;',
      '  transition: background 0.15s ease, transform 0.15s ease;',
      '}',
      '.rv-exhibition-nav:hover {',
      '  background: ' + ROOMVIBE_COLORS.white + ';',
      '  transform: translateY(-50%) scale(1.05);',
      '}',
      '.rv-exhibition-nav.rv-prev {',
      '  left: 16px;',
      '}',
      '.rv-exhibition-nav.rv-next {',
      '  right: 16px;',
      '}',
      '.rv-exhibition-nav svg {',
      '  width: 20px;',
      '  height: 20px;',
      '  color: ' + ROOMVIBE_COLORS.primary + ';',
      '}',
      '.rv-exhibition-counter {',
      '  position: absolute;',
      '  bottom: 16px;',
      '  left: 50%;',
      '  transform: translateX(-50%);',
      '  padding: 6px 12px;',
      '  background: rgba(0,0,0,0.6);',
      '  border-radius: 20px;',
      '  font-size: 12px;',
      '  font-weight: 500;',
      '  color: ' + ROOMVIBE_COLORS.white + ';',
      '}',
      '.rv-artwork-slide {',
      '  position: absolute;',
      '  top: 0;',
      '  left: 0;',
      '  width: 100%;',
      '  height: 100%;',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  transition: transform 0.15s ease-out, opacity 0.15s ease-out;',
      '}',
      '.rv-artwork-slide.rv-slide-enter-left {',
      '  transform: translateX(-30%);',
      '  opacity: 0;',
      '}',
      '.rv-artwork-slide.rv-slide-enter-right {',
      '  transform: translateX(30%);',
      '  opacity: 0;',
      '}',
      '.rv-artwork-slide.rv-slide-exit-left {',
      '  transform: translateX(-30%);',
      '  opacity: 0;',
      '}',
      '.rv-artwork-slide.rv-slide-exit-right {',
      '  transform: translateX(30%);',
      '  opacity: 0;',
      '}',
      '.rv-artwork-slide.rv-slide-active {',
      '  transform: translateX(0);',
      '  opacity: 1;',
      '}',
      '.rv-gallery-thumbs {',
      '  display: flex;',
      '  gap: 8px;',
      '  overflow-x: auto;',
      '  padding: 8px 0;',
      '  -webkit-overflow-scrolling: touch;',
      '  scrollbar-width: none;',
      '}',
      '.rv-gallery-thumbs::-webkit-scrollbar {',
      '  display: none;',
      '}',
      '.rv-gallery-thumb {',
      '  flex-shrink: 0;',
      '  width: 64px;',
      '  height: 64px;',
      '  border-radius: 8px;',
      '  overflow: hidden;',
      '  border: 2px solid transparent;',
      '  cursor: pointer;',
      '  transition: border-color 0.15s ease, transform 0.15s ease;',
      '}',
      '.rv-gallery-thumb:hover {',
      '  border-color: ' + ROOMVIBE_COLORS.primary + ';',
      '  transform: scale(1.05);',
      '}',
      '.rv-gallery-thumb.rv-selected {',
      '  border-color: ' + ROOMVIBE_COLORS.gold + ';',
      '}',
      '.rv-gallery-thumb img {',
      '  width: 100%;',
      '  height: 100%;',
      '  object-fit: cover;',
      '}',
      '.rv-dropdown {',
      '  position: relative;',
      '}',
      '.rv-dropdown-menu {',
      '  position: absolute;',
      '  top: calc(100% + 4px);',
      '  left: 0;',
      '  min-width: 180px;',
      '  background: ' + ROOMVIBE_COLORS.white + ';',
      '  border: 1px solid ' + ROOMVIBE_COLORS.softGrey + ';',
      '  border-radius: 8px;',
      '  box-shadow: 0 4px 16px rgba(0,0,0,0.12);',
      '  z-index: 20;',
      '  opacity: 0;',
      '  transform: translateY(-4px);',
      '  transition: opacity 0.15s ease, transform 0.15s ease;',
      '  pointer-events: none;',
      '}',
      '.rv-dropdown-menu.rv-visible {',
      '  opacity: 1;',
      '  transform: translateY(0);',
      '  pointer-events: auto;',
      '}',
      '.rv-dropdown-item {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 8px;',
      '  width: 100%;',
      '  padding: 10px 14px;',
      '  font-size: 13px;',
      '  color: ' + ROOMVIBE_COLORS.text + ';',
      '  background: none;',
      '  border: none;',
      '  cursor: pointer;',
      '  text-align: left;',
      '  transition: background 0.15s ease;',
      '}',
      '.rv-dropdown-item:first-child {',
      '  border-radius: 8px 8px 0 0;',
      '}',
      '.rv-dropdown-item:last-child {',
      '  border-radius: 0 0 8px 8px;',
      '}',
      '.rv-dropdown-item:hover {',
      '  background: rgba(40, 53, 147, 0.05);',
      '}',
      '.rv-dropdown-item.rv-locked {',
      '  color: ' + ROOMVIBE_COLORS.gold + ';',
      '}',
      '.rv-dropdown-item svg {',
      '  width: 16px;',
      '  height: 16px;',
      '}',
      '@media (max-width: 768px) {',
      '  .rv-modal {',
      '    max-height: 100vh;',
      '    border-radius: 0;',
      '  }',
      '  .rv-modal-body {',
      '    flex-direction: column;',
      '  }',
      '  .rv-main {',
      '    order: 1;',
      '  }',
      '  .rv-sidebar {',
      '    order: 2;',
      '    width: 100%;',
      '    border-left: none;',
      '    border-top: 1px solid ' + ROOMVIBE_COLORS.softGrey + ';',
      '    max-height: 30vh;',
      '  }',
      '  .rv-canvas-area {',
      '    min-height: 50vh;',
      '    height: 70vh;',
      '  }',
      '  .rv-controls {',
      '    position: sticky;',
      '    bottom: 0;',
      '    z-index: 10;',
      '    padding: 10px 12px;',
      '    flex-wrap: nowrap;',
      '  }',
      '  .rv-controls-left {',
      '    flex: 1;',
      '    overflow-x: auto;',
      '    padding-bottom: 2px;',
      '  }',
      '  .rv-control-btn {',
      '    padding: 8px 10px;',
      '    font-size: 12px;',
      '  }',
      '  .rv-control-btn span {',
      '    display: none;',
      '  }',
      '  .rv-exhibition-nav {',
      '    width: 40px;',
      '    height: 40px;',
      '  }',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function createIcon(name) {
    var icons = {
      room: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>',
      lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>',
      download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
      image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
      frame: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg>',
      layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polygon points="12,2 2,7 12,12 22,7 12,2"/><polyline points="2,17 12,22 22,17"/><polyline points="2,12 12,17 22,12"/></svg>',
      arrowLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12,19 5,12 12,5"/></svg>',
      arrowRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/></svg>',
      info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
      close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
      chevronDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="6,9 12,15 18,9"/></svg>',
      file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>',
      gallery: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="8" height="8" rx="1"/><rect x="14" y="2" width="8" height="8" rx="1"/><rect x="2" y="14" width="8" height="8" rx="1"/><rect x="14" y="14" width="8" height="8" rx="1"/></svg>',
      building: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>'
    };
    return icons[name] || '';
  }

  async function fetchWidgetConfig(widgetId) {
    try {
      var response = await fetch(BASE_URL + '/api/widget/config?widgetId=' + encodeURIComponent(widgetId));
      if (!response.ok) {
        throw new Error('Failed to load widget configuration');
      }
      return await response.json();
    } catch (error) {
      console.error('[RoomVibe Widget] Config error:', error);
      throw error;
    }
  }

  function renderArtworkList(container, artworks, onSelect) {
    container.innerHTML = '';
    
    if (!artworks || artworks.length === 0) {
      container.innerHTML = '<div style="color: #6B7280; font-size: 13px; padding: 10px;">No artworks available</div>';
      return;
    }

    artworks.forEach(function(artwork, index) {
      var item = document.createElement('div');
      item.className = 'rv-artwork-item' + (index === 0 ? ' rv-selected' : '');
      item.innerHTML = [
        '<img class="rv-artwork-thumb" src="' + artwork.imageUrl + '" alt="' + artwork.title + '">',
        '<div class="rv-artwork-info">',
        '  <div class="rv-artwork-name">' + artwork.title + '</div>',
        '  <div class="rv-artwork-dims">' + artwork.width + ' × ' + artwork.height + ' ' + (artwork.dimensionUnit || 'cm') + '</div>',
        '</div>'
      ].join('');
      
      item.addEventListener('click', function() {
        container.querySelectorAll('.rv-artwork-item').forEach(function(el) {
          el.classList.remove('rv-selected');
        });
        item.classList.add('rv-selected');
        onSelect(artwork);
      });
      
      container.appendChild(item);

      setTimeout(function() {
        item.classList.add('rv-visible');
      }, 50 + (index * 30));
    });

    if (artworks.length > 0) {
      onSelect(artworks[0]);
    }
  }

  function renderRoomGrid(container, rooms, onSelect) {
    container.innerHTML = '';
    
    rooms.forEach(function(room, index) {
      var item = document.createElement('div');
      item.className = 'rv-room-item' + (index === 0 ? ' rv-selected' : '');
      item.innerHTML = '<img src="' + BASE_URL + room.thumbnail + '" alt="' + room.name + '">';
      
      item.addEventListener('click', function() {
        container.querySelectorAll('.rv-room-item').forEach(function(el) {
          el.classList.remove('rv-selected');
        });
        item.classList.add('rv-selected');
        onSelect(room);
      });
      
      container.appendChild(item);

      setTimeout(function() {
        item.classList.add('rv-visible');
      }, 50 + (index * 30));
    });

    if (rooms.length > 0) {
      onSelect(rooms[0]);
    }
  }

  function renderFrameOptions(container, onSelect) {
    var frames = [
      { id: 'none', label: 'No Frame' },
      { id: 'black', label: 'Black' },
      { id: 'white', label: 'White' },
      { id: 'wood', label: 'Wood' },
      { id: 'gold', label: 'Gold' }
    ];

    container.innerHTML = '';
    
    frames.forEach(function(frame, index) {
      var option = document.createElement('button');
      option.type = 'button';
      option.className = 'rv-frame-option' + (index === 0 ? ' rv-selected' : '');
      option.textContent = frame.label;
      
      option.addEventListener('click', function() {
        container.querySelectorAll('.rv-frame-option').forEach(function(el) {
          el.classList.remove('rv-selected');
        });
        option.classList.add('rv-selected');
        onSelect(frame);
      });
      
      container.appendChild(option);
    });
  }

  function renderGalleryThumbnails(container, artworks, onSelect) {
    container.innerHTML = '';
    
    if (!artworks || artworks.length === 0) {
      container.innerHTML = '<div style="color: #6B7280; font-size: 13px;">No artworks in this exhibition</div>';
      return;
    }

    artworks.forEach(function(artwork, index) {
      var thumb = document.createElement('div');
      thumb.className = 'rv-gallery-thumb' + (index === 0 ? ' rv-selected' : '');
      thumb.innerHTML = '<img src="' + artwork.imageUrl + '" alt="' + artwork.title + '">';
      
      thumb.addEventListener('click', function() {
        container.querySelectorAll('.rv-gallery-thumb').forEach(function(el) {
          el.classList.remove('rv-selected');
        });
        thumb.classList.add('rv-selected');
        onSelect(artwork, index);
      });
      
      container.appendChild(thumb);
    });

    if (artworks.length > 0) {
      onSelect(artworks[0], 0);
    }
  }

  function updateArtworkOverlay(canvasArea, artwork, room, frame, animate) {
    var existing = canvasArea.querySelector('.rv-artwork-overlay');
    if (existing) {
      if (animate) {
        existing.classList.remove('rv-visible');
        setTimeout(function() {
          if (existing.parentNode) existing.remove();
          createNewOverlay();
        }, 150);
      } else {
        existing.remove();
        createNewOverlay();
      }
    } else {
      createNewOverlay();
    }

    function createNewOverlay() {
      if (!artwork || !room) return;

      var overlay = document.createElement('div');
      overlay.className = 'rv-artwork-overlay';
      
      var frameColor = 'transparent';
      var frameWidth = 0;
      if (frame && frame.id !== 'none') {
        frameWidth = 8;
        switch (frame.id) {
          case 'black': frameColor = '#1a1a1a'; break;
          case 'white': frameColor = '#ffffff'; break;
          case 'wood': frameColor = '#8B4513'; break;
          case 'gold': frameColor = ROOMVIBE_COLORS.gold; break;
        }
      }

      var scale = 1.5;
      var displayWidth = artwork.width * scale;
      var displayHeight = artwork.height * scale;

      overlay.style.cssText = [
        'width: ' + displayWidth + 'px',
        'height: ' + displayHeight + 'px',
        'border: ' + frameWidth + 'px solid ' + frameColor,
        'top: 50%',
        'left: 50%',
        'transform: translate(-50%, -60%)'
      ].join(';');

      overlay.innerHTML = '<img src="' + artwork.imageUrl + '" alt="' + artwork.title + '">';
      canvasArea.appendChild(overlay);

      setTimeout(function() {
        overlay.classList.add('rv-visible');
      }, 10);

      makeDraggable(overlay, canvasArea);
    }
  }

  function transitionRoom(roomImage, newSrc, callback) {
    roomImage.classList.add('rv-transitioning');
    
    var img = new Image();
    img.src = newSrc;
    
    var fadeOut = new Promise(function(resolve) {
      setTimeout(resolve, 150);
    });
    
    var imageLoad = new Promise(function(resolve) {
      if (img.complete) {
        resolve();
      } else {
        img.onload = resolve;
        img.onerror = resolve;
      }
    });
    
    Promise.all([fadeOut, imageLoad]).then(function() {
      roomImage.src = newSrc;
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          roomImage.classList.remove('rv-transitioning');
          if (callback) callback();
        });
      });
    });
  }

  function makeDraggable(element, container) {
    var isDragging = false;
    var startX, startY, initialLeft, initialTop;
    var touchStartY = 0;
    var touchMoved = false;

    element.addEventListener('mousedown', function(e) {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      
      var rect = element.getBoundingClientRect();
      var containerRect = container.getBoundingClientRect();
      initialLeft = rect.left - containerRect.left;
      initialTop = rect.top - containerRect.top;
      
      element.style.transform = 'none';
      element.style.left = initialLeft + 'px';
      element.style.top = initialTop + 'px';
      
      e.preventDefault();
    });

    document.addEventListener('mousemove', function(e) {
      if (!isDragging) return;
      
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      
      element.style.left = (initialLeft + dx) + 'px';
      element.style.top = (initialTop + dy) + 'px';
    });

    document.addEventListener('mouseup', function() {
      isDragging = false;
    });

    element.addEventListener('touchstart', function(e) {
      if (e.touches.length !== 1) return;
      
      touchStartY = e.touches[0].clientY;
      touchMoved = false;
      
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      
      var rect = element.getBoundingClientRect();
      var containerRect = container.getBoundingClientRect();
      initialLeft = rect.left - containerRect.left;
      initialTop = rect.top - containerRect.top;
    }, { passive: true });

    element.addEventListener('touchmove', function(e) {
      if (e.touches.length !== 1) return;
      
      var dx = e.touches[0].clientX - startX;
      var dy = e.touches[0].clientY - startY;
      
      if (!touchMoved && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
        return;
      }
      
      if (Math.abs(dx) > 8 || touchMoved) {
        touchMoved = true;
        isDragging = true;
        e.preventDefault();
        
        element.style.transform = 'none';
        element.style.left = (initialLeft + dx) + 'px';
        element.style.top = (initialTop + dy) + 'px';
      }
    }, { passive: false });

    element.addEventListener('touchend', function() {
      isDragging = false;
      touchMoved = false;
    });
  }

  function showUpgradeModal(feature, requiredPlan) {
    var overlay = document.createElement('div');
    overlay.className = 'rv-modal-overlay';
    
    overlay.innerHTML = [
      '<div class="rv-modal rv-upgrade-modal">',
      '  <div class="rv-upgrade-icon">' + createIcon('lock') + '</div>',
      '  <h3 class="rv-upgrade-title">Unlock Premium Tools</h3>',
      '  <p class="rv-upgrade-text">This feature is part of the <strong>' + requiredPlan + '</strong> plan.<br>Upgrade now to access premium room library, high-resolution exports, and more!</p>',
      '  <div class="rv-upgrade-buttons">',
      '    <button type="button" class="rv-widget-btn rv-widget-btn-secondary rv-cancel-btn">Cancel</button>',
      '    <button type="button" class="rv-widget-btn rv-upgrade-btn">Upgrade Now</button>',
      '  </div>',
      '</div>'
    ].join('');

    document.body.appendChild(overlay);

    setTimeout(function() {
      overlay.classList.add('rv-visible');
    }, 10);

    function closeModal() {
      overlay.classList.remove('rv-visible');
      setTimeout(function() {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 200);
    }

    overlay.querySelector('.rv-cancel-btn').addEventListener('click', closeModal);
    overlay.querySelector('.rv-upgrade-btn').addEventListener('click', function() {
      window.open(BASE_URL + '/#/pricing', '_blank');
      closeModal();
    });
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeModal();
    });
  }

  function showInfoTooltip(button, userType) {
    var existingTooltip = document.querySelector('.rv-tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
      return;
    }

    var tips = {
      artist: [
        'Drag artwork to reposition on the wall',
        'Choose from different room presets',
        'Add frames to your artwork',
        'Download preview images'
      ],
      designer: [
        'Access premium room library',
        'Export high-resolution images',
        'Create PDF proposals',
        'Custom branding options'
      ],
      gallery: [
        'Create virtual exhibitions',
        'Showcase multiple artworks',
        'Navigate with arrow keys',
        'Export slideshows and PDFs'
      ]
    };

    var currentTips = tips[userType] || tips.artist;
    var tooltip = document.createElement('div');
    tooltip.className = 'rv-tooltip';
    tooltip.innerHTML = [
      '<h4>Quick Tips</h4>',
      '<ul>',
      currentTips.map(function(tip) { return '<li>' + tip + '</li>'; }).join(''),
      '</ul>'
    ].join('');

    button.parentNode.style.position = 'relative';
    button.parentNode.appendChild(tooltip);

    setTimeout(function() {
      tooltip.classList.add('rv-visible');
    }, 10);

    document.addEventListener('click', function closeTooltip(e) {
      if (!tooltip.contains(e.target) && e.target !== button) {
        tooltip.classList.remove('rv-visible');
        setTimeout(function() {
          if (tooltip.parentNode) tooltip.remove();
        }, 200);
        document.removeEventListener('click', closeTooltip);
      }
    });
  }

  function createDropdown(button, items) {
    var dropdown = document.createElement('div');
    dropdown.className = 'rv-dropdown';
    
    button.parentNode.insertBefore(dropdown, button);
    dropdown.appendChild(button);

    var menu = document.createElement('div');
    menu.className = 'rv-dropdown-menu';
    
    items.forEach(function(item) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rv-dropdown-item' + (item.locked ? ' rv-locked' : '');
      btn.innerHTML = item.icon + '<span>' + item.label + '</span>' + (item.locked ? createIcon('lock') : '');
      btn.addEventListener('click', function() {
        menu.classList.remove('rv-visible');
        item.onClick();
      });
      menu.appendChild(btn);
    });

    dropdown.appendChild(menu);

    button.addEventListener('click', function(e) {
      e.stopPropagation();
      menu.classList.toggle('rv-visible');
    });

    document.addEventListener('click', function(e) {
      if (!dropdown.contains(e.target)) {
        menu.classList.remove('rv-visible');
      }
    });

    return dropdown;
  }

  async function exportImage(canvasArea, highRes) {
    try {
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');
      var scale = highRes ? 2.5 : 1;
      var width = 1200 * scale;
      var height = 800 * scale;
      
      canvas.width = width;
      canvas.height = height;

      ctx.fillStyle = ROOMVIBE_COLORS.softGrey;
      ctx.fillRect(0, 0, width, height);

      var roomImg = canvasArea.querySelector('.rv-room-image');
      if (roomImg) {
        await new Promise(function(resolve, reject) {
          var img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = function() {
            ctx.drawImage(img, 0, 0, width, height);
            resolve();
          };
          img.onerror = reject;
          img.src = roomImg.src;
        });
      }

      var artworkOverlay = canvasArea.querySelector('.rv-artwork-overlay');
      if (artworkOverlay) {
        var artworkImg = artworkOverlay.querySelector('img');
        if (artworkImg) {
          var overlayRect = artworkOverlay.getBoundingClientRect();
          var canvasRect = canvasArea.getBoundingClientRect();
          
          var relX = (overlayRect.left - canvasRect.left) / canvasRect.width;
          var relY = (overlayRect.top - canvasRect.top) / canvasRect.height;
          var relW = overlayRect.width / canvasRect.width;
          var relH = overlayRect.height / canvasRect.height;

          await new Promise(function(resolve, reject) {
            var img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = function() {
              var borderWidth = parseInt(artworkOverlay.style.borderWidth) || 0;
              var borderColor = artworkOverlay.style.borderColor;
              
              if (borderWidth > 0 && borderColor !== 'transparent') {
                ctx.fillStyle = borderColor;
                ctx.fillRect(
                  relX * width - borderWidth * scale,
                  relY * height - borderWidth * scale,
                  relW * width + borderWidth * 2 * scale,
                  relH * height + borderWidth * 2 * scale
                );
              }
              
              ctx.drawImage(img, relX * width, relY * height, relW * width, relH * height);
              resolve();
            };
            img.onerror = reject;
            img.src = artworkImg.src;
          });
        }
      }

      if (!highRes && widgetConfig && widgetConfig.userType === 'user') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(width - 320, height - 50, 310, 40);
        ctx.fillStyle = ROOMVIBE_COLORS.primary;
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('RoomVibe – Upgrade for High-Res', width - 20, height - 25);
      }

      var dataUrl = canvas.toDataURL('image/png');
      var link = document.createElement('a');
      link.download = 'roomvibe-visualization' + (highRes ? '-hires' : '') + '.png';
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('[RoomVibe Widget] Export error:', error);
      alert('Failed to export image. Please try again.');
    }
  }

  function getModeTitle(userType) {
    var titles = {
      artist: 'Preview in your room',
      designer: 'Designer Studio',
      gallery: 'Gallery View',
      user: 'Preview in your room'
    };
    return titles[userType] || 'Preview in your room';
  }

  function getModeControls(userType, capabilities) {
    var controls = {
      left: [],
      right: []
    };

    if (userType === 'artist' || userType === 'user') {
      controls.left = [
        { id: 'rooms', icon: createIcon('room'), label: 'Change Room', action: 'toggleRooms' },
        { id: 'frames', icon: createIcon('frame'), label: 'Frame', action: 'toggleFrames' }
      ];
      controls.right = [
        { id: 'download', icon: createIcon('download'), label: 'Download', action: 'download' }
      ];
      if (capabilities.buyButton) {
        controls.right.push({ id: 'buy', icon: '', label: 'Buy Now', action: 'buy', primary: true });
      }
    } else if (userType === 'designer') {
      controls.left = [
        { id: 'rooms', icon: createIcon('building'), label: 'Premium Rooms', action: 'toggleRooms', premium: capabilities.premiumRooms },
        { id: 'frames', icon: createIcon('frame'), label: 'Frame', action: 'toggleFrames' }
      ];
      controls.right = [
        { id: 'export', icon: createIcon('download'), label: 'Export', action: 'showExportMenu', hasDropdown: true }
      ];
    } else if (userType === 'gallery') {
      controls.left = [
        { id: 'rooms', icon: createIcon('building'), label: 'Exhibition Rooms', action: 'toggleRooms' },
        { id: 'artworks', icon: createIcon('gallery'), label: 'Artwork List', action: 'toggleArtworks' }
      ];
      controls.right = [
        { id: 'export', icon: createIcon('file'), label: 'Export', action: 'showExportMenu', hasDropdown: true }
      ];
    }

    return controls;
  }

  function createWidgetModal(config) {
    widgetConfig = config;
    currentFrame = 'none';
    exhibitionIndex = 0;

    var overlay = document.createElement('div');
    overlay.className = 'rv-modal-overlay';

    var modeTitle = getModeTitle(config.userType);
    var controls = getModeControls(config.userType, config.capabilities);
    var isGalleryMode = config.userType === 'gallery';

    overlay.innerHTML = [
      '<div class="rv-modal">',
      '  <div class="rv-modal-header">',
      '    <div class="rv-modal-header-left">',
      '      <h2 class="rv-modal-title">' + modeTitle + '</h2>',
      '    </div>',
      '    <div class="rv-modal-header-right">',
      '      <button type="button" class="rv-info-btn" aria-label="Help">' + createIcon('info') + '</button>',
      '      <button type="button" class="rv-modal-close" aria-label="Close">' + createIcon('close') + '</button>',
      '    </div>',
      '  </div>',
      '  <div class="rv-modal-body">',
      '    <div class="rv-main">',
      '      <div class="rv-canvas-area">',
      '        <img class="rv-room-image" src="" alt="Room preview">',
      (isGalleryMode ? '        <button type="button" class="rv-exhibition-nav rv-prev" aria-label="Previous">' + createIcon('arrowLeft') + '</button>' : ''),
      (isGalleryMode ? '        <button type="button" class="rv-exhibition-nav rv-next" aria-label="Next">' + createIcon('arrowRight') + '</button>' : ''),
      (isGalleryMode ? '        <div class="rv-exhibition-counter">1 / 1</div>' : ''),
      '      </div>',
      '      <div class="rv-controls">',
      '        <div class="rv-controls-left"></div>',
      '        <div class="rv-controls-right"></div>',
      '      </div>',
      '    </div>',
      '    <div class="rv-sidebar">',
      (isGalleryMode ? 
        '      <div class="rv-section">' +
        '        <h3 class="rv-section-title">Exhibition</h3>' +
        '        <div class="rv-gallery-thumbs"></div>' +
        '      </div>' +
        '      <div class="rv-section">' +
        '        <h3 class="rv-section-title">Exhibition Rooms</h3>' +
        '        <div class="rv-room-grid"></div>' +
        '      </div>' +
        '      <div class="rv-section">' +
        '        <h3 class="rv-section-title">Frame Style</h3>' +
        '        <div class="rv-frame-options"></div>' +
        '      </div>'
        :
        '      <div class="rv-section">' +
        '        <h3 class="rv-section-title">Artworks</h3>' +
        '        <div class="rv-artwork-list"></div>' +
        '      </div>' +
        '      <div class="rv-section">' +
        '        <h3 class="rv-section-title">Room Presets</h3>' +
        '        <div class="rv-room-grid"></div>' +
        '      </div>' +
        '      <div class="rv-section">' +
        '        <h3 class="rv-section-title">Frame Style</h3>' +
        '        <div class="rv-frame-options"></div>' +
        '      </div>'
      ),
      '    </div>',
      '  </div>',
      '</div>'
    ].join('');

    document.body.appendChild(overlay);

    var modal = overlay.querySelector('.rv-modal');
    var closeBtn = overlay.querySelector('.rv-modal-close');
    var infoBtn = overlay.querySelector('.rv-info-btn');
    var artworkList = overlay.querySelector('.rv-artwork-list');
    var roomGrid = overlay.querySelector('.rv-room-grid');
    var frameOptions = overlay.querySelector('.rv-frame-options');
    var canvasArea = overlay.querySelector('.rv-canvas-area');
    var roomImage = overlay.querySelector('.rv-room-image');
    var controlsLeft = overlay.querySelector('.rv-controls-left');
    var controlsRight = overlay.querySelector('.rv-controls-right');
    var exhibitionCounter = overlay.querySelector('.rv-exhibition-counter');
    var prevBtn = overlay.querySelector('.rv-exhibition-nav.rv-prev');
    var nextBtn = overlay.querySelector('.rv-exhibition-nav.rv-next');

    function closeModal() {
      overlay.classList.remove('rv-visible');
      setTimeout(function() {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
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

    infoBtn.addEventListener('click', function() {
      showInfoTooltip(infoBtn, config.userType);
    });

    var allArtworks = config.data.artworks || [];
    if (config.userType === 'gallery' && config.data.galleryScenes) {
      config.data.galleryScenes.forEach(function(scene) {
        if (scene.artworks) {
          allArtworks = allArtworks.concat(scene.artworks);
        }
      });
    }

    if (isGalleryMode) {
      var galleryThumbs = overlay.querySelector('.rv-gallery-thumbs');
      if (galleryThumbs) {
        renderGalleryThumbnails(galleryThumbs, allArtworks, function(artwork, idx) {
          currentArtwork = artwork;
          exhibitionIndex = idx;
          updateArtworkOverlay(canvasArea, currentArtwork, currentRoom, { id: currentFrame }, true);
          if (exhibitionCounter) {
            exhibitionCounter.textContent = (exhibitionIndex + 1) + ' / ' + allArtworks.length;
          }
        });
      }
    } else {
      renderArtworkList(artworkList, allArtworks, function(artwork) {
        currentArtwork = artwork;
        updateArtworkOverlay(canvasArea, currentArtwork, currentRoom, { id: currentFrame }, true);
      });
    }

    renderRoomGrid(roomGrid, config.data.rooms || [], function(room) {
      currentRoom = room;
      transitionRoom(roomImage, BASE_URL + room.image, function() {
        updateArtworkOverlay(canvasArea, currentArtwork, currentRoom, { id: currentFrame }, true);
      });
    });

    renderFrameOptions(frameOptions, function(frame) {
      currentFrame = frame.id;
      updateArtworkOverlay(canvasArea, currentArtwork, currentRoom, frame, false);
    });

    function handleAction(action) {
      switch (action) {
        case 'toggleRooms':
          var roomSection = overlay.querySelector('.rv-room-grid').parentNode;
          roomSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          break;
        case 'toggleFrames':
          var frameSection = overlay.querySelector('.rv-frame-options').parentNode;
          frameSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          break;
        case 'toggleArtworks':
          var artSection = overlay.querySelector('.rv-artwork-list').parentNode;
          artSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          break;
        case 'download':
          exportImage(canvasArea, false);
          break;
        case 'buy':
          if (currentArtwork && currentArtwork.buyUrl) {
            window.open(currentArtwork.buyUrl, '_blank');
          } else {
            alert('Buy link not available for this artwork.');
          }
          break;
      }
    }

    controls.left.forEach(function(ctrl) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rv-control-btn' + (ctrl.premium === false ? ' rv-premium' : '');
      btn.innerHTML = ctrl.icon + '<span>' + ctrl.label + '</span>';
      btn.addEventListener('click', function() {
        handleAction(ctrl.action);
      });
      controlsLeft.appendChild(btn);
    });

    controls.right.forEach(function(ctrl) {
      if (ctrl.hasDropdown) {
        var dropdownBtn = document.createElement('button');
        dropdownBtn.type = 'button';
        dropdownBtn.className = 'rv-control-btn';
        dropdownBtn.innerHTML = ctrl.icon + '<span>' + ctrl.label + '</span>' + createIcon('chevronDown');

        var exportItems = [
          { 
            icon: createIcon('download'), 
            label: 'Download PNG', 
            locked: false, 
            onClick: function() { exportImage(canvasArea, false); } 
          },
          { 
            icon: createIcon('download'), 
            label: 'High-Res PNG', 
            locked: !config.capabilities.highResExport, 
            onClick: function() { 
              if (config.capabilities.highResExport) {
                exportImage(canvasArea, true);
              } else {
                showUpgradeModal('highResExport', 'Designer or Gallery');
              }
            } 
          },
          { 
            icon: createIcon('file'), 
            label: 'PDF Export', 
            locked: !config.capabilities.pdfExport, 
            onClick: function() { 
              if (config.capabilities.pdfExport) {
                alert('PDF export coming soon!');
              } else {
                showUpgradeModal('pdfExport', 'Artist');
              }
            } 
          }
        ];

        createDropdown(dropdownBtn, exportItems);
        controlsRight.appendChild(dropdownBtn.parentNode);
      } else {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'rv-control-btn' + (ctrl.primary ? ' rv-buy-btn' : '');
        btn.innerHTML = ctrl.icon + '<span>' + ctrl.label + '</span>';
        btn.addEventListener('click', function() {
          handleAction(ctrl.action);
        });
        controlsRight.appendChild(btn);
      }
    });

    if (isGalleryMode && allArtworks.length > 0) {
      exhibitionCounter.textContent = '1 / ' + allArtworks.length;
      var isAnimating = false;

      function navigateExhibition(direction) {
        if (isAnimating || allArtworks.length <= 1) return;
        isAnimating = true;

        var oldIndex = exhibitionIndex;
        if (direction === 'prev') {
          exhibitionIndex = exhibitionIndex === 0 ? allArtworks.length - 1 : exhibitionIndex - 1;
        } else {
          exhibitionIndex = exhibitionIndex === allArtworks.length - 1 ? 0 : exhibitionIndex + 1;
        }
        
        var currentOverlay = canvasArea.querySelector('.rv-artwork-overlay');
        if (currentOverlay) {
          currentOverlay.classList.add(direction === 'prev' ? 'rv-slide-exit-right' : 'rv-slide-exit-left');
          currentOverlay.classList.remove('rv-visible');
        }
        
        setTimeout(function() {
          if (currentOverlay && currentOverlay.parentNode) {
            currentOverlay.remove();
          }
          
          currentArtwork = allArtworks[exhibitionIndex];
          updateArtworkOverlayWithSlide(canvasArea, currentArtwork, currentRoom, { id: currentFrame }, direction);
          exhibitionCounter.textContent = (exhibitionIndex + 1) + ' / ' + allArtworks.length;

          artworkList.querySelectorAll('.rv-artwork-item').forEach(function(el, idx) {
            el.classList.toggle('rv-selected', idx === exhibitionIndex);
          });
          
          var galleryThumbs = overlay.querySelectorAll('.rv-gallery-thumb');
          galleryThumbs.forEach(function(thumb, idx) {
            thumb.classList.toggle('rv-selected', idx === exhibitionIndex);
          });
          
          setTimeout(function() {
            isAnimating = false;
          }, 150);
        }, 150);
      }

      function updateArtworkOverlayWithSlide(canvasArea, artwork, room, frame, direction) {
        if (!artwork || !room) return;

        var overlay = document.createElement('div');
        overlay.className = 'rv-artwork-overlay';
        overlay.classList.add(direction === 'prev' ? 'rv-slide-enter-left' : 'rv-slide-enter-right');
        
        var frameColor = 'transparent';
        var frameWidth = 0;
        if (frame && frame.id !== 'none') {
          frameWidth = 8;
          switch (frame.id) {
            case 'black': frameColor = '#1a1a1a'; break;
            case 'white': frameColor = '#ffffff'; break;
            case 'wood': frameColor = '#8B4513'; break;
            case 'gold': frameColor = ROOMVIBE_COLORS.gold; break;
          }
        }

        var scale = 1.5;
        var displayWidth = artwork.width * scale;
        var displayHeight = artwork.height * scale;

        overlay.style.cssText = [
          'width: ' + displayWidth + 'px',
          'height: ' + displayHeight + 'px',
          'border: ' + frameWidth + 'px solid ' + frameColor,
          'top: 50%',
          'left: 50%',
          'transform: translate(-50%, -60%)'
        ].join(';');

        overlay.innerHTML = '<img src="' + artwork.imageUrl + '" alt="' + artwork.title + '">';
        canvasArea.appendChild(overlay);

        requestAnimationFrame(function() {
          requestAnimationFrame(function() {
            overlay.classList.remove('rv-slide-enter-left', 'rv-slide-enter-right');
            overlay.classList.add('rv-visible');
          });
        });

        makeDraggable(overlay, canvasArea);
      }

      prevBtn.addEventListener('click', function() { navigateExhibition('prev'); });
      nextBtn.addEventListener('click', function() { navigateExhibition('next'); });

      document.addEventListener('keydown', function navHandler(e) {
        if (!document.body.contains(overlay)) {
          document.removeEventListener('keydown', navHandler);
          return;
        }
        if (e.key === 'ArrowLeft') navigateExhibition('prev');
        if (e.key === 'ArrowRight') navigateExhibition('next');
      });

      var touchStartX = 0;
      var touchStartTime = 0;
      canvasArea.addEventListener('touchstart', function(e) {
        touchStartX = e.touches[0].clientX;
        touchStartTime = Date.now();
      }, { passive: true });

      canvasArea.addEventListener('touchend', function(e) {
        var touchEndX = e.changedTouches[0].clientX;
        var touchDuration = Date.now() - touchStartTime;
        var diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50 && touchDuration < 500) {
          navigateExhibition(diff > 0 ? 'next' : 'prev');
        }
      });
    }

    setTimeout(function() {
      overlay.classList.add('rv-visible');
    }, 10);
  }

  function createWidget(scriptEl) {
    var widgetId = scriptEl.getAttribute('data-widget-id');
    var buttonText = scriptEl.getAttribute('data-button-text') || 'See in your room';
    var containerId = scriptEl.getAttribute('data-container');

    if (!widgetId) {
      console.warn('[RoomVibe Widget] No widget ID provided');
      return;
    }

    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'rv-widget-btn';
    button.innerHTML = createIcon('room') + '<span>' + buttonText + '</span>';

    button.addEventListener('click', async function(e) {
      e.preventDefault();
      button.disabled = true;
      button.style.opacity = '0.7';

      try {
        var config = await fetchWidgetConfig(widgetId);
        createWidgetModal(config);
      } catch (error) {
        console.error('[RoomVibe Widget] Error:', error);
        alert('Failed to load widget. Please try again.');
      } finally {
        button.disabled = false;
        button.style.opacity = '1';
      }
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

      var scripts = document.querySelectorAll('script[data-widget-id]');
      
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
      version: '2.1.0'
    };
  }

})();
