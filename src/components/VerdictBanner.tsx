import { VERDICT_TEXT } from '../lib/rules';
import type { Verdict } from '../lib/types';
import styles from './VerdictBanner.module.css';

const ICON = { block: '🔴', review: '🟠', info: '⚪', clean: '🟢' } as const;

export function VerdictBanner({ verdict, headingLevel = 2 }: { verdict: Verdict; headingLevel?: 2 | 3 }) {
  const text = VERDICT_TEXT[verdict];
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <section className={`${styles.banner} ${styles[text.tone]}`} aria-label="Verdict">
      <Heading className={styles.title}>
        <span aria-hidden="true">{ICON[text.tone]}</span> {text.label}
      </Heading>
      <p>{text.summary}</p>
    </section>
  );
}
