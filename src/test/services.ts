import { afterEach, vi } from 'vitest';
import type { Services } from '../lib/services';
import type { RegistryChain, Wallet } from '../lib/stellar/types';

const offline = () => Promise.reject(new Error('No Stellar RPC in unit tests'));

/** A chain that is unreachable unless a test overrides a method. */
export function fakeChain(overrides: Partial<RegistryChain> = {}): RegistryChain {
  return {
    indicator: vi.fn(offline),
    isKnownBad: vi.fn(offline),
    latestAttestation: vi.fn(offline),
    isCurator: vi.fn(offline),
    prepare: vi.fn(offline),
    ...overrides,
  };
}

/** A wallet that is not installed unless a test overrides a method. */
export function fakeWallet(overrides: Partial<Wallet> = {}): Wallet {
  return {
    name: 'Test wallet',
    isAvailable: vi.fn(() => Promise.resolve(false)),
    connect: vi.fn(offline),
    current: vi.fn(() => Promise.resolve(null)),
    signTransaction: vi.fn(offline),
    ...overrides,
  };
}

let current: { chain: RegistryChain; wallet: Wallet } = { chain: fakeChain(), wallet: fakeWallet() };

/** Use these fakes for the next renderRoute call in this test. */
export function useFakes(fakes: { chain?: RegistryChain; wallet?: Wallet }): void {
  current = { ...current, ...fakes };
}

export function testServices(): Services {
  const { chain, wallet } = current;
  return { chain: () => Promise.resolve(chain), wallet: () => Promise.resolve(wallet) };
}

afterEach(() => {
  current = { chain: fakeChain(), wallet: fakeWallet() };
});
