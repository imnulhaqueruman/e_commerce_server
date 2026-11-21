import { useEffect, useState } from 'react';

/**
 * Debounce a rapidly-changing value.
 *
 * Used by the search input so typing does not fire a request per keystroke.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
