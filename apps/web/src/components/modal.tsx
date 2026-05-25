'use client';

import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  useContext,
  useEffect,
  useId,
  useRef,
  useState
} from 'react';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  labelledBy?: string;
  className?: string;
};

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

export function Modal({ open, onClose, title, children, labelledBy, className }: ModalProps) {
  const generatedTitleId = useId();
  const titleId = labelledBy ?? generatedTitleId;
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = panelRef.current;
    const focusable = getFocusable(panel);
    (focusable[0] ?? panel)?.focus();

    return () => {
      restoreFocusRef.current?.focus();
      restoreFocusRef.current = null;
    };
  }, [open]);

  if (!open) return null;

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== 'Tab') return;
    const focusable = getFocusable(panelRef.current);
    if (focusable.length === 0) {
      event.preventDefault();
      panelRef.current?.focus();
      return;
    }

    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={onClose}>
      <div
        ref={panelRef}
        aria-labelledby={titleId}
        aria-modal="true"
        className={className}
        onKeyDown={handleKeyDown}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        tabIndex={-1}
      >
        <h2 id={titleId}>{title}</h2>
        {children}
      </div>
    </div>
  );
}

function getFocusable(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true'
  );
}

type TabsContextValue = {
  selectedValue: string;
  setSelectedValue: (value: string) => void;
};

const TabsContext = createContext<TabsContextValue | null>(null);

export function Tabs({ defaultValue, children, ...props }: HTMLAttributes<HTMLDivElement> & { defaultValue: string }) {
  const [selectedValue, setSelectedValue] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ selectedValue, setSelectedValue }}>
      <div {...props}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabList({ children, onKeyDown, ...props }: HTMLAttributes<HTMLDivElement>) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    if (tabs.length === 0) return;
    const currentIndex = Math.max(0, tabs.indexOf(document.activeElement as HTMLButtonElement));
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? tabs.length - 1
        : event.key === 'ArrowLeft'
          ? (currentIndex - 1 + tabs.length) % tabs.length
          : (currentIndex + 1) % tabs.length;
    event.preventDefault();
    tabs[nextIndex]?.click();
    tabs[nextIndex]?.focus();
  }

  return <div role="tablist" {...props} onKeyDown={handleKeyDown}>{children}</div>;
}

export function Tab({ value, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
  const context = useTabsContext();
  const selected = context.selectedValue === value;
  return (
    <button
      aria-selected={selected}
      role="tab"
      tabIndex={selected ? 0 : -1}
      type="button"
      {...props}
      onClick={(event) => {
        props.onClick?.(event);
        if (!event.defaultPrevented) context.setSelectedValue(value);
      }}
    >
      {children}
    </button>
  );
}

export function TabPanels({ children }: { children: ReactNode }) {
  const context = useTabsContext();
  return Children.map(children, (child) => {
    if (!isValidElement<{ value: string }>(child)) return child;
    return cloneElement(child as ReactElement<{ value: string; hidden?: boolean }>, {
      hidden: child.props.value !== context.selectedValue
    });
  });
}

export function TabPanel({ value: _value, ...props }: HTMLAttributes<HTMLDivElement> & { value: string }) {
  return <div role="tabpanel" {...props} />;
}

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) throw new Error('Tabs components must be rendered inside <Tabs>.');
  return context;
}

export function AccordionButton({ expanded, controls, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { expanded: boolean; controls: string }) {
  return <button aria-controls={controls} aria-expanded={expanded} type="button" {...props} />;
}
