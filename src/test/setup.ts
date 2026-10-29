import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom replaces AbortController but not Node's Request, and Node's Request
// rejects jsdom's AbortSignal. React Router builds a Request on every
// navigation, so drop the foreign signal in tests.
const NodeRequest = globalThis.Request;
globalThis.Request = class extends NodeRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(input, init && { ...init, signal: undefined });
  }
} as typeof Request;

// jsdom does not implement scrolling; ScrollRestoration calls it on navigation.
window.scrollTo = () => {};

afterEach(() => {
  cleanup();
});
