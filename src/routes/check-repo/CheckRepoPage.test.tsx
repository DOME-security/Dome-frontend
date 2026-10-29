import { act, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { scan } from '../../test/fixtures';
import { renderRoute } from '../../test/render';
import { POLL_MS } from './CheckRepoPage';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('/check/repo', () => {
  it('rejects links that are not GitHub repositories without calling the API', async () => {
    const { user } = renderRoute('/check/repo');
    await user.type(await screen.findByLabelText('GitHub repository'), 'https://gitlab.com/o/r');
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/public GitHub repository/);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects invalid branch names', async () => {
    const { user } = renderRoute('/check/repo');
    await user.type(await screen.findByLabelText('GitHub repository'), 'o/r');
    await user.type(screen.getByLabelText(/Branch or tag/), '../main');
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/branch or tag/i);
  });

  it('queues a scan, polls while it runs, then shows the report', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    let polls = 0;
    const { user, router } = renderRoute('/check/repo', {
      'POST /v1/scans': () => ({ status: 202, body: { id: 'scan-1', status: 'queued', links: { self: '/v1/scans/scan-1' } } }),
      'GET /v1/scans/scan-1': () => {
        polls += 1;
        return { body: polls === 1 ? scan({ status: 'running', verdict: null, report: undefined }) : scan() };
      },
    });
    await user.type(await screen.findByLabelText('GitHub repository'), 'https://github.com/dome-security/demo-repo/tree/main');
    await user.click(screen.getByRole('button', { name: 'Check' }));

    expect(await screen.findByText(/Scanning/)).toBeInTheDocument();
    expect(router.state.location.search).toBe('?scan=scan-1');
    const post = vi.mocked(fetch).mock.calls.find(([, init]) => init?.method === 'POST');
    expect(JSON.parse(String(post?.[1]?.body))).toEqual({ url: 'https://github.com/dome-security/demo-repo' });

    await act(() => vi.advanceTimersByTimeAsync(POLL_MS));
    expect(await screen.findByRole('heading', { name: /needs review/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /on-chain attestation/ })).toHaveAttribute('href', '/repos/dome-security/demo-repo');
    expect(polls).toBe(2);
  });

  it('opens an existing scan from the URL and says a failed scan is not clean', async () => {
    renderRoute('/check/repo?scan=scan-9', {
      'GET /v1/scans/scan-9': () => ({ body: scan({ id: 'scan-9', status: 'failed', verdict: null, report: undefined }) }),
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(/not a clean result/);
  });

  it('shows API errors in its own words', async () => {
    const { user } = renderRoute('/check/repo', {
      'POST /v1/scans': () => ({ status: 429, body: { error: 'slow down <script>' } }),
    });
    await user.type(await screen.findByLabelText('GitHub repository'), 'o/r');
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Too many requests. Wait a minute and try again.');
  });
});
