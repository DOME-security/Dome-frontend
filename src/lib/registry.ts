import { config, type StellarNetwork } from './config';
import { reportHash } from './hash';

// Helpers for the Dome Registry contract (dome-contracts). Reads currently go
// through the dome-backend indexer; direct RPC reads and curator transactions
// will use @dome-security/registry-bindings once it is published to npm.

export const NETWORK_LABEL: Record<StellarNetwork, string> = {
  testnet: 'Stellar testnet',
  mainnet: 'Stellar mainnet',
};

const TX_HASH = /^[0-9a-f]{64}$/i;
const CONTRACT_ID = /^C[A-Z2-7]{55}$/;
const ACCOUNT_ID = /^G[A-Z2-7]{55}$/;

export function isContractId(value: string): boolean {
  return CONTRACT_ID.test(value);
}

export function isAccountId(value: string): boolean {
  return ACCOUNT_ID.test(value);
}

function explorerBase(network: StellarNetwork): string {
  return `https://stellar.expert/explorer/${network === 'mainnet' ? 'public' : 'testnet'}`;
}

export function txUrl(txHash: string, network: StellarNetwork = config.network): string | null {
  return TX_HASH.test(txHash) ? `${explorerBase(network)}/tx/${txHash.toLowerCase()}` : null;
}

export function contractUrl(contractId: string, network: StellarNetwork = config.network): string | null {
  return isContractId(contractId) ? `${explorerBase(network)}/contract/${contractId}` : null;
}

export function accountUrl(accountId: string, network: StellarNetwork = config.network): string | null {
  return isAccountId(accountId) ? `${explorerBase(network)}/account/${accountId}` : null;
}

/** `GABC…WXYZ` for display; the full value goes in a title or copy button. */
export function shortKey(value: string, keep = 4): string {
  return value.length > keep * 2 + 1 ? `${value.slice(0, keep)}…${value.slice(-keep)}` : value;
}

/** Contract error codes from dome-contracts errors.rs (append-only), in plain language. */
export const CONTRACT_ERRORS: Record<number, string> = {
  1: 'The approval threshold is too low.',
  2: 'That address already has this role.',
  3: 'That address does not have this role.',
  4: 'This account is not a registered attester.',
  5: 'The verdict is not one the registry accepts.',
  6: 'The commit id is not a valid git commit.',
  7: 'The scanner version is missing.',
  8: 'The page size is out of range.',
  9: 'This account is not a registered curator.',
  10: 'The indicator kind is not one the registry accepts.',
  11: 'An indicator with this hash already exists (retracted ones included).',
  12: 'There is no indicator with this hash.',
  13: 'You have already approved this indicator.',
  14: 'This indicator has been retracted and can no longer change.',
  15: 'There is no attestation at that position for this repository.',
  16: 'This attestation has already been retracted.',
  17: 'Only the original attester or the admin can retract this attestation.',
};

export function contractErrorMessage(code: number): string {
  return CONTRACT_ERRORS[code] ?? `The registry rejected the transaction (error ${code}).`;
}

export const INDICATOR_KIND_TEXT: Record<string, string> = {
  // Kinds in the backend index.
  hash: 'File fingerprint',
  marker: 'Campaign marker',
  domain: 'Staging or C2 domain',
  // Kinds in the contract.
  task: 'Editor task file',
  font: 'Fake font file',
  config: 'Build config file',
  script: 'Script',
  package: 'npm package',
};

export function indicatorKindLabel(kind: string): string {
  return Object.hasOwn(INDICATOR_KIND_TEXT, kind) ? INDICATOR_KIND_TEXT[kind]! : 'Other';
}

export type ReportCheck = 'match' | 'mismatch' | 'unavailable';

/**
 * Recomputes the report hash in the browser and compares it with the hash
 * attested on chain, so the user does not have to trust the API for the link
 * between a report and its on-chain record.
 */
export async function verifyReportHash(report: unknown, attested: string | null | undefined): Promise<ReportCheck> {
  if (!report || !attested || !/^[0-9a-f]{64}$/i.test(attested)) return 'unavailable';
  return (await reportHash(report)) === attested.toLowerCase() ? 'match' : 'mismatch';
}
