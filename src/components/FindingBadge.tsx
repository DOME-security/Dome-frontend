import { SEVERITY_TEXT } from '../lib/rules';
import type { Severity } from '../lib/types';
import styles from './FindingBadge.module.css';

/** Severity shown as icon plus text, never colour alone. */
export function FindingBadge({ severity }: { severity: Severity }) {
  const text = SEVERITY_TEXT[severity];
  return (
    <span className={`${styles.badge} ${styles[severity]}`}>
      <span aria-hidden="true">{text.icon}</span> {text.label}
    </span>
  );
}
