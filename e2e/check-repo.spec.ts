import { expect, test, type Page } from '@playwright/test';
import { failOnConsoleErrors } from './helpers';
import { mockApi, type ScanOutcome } from './mock-api';

failOnConsoleErrors();

async function checkRepo(page: Page, outcome: ScanOutcome) {
  await mockApi(page, { scanOutcome: outcome });
  await page.goto('/');
  await page.getByRole('link', { name: 'Check a GitHub repo' }).click();
  await expect(page).toHaveURL('/check/repo');
  await page.getByLabel('GitHub repository').fill('https://github.com/dome-security/demo-repo');
  await page.getByRole('button', { name: 'Check', exact: true }).click();
  await expect(page).toHaveURL(/\?scan=scan-e2e$/);
}

const notice = (page: Page) => page.locator('main').getByText('No known pattern found is not the same as safe.');

test('block: findings sorted by severity, hostile paths shown as text', async ({ page }) => {
  await checkRepo(page, 'block');
  await expect(page.getByRole('heading', { name: /Blocked/ })).toBeVisible({ timeout: 10_000 });
  const rows = page.getByRole('row');
  await expect(rows.nth(1)).toContainText('Task downloads and runs code');
  await expect(rows.nth(1)).toContainText('Block');
  await expect(rows.nth(2)).toContainText('Task runs on folder open');
  await expect(page.getByText('.vscode/<b>tasks</b>.json:7')).toBeVisible();
  await expect(page.getByText('engine text the app must not show')).toHaveCount(0);
  await expect(notice(page)).toBeVisible();
});

test('review: shows the rule reason and asks for a read first', async ({ page }) => {
  await checkRepo(page, 'review');
  await expect(page.getByRole('heading', { name: /Needs review/ })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('row').nth(1)).toContainText('Install script added or changed');
  await expect(notice(page)).toBeVisible();
});

test('clean: no findings, and still not called safe', async ({ page }) => {
  await checkRepo(page, 'clean');
  await expect(page.getByRole('heading', { name: /No known pattern found/ })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('No findings.')).toBeVisible();
  await expect(notice(page)).toBeVisible();
});

test('could not check: a failed scan is not a clean result', async ({ page }) => {
  await checkRepo(page, 'failed');
  await expect(page.getByRole('alert')).toContainText('This is not a clean result', { timeout: 10_000 });
  await expect(page.getByRole('heading', { name: /No known pattern found/ })).toHaveCount(0);
});
