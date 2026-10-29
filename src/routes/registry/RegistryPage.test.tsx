import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEMO_HASH, indicatorPage } from '../../test/fixtures';
import { renderRoute } from '../../test/render';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('/registry', () => {
  it('lists indicators, links hashes and filters by campaign', async () => {
    const { user } = renderRoute('/registry', { 'GET /v1/indicators?limit=100': () => ({ body: indicatorPage }) });
    const table = await screen.findByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(4);
    expect(within(table).getByTitle(DEMO_HASH)).toHaveAttribute('href', `/registry/indicator/${DEMO_HASH}`);
    expect(within(table).getByText('dome-fixture-package')).toBeInTheDocument();
    expect(within(table).getByText('Fake font file')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Campaign'), 'other-demo');
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(2);
  });

  it('pages with the cursor', async () => {
    const { user } = renderRoute('/registry', {
      'GET /v1/indicators?limit=100': () => ({ body: { ...indicatorPage, nextCursor: 'next' } }),
      'GET /v1/indicators?limit=100&cursor=next': () => ({
        body: { indicators: [{ kind: 'script', value: 'e'.repeat(64), campaign: 'demo', evidence: [] }], nextCursor: null },
      }),
    });
    await user.click(await screen.findByRole('button', { name: 'Load more' }));
    expect(await screen.findByText('Script')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });

  it('shows an empty state', async () => {
    renderRoute('/registry', { 'GET /v1/indicators?limit=100': () => ({ body: { indicators: [], nextCursor: null } }) });
    expect(await screen.findByText('No active indicators yet.')).toBeInTheDocument();
  });
});

describe('/registry/indicator/:hash', () => {
  it('shows an active indicator', async () => {
    renderRoute(`/registry/indicator/${DEMO_HASH}`, {
      [`GET /v1/indicators/${DEMO_HASH}`]: () => ({
        body: { sha256: DEMO_HASH, known: true, campaign: 'demo', evidence: [], ledger: 7, txHash: 'f'.repeat(64) },
      }),
    });
    expect(await screen.findByText('Active')).toBeInTheDocument();
    expect(screen.getByText('None published')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^ffff/ })).toHaveAttribute('href', expect.stringContaining('/tx/'));
  });

  it('explains when a hash is not active', async () => {
    renderRoute(`/registry/indicator/${DEMO_HASH}`, {
      [`GET /v1/indicators/${DEMO_HASH}`]: () => ({ body: { sha256: DEMO_HASH, known: false } }),
    });
    expect(await screen.findByText('Not an active indicator.')).toBeInTheDocument();
  });

  it('treats malformed hashes as not found without calling the API', async () => {
    renderRoute('/registry/indicator/not-a-hash');
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });
});
