import type { ScanStatus } from '../lib/types';
import { m } from '../i18n';
import styles from './ScanProgress.module.css';

const STEPS: { status: ScanStatus; label: string }[] = [
  { status: 'queued', label: m.scanProgress.queued },
  { status: 'running', label: m.scanProgress.running },
  { status: 'done', label: m.scanProgress.done },
];

const ORDER: Record<ScanStatus, number> = { queued: 0, running: 1, done: 2, failed: 2 };

export function ScanProgress({ status }: { status: ScanStatus }) {
  const current = ORDER[status];
  return (
    <div className={styles.progress}>
      <ol className={styles.steps}>
        {STEPS.map((step, i) => (
          <li
            key={step.status}
            className={i < current ? styles.done : i === current ? styles.current : undefined}
            aria-current={i === current ? 'step' : undefined}
          >
            {step.label}
          </li>
        ))}
      </ol>
      <p role="status" aria-live="polite" className="visually-hidden">
        {status === 'queued' ? m.scanProgress.queuedAnnouncement : status === 'running' ? m.scanProgress.runningAnnouncement : ''}
      </p>
    </div>
  );
}
