import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { scan } from '../test/fixtures';
import { sentRequests, server } from '../test/server';
import { ApiError, createApiClient, errorMessage } from './api';

const client = createApiClient('');

describe('createApiClient', () => {
  it('posts a scan with only the fields the API accepts', async () => {
    server.use(
      http.post('/v1/scans', () =>
        HttpResponse.json({ id: 'abc', status: 'queued', links: { self: '/v1/scans/abc' } }, { status: 202 }),
      ),
    );
    await expect(client.createScan('https://github.com/o/r')).resolves.toMatchObject({ id: 'abc' });
    await client.createScan('https://github.com/o/r', 'main');
    expect(await sentRequests[0]!.json()).toEqual({ url: 'https://github.com/o/r' });
    expect(await sentRequests[1]!.json()).toEqual({ url: 'https://github.com/o/r', ref: 'main' });
  });

  it('never sends cookies', async () => {
    server.use(http.get('/v1/scans/x', () => HttpResponse.json(scan())));
    await client.getScan('x');
    expect(sentRequests[0]!.credentials).toBe('omit');
  });

  it('encodes path parameters', async () => {
    server.use(http.get('/v1/scans/:id', () => HttpResponse.json({ error: 'nope' }, { status: 404 })));
    await client.getScan('../admin').catch(() => {});
    expect(new URL(sentRequests[0]!.url).pathname).toBe('/v1/scans/..%2Fadmin');
  });

  it('uses its own error text, not the response body', async () => {
    server.use(http.get('/v1/scans/x', () => HttpResponse.json({ error: '<b>pwned</b>' }, { status: 429 })));
    const error = await client.getScan('x').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(429);
    expect((error as ApiError).message).toBe(errorMessage(429));
  });

  it('rejects responses with the wrong shape', async () => {
    server.use(http.get('/v1/scans/x', () => HttpResponse.json({ id: 'x', status: 'pwned' })));
    await expect(client.getScan('x')).rejects.toThrow(/Unexpected response/);
  });

  it('reports network failures with status 0', async () => {
    server.use(http.get('/v1/repos/o/r', () => HttpResponse.error()));
    await expect(client.getRepo('o', 'r')).rejects.toMatchObject({ status: 0 });
  });

  it('validates hashes before looking them up', async () => {
    await expect(client.getIndicator('nope')).rejects.toMatchObject({ status: 400 });
    expect(sentRequests).toHaveLength(0);
  });

  it('lowercases hashes and pages indicators', async () => {
    const hash = 'A'.repeat(64);
    server.use(
      http.get('/v1/indicators/:sha256', ({ params }) => HttpResponse.json({ sha256: params.sha256, known: false })),
      http.get('/v1/indicators', ({ request }) => {
        const url = new URL(request.url);
        return HttpResponse.json({ indicators: [], nextCursor: url.searchParams.get('cursor') === 'abc' ? 'def' : null });
      }),
    );
    await expect(client.getIndicator(hash)).resolves.toEqual({ sha256: hash.toLowerCase(), known: false });
    await expect(client.listIndicators({ limit: 50, cursor: 'abc' })).resolves.toEqual({ indicators: [], nextCursor: 'def' });
    expect(new URL(sentRequests[1]!.url).search).toBe('?limit=50&cursor=abc');
  });

  it('prefixes the configured base URL', async () => {
    server.use(http.get('https://api.dome.example/v1/scans/x', () => HttpResponse.json(scan())));
    await expect(createApiClient('https://api.dome.example').getScan('x')).resolves.toMatchObject({ id: 'scan-1' });
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
