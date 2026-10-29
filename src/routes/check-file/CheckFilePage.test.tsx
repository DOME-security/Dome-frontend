import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { sha256Hex } from '../../lib/hash';
import { renderRoute } from '../../test/render';
import { sentRequests } from '../../test/server';

// Inert look-alike of a malicious task file.
const FIXTURE = '{"version":"2.0.0","tasks":[{"label":"x","command":"echo DOME_FIXTURE","runOptions":{"runOn":"folderOpen"}}]}';

describe('/check/file', () => {
  it('hashes the file locally and sends only the hash', async () => {
    const hash = await sha256Hex(FIXTURE);
    const { user } = renderRoute(
      '/check/file',
      http.get(`/v1/indicators/${hash}`, () =>
        HttpResponse.json({
          sha256: hash,
          known: true,
          campaign: 'demo',
          evidence: ['https://example.org/advisory', 'javascript:alert(1)'],
          ledger: 42,
          txHash: 'c'.repeat(64),
        }),
      ),
    );
    const input = (await screen.findByLabelText(/choose a file/i)) as HTMLInputElement;
    await user.upload(input, new File([FIXTURE], 'tasks.json', { type: 'application/json' }));

    expect(await screen.findByRole('heading', { name: /blocked/i })).toBeInTheDocument();
    expect(screen.getByText(hash)).toBeInTheDocument();
    expect(screen.getByText(/tasks\.json \(\d+ bytes\)/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'example.org' })).toHaveAttribute('href', 'https://example.org/advisory');
    expect(screen.queryByText(/javascript/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View transaction' })).toHaveAttribute(
      'href',
      expect.stringContaining('/testnet/tx/'),
    );

    expect(sentRequests).toHaveLength(1);
    expect(new URL(sentRequests[0]!.url).pathname).toBe(`/v1/indicators/${hash}`);
    expect(sentRequests[0]!.method).toBe('GET');
    expect(sentRequests[0]!.body).toBeNull();
  });

  it('says an unknown file is not proof of safety', async () => {
    const hash = await sha256Hex('echo DOME_FIXTURE');
    const { user } = renderRoute(
      '/check/file',
      http.get(`/v1/indicators/${hash}`, () => HttpResponse.json({ sha256: hash, known: false })),
    );
    await user.upload(await screen.findByLabelText(/choose a file/i), new File(['echo DOME_FIXTURE'], 'a.sh'));
    expect(await screen.findByRole('heading', { name: 'Not on the known-bad list' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Result' })).toHaveTextContent('No known pattern found is not the same as safe.');
  });

  it('looks up a pasted hash and validates it first', async () => {
    const hash = 'd'.repeat(64);
    const { user } = renderRoute(
      '/check/file',
      http.get(`/v1/indicators/${hash}`, () => HttpResponse.json({ sha256: hash, known: false })),
    );
    await user.click(await screen.findByText('Already have a SHA-256 fingerprint?'));
    await user.type(screen.getByLabelText('SHA-256'), 'xyz');
    await user.click(screen.getByRole('button', { name: 'Look up' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/64 characters/);
    await user.clear(screen.getByLabelText('SHA-256'));
    await user.type(screen.getByLabelText('SHA-256'), hash.toUpperCase());
    await user.click(screen.getByRole('button', { name: 'Look up' }));
    expect(await screen.findByRole('heading', { name: 'Not on the known-bad list' })).toBeInTheDocument();
  });
});
