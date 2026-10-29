import { expect, test } from '@playwright/test';

test('production build ships a strict Content Security Policy', async ({ page }) => {
  await page.goto('/');
  const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
  expect(csp).toContain("script-src 'self'");
  expect(csp).toContain("connect-src 'self' https://soroban-testnet.stellar.org");
  expect(csp).toContain("object-src 'none'");
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

test('theme choice persists across reloads', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Colour theme').selectOption('dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('keyboard alone reaches every main navigation link with a visible focus ring', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Keyboard navigation is checked on desktop');
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
  const reached: string[] = [];
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    const outline = await focused.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).not.toBe('none');
    reached.push((await focused.textContent())?.trim() ?? '');
  }
  for (const name of ['Check a repo', 'Check a file', 'Registry', 'Infected?', 'Maintainers']) expect(reached).toContain(name);
});
