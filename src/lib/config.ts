export type StellarNetwork = 'testnet' | 'mainnet';

export interface AppConfig {
  /** Base URL of dome-backend, without a trailing slash. Empty means same origin (the dev proxy). */
  apiUrl: string;
  network: StellarNetwork;
  registryContractId: string;
}

export function readConfig(env: Record<string, string | undefined>): AppConfig {
  const network = env.VITE_STELLAR_NETWORK === 'mainnet' ? 'mainnet' : 'testnet';
  return {
    apiUrl: (env.VITE_DOME_API_URL ?? '').replace(/\/+$/, ''),
    network,
    registryContractId: env.VITE_REGISTRY_CONTRACT_ID ?? '',
  };
}

export const config: AppConfig = readConfig(import.meta.env);
