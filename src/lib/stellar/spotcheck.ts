import { m } from '../../i18n';
import type { IndicatorLookup, OnChainAttestation } from '../types';

const diff = m.ledger.diff;

// Pure comparisons between what the backend indexer says and what the
// Stellar ledger says. The chain is the source of truth.

/** An indicator as read from the contract, with byte fields as lowercase hex. */
export interface ChainIndicator {
  hash: string;
  kind: string;
  campaign: string;
  status: 'proposed' | 'active' | 'retracted' | string;
  approvals: string[];
  evidence: string;
  retractedBy: string | null;
  retractReason: string | null;
  proposedAt: number;
}

/** A repository's latest attestation as read from the contract. */
export interface ChainAttestation {
  commit: string;
  verdict: string;
  report: string;
  attester: string;
  at: number;
  retractedBy: string | null;
}

export type SpotCheck =
  | { state: 'match' }
  | { state: 'mismatch'; differences: string[] }
  | { state: 'unavailable' }
  | { state: 'not-configured' };

/** Backend says known/unknown; the chain says whether the indicator is active and in which campaign. */
export function compareIndicator(backend: IndicatorLookup, chain: ChainIndicator | null): SpotCheck {
  const chainActive = chain?.status === 'active';
  const differences: string[] = [];
  if (backend.known && !chain) differences.push(diff.noIndicator);
  else if (backend.known && !chainActive) differences.push(diff.indicatorStatus(chain!.status));
  else if (!backend.known && chainActive) differences.push(diff.indicatorUnlisted);
  if (backend.known && chain && backend.campaign !== chain.campaign) differences.push(diff.campaign);
  return differences.length ? { state: 'mismatch', differences } : { state: 'match' };
}

/** Compares the indexed attestation with the ledger's latest one for the repository. */
export function compareAttestation(backend: OnChainAttestation | null, chain: ChainAttestation | null): SpotCheck {
  if (!backend && !chain) return { state: 'match' };
  if (!chain) return { state: 'mismatch', differences: [diff.noAttestation] };
  if (!backend) return { state: 'mismatch', differences: [diff.extraAttestation] };
  const differences: string[] = [];
  if (chain.retractedBy) differences.push(diff.retracted);
  if (backend.commit.toLowerCase() !== chain.commit) differences.push(diff.commit);
  if (backend.verdict !== chain.verdict) differences.push(diff.verdict);
  if (backend.reportHash.toLowerCase() !== chain.report) differences.push(diff.reportHash);
  return differences.length ? { state: 'mismatch', differences } : { state: 'match' };
}

/** Indicators listed as active by the backend, checked one by one with `is_known_bad`. */
export function compareKnownBad(results: { hash: string; knownBad: boolean }[]): SpotCheck {
  const missing = results.filter((r) => !r.knownBad);
  return missing.length
    ? { state: 'mismatch', differences: missing.map((r) => diff.notActive(r.hash.slice(0, 12))) }
    : { state: 'match' };
}
