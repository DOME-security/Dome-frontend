import { expect, test } from '@playwright/test';

test('production build ships a strict Content Security Policy', async ({ page }) => {
  await page.goto('/');
  const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
  expect(csp).toContain("script-src 'self'");
  expect(csp).toContain("connect-src 'self'");
  expect(csp).not.toContain('unsafe-inline');
});

test('skip link moves focus to the main content', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);
});

test('guides render and deep links work', async ({ page }) => {
  await page.goto('/guides/infected');
  await expect(page.getByRole('heading', { level: 1, name: 'I think I was infected' })).toBeVisible();
  const box = page.getByRole('checkbox', { name: /turn off wi-fi/i });
  await box.check();
  await expect(box).toBeChecked();
});

test('the page never scrolls sideways at phone width', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  for (const path of ['/', '/check/repo', '/check/file', '/guides/hardening']) {
    await page.goto(path);
    await expect(page.locator('h1')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});

test('theme choice persists across reloads', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Colour theme').selectOption('dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
