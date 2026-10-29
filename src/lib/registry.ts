import { m } from '../i18n';
import { config, type StellarNetwork } from './config';
import { reportHash } from './hash';

// Helpers for the Dome Registry contract (dome-contracts). Reads currently go
// through the dome-backend indexer; direct RPC reads and curator transactions
// will use @dome-security/registry-bindings once it is published to npm.

export const NETWORK_LABEL: Record<StellarNetwork, string> = m.network;

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
export const CONTRACT_ERRORS: Record<number, string> = m.contractErrors;

export function contractErrorMessage(code: number): string {
  return CONTRACT_ERRORS[code] ?? m.contractErrorOther(code);
}

/** The contract error code inside a simulation or submission failure (`Error(Contract, #N)`), if any. */
export function contractErrorCode(error: unknown): number | null {
  const match = /Error\(Contract, #(\d+)\)/.exec(error instanceof Error ? error.message : String(error));
  return match ? Number(match[1]) : null;
}

export const INDICATOR_KIND_TEXT: Record<string, string> = m.indicatorKind;

export function indicatorKindLabel(kind: string): string {
  return Object.hasOwn(INDICATOR_KIND_TEXT, kind) ? INDICATOR_KIND_TEXT[kind]! : m.indicatorKindOther;
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
