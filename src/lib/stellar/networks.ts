import type { StellarNetwork } from '../config';

/** Network passphrases, as defined by the Stellar network itself. */
export const PASSPHRASE: Record<StellarNetwork, string> = {
  testnet: 'Test SDF Network ; September 2015',
  mainnet: 'Public Global Stellar Network ; September 2015',
};

export function networkForPassphrase(passphrase: string): StellarNetwork | null {
  return (Object.keys(PASSPHRASE) as StellarNetwork[]).find((n) => PASSPHRASE[n] === passphrase) ?? null;
}

/** Stroops (the integer unit) to a human XLM amount: 1 XLM = 10,000,000 stroops. */
export function stroopsToXlm(stroops: string | number): string {
  const value = BigInt(stroops);
  const whole = value / 10_000_000n;
  const fraction = (value % 10_000_000n).toString().padStart(7, '0').replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : `${whole}`;
}
