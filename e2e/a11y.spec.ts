import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { installFakes } from './fakes';
import { ACTIVE_HASH, mockApi, REPO } from './mock-api';

// Every page, in both themes, with zero serious or critical axe violations
// and no sideways scrolling at 320 px.
const PAGES: [string, string | RegExp][] = [
  ['/', 'Check a repo before you open it.'],
  ['/check/repo', 'Check a repo'],
  ['/check/repo?scan=scan-e2e', 'Check a repo'],
  ['/check/file', 'Check a file'],
  ['/registry', 'Dome Registry'],
  [`/registry/indicator/${ACTIVE_HASH}`, 'Indicator'],
  [`/repos/${REPO.owner}/${REPO.repo}`, `${REPO.owner}/${REPO.repo}`],
  ['/dashboard', 'Maintainer dashboard'],
  ['/curate', 'Curator console'],
  ['/guides/infected', 'I think I was infected'],
  ['/guides/hardening', 'Harden your editor and repository'],
  ['/guides/wave', 'A safe review routine for Stellar Wave'],
  ['/no-such-page', 'Page not found'],
];

for (const theme of ['light', 'dark'] as const) {
  for (const [path, heading] of PAGES) {
    test(`${path} (${theme}) has no serious accessibility violations`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('dome-theme', t), theme);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await installFakes(page, {
        knownBad: [ACTIVE_HASH, 'b'.repeat(64)],
        indicators: { [ACTIVE_HASH]: { status: 'active', campaign: 'demo' } },
      });
      await mockApi(page, { scanOutcome: 'block' });
      await page.goto(path);
      await expect(page.locator('h1')).toContainText(heading);
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
    });
  }
}

test('no page scrolls sideways at 320 px', async ({ page }) => {
  await installFakes(page);
  await mockApi(page);
  await page.setViewportSize({ width: 320, height: 700 });
  for (const [path, heading] of PAGES) {
    await page.goto(path);
    await expect(page.locator('h1')).toContainText(heading);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});
