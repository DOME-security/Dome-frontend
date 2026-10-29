import type { Page, Request } from '@playwright/test';

// Inert demo data for the mocked Dome API. Nothing here is, or points to, real
// malware: the "malicious" task file only echoes a marker.
export const COMMIT = '7fd1a60b01f91b314f59955a4e4d4e80d8edf11d';
export const FIXTURE_TASKS =
  '{"version":"2.0.0","tasks":[{"label":"x","command":"echo DOME_FIXTURE","runOptions":{"runOn":"folderOpen"}}]}';
export const ACTIVE_HASH = 'a'.repeat(64);
export const REPO = { owner: 'dome-security', repo: 'demo-repo' };

const finding = (ruleId: string, severity: string, reasonKey: string, path: string, line: number) => ({
  ruleId,
  relatedRules: [],
  severity,
  reasonKey,
  reason: 'engine text the app must not show',
  locations: [{ path, line }],
});

const FINDINGS = {
  block: [
    finding('DOME-VSC-001', 'review', 'folderOpen', '.vscode/tasks.json', 5),
    finding('DOME-VSC-005', 'block', 'downloadAndRun', '.vscode/<b>tasks</b>.json', 7),
  ],
  review: [finding('DOME-NPM-001', 'review', 'added', 'package.json', 3)],
  clean: [],
};

export type ScanOutcome = 'block' | 'review' | 'clean' | 'failed';

export function report(verdict: 'block' | 'review' | 'clean') {
  return {
    tool: { name: 'dome', version: '0.1.0' },
    target: `https://github.com/${REPO.owner}/${REPO.repo}`,
    scope: 'full',
    verdict,
    findings: FINDINGS[verdict],
    incomplete: [],
    stats: { filesInTree: 10, filesInScope: 10, rulesRun: 27 },
  };
}

function scan(id: string, outcome: ScanOutcome, done: boolean) {
  const finished = done && outcome !== 'failed';
  return {
    id,
    repository: { ...REPO, url: `https://github.com/${REPO.owner}/${REPO.repo}` },
    ref: null,
    commit: COMMIT,
    pullRequest: null,
    status: done ? (outcome === 'failed' ? 'failed' : 'done') : 'running',
    verdict: finished ? outcome : null,
    createdAt: '2026-10-28T10:00:00Z',
    startedAt: '2026-10-28T10:00:01Z',
    finishedAt: done ? '2026-10-28T10:00:05Z' : null,
    attestation: null,
    ...(finished ? { report: report(outcome as 'block' | 'review' | 'clean') } : {}),
  };
}

export interface MockOptions {
  /** What the next queued scan turns into. */
  scanOutcome?: ScanOutcome;
  knownHash?: string;
  repo?: unknown;
}

/** Installs the mock API and returns every request the page sent to it. */
export async function mockApi(page: Page, options: MockOptions = {}): Promise<Request[]> {
  const requests: Request[] = [];
  const outcome = options.scanOutcome ?? 'block';
  let polls = 0;
  await page.route('**/v1/**', async (route) => {
    const request = route.request();
    requests.push(request);
    const { pathname, searchParams } = new URL(request.url());
    const json = (body: unknown, status = 200) => route.fulfill({ status, json: body });

    if (request.method() === 'POST' && pathname === '/v1/scans') {
      return json({ id: 'scan-e2e', status: 'queued', links: { self: '/v1/scans/scan-e2e' } }, 202);
    }
    if (pathname === '/v1/scans/scan-e2e') {
      polls += 1;
      return json(scan('scan-e2e', outcome, polls >= 2));
    }
    if (pathname === `/v1/repos/${REPO.owner}/${REPO.repo}`) {
      return json(options.repo ?? { repository: REPO, latestScan: scan('scan-e2e', 'clean', true), attestation: null });
    }
    if (pathname.startsWith('/v1/repos/')) {
      const [, , , owner, repo] = pathname.split('/');
      return json({ repository: { owner, repo }, latestScan: null, attestation: null });
    }
    if (pathname === '/v1/indicators') {
      return json({
        indicators: [
          { kind: 'hash', value: ACTIVE_HASH, campaign: 'demo', evidence: ['https://example.org/advisory'] },
          { kind: 'hash', value: 'b'.repeat(64), campaign: 'demo', evidence: [] },
          { kind: 'package', value: 'dome-fixture-package', campaign: 'other-demo', evidence: [] },
        ],
        nextCursor: searchParams.get('cursor') ? null : null,
      });
    }
    const indicator = /^\/v1\/indicators\/([0-9a-f]{64})$/.exec(pathname);
    if (indicator) {
      const sha256 = indicator[1]!;
      return sha256 === options.knownHash || sha256 === ACTIVE_HASH
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
