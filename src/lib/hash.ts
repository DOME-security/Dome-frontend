/** Largest file the browser will hash. Web Crypto has no streaming digest, so the whole file is read into memory. */
export const MAX_HASH_BYTES = 256 * 1024 * 1024;

export function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** SHA-256 as lowercase hex, computed locally with Web Crypto. */
export async function sha256Hex(data: BufferSource | string): Promise<string> {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  return toHex(await crypto.subtle.digest('SHA-256', bytes));
}

function readAsArrayBuffer(file: Blob): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === 'function') return file.arrayBuffer();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the file.'));
    reader.readAsArrayBuffer(file);
  });
}

/** Hashes a file without uploading it anywhere. */
export async function hashFile(file: Blob): Promise<string> {
  if (file.size > MAX_HASH_BYTES) {
    throw new RangeError(`Files over ${MAX_HASH_BYTES / 1024 / 1024} MB cannot be checked in the browser.`);
  }
  return sha256Hex(await readAsArrayBuffer(file));
}

/**
 * JSON with object keys sorted at every level and undefined values dropped.
 * Mirrors canonicalJson in dome-backend packages/server/src/report-hash.ts.
 */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

/** The value attested on chain for a scan report. Anyone can recompute it. */
export function reportHash(report: unknown): Promise<string> {
  return sha256Hex(canonicalJson(report));
}
