import { Networks } from '@stellar/stellar-sdk';
import { describe, expect, it } from 'vitest';
import { networkForPassphrase, PASSPHRASE, stroopsToXlm } from './networks';

describe('networks', () => {
  it('uses the same passphrases as the Stellar SDK', () => {
    expect(PASSPHRASE.testnet).toBe(Networks.TESTNET);
    expect(PASSPHRASE.mainnet).toBe(Networks.PUBLIC);
    expect(networkForPassphrase(Networks.TESTNET)).toBe('testnet');
    expect(networkForPassphrase('Standalone Network ; February 2017')).toBeNull();
  });

  it('formats stroops as XLM', () => {
    expect(stroopsToXlm('100')).toBe('0.00001');
    expect(stroopsToXlm(10_000_000)).toBe('1');
    expect(stroopsToXlm('123456789')).toBe('12.3456789');
  });
});
