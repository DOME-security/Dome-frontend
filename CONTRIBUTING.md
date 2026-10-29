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
pnpm test              # Vitest unit and component tests
pnpm test:e2e          # Playwright against the production build and a mocked API
./scripts/check-hygiene.sh
```

`pnpm test:e2e` needs a Chromium build once: `pnpm exec playwright install chromium` (add `--with-deps` on a fresh Linux machine).

## Rules for PRs

- **Plain text only.** Never render text from the API, a scanned repository or the registry as HTML. Use React text nodes. Links to external sites go through `safeHref` or an id-checked builder in `src/lib`.
- **Fixed wording.** New verdict or rule text goes in `src/lib/rules.ts`; new error text in `src/lib/api.ts` or `src/lib/registry.ts`. When dome-backend adds a rule, add it to `RULES` and update the count in `rules.test.ts`.
- **Tests.** New components and pages come with Testing Library tests; new user flows also get a Playwright test in `e2e/`. API calls in tests go through `mockFetch` (unit) or `e2e/mock-api.ts` (end-to-end), never a real backend.
- **Accessibility.** Keyboard reachable, visible focus, labelled controls, and severity never shown by colour alone.
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
