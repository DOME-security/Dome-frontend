import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { reportHash } from '../../lib/hash';
import { COMMIT, repoSummary, scan } from '../../test/fixtures';
import { renderRoute } from '../../test/render';
import { sentRequests } from '../../test/server';

const PATH = '/v1/repos/dome-security/demo-repo';

async function attestation(overrides: { reportHash?: string; commit?: string } = {}) {
  return {
    commit: COMMIT,
    verdict: 'review',
    reportHash: await reportHash(scan().report),
    attester: `G${'B'.repeat(55)}`,
    ledger: 123,
    txHash: '1'.repeat(64),
    closedAt: '2026-10-28T10:01:00Z',
    ...overrides,
  };
}

describe('/repos/:owner/:repo', () => {
  it('verifies the report against the on-chain hash', async () => {
    const att = await attestation();
    renderRoute(
      '/repos/dome-security/demo-repo',
      http.get(PATH, () => HttpResponse.json(repoSummary({ attestation: att }))),
    );
    expect(await screen.findByText(/hashes to the value recorded on chain/)).toBeInTheDocument();
    expect(screen.getByText('GBBB…BBBB')).toHaveAttribute('href', expect.stringContaining('/account/G'));
    expect(screen.getByRole('heading', { name: /needs review/i })).toBeInTheDocument();
  });

  it('warns when the report does not match', async () => {
    const att = await attestation({ reportHash: '0'.repeat(64) });
    renderRoute(
      '/repos/dome-security/demo-repo',
      http.get(PATH, () => HttpResponse.json(repoSummary({ attestation: att }))),
    );
    expect(await screen.findByText(/does not match the hash recorded on chain/)).toBeInTheDocument();
  });

  it('does not compare an attestation for another commit', async () => {
    const att = await attestation({ commit: 'f'.repeat(40) });
    renderRoute(
      '/repos/dome-security/demo-repo',
      http.get(PATH, () => HttpResponse.json(repoSummary({ attestation: att }))),
    );
    expect(await screen.findByText(/different commit/)).toBeInTheDocument();
  });

  it('offers a scan for repositories Dome has not seen', async () => {
    renderRoute(
      '/repos/dome-security/demo-repo',
      http.get(PATH, () =>
        HttpResponse.json({ repository: { owner: 'dome-security', repo: 'demo-repo' }, latestScan: null, attestation: null }),
      ),
    );
    expect(await screen.findByText('Dome has not scanned this repository yet.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Check it now' })).toHaveAttribute('href', '/check/repo');
  });

  it('rejects invalid owner names without calling the API', async () => {
    renderRoute('/repos/-bad-/x');
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(sentRequests).toHaveLength(0);
  });
});
