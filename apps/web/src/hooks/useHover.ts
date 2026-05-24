import { useCallback, useEffect, useRef, useState } from 'react';

type UseHoverOptions = {
  delayMs?: number;
};

export function useHover({ delayMs = 300 }: UseHoverOptions = {}) {
  const [hovered, setHovered] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const media = window.matchMedia('(hover: hover) and (pointer: fine)');
    const handleChange = () => setEnabled(media.matches);
    handleChange();
    media.addEventListener('change', handleChange);
    return () => {
      media.removeEventListener('change', handleChange);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const clearTimer = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const onPointerEnter = useCallback(() => {
    if (!enabled) return;
    clearTimer();
    timer.current = setTimeout(() => {
      setHovered(true);
    }, delayMs);
  }, [clearTimer, delayMs, enabled]);

  const onPointerLeave = useCallback(() => {
    clearTimer();
    setHovered(false);
  }, [clearTimer]);

  const onFocus = useCallback(() => {
    if (!enabled) return;
    setHovered(true);
  }, [enabled]);

  const onBlur = useCallback(() => {
    clearTimer();
    setHovered(false);
  }, [clearTimer]);

  return {
    hovered,
    enabled,
    onPointerEnter,
    onPointerLeave,
    onFocus,
    onBlur
  } as const;
}
