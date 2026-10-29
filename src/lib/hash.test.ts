import { describe, expect, it } from 'vitest';
import { canonicalJson, FileTooLargeError, hashFile, MAX_HASH_BYTES, reportHash, sha256Hex } from './hash';

describe('sha256Hex', () => {
  it('matches known vectors', async () => {
    expect(await sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(await sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});

describe('hashFile', () => {
  it('hashes file contents locally', async () => {
    const file = new File(['echo DOME_FIXTURE\n'], 'tasks.json');
    expect(await hashFile(file)).toBe(await sha256Hex('echo DOME_FIXTURE\n'));
  });

  it('refuses files over the limit', async () => {
    const big = { size: MAX_HASH_BYTES + 1, arrayBuffer: () => Promise.reject(new Error('must not read')) } as unknown as Blob;
    await expect(hashFile(big)).rejects.toThrow(FileTooLargeError);
    await expect(hashFile(big)).rejects.toThrow(/up to 25 MB/);
  });
});

describe('canonicalJson', () => {
  it('sorts keys at every level and drops undefined', () => {
    expect(canonicalJson({ b: 1, a: { d: [{ z: 1, y: 2 }], c: undefined } })).toBe('{"a":{"d":[{"y":2,"z":1}]},"b":1}');
  });

  it('matches JSON.stringify for scalars and null', () => {
    expect(canonicalJson(null)).toBe('null');
    expect(canonicalJson('a"b')).toBe('"a\\"b"');
  });
});

describe('reportHash', () => {
  it('is independent of key order', async () => {
    expect(await reportHash({ a: 1, b: 2 })).toBe(await reportHash({ b: 2, a: 1 }));
    expect(await reportHash({ a: 1, b: 2 })).toBe(await sha256Hex('{"a":1,"b":2}'));
  });
});
