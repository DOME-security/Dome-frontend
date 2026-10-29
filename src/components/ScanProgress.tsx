import type { ScanStatus } from '../lib/types';
import styles from './ScanProgress.module.css';

const STEPS: { status: ScanStatus; label: string }[] = [
  { status: 'queued', label: 'Queued' },
  { status: 'running', label: 'Scanning (Dome reads files; it never runs them)' },
  { status: 'done', label: 'Report ready' },
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
        {status === 'queued' ? 'Scan queued.' : status === 'running' ? 'Scan running.' : ''}
      </p>
    </div>
  );
}
