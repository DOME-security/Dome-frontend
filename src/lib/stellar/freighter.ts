import { getAddress, getNetworkDetails, isAllowed, isConnected, requestAccess, signTransaction } from '@stellar/freighter-api';
import type { Wallet, WalletState } from './types';

function check<T extends { error?: unknown }>(response: T): T {
  if (response.error) throw new Error('Freighter refused the request.');
  return response;
}

async function state(address: string): Promise<WalletState> {
  const details = check(await getNetworkDetails());
  return { address, networkPassphrase: details.networkPassphrase };
}

/** Freighter, through its official API. Only public keys and signed XDR ever reach the app. */
export const freighter: Wallet = {
  name: 'Freighter',
  async isAvailable() {
    try {
      return (await isConnected()).isConnected;
    } catch {
      return false;
    }
  },
  async connect() {
    const { address } = check(await requestAccess());
    return state(address);
  },
  async current() {
    if (!(await isAllowed()).isAllowed) return null;
    const { address } = await getAddress();
    return address ? state(address) : null;
  },
  async signTransaction(xdr, opts) {
    const { signedTxXdr, signerAddress } = check(await signTransaction(xdr, opts));
    return { signedTxXdr, signerAddress };
  },
};
