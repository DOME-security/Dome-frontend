import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';
import { repoSummary, scan } from '../../test/fixtures';
import { renderRoute } from '../../test/render';

afterEach(() => localStorage.clear());

describe('/dashboard', () => {
  it('starts empty and says sign-in is not available yet', async () => {
    renderRoute('/dashboard');
    expect(await screen.findByText(/GitHub sign-in is coming/)).toBeInTheDocument();
    expect(screen.getByText(/No repositories yet/)).toBeInTheDocument();
  });

  it('adds, shows and removes followed repositories, keeping them in this browser', async () => {
    const { user } = renderRoute(
      '/dashboard',
      http.get('/v1/repos/dome-security/demo-repo', () =>
        HttpResponse.json(repoSummary({ latestScan: scan({ verdict: 'block' }) })),
      ),
      http.get('/v1/repos/o/never', () =>
        HttpResponse.json({ repository: { owner: 'o', repo: 'never' }, latestScan: null, attestation: null }),
      ),
    );
    const input = await screen.findByLabelText('Add a public repository');
    await user.type(input, 'not a repo');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/owner\/repo/);

    await user.clear(input);
    await user.type(input, 'https://github.com/dome-security/demo-repo');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    await user.type(input, 'o/never');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    const rows = screen.getAllByRole('row').slice(1);
    expect(await within(rows[0]!).findByText('Block')).toBeInTheDocument();
    expect(await within(rows[1]!).findByText('Not scanned yet')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('dome-watchlist')!)).toEqual([
      { owner: 'dome-security', repo: 'demo-repo' },
      { owner: 'o', repo: 'never' },
    ]);

    await user.click(screen.getByRole('button', { name: 'Stop following o/never' }));
    expect(screen.getAllByRole('row')).toHaveLength(2);
  });

  it('ignores tampered storage', async () => {
    localStorage.setItem('dome-watchlist', JSON.stringify([{ owner: '<img src=x>', repo: 'r' }, 'junk']));
    renderRoute('/dashboard');
    expect(await screen.findByText(/No repositories yet/)).toBeInTheDocument();
  });

  it('shows the Action workflow pinned to pull_request with a read-only token', async () => {
    renderRoute('/dashboard');
    const workflow = await screen.findByLabelText('Workflow file');
    expect(workflow).toHaveTextContent('pull_request:');
    expect(workflow).toHaveTextContent('contents: read');
    expect(workflow.textContent).not.toMatch(/^\s*pull_request_target:/m);
  });
});
