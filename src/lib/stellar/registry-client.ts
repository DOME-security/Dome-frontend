import { Networks } from '@stellar/stellar-sdk';
import { Client, type Attestation, type Indicator } from '../../vendor/registry-bindings';
import type { NetworkConfig, StellarNetwork } from '../config';
import { sha256Hex } from '../hash';
import { bytesToHex, hexToBytes } from './bytes';
import type { ChainAttestation, ChainIndicator } from './spotcheck';
import type { CuratorAction, PreparedTransaction, RegistryChain, SignTransaction } from './types';

// Reads and curator transactions through the generated contract bindings
// (src/vendor/registry-bindings). This module pulls in the Stellar SDK, so it is
// only ever loaded with a dynamic import.

export const PASSPHRASE: Record<StellarNetwork, string> = {
  testnet: Networks.TESTNET,
  mainnet: Networks.PUBLIC,
};

function client(net: NetworkConfig, publicKey?: string): Client {
  return new Client({
    contractId: net.contractId,
    networkPassphrase: PASSPHRASE[net.network],
    rpcUrl: net.rpcUrl,
    publicKey,
  });
}

function toChainIndicator(i: Indicator): ChainIndicator {
  return {
    hash: bytesToHex(i.hash),
    kind: i.kind,
    campaign: i.campaign,
    status: i.status,
    approvals: i.approvals,
    evidence: bytesToHex(i.evidence),
    retractedBy: i.retracted_by ?? null,
    retractReason: i.retract_reason ? bytesToHex(i.retract_reason) : null,
    proposedAt: Number(i.proposed_at),
  };
}

function toChainAttestation(a: Attestation): ChainAttestation {
  return {
    commit: bytesToHex(a.commit),
    verdict: a.verdict,
    report: bytesToHex(a.report),
    attester: a.attester,
    at: Number(a.at),
    retractedBy: a.retracted_by ?? null,
  };
}

/** Repository id convention shared with dome-backend: SHA-256 of `github.com/<owner>/<repo>`, lowercased. */
export async function repoId(owner: string, repo: string): Promise<Uint8Array> {
  return hexToBytes(await sha256Hex(`github.com/${owner}/${repo}`.toLowerCase()));
}

/** The contract error code inside a simulation or submission failure, if any. */
export function contractErrorCode(error: unknown): number | null {
  const match = /Error\(Contract, #(\d+)\)/.exec(error instanceof Error ? error.message : String(error));
  return match ? Number(match[1]) : null;
}

async function build(net: NetworkConfig, action: CuratorAction, source: string) {
  const c = client(net, source);
  switch (action.type) {
    case 'propose':
      return c.propose({
        curator: source,
        i: { hash: hexToBytes(action.hash), kind: action.kind, campaign: action.campaign, evidence: hexToBytes(action.evidence) },
      });
    case 'approve':
      return c.approve({ curator: source, hash: hexToBytes(action.hash) });
    case 'retract':
      return c.retract({ curator: source, hash: hexToBytes(action.hash), reason: hexToBytes(action.reason) });
  }
}

export const sorobanRegistry: RegistryChain = {
  async indicator(net, hash) {
    const tx = await client(net).indicator({ hash: hexToBytes(hash) });
    return tx.result ? toChainIndicator(tx.result) : null;
  },

  async isKnownBad(net, hash) {
    return (await client(net).is_known_bad({ hash: hexToBytes(hash) })).result;
  },

  async latestAttestation(net, owner, repo) {
    const tx = await client(net).latest({ repo: await repoId(owner, repo) });
    return tx.result ? toChainAttestation(tx.result) : null;
  },

  async isCurator(net, account) {
    return (await client(net).is_curator({ account })).result;
  },

  async prepare(net, action, source): Promise<PreparedTransaction> {
    // One call builds and simulates exactly one contract invocation.
    const tx = await build(net, action, source);
    const result = tx.result;
    if (result.isErr()) throw new Error(`Error(Contract, #${(result.unwrapErr() as { code?: number }).code ?? 0})`);
    return {
      action,
      network: net.network,
      source,
      feeStroops: tx.built?.fee ?? '0',
      async submit(sign: SignTransaction) {
        const sent = await tx.signAndSend({ signTransaction: sign });
        return { txHash: sent.sendTransactionResponse?.hash ?? '' };
      },
    };
  },
};
