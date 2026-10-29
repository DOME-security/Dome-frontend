export type StellarNetwork = 'testnet' | 'mainnet';

export interface NetworkConfig {
  network: StellarNetwork;
  /** Soroban RPC endpoint used for read-only simulation and transaction submission. */
  rpcUrl: string;
  /** Dome Registry contract id on this network. */
  contractId: string;
}

export interface AppConfig {
  /** Base URL of dome-backend, without a trailing slash. Empty means same origin (the dev proxy). */
  apiUrl: string;
  /** The network the app reads from and curators sign for by default. */
  network: StellarNetwork;
  registryContractId: string;
  /** Configured networks. Mainnet is present only when its contract and RPC are set explicitly. */
  networks: Partial<Record<StellarNetwork, NetworkConfig>>;
}

export const DEFAULT_TESTNET_RPC = 'https://soroban-testnet.stellar.org';

export function readConfig(env: Record<string, string | boolean | undefined>): AppConfig {
  const str = (key: string) => (typeof env[key] === 'string' ? (env[key] as string).trim() : '');
  const network: StellarNetwork = str('VITE_STELLAR_NETWORK') === 'mainnet' ? 'mainnet' : 'testnet';
  const networks: AppConfig['networks'] = {};

  const primaryRpc = str('VITE_STELLAR_RPC_URL') || (network === 'testnet' ? DEFAULT_TESTNET_RPC : '');
  const primaryContract = str('VITE_REGISTRY_CONTRACT_ID');
  if (primaryRpc && primaryContract) networks[network] = { network, rpcUrl: primaryRpc, contractId: primaryContract };

  // A testnet build can offer mainnet behind an explicit switch, only when both values are configured.
  const mainnetRpc = str('VITE_MAINNET_STELLAR_RPC_URL');
  const mainnetContract = str('VITE_MAINNET_REGISTRY_CONTRACT_ID');
  if (network === 'testnet' && mainnetRpc && mainnetContract) {
    networks.mainnet = { network: 'mainnet', rpcUrl: mainnetRpc, contractId: mainnetContract };
  }

  return {
    apiUrl: str('VITE_DOME_API_URL').replace(/\/+$/, ''),
    network,
    registryContractId: primaryContract,
    networks,
  };
}

export const config: AppConfig = readConfig(import.meta.env ?? {});

/** RPC endpoints the build talks to, for the Content Security Policy. */
export function rpcUrls(c: AppConfig): string[] {
  return Object.values(c.networks).map((n) => n.rpcUrl);
}
