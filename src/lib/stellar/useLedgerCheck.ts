import { useQuery } from '@tanstack/react-query';
import { config, type NetworkConfig } from '../config';
import { useServices } from '../services';
import type { RegistryChain } from './types';
import type { SpotCheck } from './spotcheck';

export type LedgerCheck = SpotCheck | { state: 'checking' };

/**
 * Runs `read` against the Stellar ledger and turns the answer into a SpotCheck.
 * Waits until `enabled` (usually: the backend data has arrived).
 */
export function useLedgerCheck<T>(
  key: unknown[],
  read: (chain: RegistryChain, net: NetworkConfig) => Promise<T>,
  compare: (chainValue: T) => SpotCheck,
  enabled: boolean,
): { check: LedgerCheck; value: T | undefined } {
  const { chain } = useServices();
  const net = config.networks[config.network];
  const query = useQuery({
    queryKey: ['ledger', config.network, ...key],
    queryFn: async () => read(await chain(), net!),
    enabled: enabled && Boolean(net),
    staleTime: 60_000,
    retry: 1,
  });
  if (!net) return { check: { state: 'not-configured' }, value: undefined };
  if (query.isError) return { check: { state: 'unavailable' }, value: undefined };
  if (!query.isSuccess) return { check: { state: 'checking' }, value: undefined };
  return { check: compare(query.data), value: query.data };
}
