export function hexToBytes(hex: string): Uint8Array {
  if (!/^(?:[0-9a-f]{2})*$/i.test(hex)) throw new TypeError('Expected an even-length hex string.');
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function bytesToHex(bytes: Uint8Array | ArrayLike<number> | null | undefined): string {
  return bytes ? Array.from(bytes as ArrayLike<number>, (b) => b.toString(16).padStart(2, '0')).join('') : '';
}
