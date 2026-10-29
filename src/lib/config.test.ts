import { describe, expect, it } from 'vitest';
import { DEFAULT_TESTNET_RPC, readConfig } from './config';

const CONTRACT = 'CCHLCPUBLL4ROEFP5PR3JY4LUB32TLNB2KDF3DQLG3R53IK5OUW7TZUY';

describe('readConfig', () => {
  it('defaults to testnet with the public testnet RPC', () => {
    const config = readConfig({ VITE_REGISTRY_CONTRACT_ID: CONTRACT, VITE_DOME_API_URL: 'https://api.example/' });
    expect(config.network).toBe('testnet');
    expect(config.apiUrl).toBe('https://api.example');
    expect(config.networks).toEqual({ testnet: { network: 'testnet', rpcUrl: DEFAULT_TESTNET_RPC, contractId: CONTRACT } });
  });

  it('leaves the registry unconfigured without a contract id', () => {
    expect(readConfig({}).networks).toEqual({});
  });

  it('offers mainnet only when both its contract and RPC are set', () => {
    expect(
      readConfig({ VITE_REGISTRY_CONTRACT_ID: CONTRACT, VITE_MAINNET_REGISTRY_CONTRACT_ID: CONTRACT }).networks.mainnet,
    ).toBeUndefined();
    const config = readConfig({
      VITE_REGISTRY_CONTRACT_ID: CONTRACT,
      VITE_MAINNET_REGISTRY_CONTRACT_ID: CONTRACT,
      VITE_MAINNET_STELLAR_RPC_URL: 'https://rpc.mainnet.example',
    });
    expect(config.networks.mainnet?.rpcUrl).toBe('https://rpc.mainnet.example');
  });

  it('needs an explicit RPC for a mainnet build', () => {
    expect(readConfig({ VITE_STELLAR_NETWORK: 'mainnet', VITE_REGISTRY_CONTRACT_ID: CONTRACT }).networks).toEqual({});
  });
});
