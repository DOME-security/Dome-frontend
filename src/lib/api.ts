import { config } from './config';
import type { CreatedScan, IndicatorLookup, IndicatorPage, RepoSummary, Scan } from './types';

/** Error from the Dome API or the network. `status` is 0 when no response arrived. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const SHA256 = /^[0-9a-f]{64}$/;

export function isSha256(value: string): boolean {
  return SHA256.test(value);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function expect(condition: boolean, what: string): asserts condition {
  if (!condition) throw new ApiError(`Unexpected response from the Dome API (${what}).`, 0);
}

function checkScan(value: unknown): Scan {
  expect(isObject(value), 'scan');
  expect(typeof value.id === 'string', 'scan.id');
  expect(['queued', 'running', 'done', 'failed'].includes(value.status as string), 'scan.status');
  expect(isObject(value.repository), 'scan.repository');
  if (value.report != null) {
    expect(isObject(value.report) && Array.isArray(value.report.findings), 'scan.report');
  }
  return value as unknown as Scan;
}

export interface ApiClient {
  createScan(url: string, ref?: string): Promise<CreatedScan>;
  getScan(id: string): Promise<Scan>;
  getRepo(owner: string, repo: string): Promise<RepoSummary>;
  getIndicator(sha256: string): Promise<IndicatorLookup>;
  listIndicators(options?: { limit?: number; cursor?: string }): Promise<IndicatorPage>;
}

export function createApiClient(baseUrl: string, fetchImpl: typeof fetch = (...args) => fetch(...args)): ApiClient {
  async function request(path: string, init?: RequestInit): Promise<unknown> {
    let response: Response;
    try {
      response = await fetchImpl(`${baseUrl}${path}`, {
        ...init,
        credentials: 'omit',
        headers: { accept: 'application/json', ...init?.headers },
      });
    } catch {
      throw new ApiError('Could not reach the Dome API. Check your connection and try again.', 0);
    }
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      // Handled below: a non-JSON body is an error either way.
    }
    if (!response.ok) {
      throw new ApiError(errorMessage(response.status), response.status);
    }
    expect(body !== null, 'empty body');
    return body;
  }

  return {
    async createScan(url, ref) {
      const body = await request('/v1/scans', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(ref ? { url, ref } : { url }),
      });
      expect(isObject(body) && typeof body.id === 'string', 'created scan');
      return body as unknown as CreatedScan;
    },

    async getScan(id) {
      return checkScan(await request(`/v1/scans/${encodeURIComponent(id)}`));
    },

    async getRepo(owner, repo) {
      const body = await request(`/v1/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
      expect(isObject(body) && isObject(body.repository), 'repo');
      if (body.latestScan != null) checkScan(body.latestScan);
      return body as unknown as RepoSummary;
    },

    async getIndicator(sha256) {
      const hash = sha256.toLowerCase();
      if (!isSha256(hash)) throw new ApiError('That is not a SHA-256 hash.', 400);
      const body = await request(`/v1/indicators/${hash}`);
      expect(isObject(body) && typeof body.known === 'boolean', 'indicator');
      return body as unknown as IndicatorLookup;
    },

    async listIndicators({ limit, cursor } = {}) {
      const params = new URLSearchParams();
      if (limit) params.set('limit', String(limit));
      if (cursor) params.set('cursor', cursor);
      const query = params.size ? `?${params}` : '';
      const body = await request(`/v1/indicators${query}`);
      expect(isObject(body) && Array.isArray(body.indicators), 'indicator page');
      return { indicators: body.indicators, nextCursor: (body.nextCursor as string | null | undefined) ?? null } as IndicatorPage;
    },
  };
}

/**
 * Messages are written here, not taken from the response, so nothing the API
 * (or a repository it scanned) returns can change what the user reads.
 */
export function errorMessage(status: number): string {
  if (status === 400) return 'The Dome API could not accept that request. Check the link and try again.';
  if (status === 404) return 'Not found.';
  if (status === 429) return 'Too many requests. Wait a minute and try again.';
  if (status >= 500) return 'The Dome API is having trouble. Try again in a few minutes.';
  return `The Dome API returned an error (${status}).`;
}

export const api: ApiClient = createApiClient(config.apiUrl);
