import { createHash } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { FIXTURE_TASKS, mockApi } from './mock-api';

test.beforeEach(({ page }) => {
  // CSP violations and runtime errors show up as console errors.
  page.on('console', (message) => {
    if (message.type() === 'error') throw new Error(`Console error: ${message.text()}`);
  });
  page.on('pageerror', (error) => {
    throw error;
  });
});

test('check a repo from the home page and read the report', async ({ page }) => {
  await mockApi(page);
  await page.goto('/');
  await page.getByRole('link', { name: 'Check a GitHub repo' }).click();
  await expect(page).toHaveURL('/check/repo');

  await page.getByLabel('GitHub repository').fill('https://github.com/dome-security/demo-repo');
  await page.getByRole('button', { name: 'Check' }).click();

  await expect(page).toHaveURL(/\?scan=scan-e2e$/);
  await expect(page.getByRole('heading', { name: /blocked/i })).toBeVisible({ timeout: 10_000 });
  const rows = page.getByRole('row');
  await expect(rows.nth(1)).toContainText('Task downloads and runs code');
  await expect(rows.nth(2)).toContainText('Task runs on folder open');
  // A hostile file name is shown as text, not markup.
  await expect(page.getByText('.vscode/<b>tasks</b>.json:7')).toBeVisible();
  await expect(page.locator('main').getByText('No known pattern found is not the same as safe.')).toBeVisible();
});

test('check a file without uploading it', async ({ page }) => {
  const knownHash = createHash('sha256').update(FIXTURE_TASKS).digest('hex');
  const requests = await mockApi(page, { knownHash });
  await page.goto('/check/file');
  await page
    .getByLabel(/choose a file/i)
    .setInputFiles({ name: 'tasks.json', mimeType: 'application/json', buffer: Buffer.from(FIXTURE_TASKS) });

  await expect(page.getByRole('heading', { name: /blocked/i })).toBeVisible();
  await expect(page.getByText(knownHash)).toBeVisible();
  expect(requests.map((r) => `${r.method()} ${new URL(r.url()).pathname}`)).toEqual([`GET /v1/indicators/${knownHash}`]);
  expect(requests.every((r) => r.postData() === null)).toBe(true);
});

test('browse the registry to an indicator', async ({ page }) => {
  await mockApi(page);
  await page.goto('/registry');
  await page.getByTitle('a'.repeat(64)).click();
  await expect(page).toHaveURL(`/registry/indicator/${'a'.repeat(64)}`);
  await expect(page.getByText('Active', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'example.org' })).toHaveAttribute('href', 'https://example.org/advisory');
});
