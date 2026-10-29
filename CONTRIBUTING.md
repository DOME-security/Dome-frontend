# Contributing to dome-frontend

## Stellar Wave

This repo takes part in the **Stellar Wave Program on Drips**.

1. Apply for an issue in the [Drips Wave app](https://www.drips.network/wave).
2. **Wait to be assigned** before starting.
3. Open a PR with `Closes #<issue>` in the description.

Points are awarded when the issue is closed as completed during an active Wave: **Trivial 100, Medium 150, High 200**. Maintainers set complexity. KYC in the Drips app is required to apply and withdraw. Read the [Drips Wave Terms and Rules](https://docs.drips.network/wave/terms-and-rules) first.

## Local setup

You need Node 22+ and pnpm 12 (`corepack enable` picks up the version in `package.json`).

```bash
pnpm install --ignore-scripts
cp .env.example .env.local
pnpm dev               # http://localhost:5173, proxies /v1 to DOME_API_PROXY_TARGET
```

Before you push:

```bash
pnpm format:check      # Prettier
pnpm lint              # ESLint, including the security rules
pnpm typecheck         # TypeScript, strict
pnpm test              # Vitest unit and component tests (API mocked with MSW)
pnpm test:e2e          # Playwright: every flow, axe on every page, 320 px layout
pnpm lighthouse        # Lighthouse budget on the production build (run pnpm build first; needs CHROME_PATH)
pnpm generate:api      # after editing src/vendor/openapi.json; CI fails if src/lib/api-schema.ts is stale
./scripts/check-hygiene.sh
```

`pnpm test:e2e` needs a Chromium build once: `pnpm exec playwright install chromium` (add `--with-deps` on a fresh Linux machine). For Lighthouse, point `CHROME_PATH` at it: `CHROME_PATH="$(node -e "console.log(require('@playwright/test').chromium.executablePath())")" pnpm lighthouse`.

`pnpm screenshots` regenerates `docs/screenshots/` at desktop and phone width against the mocked API; use it for the screenshots your UI pull request needs.

## How the code is organised

- **Text** lives in `src/i18n/en.ts`. JSX may not contain literal text (`react/jsx-no-literals`). Guides are Markdown in `src/content/guides/en/`.
- **Other repositories' files** live in `src/vendor/` as pinned placeholders. Read `src/vendor/README.md` before touching them, and update them in their own pull request.
- **The Stellar chain and the wallet** are reached only through `src/lib/services.tsx`. Unit tests replace them with `fakeChain()` / `fakeWallet()` from `src/test/services.ts`; end-to-end tests with `e2e/fakes.ts`. No test talks to a real RPC or wallet.
- **The Dome API** is mocked with MSW in unit tests (`src/test/server.ts`, unhandled requests fail) and with `page.route` in `e2e/mock-api.ts`.

## Rules for PRs

- **Plain text only.** Never render text from the API, a scanned repository or the registry as HTML. Use React text nodes. Links to external sites go through `safeHref` or an id-checked builder in `src/lib`.
- **Fixed wording.** All text goes in `src/i18n/en.ts`. Rule titles and reasons come from `src/vendor/rules.json`; when dome-backend adds a rule, refresh it with `node scripts/sync-rules.mjs <dome-backend checkout>` in its own pull request.
- **Tests.** New components and pages come with Testing Library tests, including loading, empty and error states; new user flows also get a Playwright test in `e2e/`, and new pages join the axe list in `e2e/a11y.spec.ts`.
- **Accessibility.** Keyboard reachable, visible focus, labelled controls, severity never shown by colour alone, no sideways scrolling at 320 px. CI fails on serious or critical axe violations and on a Lighthouse accessibility score under 95.
- **Wallet safety.** Curator actions build one transaction per click and show a plain-language summary before the wallet signs. Never ask for, accept or store a secret key or recovery phrase.
- **Screenshots.** UI PRs include screenshots or a short recording at desktop and phone width.
- **Dependencies.** No new dependency without a reason in the PR description. Pin exact versions.
- **No secrets.** No `.env` files, real keys or Stellar identity files. Every `VITE_` variable is public.
- **No real malware.** Fixtures are inert look-alikes that only `echo DOME_FIXTURE`.
- **No install scripts.** No `preinstall`, `install`, `postinstall` or `prepare` in `package.json`.
- **No `.vscode/` files.** CI rejects them.
- **Actions pinned by SHA.** New GitHub Actions are pinned to a full commit SHA with the version in a comment. Workflows use `pull_request`, never `pull_request_target`.
- **Small build config.** Keep `vite.config.ts` and other config files short and readable; attackers hide payloads at the end of config files.
- **Conventional Commits.** `feat:`, `fix:`, `test:`, `docs:`, `chore:`, `ci:`.

AI help is fine, but you must understand and test what you submit.
