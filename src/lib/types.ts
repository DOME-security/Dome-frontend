// Response shapes from dome-backend. Source of truth: dome-backend docs/api.md
// and packages/engine/src/types.ts. A change there is a breaking change here.

export type Severity = 'info' | 'review' | 'block';
export type Verdict = 'clean' | 'review' | 'block' | 'incomplete';
export type ScanStatus = 'queued' | 'running' | 'done' | 'failed';

export interface Location {
  path: string;
  line?: number;
  column?: number;
}

export interface Finding {
  ruleId: string;
  relatedRules: string[];
  severity: Severity;
  reasonKey: string;
  reason: string;
  locations: Location[];
  fixture?: boolean;
  allowed?: boolean;
}

export interface IncompleteRead {
  path: string;
  reason: 'too-large' | 'read-error' | 'invalid-config' | 'unsupported-entry';
}

export interface ScanReport {
  tool: { name: 'dome'; version: string };
  target: string;
  scope: 'full' | 'diff';
  verdict: Verdict;
  findings: Finding[];
  incomplete: IncompleteRead[];
  stats: { filesInTree: number; filesInScope: number; rulesRun: number };
}

export interface Repository {
  owner: string;
  repo: string;
  url?: string;
}

export interface Scan {
  id: string;
  repository: Repository;
  ref: string | null;
  commit: string | null;
  pullRequest: number | null;
  status: ScanStatus;
  verdict: Verdict | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  report: ScanReport | null;
  reportHash: string | null;
  attestation: { tx: string } | null;
}

export interface CreatedScan {
  id: string;
  status: ScanStatus;
  links: { self: string };
}

export interface OnChainAttestation {
  commit: string;
  verdict: string;
  reportHash: string;
  attester: string;
  ledger: number;
  txHash: string;
  closedAt: string;
}

export interface RepoSummary {
  repository: Repository;
  latestScan: Scan | null;
  attestation: OnChainAttestation | null;
}

export type IndicatorLookup =
  | { sha256: string; known: false }
  | {
      sha256: string;
      known: true;
      campaign: string;
      evidence: string[];
      ledger: number;
      txHash: string;
    };

export interface IndicatorEntry {
  kind: string;
  value: string;
  campaign: string;
  evidence: string[];
}

export interface IndicatorPage {
  indicators: IndicatorEntry[];
  nextCursor: string | null;
}
