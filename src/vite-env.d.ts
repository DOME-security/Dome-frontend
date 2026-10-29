/// <reference types="vite/client" />

type DomeServices = import('./lib/services').Services; // eslint-disable-line @typescript-eslint/consistent-type-imports -- ambient file cannot use import statements

interface ImportMetaEnv {
  readonly VITE_DOME_API_URL?: string;
  readonly VITE_STELLAR_NETWORK?: string;
  readonly VITE_REGISTRY_CONTRACT_ID?: string;
  readonly VITE_STELLAR_RPC_URL?: string;
  readonly VITE_MAINNET_REGISTRY_CONTRACT_ID?: string;
  readonly VITE_MAINNET_STELLAR_RPC_URL?: string;
  /** Only for end-to-end builds: take chain and wallet fakes from window.__DOME_E2E__. */
  readonly VITE_E2E_FAKES?: string;
}

interface Window {
  __DOME_E2E__?: DomeServices;
}
