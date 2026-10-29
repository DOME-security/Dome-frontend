import { expect, test, type Page } from '@playwright/test';
import { CURATOR, installFakes, TESTNET } from './fakes';
import { failOnConsoleErrors } from './helpers';

failOnConsoleErrors();

const HASH = '5b5daf85854470843ec093937f0b47ee52c2260cff3c6e6f65c6c1ae521785dc';
const log = (page: Page) => page.evaluate(() => (window as unknown as { __E2E_LOG__: unknown[] }).__E2E_LOG__);

test('curator proposes an indicator: summary first, then one signature', async ({ page }) => {
  await installFakes(page);
  await page.goto('/curate');
  await expect(page.getByRole('radio', { name: /Stellar testnet/ })).toBeChecked();
  await page.getByRole('button', { name: 'Connect Freighter' }).click();
  await expect(page.getByTitle(CURATOR)).toBeVisible();

  await page.getByLabel('File fingerprint (SHA-256)').fill(HASH);
  await page.getByLabel('Kind of file').selectOption('task');
  await page.getByLabel('Campaign label').fill('demo');
  await page.getByLabel('Evidence hash (SHA-256)').fill('e'.repeat(64));
  await page.getByRole('button', { name: 'Review transaction' }).click();

  const summary = page.getByRole('region', { name: 'Check before you sign' });
  await expect(summary).toContainText('Propose an indicator');
  await expect(summary).toContainText(HASH);
  await expect(summary).toContainText('Stellar testnet');
  await expect(summary).toContainText('0.0154321 XLM');
  expect(await log(page)).toEqual([
    { prepared: { type: 'propose', hash: HASH, kind: 'task', campaign: 'demo', evidence: 'e'.repeat(64) } },
  ]);

  await summary.getByRole('button', { name: 'Sign and send' }).click();
  await expect(page.getByText(/The transaction is on Stellar testnet/)).toBeVisible();
  const entries = (await log(page)) as Record<string, unknown>[];
  expect(entries.filter((e) => 'signRequest' in e)).toEqual([
    { signRequest: { xdr: 'UNSIGNED_E2E_XDR', opts: { networkPassphrase: TESTNET, address: CURATOR } } },
  ]);
});

test('wallet on the wrong network blocks signing', async ({ page }) => {
  await installFakes(page, { wallet: { installed: true, passphrase: 'Public Global Stellar Network ; September 2015' } });
  await page.goto('/curate');
  await page.getByRole('button', { name: 'Connect Freighter' }).click();
  await expect(page.getByText(/Your wallet is set to Stellar mainnet/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Review transaction' })).toBeDisabled();
});

test('no wallet installed: explains what to do', async ({ page }) => {
  await installFakes(page, { wallet: { installed: false } });
  await page.goto('/curate');
  await expect(page.getByText('Freighter is not installed in this browser.')).toBeVisible();
});
