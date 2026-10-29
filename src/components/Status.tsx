import type { ReactNode } from 'react';
import { ApiError } from '../lib/api';
import styles from './Status.module.css';

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <p role="status" className={styles.loading}>
      <span className={styles.spinner} aria-hidden="true" />
      {label}
    </p>
  );
}

/** Shows an error in app-written words. Messages from ApiError are already fixed text. */
export function ErrorMessage({ error, children }: { error: unknown; children?: ReactNode }) {
  const message =
    error instanceof ApiError || error instanceof RangeError ? error.message : 'Something went wrong. Try again in a moment.';
  return (
    <div role="alert" className={styles.error}>
      <p>{message}</p>
      {children}
    </div>
  );
}
