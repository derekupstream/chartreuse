import { useEffect, useState } from 'react';

const STORAGE_KEY = 'chart-reuse-2-mode';

/**
 * Per-user toggle for the Chart-Reuse 2.0 redesign. Stored in localStorage so it
 * survives page reloads and is opt-in per device. Returns false on the server
 * to avoid hydration mismatches; clients see the real value after mount.
 */
export function useChartReuse2(): {
  enabled: boolean;
  setEnabled: (next: boolean) => void;
  hydrated: boolean;
} {
  const [enabled, setEnabledState] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      setEnabledState(raw === 'true');
    } catch {
      // SSR / disabled storage — keep default false
    }
    setHydrated(true);
  }, []);

  const setEnabled = (next: boolean) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? 'true' : 'false');
    } catch {}
    setEnabledState(next);
  };

  return { enabled, setEnabled, hydrated };
}
