"use client";

import { useCallback, useRef, useState, useEffect, type PointerEvent, type FocusEvent } from "react";

type HoverControlOptions = {
  delayMs?: number;
  enabled?: boolean;
};

export type HoverControl = {
  isHovering: boolean;
  hoverProps: {
    onPointerEnter: (event: PointerEvent<HTMLElement>) => void;
    onPointerLeave: (event: PointerEvent<HTMLElement>) => void;
    onFocus: (event: FocusEvent<HTMLElement>) => void;
    onBlur: (event: FocusEvent<HTMLElement>) => void;
  };
};

function supportsFineHover(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export function useHover({
  delayMs = 300,
  enabled = true,
}: HoverControlOptions = {}): HoverControl {
  const [isHovering, setIsHovering] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHoverTimer = useCallback(() => {
    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);

  const show = useCallback(() => {
    if (!enabled || !supportsFineHover()) {
      return;
    }

    clearHoverTimer();
    hoverTimerRef.current = window.setTimeout(() => {
      setIsHovering(true);
      hoverTimerRef.current = null;
    }, delayMs);
  }, [clearHoverTimer, delayMs, enabled]);

  const hide = useCallback(() => {
    clearHoverTimer();
    setIsHovering(false);
  }, [clearHoverTimer]);

  useEffect(() => {
    return clearHoverTimer;
  }, [clearHoverTimer]);

  return {
    isHovering,
    hoverProps: {
      onPointerEnter: show,
      onPointerLeave: hide,
      onFocus: show,
      onBlur: hide,
    },
  };
}
