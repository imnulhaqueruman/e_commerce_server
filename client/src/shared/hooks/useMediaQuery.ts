import { useEffect, useState } from 'react';

/**
 * Track a CSS media query.
 *
 * Used to switch between the desktop filter rail and the mobile drawer.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);

    setMatches(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/** True on small screens — the breakpoint used for the mobile nav. */
export const useIsMobile = () => useMediaQuery('(max-width: 767px)');
