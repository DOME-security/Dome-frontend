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
          Checking {subject} against the {network} ledger…
        </p>
      );
    case 'match':
      return (
        <p role="status" className={`${styles.note} ${styles.match}`}>
          <span aria-hidden="true">✓</span> Verified: {subject} matches the {network} ledger.
        </p>
      );
    case 'mismatch':
      return (
        <div role="alert" className={`${styles.note} ${styles.mismatch}`}>
          <p>
            <strong>
              <span aria-hidden="true">✗</span> The {network} ledger disagrees with the Dome API.
            </strong>{' '}
            Trust the ledger, and treat this page with suspicion until it is fixed.
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
          Could not reach Stellar to verify {subject}. What you see comes from the Dome API only.
        </p>
      );
    case 'not-configured':
      return (
        <p role="status" className={styles.note}>
          Ledger verification is not configured for this build.
        </p>
      );
  }
}
