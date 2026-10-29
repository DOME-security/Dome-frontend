import { describe, expect, it } from 'vitest';
import { nextPollDelay, POLL_GIVE_UP_MS, POLL_MAX_MS } from './polling';

describe('nextPollDelay', () => {
  it('backs off exponentially up to a cap', () => {
    expect([0, 1, 2, 3, 4, 5, 10].map((n) => nextPollDelay('running', n, 0))).toEqual([
      1000,
      2000,
      4000,
      8000,
      POLL_MAX_MS,
      POLL_MAX_MS,
      POLL_MAX_MS,
    ]);
  });

  it('stops on terminal states', () => {
    expect(nextPollDelay('done', 0, 0)).toBe(false);
    expect(nextPollDelay('failed', 3, 0)).toBe(false);
  });

  it('gives up after the time limit', () => {
    expect(nextPollDelay('queued', 2, POLL_GIVE_UP_MS - 1)).toBe(4000);
    expect(nextPollDelay('queued', 2, POLL_GIVE_UP_MS)).toBe(false);
  });
});
