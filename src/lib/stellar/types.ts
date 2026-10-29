import type { NetworkConfig, StellarNetwork } from '../config';
import type { ChainAttestation, ChainIndicator } from './spotcheck';

/** One curator action; each becomes exactly one transaction. Byte fields are lowercase hex. */
export type CuratorAction =
  | { type: 'propose'; hash: string; kind: string; campaign: string; evidence: string }
  | { type: 'approve'; hash: string }
  | { type: 'retract'; hash: string; reason: string };

export type SignTransaction = (
  xdr: string,
  opts?: { networkPassphrase?: string; address?: string },
) => Promise<{ signedTxXdr: string; signerAddress?: string }>;

/** A simulated transaction waiting for the curator's approval. */
export interface PreparedTransaction {
  action: CuratorAction;
  network: StellarNetwork;
  source: string;
  /** Total fee in stroops (1 XLM = 10,000,000 stroops), including the resource fee from simulation. */
  feeStroops: string;
  submit(sign: SignTransaction): Promise<{ txHash: string }>;
}

/** Everything the app reads from or writes to the Dome Registry contract. */
export interface RegistryChain {
  indicator(net: NetworkConfig, hash: string): Promise<ChainIndicator | null>;
  isKnownBad(net: NetworkConfig, hash: string): Promise<boolean>;
  latestAttestation(net: NetworkConfig, owner: string, repo: string): Promise<ChainAttestation | null>;
  isCurator(net: NetworkConfig, account: string): Promise<boolean>;
  prepare(net: NetworkConfig, action: CuratorAction, source: string): Promise<PreparedTransaction>;
}

export interface WalletState {
  address: string;
  /** Network passphrase the wallet is currently set to. */
  networkPassphrase: string;
}

/** A browser wallet. The app never sees or stores secret keys; the wallet signs. */
export interface Wallet {
  name: string;
  isAvailable(): Promise<boolean>;
  connect(): Promise<WalletState>;
  /** Current state without prompting, or null if the site is not yet allowed. */
  current(): Promise<WalletState | null>;
  signTransaction: SignTransaction;
}
