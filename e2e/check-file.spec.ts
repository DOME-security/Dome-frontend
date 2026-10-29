import { createHash } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { failOnConsoleErrors } from './helpers';
import { FIXTURE_TASKS, mockApi } from './mock-api';

failOnConsoleErrors();

const sha256 = (data: string | Buffer) => createHash('sha256').update(data).digest('hex');

test('known bad: hashed locally, only the hash is sent', async ({ page }) => {
  const knownHash = sha256(FIXTURE_TASKS);
  const requests = await mockApi(page, { knownHash });
  await page.goto('/check/file');
  await page
    .getByLabel(/Choose a file/)
    .setInputFiles({ name: 'tasks.json', mimeType: 'application/json', buffer: Buffer.from(FIXTURE_TASKS) });

  await expect(page.getByRole('heading', { name: /Blocked/ })).toBeVisible();
  await expect(page.getByText(knownHash)).toBeVisible();
  expect(requests.map((r) => `${r.method()} ${new URL(r.url()).pathname}`)).toEqual([`GET /v1/indicators/${knownHash}`]);
  expect(requests.every((r) => r.postData() === null)).toBe(true);
});

test('not found: says so without calling the file safe', async ({ page }) => {
  await mockApi(page);
  await page.goto('/check/file');
  await page
    .getByLabel(/Choose a file/)
    .setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('echo DOME_FIXTURE\n') });
  await expect(page.getByRole('heading', { name: 'Not on the known-bad list' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Result' })).toContainText('No known pattern found is not the same as safe.');
});

test('too large: refused before reading, nothing sent', async ({ page }) => {
  const requests = await mockApi(page);
  await page.goto('/check/file');
  await expect(page.getByText(/Up to 25 MB/)).toBeVisible();
  await page
    .getByLabel(/Choose a file/)
    .setInputFiles({ name: 'huge.bin', mimeType: 'application/octet-stream', buffer: Buffer.alloc(26 * 1024 * 1024) });
  await expect(page.getByRole('alert')).toContainText('This file is 26.0 MB. Dome can check files up to 25 MB in the browser.');
  expect(requests).toHaveLength(0);
});
