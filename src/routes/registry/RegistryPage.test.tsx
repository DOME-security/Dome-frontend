import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { DEMO_HASH, indicatorPage } from '../../test/fixtures';
import { renderRoute } from '../../test/render';
import { sentRequests } from '../../test/server';
import { fakeChain, useFakes } from '../../test/services';

const list = (pages: Record<string, unknown>) =>
  http.get('/v1/indicators', ({ request }) =>
    HttpResponse.json(pages[new URL(request.url).searchParams.get('cursor') ?? ''] as object),
  );

describe('/registry', () => {
  it('lists indicators, links hashes and filters by campaign', async () => {
    const { user } = renderRoute('/registry', list({ '': indicatorPage }));
    const table = await screen.findByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(4);
    expect(within(table).getByTitle(DEMO_HASH)).toHaveAttribute('href', `/registry/indicator/${DEMO_HASH}`);
    expect(within(table).getByText('dome-fixture-package')).toBeInTheDocument();
    expect(within(table).getAllByText('File fingerprint')).toHaveLength(2);

    await user.selectOptions(screen.getByLabelText('Campaign'), 'other-demo');
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(2);
  });

  it('pages with the cursor', async () => {
    const { user } = renderRoute(
      '/registry',
      list({
        '': { ...indicatorPage, nextCursor: 'next' },
        next: {
          indicators: [{ kind: 'domain', value: 'staging.example.invalid', campaign: 'demo', evidence: [] }],
          nextCursor: null,
        },
      }),
    );
    await user.click(await screen.findByRole('button', { name: 'Load more' }));
    expect(await screen.findByText('Staging or C2 domain')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
    expect(new URL(sentRequests[1]!.url).search).toBe('?limit=100&cursor=next');
  });

  it('shows an empty state', async () => {
    renderRoute('/registry', list({ '': { indicators: [], nextCursor: null } }));
    expect(await screen.findByText('No active indicators yet.')).toBeInTheDocument();
  });

  it('shows an error state', async () => {
    renderRoute(
      '/registry',
      http.get('/v1/indicators', () => HttpResponse.json({ error: 'x' }, { status: 503 })),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(/having trouble/);
  });
});

describe('/registry ledger spot-check', () => {
  it('re-checks listed fingerprints with is_known_bad and says when the ledger disagrees', async () => {
    const isKnownBad = vi.fn((_net, hash: string) => Promise.resolve(hash === DEMO_HASH));
    useFakes({ chain: fakeChain({ isKnownBad }) });
    renderRoute('/registry', list({ '': indicatorPage }));
    expect(await screen.findByRole('alert')).toHaveTextContent('The Stellar testnet ledger disagrees with the Dome API.');
    expect(screen.getByRole('alert')).toHaveTextContent('bbbbbbbbbbbb… is not active on the ledger.');
    expect(isKnownBad).toHaveBeenCalledTimes(2);
  });

  it('confirms a matching sample', async () => {
    useFakes({ chain: fakeChain({ isKnownBad: () => Promise.resolve(true) }) });
    renderRoute('/registry', list({ '': indicatorPage }));
    expect(await screen.findByText(/Verified: a sample of 2 listed fingerprints matches/)).toBeInTheDocument();
  });

  it('says when the ledger cannot be reached', async () => {
    renderRoute('/registry', list({ '': indicatorPage }));
    // One retry happens before the page gives up on the ledger.
    expect(await screen.findByText(/Could not reach Stellar/, {}, { timeout: 4000 })).toBeInTheDocument();
  });
});

describe('/registry/indicator/:hash', () => {
  it('shows the on-chain record with approvals and verifies it', async () => {
    useFakes({
      chain: fakeChain({
        indicator: () =>
          Promise.resolve({
            hash: DEMO_HASH,
            kind: 'task',
            campaign: 'demo',
            status: 'active',
            approvals: [`G${'A'.repeat(55)}`, `G${'B'.repeat(55)}`],
            evidence: 'e'.repeat(64),
            retractedBy: null,
            retractReason: null,
            proposedAt: 1_790_000_000,
          }),
      }),
    });
    renderRoute(
      `/registry/indicator/${DEMO_HASH}`,
      http.get(`/v1/indicators/${DEMO_HASH}`, () =>
        HttpResponse.json({ sha256: DEMO_HASH, known: true, campaign: 'demo', evidence: [], ledger: 7, txHash: 'f'.repeat(64) }),
      ),
    );
    expect(await screen.findByText(/Verified: this indicator matches/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'On the ledger' })).toBeInTheDocument();
    expect(screen.getByText('Editor task file')).toBeInTheDocument();
    expect(screen.getByText('GAAA…AAAA')).toHaveAttribute('href', expect.stringContaining('/account/'));
  });

  it('flags an indicator the ledger says was retracted', async () => {
    useFakes({
      chain: fakeChain({
        indicator: () =>
          Promise.resolve({
            hash: DEMO_HASH,
            kind: 'task',
            campaign: 'demo',
            status: 'retracted',
            approvals: [],
            evidence: 'e'.repeat(64),
            retractedBy: `G${'C'.repeat(55)}`,
            retractReason: 'd'.repeat(64),
            proposedAt: 1_790_000_000,
          }),
      }),
    });
    renderRoute(
      `/registry/indicator/${DEMO_HASH}`,
      http.get(`/v1/indicators/${DEMO_HASH}`, () =>
        HttpResponse.json({ sha256: DEMO_HASH, known: true, campaign: 'demo', evidence: [], ledger: 7, txHash: 'f'.repeat(64) }),
      ),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('The ledger says this indicator is retracted, not active.');
    expect(screen.getByText('Retracted by')).toBeInTheDocument();
  });

  it('shows an active indicator', async () => {
    renderRoute(
      `/registry/indicator/${DEMO_HASH}`,
      http.get(`/v1/indicators/${DEMO_HASH}`, () =>
        HttpResponse.json({ sha256: DEMO_HASH, known: true, campaign: 'demo', evidence: [], ledger: 7, txHash: 'f'.repeat(64) }),
      ),
    );
    expect(await screen.findByText('Active')).toBeInTheDocument();
    expect(screen.getByText('None published')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^ffff/ })).toHaveAttribute('href', expect.stringContaining('/tx/'));
  });

  it('explains when a hash is not active', async () => {
    renderRoute(
      `/registry/indicator/${DEMO_HASH}`,
      http.get(`/v1/indicators/${DEMO_HASH}`, () => HttpResponse.json({ sha256: DEMO_HASH, known: false })),
    );
    expect(await screen.findByText('Not an active indicator.')).toBeInTheDocument();
  });

  it('treats malformed hashes as not found without calling the API', async () => {
    renderRoute('/registry/indicator/not-a-hash');
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(sentRequests).toHaveLength(0);
  });
});
