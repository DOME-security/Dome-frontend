import { act, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { POLL_GIVE_UP_MS } from '../../lib/polling';
import { scan } from '../../test/fixtures';
import { renderRoute } from '../../test/render';
import { sentRequests } from '../../test/server';

afterEach(() => {
  vi.useRealTimers();
});

const created = () => HttpResponse.json({ id: 'scan-1', status: 'queued', links: { self: '/v1/scans/scan-1' } }, { status: 202 });

describe('/check/repo', () => {
  it('rejects links that are not GitHub repositories without calling the API', async () => {
    const { user } = renderRoute('/check/repo');
    await user.type(await screen.findByLabelText('GitHub repository'), 'https://gitlab.com/o/r');
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/public GitHub repository/);
    expect(sentRequests).toHaveLength(0);
  });

  it('rejects invalid branch names', async () => {
    const { user } = renderRoute('/check/repo');
    await user.type(await screen.findByLabelText('GitHub repository'), 'o/r');
    await user.type(screen.getByLabelText(/Branch or tag/), '../main');
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/branch or tag/i);
  });

  it('queues a scan, polls with backoff while it runs, then shows the report', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const pollTimes: number[] = [];
    const { user, router } = renderRoute(
      '/check/repo',
      http.post('/v1/scans', created),
      http.get('/v1/scans/scan-1', () => {
        pollTimes.push(Date.now());
        return HttpResponse.json(pollTimes.length < 4 ? scan({ status: 'running', verdict: null, report: undefined }) : scan());
      }),
    );
    await user.type(await screen.findByLabelText('GitHub repository'), 'https://github.com/dome-security/demo-repo/tree/main');
    await user.click(screen.getByRole('button', { name: 'Check' }));

    expect(await screen.findByText(/Scanning/)).toBeInTheDocument();
    expect(router.state.location.search).toBe('?scan=scan-1');
    expect(await sentRequests[0]!.json()).toEqual({ url: 'https://github.com/dome-security/demo-repo' });

    for (const ms of [1000, 2000, 4000]) await act(() => vi.advanceTimersByTimeAsync(ms));
    expect(await screen.findByRole('heading', { name: /needs review/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /on-chain attestation/ })).toHaveAttribute('href', '/repos/dome-security/demo-repo');

    const gaps = pollTimes.slice(1).map((t, i) => t - pollTimes[i]!);
    expect(gaps[1]!).toBeGreaterThan(gaps[0]!);
    await act(() => vi.advanceTimersByTimeAsync(60_000));
    expect(pollTimes).toHaveLength(4);
  });

  it('stops polling a stuck scan and offers a manual check', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    let polls = 0;
    const { user } = renderRoute(
      '/check/repo?scan=scan-1',
      http.get('/v1/scans/scan-1', () => {
        polls += 1;
        return HttpResponse.json(scan({ status: 'queued', verdict: null, report: undefined }));
      }),
    );
    expect(await screen.findByText(/Queued/)).toBeInTheDocument();
    await act(() => vi.advanceTimersByTimeAsync(POLL_GIVE_UP_MS + 30_000));
    const button = await screen.findByRole('button', { name: 'Check again' });
    const settled = polls;
    await act(() => vi.advanceTimersByTimeAsync(120_000));
    expect(polls).toBe(settled);
    await user.click(button);
    await vi.waitFor(() => expect(polls).toBe(settled + 1));
  });

  it('opens an existing scan from the URL and says a failed scan is not clean', async () => {
    renderRoute(
      '/check/repo?scan=scan-9',
      http.get('/v1/scans/scan-9', () =>
        HttpResponse.json(scan({ id: 'scan-9', status: 'failed', verdict: null, report: undefined })),
      ),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(/not a clean result/);
  });

  it('shows API errors in its own words', async () => {
    const { user } = renderRoute(
      '/check/repo',
      http.post('/v1/scans', () => HttpResponse.json({ error: 'slow down <script>' }, { status: 429 })),
    );
    await user.type(await screen.findByLabelText('GitHub repository'), 'o/r');
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Too many requests. Wait a minute and try again.');
  });
});
