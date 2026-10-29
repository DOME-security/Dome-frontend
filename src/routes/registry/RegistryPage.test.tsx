import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { DEMO_HASH, indicatorPage } from '../../test/fixtures';
import { renderRoute } from '../../test/render';
import { sentRequests } from '../../test/server';

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

describe('/registry/indicator/:hash', () => {
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
