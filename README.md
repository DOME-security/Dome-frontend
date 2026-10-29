# dome-frontend

**The Dome web app: check a repo or file before you open it.**

Most developers hit by "open-the-folder" malware never had a chance to check first. dome-frontend is the place to check, with nothing to install: paste a GitHub link and see what the repository would run when you open, install or build it, or drop in a single file and find out whether it matches a known attack. Files are fingerprinted in the browser and never uploaded. The app also explains each finding in plain language, shows the on-chain Dome Registry of known-bad files, and walks people through what to do if they think they were infected.

Part of the Dome Security org, alongside [dome-backend](https://github.com/DOME-security/Dome-backend) (scanner and API) and [dome-contracts](https://github.com/DOME-security/Dome-contracts) (the Dome Registry on Stellar). Dome protects open-source projects from auto-run malware and is built for the Stellar Wave Program on Drips.

---

## What it does

- **Check a repo** (`/check/repo`) — paste a public GitHub URL (optionally a branch or tag); the app queues a scan on dome-backend, polls its status live, and shows a report with 🔴 block / 🟠 review / ⚪ info findings, each linked to the exact file and line at the scanned commit. The link is shareable (`?scan=<id>`).
- **Check a file** (`/check/file`) — drop a file, or paste a SHA-256; the fingerprint is computed **in the browser** with Web Crypto and only the hash is looked up against the registry's known-bad list. The file never leaves the device.
- **Registry explorer** (`/registry`, `/registry/indicator/:hash`) — active indicators by kind and campaign, with paging, evidence links and the transaction that recorded each one.
- **Repository page** (`/repos/:owner/:repo`) — the latest scan and the latest on-chain attestation for a public repo. The app **recomputes the report hash in the browser** and tells you whether it matches the hash recorded on chain, so the link between report and attestation does not depend on trusting the API.
- **Guides** (`/guides/infected`, `/guides/hardening`, `/guides/wave`) — "I think I was infected" (disconnect, secure crypto and rotate credentials from a clean device, reset, report or appeal), editor and repository hardening (Workspace Trust, `task.allowAutomaticTasks`, rulesets, signed commits, CODEOWNERS), and a safe review routine for Stellar Wave, with tick-off checklists.
- **Fixed wording, no HTML** — the backend sends rule IDs; every word of a verdict comes from the app's own rule table, and repository-supplied text (file paths, repo names) is only ever rendered as plain text. Every report ends with: *"No known pattern found is not the same as safe."*
- **Maintainer dashboard and curator console** — `/dashboard` (GitHub sign-in, scan history, Action setup) and `/curate` (Freighter, propose / approve / retract on testnet) are *planned*; see [Roadmap](#roadmap).

## Status

Pre-alpha. The app shell, both check flows, the registry explorer and the repository page are implemented against the REST contract in dome-backend's [`docs/api.md`](https://github.com/DOME-security/Dome-backend/blob/main/docs/api.md), and covered by 102 unit and component tests (Vitest) and 8 end-to-end tests run at desktop and phone size (Playwright, against the production build with its CSP and a mocked API). There is no public deployment yet. Registry data is read through the backend's indexer; direct Stellar RPC reads and curator transactions wait for `@dome-security/registry-bindings` to be published to npm. See [Roadmap](#roadmap).

## Architecture

```
src/
├── main.tsx          Entry point: theme, TanStack Query client, router
├── router.tsx        Route table; every page is a lazily loaded chunk
├── routes/           One folder per page
│   ├── home/             /
│   ├── check-repo/       /check/repo: submit, poll, report
│   ├── check-file/       /check/file: local hashing, known-bad lookup
│   ├── registry/         /registry and /registry/indicator/:hash
│   ├── repo/             /repos/:owner/:repo with report-hash verification
│   ├── guides/           /guides/:slug, loads Markdown from content/guides
│   └── not-found/        404 and route error pages
├── components/       Report table, finding badge, verdict banner, scan progress, file dropzone, safe Markdown, layout
├── lib/
│   ├── api.ts            Typed client for dome-backend, response checks, fixed error text
│   ├── types.ts          Response shapes mirrored from dome-backend
│   ├── rules.ts          Rule ID → fixed display text, severity and verdict wording
│   ├── hash.ts           Web Crypto SHA-256, canonical JSON report hash
│   ├── registry.ts       Explorer links, contract error messages, report-hash check
│   ├── github.ts         GitHub URL parsing and encoded file links
│   ├── markdown.ts       Markdown subset → data tree (no HTML path)
│   ├── config.ts         Build-time configuration
│   └── theme.ts          Light / dark / system theme
├── content/guides/   Guide text in Markdown, rendered as React elements
├── styles/           Design tokens, light and dark themes, shared UI classes
└── test/             Test setup, inert fixtures, route render helper

config/               CSP and security headers for builds, plus tests for them and for the security lint rules
e2e/                  Playwright tests and the mocked Dome API they run against
public/               Static assets
scripts/              check-hygiene.sh: CI check for auto-run files, secrets, install scripts, unpinned actions
docs/                 Deployment guide
.github/              CI workflow and Dependabot
```

One package, one toolchain. The build is a static site, so the app has no server of its own and no secrets:

| Layer | Tool | Members |
|---|---|---|
| App | [Vite](https://vite.dev) + React + TypeScript, [pnpm](https://pnpm.io) | `src/`, `public/`, `index.html` |
| Unit and component tests | [Vitest](https://vitest.dev) + Testing Library (jsdom) | `src/**/*.test.ts(x)`, `config/*.test.ts` |
| End-to-end tests | [Playwright](https://playwright.dev) (Chromium, desktop and phone) | `e2e/` |
| Lint and format | ESLint (with security rules) + Prettier | whole repo |
| Build hardening | Vite plugin in `vite.config.ts` using `config/security-headers.ts` | `dist/index.html` CSP meta tag, `dist/_headers` |

## Tech stack

- **Framework**: React 19 + TypeScript (strict), built with Vite 7 into a static site
- **Routing**: React Router 7, one lazy chunk per route
- **Data fetching**: TanStack Query 5 (scan polling, paged registry lists)
- **Styling**: CSS modules on design tokens; light, dark and system themes
- **Hashing**: Web Crypto `crypto.subtle.digest("SHA-256", …)`; canonical JSON hashing identical to dome-backend's `report-hash.ts`
- **Stellar**: explorer links to stellar.expert today; `@stellar/stellar-sdk`, `@stellar/freighter-api` and `@dome-security/registry-bindings` are *planned* for chain reads and curator actions
- **Testing**: Vitest + Testing Library for units and components, Playwright for end-to-end
- **Supply chain**: exact dependency versions, `ignore-scripts=true`, pnpm build scripts blocked, 7-day minimum release age, Dependabot, SHA-pinned Actions

## Getting started

> This repo takes part in the **Stellar Wave Program on Drips**. Apply for an issue in the [Drips Wave app](https://www.drips.network/wave), **wait to be assigned**, and open a PR with `Closes #<issue>`. Points: **Trivial 100, Medium 150, High 200**. Rules for PRs are in [`CONTRIBUTING.md`](CONTRIBUTING.md).

Requirements: Node 22+ and pnpm 12. A local [dome-backend](https://github.com/DOME-security/Dome-backend) (`pnpm dev:server`, API on `:8080`) or a shared API URL.

```bash
git clone https://github.com/DOME-security/Dome-frontend.git
cd Dome-frontend

# Dependencies never run install scripts
pnpm install --ignore-scripts

cp .env.example .env.local     # VITE_DOME_API_URL, VITE_STELLAR_NETWORK=testnet, VITE_REGISTRY_CONTRACT_ID
pnpm dev                       # http://localhost:5173, proxies /v1 to DOME_API_PROXY_TARGET
```

Run the full check suite, as CI does:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test                      # unit + component tests
pnpm test:e2e                  # Playwright against the production build and a mocked API
./scripts/check-hygiene.sh
```

`pnpm test:e2e` needs Chromium once: `pnpm exec playwright install chromium`. `pnpm build` writes the static site to `dist/`; see [`docs/deployment.md`](docs/deployment.md) for configuration, security headers and hosting.

When curator pages ship, use a dedicated browser profile with only a **testnet** Freighter wallet for development. Never connect a wallet holding real funds to a dev build.

## Design system

Tokens for colour, spacing, type and radius live in [`src/styles/tokens.css`](src/styles/tokens.css), with light and dark palettes chosen for WCAG 2.2 AA contrast; components use only the variables. The app is built phone-first, since many contributors check a link on their phone before touching their laptop, and the end-to-end suite fails if the main pages scroll sideways at 360 px. Severity is never shown by colour alone (🔴/🟠/⚪ always come with a text label), every control is keyboard reachable with a visible focus ring, and a skip link leads to the content. The guides are written for someone who has just seen a scary antivirus alert, not for security engineers. No UI kit, no web fonts, no images beyond the logo.

## Related repositories

```
                 ┌──────────────────────────┐
  users ────────▶│  dome-frontend (this)    │
                 └───┬──────────────────┬───┘
     REST API (JSON) │                  │ explorer links today;
                     ▼                  ▼ RPC reads + Freighter-signed txs (planned)
         ┌────────────────┐     ┌─────────────────────────────┐
         │ dome-backend   │────▶│ dome-contracts              │
         │ scans, API,    │◀────│ Dome Registry on Stellar    │
         │ indexer        │     └─────────────────────────────┘
         └────────────────┘
```

**[dome-backend](https://github.com/DOME-security/Dome-backend)**

- *Sends to it:* `POST /v1/scans` with `{ url, ref? }` for a public GitHub repo; `GET /v1/scans/:id`, polled every 2 seconds while the scan is `queued` or `running`; `GET /v1/repos/:owner/:repo`; `GET /v1/indicators?limit=&cursor=`; and `GET /v1/indicators/:sha256` with a hash computed in the browser, never file contents. Requests carry no cookies. The app's origin must be listed in the backend's `CORS_ORIGINS`.
- *Receives from it:* scan records (status, verdict, commit, the engine's JSON report with findings as rule ID, severity and locations, and `reportHash`), repository summaries with the latest on-chain attestation, and pages of active indicators. The `reason` and `error` text in responses is never displayed; the app uses its own wording.
- *Never asks it to run anything:* all scanning happens in dome-backend's sandboxed workers. The frontend never clones, parses or runs repository code.

**[dome-contracts](https://github.com/DOME-security/Dome-contracts)**

- *Receives from it today:* registry data indirectly, through the backend's indexer, plus links to the contract, transactions and attester accounts on stellar.expert. The report hash the backend attests is recomputed in the browser and compared with the attested value.
- *Will receive (planned):* `latest`, `history`, `indicator` and `is_known_bad` through Stellar RPC simulation, to spot-check indexer data against the chain.
- *Will send (planned):* `propose`, `approve` and `retract` transactions from the curator console, one per click, summarised in plain language before Freighter signs, on testnet by default. Admin actions are never signed through the frontend.

**Shared interfaces**

| Interface | Owned by | Used here in |
|---|---|---|
| REST contract, [`docs/api.md`](https://github.com/DOME-security/Dome-backend/blob/main/docs/api.md) | dome-backend | `src/lib/api.ts`, `src/lib/types.ts` |
| Rule IDs, titles and default levels, [`docs/rules`](https://github.com/DOME-security/Dome-backend/tree/main/docs/rules) | dome-backend (engine) | `src/lib/rules.ts` (27 rules, kept in sync by hand) |
| Canonical JSON report hash (`report-hash.ts`) | dome-backend | `src/lib/hash.ts`, verified on `/repos/:owner/:repo` |
| `@dome-security/registry-bindings` TypeScript client (npm publish planned) | dome-contracts | *planned* for chain reads and curator actions |
| Contract id per network | dome-contracts README | `VITE_REGISTRY_CONTRACT_ID` |
| Contract error codes (`errors.rs`, append-only) | dome-contracts | `src/lib/registry.ts` plain-language messages |
| Verdict, indicator kind and status symbols | dome-contracts / dome-backend | `src/lib/rules.ts`, `src/lib/registry.ts` labels |

## Roadmap

Milestones from the original specification, compared with the code in this repo. Items marked *planned* do not exist yet.

- [x] **M1 Shell:** layout, routing with lazy routes, light/dark/system themes, home page, `/guides/infected`, `/guides/hardening`, `/guides/wave`
- [x] **M2 Check:** `/check/repo` with live status and shareable scan links, `/check/file` with local hashing and pasted-hash lookup, report components
- [ ] **M3 Registry**
  - [x] Explorer list with campaign filter and cursor paging, indicator detail page, `/repos/:owner/:repo`
  - [x] In-browser report-hash verification against the attested hash (new)
  - [ ] Verify indexer data directly against Stellar RPC (*planned*; needs `@dome-security/registry-bindings` on npm)
  - [ ] Proposed and retracted indicators, approvals and per-indicator history (*planned*; the backend API serves active indicators only)
- [ ] **M4 Maintainers:** GitHub sign-in, `/dashboard`, Action setup flow (*planned*; waits for GitHub App authentication in dome-backend)
- [ ] **M5 Curators:** `/curate`, Freighter connect with network display and testnet guard, propose/approve/retract with a transaction summary before signing (*planned*; contract error messages are already mapped in `src/lib/registry.ts`)
- [ ] **M6 Polish**
  - [x] Phone-width, keyboard and theme checks in the end-to-end suite
  - [ ] Automated accessibility audit (axe) in CI (*planned*)
  - [ ] Performance budget in CI (*planned*)
  - [ ] Translations (*planned*)
- [ ] **Release readiness**
  - [x] CI: hygiene, format, lint, typecheck, unit tests on Node 22 and 24, build, Playwright; Dependabot
  - [x] Lint rules banning `dangerouslySetInnerHTML` and other HTML sinks, with tests; CSP and security headers in builds
  - [ ] `CODEOWNERS` and branch protection on `main` (*planned*)
  - [ ] Dome GitHub Action self-scan on pull requests (*planned*; waits for the first dome-backend Action release)
  - [ ] Generate `src/lib/rules.ts` from dome-backend instead of syncing by hand (new, *planned*)
  - [ ] Public deployment (*planned*)

## Security

The app shows verdicts about code that may be hostile, so its rules are strict: repository-supplied text is never rendered as HTML (`dangerouslySetInnerHTML`, `innerHTML`, `eval` and `javascript:` URLs are lint errors); verdict and error wording come from the app, not from the API or the repo; files are hashed locally and only the hash is sent; production builds carry a strict Content Security Policy with no inline scripts, no third-party hosts, and connections only to the app and the Dome API; build config stays small, because in 2026 attackers hid payloads at the end of files like `postcss.config.mjs` and `tailwind.config.js`; and nothing runs at install time (`--ignore-scripts` locally and in CI). When curator actions ship they will build one transaction per click, summarise it before signing, never handle secret keys, and default to testnet. Found a vulnerability? Please don't open a public issue. Report it privately through **Report a vulnerability** on this repo, as described in [`SECURITY.md`](SECURITY.md).

## License

[Apache-2.0](LICENSE).

## Acknowledgments

Built for the Stellar Wave Program on Drips. Rule wording follows dome-backend's [rule documentation](https://github.com/DOME-security/Dome-backend/tree/main/docs/rules). References: [Freighter developer docs](https://docs.freighter.app), [Stellar JavaScript SDK](https://github.com/stellar/js-stellar-sdk), [MDN `SubtleCrypto.digest()`](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest), [OWASP CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html), [WCAG 2.2](https://www.w3.org/TR/WCAG22/), Microsoft's [developer-targeting campaign using malicious Next.js repositories](https://www.microsoft.com/en-us/security/blog/2026/02/24/c2-developer-targeting-campaign/), and the [Drips Wave docs](https://docs.drips.network/wave).
