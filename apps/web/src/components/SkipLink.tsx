'use client';

import { type MouseEvent } from 'react';

export function SkipLink() {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    const target = document.querySelector<HTMLElement>('main') ?? document.getElementById('main-content');
    if (!target) return;

    event.preventDefault();
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: 'start' });
  }

  return (
    <a className="skip-link" href="#main-content" onClick={handleClick}>
      Skip to main content
    </a>
  );
}
