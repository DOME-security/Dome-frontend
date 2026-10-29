import type { Page, Request } from '@playwright/test';

// Inert demo data. Nothing here is, or points to, real malware.
export const COMMIT = '7fd1a60b01f91b314f59955a4e4d4e80d8edf11d';
export const FIXTURE_TASKS =
  '{"version":"2.0.0","tasks":[{"label":"x","command":"echo DOME_FIXTURE","runOptions":{"runOn":"folderOpen"}}]}';

const report = {
  tool: { name: 'dome', version: '0.1.0' },
  target: 'https://github.com/dome-security/demo-repo',
  scope: 'full',
  verdict: 'block',
  findings: [
    {
      ruleId: 'DOME-VSC-001',
      relatedRules: [],
      severity: 'review',
      reasonKey: 'folderOpen',
      reason: 'fixed text',
      locations: [{ path: '.vscode/tasks.json', line: 5 }],
    },
    {
      ruleId: 'DOME-VSC-005',
      relatedRules: [],
      severity: 'block',
      reasonKey: 'curlPipe',
      reason: 'fixed text',
      locations: [{ path: '.vscode/<b>tasks</b>.json', line: 7 }],
    },
  ],
  incomplete: [],
  stats: { filesInTree: 10, filesInScope: 10, rulesRun: 27 },
};

function scan(status: string) {
  const done = status === 'done';
  return {
    id: 'scan-e2e',
    repository: { owner: 'dome-security', repo: 'demo-repo', url: 'https://github.com/dome-security/demo-repo' },
    ref: null,
    commit: COMMIT,
    pullRequest: null,
    status,
    verdict: done ? 'block' : null,
    createdAt: '2026-10-28T10:00:00Z',
    startedAt: null,
    finishedAt: null,
    report: done ? report : null,
    reportHash: null,
    attestation: null,
  };
}

/** Installs the mock API and returns every request the page sent to it. */
export async function mockApi(page: Page, options: { knownHash?: string } = {}): Promise<Request[]> {
  const requests: Request[] = [];
  let polls = 0;
  await page.route('**/v1/**', async (route) => {
    const request = route.request();
    requests.push(request);
    const { pathname } = new URL(request.url());
    const json = (body: unknown, status = 200) => route.fulfill({ status, json: body });

    if (request.method() === 'POST' && pathname === '/v1/scans') {
      return json({ id: 'scan-e2e', status: 'queued', links: { self: '/v1/scans/scan-e2e' } }, 202);
    }
    if (pathname === '/v1/scans/scan-e2e') {
      polls += 1;
      return json(scan(polls < 2 ? 'running' : 'done'));
    }
    if (pathname === '/v1/indicators') {
      return json({
        indicators: [{ kind: 'task', value: 'a'.repeat(64), campaign: 'demo', evidence: ['https://example.org/advisory'] }],
        nextCursor: null,
      });
    }
    const indicator = /^\/v1\/indicators\/([0-9a-f]{64})$/.exec(pathname);
    if (indicator) {
      const sha256 = indicator[1]!;
      return sha256 === options.knownHash || sha256 === 'a'.repeat(64)
        ? json({
            sha256,
            known: true,
            campaign: 'demo',
            evidence: ['https://example.org/advisory'],
            ledger: 42,
            txHash: 'c'.repeat(64),
          })
        : json({ sha256, known: false });
    }
    return json({ error: 'not found' }, 404);
  });
  return requests;
}
