import { createContext, useContext, type ReactNode } from 'react';
import type { RegistryChain, Wallet } from './stellar/types';

/**
 * Chain and wallet access, loaded on demand so the Stellar SDK and wallet code
 * stay out of the main bundle. Tests (and the end-to-end build) provide fakes.
 */
export interface Services {
  chain: () => Promise<RegistryChain>;
  wallet: () => Promise<Wallet>;
}

export const defaultServices: Services = {
  chain: () => import('./stellar/registry-client').then((m) => m.sorobanRegistry),
  wallet: () => import('./stellar/freighter').then((m) => m.freighter),
};

const ServicesContext = createContext<Services>(defaultServices);

export function ServicesProvider({ services, children }: { services: Services; children: ReactNode }) {
  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>;
}

export function useServices(): Services {
  return useContext(ServicesContext);
}
