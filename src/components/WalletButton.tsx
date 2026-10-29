import type { StellarNetwork } from '../lib/config';
import { m } from '../i18n';
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
          <strong>{m.curate.walletNotInstalled(walletName)}</strong> {m.curate.walletInstallBefore}{' '}
          <a href="https://www.freighter.app" target="_blank" rel="noreferrer">
            {m.curate.walletSite}
          </a>
          {m.curate.walletInstallAfter}
        </p>
      </div>
    );
  }
  if (!state) {
    return (
      <button type="button" className={ui.button} onClick={onConnect} disabled={connecting || available === undefined}>
        {connecting ? m.curate.waitingForWallet : m.curate.connect(walletName)}
      </button>
    );
  }
  const walletNetwork = networkForPassphrase(state.networkPassphrase);
  return (
    <div className={styles.connected}>
      <dl className={ui.dl}>
        <dt>{m.curate.account}</dt>
        <dd className={ui.mono} title={state.address}>
          {shortKey(state.address, 6)}
        </dd>
        <dt>{m.curate.walletNetwork}</dt>
        <dd>{walletNetwork ? NETWORK_LABEL[walletNetwork] : m.curate.unknownNetwork}</dd>
      </dl>
      {walletNetwork !== expected && (
        <p role="alert" className={ui.warning}>
          {m.curate.networkMismatch(
            walletNetwork ? NETWORK_LABEL[walletNetwork] : m.curate.anotherNetwork,
            NETWORK_LABEL[expected],
            walletName,
          )}
        </p>
      )}
    </div>
  );
}
