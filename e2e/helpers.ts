import { test } from '@playwright/test';

/** CSP violations and runtime errors surface as console errors; fail on any. */
export function failOnConsoleErrors(): void {
  test.beforeEach(({ page }) => {
    page.on('console', (message) => {
      if (message.type() === 'error') throw new Error(`Console error: ${message.text()}`);
    });
    page.on('pageerror', (error) => {
      throw error;
    });
  });
}
