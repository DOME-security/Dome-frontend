import type { IndicatorPage, RepoSummary, Scan, ScanReport } from '../lib/types';

// Inert look-alike data. Paths and hashes describe harmless demo files; nothing
// here is, or links to, real malware.

export const DEMO_HASH = 'a'.repeat(64);
export const COMMIT = '7fd1a60b01f91b314f59955a4e4d4e80d8edf11d';

export function report(overrides: Partial<ScanReport> = {}): ScanReport {
  return {
    tool: { name: 'dome', version: '0.1.0' },
    target: 'https://github.com/dome-security/demo-repo',
    scope: 'full',
    verdict: 'review',
    findings: [
      {
        ruleId: 'DOME-VSC-001',
        relatedRules: [],
        severity: 'review',
        reasonKey: 'folderOpen',
        reason: 'A VS Code task is set to run automatically when the folder is opened.',
        locations: [{ path: '.vscode/tasks.json', line: 5 }],
      },
    ],
    incomplete: [],
    stats: { filesInTree: 12, filesInScope: 12, rulesRun: 27 },
    ...overrides,
  };
}

export function scan(overrides: Partial<Scan> = {}): Scan {
  return {
    id: 'scan-1',
    repository: { owner: 'dome-security', repo: 'demo-repo', url: 'https://github.com/dome-security/demo-repo' },
    ref: null,
    commit: COMMIT,
    pullRequest: null,
    status: 'done',
    verdict: 'review',
    createdAt: '2026-10-28T10:00:00Z',
    startedAt: '2026-10-28T10:00:01Z',
    finishedAt: '2026-10-28T10:00:05Z',
    report: report(),
    reportHash: undefined,
    attestation: null,
    ...overrides,
  };
}

export function repoSummary(overrides: Partial<RepoSummary> = {}): RepoSummary {
  return {
    repository: { owner: 'dome-security', repo: 'demo-repo' },
    latestScan: scan(),
    attestation: null,
    ...overrides,
  };
}

export const indicatorPage: IndicatorPage = {
  indicators: [
    { kind: 'hash', value: DEMO_HASH, campaign: 'demo', evidence: ['https://example.org/advisory'] },
    { kind: 'hash', value: 'b'.repeat(64), campaign: 'demo', evidence: [] },
    { kind: 'package', value: 'dome-fixture-package', campaign: 'other-demo', evidence: [] },
  ],
  nextCursor: null,
};
