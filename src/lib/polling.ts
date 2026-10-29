import type { ScanStatus } from './types';

export const POLL_BASE_MS = 1000;
export const POLL_MAX_MS = 15_000;
/** After this long the page stops polling on its own and offers a manual check. */
export const POLL_GIVE_UP_MS = 10 * 60 * 1000;

export function isTerminal(status: ScanStatus | undefined): boolean {
  return status === 'done' || status === 'failed';
}

/**
 * Delay before the next status check: 1 s, 2 s, 4 s, 8 s, then every 15 s.
 * Returns false once the scan is finished or the page has waited long enough.
 */
export function nextPollDelay(status: ScanStatus | undefined, attempt: number, elapsedMs: number): number | false {
  if (isTerminal(status) || elapsedMs >= POLL_GIVE_UP_MS) return false;
  return Math.min(POLL_BASE_MS * 2 ** Math.max(0, attempt), POLL_MAX_MS);
}
