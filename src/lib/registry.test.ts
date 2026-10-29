import { describe, expect, it } from 'vitest';
import { report } from '../test/fixtures';
import { reportHash } from './hash';
import {
  accountUrl,
  contractErrorCode,
  contractErrorMessage,
  contractUrl,
  indicatorKindLabel,
  shortKey,
  txUrl,
  verifyReportHash,
} from './registry';

const CONTRACT = 'CCHLCPUBLL4ROEFP5PR3JY4LUB32TLNB2KDF3DQLG3R53IK5OUW7TZUY';

describe('explorer links', () => {
  it('builds links only for well-formed ids', () => {
    expect(txUrl('F'.repeat(64), 'testnet')).toBe(`https://stellar.expert/explorer/testnet/tx/${'f'.repeat(64)}`);
    expect(txUrl('"><script>', 'testnet')).toBeNull();
    expect(contractUrl(CONTRACT, 'mainnet')).toBe(`https://stellar.expert/explorer/public/contract/${CONTRACT}`);
    expect(contractUrl('nope')).toBeNull();
    expect(accountUrl(`G${'A'.repeat(55)}`, 'testnet')).toContain('/account/G');
  });
});

describe('labels', () => {
  it('shortens keys', () => {
    expect(shortKey(CONTRACT)).toBe('CCHL…TZUY');
    expect(shortKey('short')).toBe('short');
  });

  it('maps contract errors and kinds', () => {
    expect(contractErrorMessage(13)).toMatch(/already approved/);
    expect(contractErrorMessage(99)).toMatch(/error 99/);
    expect(contractErrorCode(new Error('HostError: Error(Contract, #13)'))).toBe(13);
    expect(contractErrorCode(new Error('network down'))).toBeNull();
    expect(indicatorKindLabel('font')).toBe('Fake font file');
    expect(indicatorKindLabel('toString')).toBe('Other');
  });
});

describe('verifyReportHash', () => {
  it('matches a report against its attested hash', async () => {
    const r = report();
    const hash = await reportHash(r);
    await expect(verifyReportHash(r, hash.toUpperCase())).resolves.toBe('match');
    await expect(verifyReportHash({ ...r, verdict: 'clean' }, hash)).resolves.toBe('mismatch');
    await expect(verifyReportHash(r, null)).resolves.toBe('unavailable');
    await expect(verifyReportHash(null, hash)).resolves.toBe('unavailable');
  });
});
