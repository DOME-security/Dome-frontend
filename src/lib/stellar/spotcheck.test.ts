import { describe, expect, it } from 'vitest';
import { compareAttestation, compareIndicator, compareKnownBad, type ChainAttestation, type ChainIndicator } from './spotcheck';

const HASH = 'a'.repeat(64);
const chainIndicator = (overrides: Partial<ChainIndicator> = {}): ChainIndicator => ({
  hash: HASH,
  kind: 'task',
  campaign: 'demo',
  status: 'active',
  approvals: ['GA', 'GB'],
  evidence: 'e'.repeat(64),
  retractedBy: null,
  retractReason: null,
  proposedAt: 1,
  ...overrides,
});
const known = { sha256: HASH, known: true as const, campaign: 'demo', evidence: [], ledger: 1, txHash: 'f'.repeat(64) };

describe('compareIndicator', () => {
  it('matches when both sides agree', () => {
    expect(compareIndicator(known, chainIndicator())).toEqual({ state: 'match' });
    expect(compareIndicator({ sha256: HASH, known: false }, null)).toEqual({ state: 'match' });
    expect(compareIndicator({ sha256: HASH, known: false }, chainIndicator({ status: 'proposed' }))).toEqual({ state: 'match' });
  });

  it('reports each disagreement', () => {
    expect(compareIndicator(known, null)).toMatchObject({
      state: 'mismatch',
      differences: [expect.stringMatching(/no indicator/)],
    });
    expect(compareIndicator(known, chainIndicator({ status: 'retracted' }))).toMatchObject({
      differences: [expect.stringMatching(/retracted, not active/)],
    });
    expect(compareIndicator({ sha256: HASH, known: false }, chainIndicator())).toMatchObject({
      differences: [expect.stringMatching(/does not list it/)],
    });
    expect(compareIndicator(known, chainIndicator({ campaign: 'other' }))).toMatchObject({
      differences: [expect.stringMatching(/campaign/)],
    });
  });
});

describe('compareAttestation', () => {
  const backend = {
    commit: 'ABC123',
    verdict: 'clean',
    reportHash: 'D'.repeat(64),
    attester: 'G',
    ledger: 1,
    txHash: 't',
    closedAt: '',
  };
  const chain: ChainAttestation = {
    commit: 'abc123',
    verdict: 'clean',
    report: 'd'.repeat(64),
    attester: 'G',
    at: 1,
    retractedBy: null,
  };

  it('matches case-insensitively', () => {
    expect(compareAttestation(backend, chain)).toEqual({ state: 'match' });
    expect(compareAttestation(null, null)).toEqual({ state: 'match' });
  });

  it('reports retractions and field differences', () => {
    const result = compareAttestation(backend, { ...chain, verdict: 'block', retractedBy: 'GADMIN', report: '0'.repeat(64) });
    expect(result).toMatchObject({ state: 'mismatch' });
    expect(result.state === 'mismatch' && result.differences).toEqual([
      'The ledger says this attestation was retracted.',
      'The verdict differs from the ledger.',
      'The report hash differs from the ledger.',
    ]);
    expect(compareAttestation(null, chain)).toMatchObject({ state: 'mismatch' });
    expect(compareAttestation(backend, null)).toMatchObject({ state: 'mismatch' });
  });
});

describe('compareKnownBad', () => {
  it('lists indicators the ledger does not consider active', () => {
    expect(compareKnownBad([{ hash: HASH, knownBad: true }])).toEqual({ state: 'match' });
    expect(compareKnownBad([{ hash: HASH, knownBad: false }])).toEqual({
      state: 'mismatch',
      differences: ['aaaaaaaaaaaa… is not active on the ledger.'],
    });
  });
});
