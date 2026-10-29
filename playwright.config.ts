import { defineConfig, devices } from '@playwright/test';

// End-to-end tests run against a production build with its CSP. The Dome API
// is answered by e2e/mock-api.ts; the Stellar chain and the wallet are fakes
// injected by e2e/fakes.ts, which this build (VITE_E2E_FAKES=true, written to
// dist-e2e/) accepts and normal builds compile out.
const env = {
  VITE_DOME_API_URL: '',
  VITE_E2E_FAKES: 'true',
  VITE_REGISTRY_CONTRACT_ID: 'CCHLCPUBLL4ROEFP5PR3JY4LUB32TLNB2KDF3DQLG3R53IK5OUW7TZUY',
};

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'pnpm exec vite build --outDir dist-e2e && pnpm exec vite preview --outDir dist-e2e --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    env,
  },
});
