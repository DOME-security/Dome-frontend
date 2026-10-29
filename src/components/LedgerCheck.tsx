import { m } from '../i18n';
import { config } from '../lib/config';
import { NETWORK_LABEL } from '../lib/registry';
import type { LedgerCheck as Check } from '../lib/stellar/useLedgerCheck';
import styles from './LedgerCheck.module.css';

/** Says, in words and not only colour, whether the Dome API agrees with the Stellar ledger. */
export function LedgerCheck({ check, subject }: { check: Check; subject: string }) {
  const network = NETWORK_LABEL[config.network];
  switch (check.state) {
    case 'checking':
      return (
        <p role="status" className={styles.note}>
          {m.ledger.checking(subject, network)}
        </p>
      );
    case 'match':
      return (
        <p role="status" className={`${styles.note} ${styles.match}`}>
          <span aria-hidden="true">✓</span> {m.ledger.match(subject, network)}
        </p>
      );
    case 'mismatch':
      return (
        <div role="alert" className={`${styles.note} ${styles.mismatch}`}>
          <p>
            <strong>
              <span aria-hidden="true">✗</span> {m.ledger.mismatch(network)}
            </strong>{' '}
            {m.ledger.mismatchAdvice}
          </p>
          <ul>
            {check.differences.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
      );
    case 'unavailable':
      return (
        <p role="status" className={styles.note}>
          {m.ledger.unavailable(subject)}
        </p>
      );
    case 'not-configured':
      return (
        <p role="status" className={styles.note}>
          {m.ledger.notConfigured}
        </p>
      );
  }
}
