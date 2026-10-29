import { describe, expect, it, vi } from 'vitest';
import { mockFetch, scan } from '../test/fixtures';
import { ApiError, createApiClient, errorMessage } from './api';

describe('createApiClient', () => {
  it('posts a scan with only the fields the API accepts', async () => {
    const seen = vi.fn();
    const client = createApiClient(
      'https://api.example',
      mockFetch({
        'POST /v1/scans': (init) => {
          seen(JSON.parse(String(init?.body)));
          return { status: 202, body: { id: 'abc', status: 'queued', links: { self: '/v1/scans/abc' } } };
        },
      }),
    );
    await expect(client.createScan('https://github.com/o/r')).resolves.toMatchObject({ id: 'abc' });
    expect(seen).toHaveBeenCalledWith({ url: 'https://github.com/o/r' });
    await client.createScan('https://github.com/o/r', 'main');
    expect(seen).toHaveBeenLastCalledWith({ url: 'https://github.com/o/r', ref: 'main' });
  });

  it('never sends cookies', async () => {
    const fetchImpl = vi.fn(mockFetch({ 'GET /v1/scans/x': () => ({ body: scan() }) }));
    await createApiClient('', fetchImpl).getScan('x');
    expect(fetchImpl.mock.calls[0]?.[1]).toMatchObject({ credentials: 'omit' });
  });

  it('encodes path parameters', async () => {
    const fetchImpl = vi.fn(mockFetch({}));
    await createApiClient('', fetchImpl)
      .getScan('../admin')
      .catch(() => {});
    expect(String(fetchImpl.mock.calls[0]?.[0])).toBe('/v1/scans/..%2Fadmin');
  });

  it('uses its own error text, not the response body', async () => {
    const client = createApiClient(
      '',
      mockFetch({ 'GET /v1/scans/x': () => ({ status: 429, body: { error: '<b>pwned</b>' } }) }),
    );
    const error = await client.getScan('x').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(429);
    expect((error as ApiError).message).toBe(errorMessage(429));
  });

  it('rejects responses with the wrong shape', async () => {
    const client = createApiClient('', mockFetch({ 'GET /v1/scans/x': () => ({ body: { id: 'x', status: 'pwned' } }) }));
    await expect(client.getScan('x')).rejects.toThrow(/Unexpected response/);
  });

  it('reports network failures with status 0', async () => {
    const client = createApiClient('', () => Promise.reject(new TypeError('offline')));
    await expect(client.getRepo('o', 'r')).rejects.toMatchObject({ status: 0 });
  });

  it('validates hashes before looking them up', async () => {
    const fetchImpl = vi.fn(mockFetch({}));
    await expect(createApiClient('', fetchImpl).getIndicator('nope')).rejects.toMatchObject({ status: 400 });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('lowercases hashes and pages indicators', async () => {
    const hash = 'A'.repeat(64);
    const client = createApiClient(
      '',
      mockFetch({
        [`GET /v1/indicators/${hash.toLowerCase()}`]: () => ({ body: { sha256: hash.toLowerCase(), known: false } }),
        'GET /v1/indicators?limit=50&cursor=abc': () => ({ body: { indicators: [], nextCursor: 'def' } }),
      }),
    );
    await expect(client.getIndicator(hash)).resolves.toEqual({ sha256: hash.toLowerCase(), known: false });
    await expect(client.listIndicators({ limit: 50, cursor: 'abc' })).resolves.toEqual({ indicators: [], nextCursor: 'def' });
  });
});

describe('errorMessage', () => {
  it.each([
    [400, /could not accept/],
    [404, /Not found/],
    [503, /having trouble/],
    [418, /\(418\)/],
  ])('%i', (status, pattern) => {
    expect(errorMessage(status)).toMatch(pattern);
  });
});
