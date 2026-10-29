import { expect, test, type Page } from '@playwright/test';
import { CURATOR, installFakes } from './fakes';
import { ACTIVE_HASH, mockApi } from './mock-api';

// Regenerates docs/screenshots/ for the README: `pnpm screenshots`.
// Skipped in normal test runs.
test.skip(!process.env.SCREENSHOTS, 'Run with pnpm screenshots');

const SHOTS: { name: string; path: string; wait: RegExp | string; prepare?: (page: Page) => Promise<void> }[] = [
  { name: 'home', path: '/', wait: 'Check a repo before you open it.' },
  { name: 'check-repo-report', path: '/check/repo?scan=scan-e2e', wait: /Blocked/ },
  { name: 'check-file', path: '/check/file', wait: 'Check a file' },
  { name: 'indicator', path: `/registry/indicator/${ACTIVE_HASH}`, wait: /Verified/ },
  {
    name: 'curate-summary',
    path: '/curate',
    wait: 'Curator console',
    prepare: async (page) => {
      await page.getByRole('button', { name: 'Connect Freighter' }).click();
      await expect(page.getByTitle(CURATOR)).toBeVisible();
      await page.getByRole('radio', { name: 'Approve an indicator' }).check();
      await page.getByLabel('File fingerprint (SHA-256)').fill(ACTIVE_HASH);
      await page.getByRole('button', { name: 'Review transaction' }).click();
      await expect(page.getByRole('region', { name: 'Check before you sign' })).toBeVisible();
    },
  },
  { name: 'guide-infected', path: '/guides/infected', wait: 'I think I was infected' },
];

for (const shot of SHOTS) {
  test(shot.name, async ({ page }, testInfo) => {
    await installFakes(page, { knownBad: [ACTIVE_HASH], indicators: { [ACTIVE_HASH]: { status: 'active', campaign: 'demo' } } });
    await mockApi(page, { scanOutcome: 'block' });
    await page.goto(shot.path);
    if (shot.path.includes('scan=')) await page.reload(); // second poll returns the finished report
    await expect(page.getByText(shot.wait).first()).toBeVisible({ timeout: 10_000 });
    await shot.prepare?.(page);
    // Phone shots are one screen tall: start them at the result, not the form.
    if (testInfo.project.name === 'phone' && shot.name === 'check-repo-report') {
      await page
        .getByRole('heading', { name: 'dome-security/demo-repo' })
        .evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 16));
    }
    await page.screenshot({
      path: `docs/screenshots/${shot.name}-${testInfo.project.name}.png`,
      fullPage: testInfo.project.name === 'desktop',
    });
  });
}
