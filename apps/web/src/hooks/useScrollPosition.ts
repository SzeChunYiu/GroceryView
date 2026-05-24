"use client";

import { useEffect, useState } from 'react';

type UseScrollPositionOptions = {
  threshold?: number;
};

export function useScrollPosition({ threshold = 10 }: UseScrollPositionOptions = {}): {
  isScrolled: boolean;
} {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const update = () => {
      setIsScrolled(window.scrollY > threshold);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => {
      window.removeEventListener('scroll', update);
    };
  }, [threshold]);

  return { isScrolled };
}
