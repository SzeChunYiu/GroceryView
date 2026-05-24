'use client';

import { Children, cloneElement, useId, useState, type FocusEventHandler, type MouseEventHandler, type ReactElement, type ReactNode } from 'react';

type TooltipSide = 'top' | 'bottom';

type TooltipTriggerProps = {
  'aria-describedby'?: string;
  onBlur?: FocusEventHandler<HTMLElement>;
  onFocus?: FocusEventHandler<HTMLElement>;
  onMouseEnter?: MouseEventHandler<HTMLElement>;
  onMouseLeave?: MouseEventHandler<HTMLElement>;
};

export interface TooltipProps {
  children: ReactElement<TooltipTriggerProps>;
  content: ReactNode;
  id?: string;
  side?: TooltipSide;
}

function mergeDescribedBy(existing: string | undefined, tooltipId: string) {
  return [...new Set([...(existing?.split(/\s+/) ?? []), tooltipId].filter(Boolean))].join(' ');
}

export function Tooltip({ children, content, id, side = 'top' }: Readonly<TooltipProps>) {
  const generatedId = useId();
  const tooltipId = id ?? `tooltip-${generatedId}`;
  const [isVisible, setIsVisible] = useState(false);
  const trigger = Children.only(children);
  const sideClass = side === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2';

  const triggerWithHandlers = cloneElement(trigger, {
    'aria-describedby': mergeDescribedBy(trigger.props['aria-describedby'], tooltipId),
    onBlur: (event) => {
      trigger.props.onBlur?.(event);
      setIsVisible(false);
    },
    onFocus: (event) => {
      trigger.props.onFocus?.(event);
      setIsVisible(true);
    },
    onMouseEnter: (event) => {
      trigger.props.onMouseEnter?.(event);
      setIsVisible(true);
    },
    onMouseLeave: (event) => {
      trigger.props.onMouseLeave?.(event);
      setIsVisible(false);
    }
  });

  return (
    <span className="relative inline-flex">
      {triggerWithHandlers}
      <span
        className={`pointer-events-none absolute left-1/2 z-30 w-max max-w-xs -translate-x-1/2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold leading-5 text-white shadow-lg transition ${sideClass} ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        id={tooltipId}
        role="tooltip"
      >
        {content}
      </span>
    </span>
  );
}
