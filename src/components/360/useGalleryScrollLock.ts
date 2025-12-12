import { useEffect, RefObject } from 'react';

export function useGalleryScrollLock(containerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const galleryEl = containerRef.current;
    if (!galleryEl) return;

    let active = false;
    let dragging = false;

    const wheelHandler = (e: WheelEvent) => {
      if (!active) return;
      e.preventDefault();
    };

    const touchMoveHandler = (e: TouchEvent) => {
      if (!active) return;
      e.preventDefault();
    };

    const keyHandler = (e: KeyboardEvent) => {
      if (!active) return;
      const scrollKeys = [
        'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown',
        'Home', 'End', ' ', 'Spacebar'
      ];
      if (scrollKeys.includes(e.key)) {
        e.preventDefault();
      }
    };

    const onEnter = () => { 
      active = true; 
    };
    
    const onLeave = () => {
      if (!dragging) {
        active = false;
      }
    };

    const onPointerDown = () => {
      active = true;
      dragging = true;
    };

    const onPointerUp = () => {
      dragging = false;
    };

    galleryEl.addEventListener('mouseenter', onEnter);
    galleryEl.addEventListener('mouseleave', onLeave);
    galleryEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);

    window.addEventListener('wheel', wheelHandler, { passive: false });
    window.addEventListener('touchmove', touchMoveHandler, { passive: false });
    window.addEventListener('keydown', keyHandler, { passive: false });

    return () => {
      galleryEl.removeEventListener('mouseenter', onEnter);
      galleryEl.removeEventListener('mouseleave', onLeave);
      galleryEl.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);

      window.removeEventListener('wheel', wheelHandler);
      window.removeEventListener('touchmove', touchMoveHandler);
      window.removeEventListener('keydown', keyHandler);
    };
  }, [containerRef]);
}
