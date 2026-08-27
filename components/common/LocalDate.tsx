import { useEffect, useState } from 'react';

/**
 * A date in the viewer's locale — hydration-safe.
 *
 * Locale formatting differs between Node and the browser (and between server and viewer
 * timezones in production), so rendering `toLocaleString()` during SSR produces the classic
 * "Text content does not match server-rendered HTML" hydration error. This renders a
 * deterministic ISO-derived string first (identical on server and client), then swaps in the
 * locale format after mount. Use this for ANY date shown on a page that server-renders data.
 */
export function LocalDate({ iso, mode = 'datetime' }: { iso: string; mode?: 'date' | 'datetime' }) {
  const [text, setText] = useState(() => iso.slice(0, mode === 'date' ? 10 : 16).replace('T', ' '));
  useEffect(() => {
    const date = new Date(iso);
    setText(mode === 'date' ? date.toLocaleDateString() : date.toLocaleString());
  }, [iso, mode]);
  return <>{text}</>;
}
