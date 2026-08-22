import { useEffect, RefObject } from 'react';

export const useFocusTrap = <T extends HTMLElement>(containerRef: RefObject<T | null> | null, enabled = true) => {
  useEffect(() => {
    if (!enabled || !containerRef || !containerRef.current) return;

    const node = containerRef.current;
    const focusableSelector = 'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])';
    const focusable = Array.from(node.querySelectorAll<HTMLElement>(focusableSelector)).filter((el) => !el.hasAttribute('disabled'));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const prevActive = document.activeElement as HTMLElement | null;
    if (first) first.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // let parent handle close via keydown if needed
        return;
      }
      if (e.key === 'Tab') {
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('keydown', handleKey);
      if (prevActive && typeof prevActive.focus === 'function') prevActive.focus();
    };
  }, [containerRef, enabled]);
};
