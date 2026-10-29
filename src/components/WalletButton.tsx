import type { StellarNetwork } from '../lib/config';
import { NETWORK_LABEL, shortKey } from '../lib/registry';
import { networkForPassphrase } from '../lib/stellar/networks';
import type { WalletState } from '../lib/stellar/types';
import ui from '../styles/ui.module.css';
import styles from './WalletButton.module.css';

interface Props {
  walletName: string;
  available: boolean | undefined;
  state: WalletState | null;
  connecting: boolean;
  expected: StellarNetwork;
  onConnect: () => void;
}

/** Connect button that, once connected, always shows the address and the wallet's network. */
export function WalletButton({ walletName, available, state, connecting, expected, onConnect }: Props) {
  if (available === false) {
    return (
      <div className={ui.warning}>
        <p>
          <strong>{walletName} is not installed in this browser.</strong> Install it from{' '}
          <a href="https://www.freighter.app" target="_blank" rel="noreferrer">
            freighter.app
          </a>
          , create a testnet account, then reload this page. Use a browser profile with no wallet holding real funds.
        </p>
      </div>
    );
  }
  if (!state) {
    return (
      <button type="button" className={ui.button} onClick={onConnect} disabled={connecting || available === undefined}>
        {connecting ? 'Waiting for the wallet…' : `Connect ${walletName}`}
      </button>
    );
  }
  const walletNetwork = networkForPassphrase(state.networkPassphrase);
  return (
    <div className={styles.connected}>
      <dl className={ui.dl}>
        <dt>Account</dt>
        <dd className={ui.mono} title={state.address}>
          {shortKey(state.address, 6)}
        </dd>
        <dt>Wallet network</dt>
        <dd>{walletNetwork ? NETWORK_LABEL[walletNetwork] : 'A network Dome does not use'}</dd>
      </dl>
      {walletNetwork !== expected && (
        <p role="alert" className={ui.warning}>
          Your wallet is set to {walletNetwork ? NETWORK_LABEL[walletNetwork] : 'another network'}, but this console is on{' '}
          {NETWORK_LABEL[expected]}. Switch the network in {walletName} before signing.
        </p>
      )}
    </div>
  );
}
