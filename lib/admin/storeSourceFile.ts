/**
 * Client-side helper: store the uploaded file verbatim (POST /api/admin/data-sources) so
 * the resulting database's "source" links to the actual file, not just a name. Returns the
 * stored file id, or null if storing failed — uploads proceed either way; the source link
 * is a bonus, never a blocker.
 */
export async function storeSourceFile(file: File): Promise<string | null> {
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const CHUNK = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK) {
      binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK)));
    }
    const res = await fetch('/api/admin/data-sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        base64: btoa(binary)
      })
    });
    if (!res.ok) return null;
    const body = await res.json();
    return typeof body.id === 'string' ? body.id : null;
  } catch {
    return null;
  }
}
