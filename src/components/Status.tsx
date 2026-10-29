import type { ReactNode } from 'react';
import { m } from '../i18n';
import { ApiError } from '../lib/api';
import styles from './Status.module.css';

export function Loading({ label = m.app.loading }: { label?: string }) {
  return (
    <p role="status" className={styles.loading}>
      <span className={styles.spinner} aria-hidden="true" />
      {label}
    </p>
  );
}

/** Shows an error in app-written words. Messages from ApiError and RangeError are already app text. */
export function ErrorMessage({ error, children }: { error: unknown; children?: ReactNode }) {
  const message = error instanceof ApiError || error instanceof RangeError ? error.message : m.app.genericError;
  return (
    <div role="alert" className={styles.error}>
      <p>{message}</p>
      {children}
    </div>
  );
}
