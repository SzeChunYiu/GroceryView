'use client';

import { useEffect } from 'react';

type SwipeStart = { x: number; y: number; active: boolean; triggered: boolean };

const edgeWidth = 28;
const minTravel = 72;
const maxVerticalDrift = 64;

function isMobileViewport() {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;
}

export function useSwipeBackNavigation() {
  useEffect(() => {
    if (!isMobileViewport()) return;

    let start: SwipeStart | null = null;
    const root = document.documentElement;

    function clearGesture() {
      start = null;
      root.classList.remove('swipe-back-active');
    }

    function onTouchStart(event: TouchEvent) {
      if (event.touches.length !== 1) return;
      const touch = event.touches[0]!;
      start = {
        x: touch.clientX,
        y: touch.clientY,
        active: touch.clientX <= edgeWidth,
        triggered: false
      };
      if (start.active) root.classList.add('swipe-back-active');
    }

    function onTouchMove(event: TouchEvent) {
      if (!start?.active || start.triggered || event.touches.length !== 1) return;
      const touch = event.touches[0]!;
      const travelX = touch.clientX - start.x;
      const travelY = Math.abs(touch.clientY - start.y);
      const isBackSwipe = travelX >= minTravel && travelY <= maxVerticalDrift && travelX > travelY * 1.5;

      if (!isBackSwipe) return;
      start.triggered = true;
      event.preventDefault();
      if (window.history.length > 1) {
        window.history.back();
      }
      clearGesture();
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', clearGesture, { passive: true });
    window.addEventListener('touchcancel', clearGesture, { passive: true });

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', clearGesture);
      window.removeEventListener('touchcancel', clearGesture);
      clearGesture();
    };
  }, []);
}

export function SwipeBackNavigation() {
  useSwipeBackNavigation();
  return null;
}
