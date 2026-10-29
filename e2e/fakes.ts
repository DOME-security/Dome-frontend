import type { Page } from '@playwright/test';

// Inert fakes for the Stellar chain and the Freighter wallet, installed before
// the app loads. Only the e2e build (VITE_E2E_FAKES=true) reads them.

export const TESTNET = 'Test SDF Network ; September 2015';
export const CURATOR = `G${'Q'.repeat(55)}`;

export interface FakeOptions {
  /** Indicator records by hash; missing hashes read as null. */
  indicators?: Record<string, { status: string; campaign: string; kind?: string; approvals?: string[] }>;
  /** Hashes `is_known_bad` answers true for. */
  knownBad?: string[];
  attestation?: { commit: string; verdict: string; report: string } | null;
  curator?: boolean;
  wallet?: { installed: boolean; passphrase?: string };
}

export async function installFakes(page: Page, options: FakeOptions = {}): Promise<void> {
  await page.addInitScript(
    (o: FakeOptions & { curatorAddress: string; testnet: string }) => {
      const log: unknown[] = [];
      (window as unknown as { __E2E_LOG__: unknown[] }).__E2E_LOG__ = log;
      const chain = {
        async indicator(_net: unknown, hash: string) {
          const i = o.indicators?.[hash];
          return i
            ? {
                hash,
                kind: i.kind ?? 'task',
                campaign: i.campaign,
                status: i.status,
                approvals: i.approvals ?? [`G${'A'.repeat(55)}`, `G${'B'.repeat(55)}`],
                evidence: 'e'.repeat(64),
                retractedBy: null,
                retractReason: null,
                proposedAt: 1_790_000_000,
              }
            : null;
        },
        async isKnownBad(_net: unknown, hash: string) {
          return (o.knownBad ?? []).includes(hash);
        },
        async latestAttestation() {
          return o.attestation ? { ...o.attestation, attester: `G${'C'.repeat(55)}`, at: 1, retractedBy: null } : null;
        },
        async isCurator() {
          return o.curator ?? true;
        },
        async prepare(_net: unknown, action: unknown, source: string) {
          log.push({ prepared: action });
          return {
            action,
            network: 'testnet',
            source,
            feeStroops: '154321',
            async submit(sign: (xdr: string, opts: unknown) => Promise<unknown>) {
              const signed = await sign('UNSIGNED_E2E_XDR', { networkPassphrase: o.testnet, address: source });
              log.push({ signed });
              return { txHash: '9'.repeat(64) };
            },
          };
        },
      };
      const state = { address: o.curatorAddress, networkPassphrase: o.wallet?.passphrase ?? o.testnet };
      let connected = false;
      const wallet = {
        name: 'Freighter',
        async isAvailable() {
          return o.wallet?.installed ?? true;
        },
        async connect() {
          connected = true;
          return state;
        },
        async current() {
          return connected ? state : null;
        },
        async signTransaction(xdr: string, opts: unknown) {
          log.push({ signRequest: { xdr, opts } });
          return { signedTxXdr: `SIGNED(${xdr})`, signerAddress: o.curatorAddress };
        },
      };
      (window as unknown as { __DOME_E2E__: unknown }).__DOME_E2E__ = {
        chain: () => Promise.resolve(chain),
        wallet: () => Promise.resolve(wallet),
      };
    },
    { ...options, curatorAddress: CURATOR, testnet: TESTNET },
  );
}
