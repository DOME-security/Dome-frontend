import { expect, test } from '@playwright/test';
import { installFakes } from './fakes';
import { failOnConsoleErrors } from './helpers';
import { ACTIVE_HASH, mockApi } from './mock-api';

failOnConsoleErrors();

test('explorer: list, ledger spot-check, then an indicator verified on chain', async ({ page }) => {
  await installFakes(page, {
    knownBad: [ACTIVE_HASH, 'b'.repeat(64)],
    indicators: { [ACTIVE_HASH]: { status: 'active', campaign: 'demo' } },
  });
  await mockApi(page);
  await page.goto('/registry');
  await expect(page.getByText(/Verified: a sample of 2 listed fingerprints matches the Stellar testnet ledger/)).toBeVisible();
  await expect(page.getByRole('cell', { name: 'dome-fixture-package' })).toBeVisible();

  await page.getByTitle(ACTIVE_HASH).click();
  await expect(page).toHaveURL(`/registry/indicator/${ACTIVE_HASH}`);
  await expect(page.getByText(/Verified: this indicator matches/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'On the ledger' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'example.org' })).toHaveAttribute('href', 'https://example.org/advisory');
});

test('explorer: shows when the ledger disagrees with the API', async ({ page }) => {
  await installFakes(page, { knownBad: [ACTIVE_HASH], indicators: { [ACTIVE_HASH]: { status: 'retracted', campaign: 'demo' } } });
  await mockApi(page);
  await page.goto('/registry');
  await expect(page.getByRole('alert')).toContainText('bbbbbbbbbbbb… is not active on the ledger.');
  await page.goto(`/registry/indicator/${ACTIVE_HASH}`);
  await expect(page.getByRole('alert')).toContainText('The ledger says this indicator is retracted, not active.');
});
