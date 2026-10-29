# dome-frontend

**The Dome web app: check a repo or file before you open it, browse the on-chain Dome Registry, follow your repos' scan history, and learn how to stay safe.**

Most developers who get hit by "open-the-folder" malware never had a chance to check first. The Dome web app is the place to check, with nothing to install: paste a GitHub link, or drop in a file, and see what it would run and whether it matches a known attack.

> 🚧 **Status: in design, pre-alpha.** This README is the specification contributors build against during Stellar Wave.

---

## Contents

- [What the app does](#what-the-app-does)
- [Pages](#pages)
- [How it fits with the other repos](#how-it-fits-with-the-other-repos)
- [Stack](#stack)
- [Security rules for this frontend](#security-rules-for-this-frontend)
- [Design and accessibility](#design-and-accessibility)
- [Development](#development)
- [Roadmap](#roadmap)
- [Contributing through Stellar Wave](#contributing-through-stellar-wave)
- [Security](#security)
- [References](#references)

---

## What the app does

| For | They can |
|---|---|
| **Contributors** | Check a repo before cloning or opening it; check a single file (hashed in the browser, never uploaded); read plain-language guides on what to do if they think they were infected |
| **Maintainers** | Sign in with GitHub, see scan history for their repos, get copy-paste setup for the Dome GitHub Action, and follow a hardening checklist |
| **Curators** | Connect a Stellar wallet (Freighter) and propose, approve or retract known-bad indicators in the Dome Registry |
| **Everyone** | Browse the public registry: active indicators, campaigns, and repo attestations |

---

## Pages

| Route | Page | Data source |
|---|---|---|
| `/` | Home: what Dome is, the three things that keep you safe, links to check a repo or file | static |
| `/check/repo` | Paste a public GitHub URL → queued scan → live status → report with 🔴 block / 🟠 review / ⚪ info findings | backend `POST /v1/scans`, `GET /v1/scans/:id` |
| `/check/file` | Drop a file → SHA-256 computed **in the browser** with Web Crypto → known-bad lookup. The file never leaves the device. | backend `GET /v1/indicators/:sha256` (or direct RPC read) |
| `/registry` | Explorer: indicators by campaign, recent attestations, retractions | backend indexer API, verified against Stellar RPC |
| `/registry/indicator/:hash` | One indicator: kind, campaign, approvals, evidence link, history | same |
| `/repos/:owner/:repo` | Latest scan + latest on-chain attestation for a public repo | backend `GET /v1/repos/:owner/:repo` |
| `/dashboard` | Maintainer view after GitHub sign-in: their repos, scan history, Action setup status | backend (GitHub App) |
| `/curate` | Curator console: connect Freighter, propose / approve / retract indicators (testnet first) | `@dome-security/registry-bindings` + Freighter |
| `/guides/infected` | "I think I was infected": disconnect, secure crypto, rotate GitHub tokens and SSH keys from a clean device, clean or reset the machine, appeal and report | static |
| `/guides/hardening` | Editor and repo hardening: Workspace Trust, `task.allowAutomaticTasks`, signed commits, rulesets, CODEOWNERS | static |
| `/guides/wave` | For Stellar Wave maintainers and contributors: safe review routine during a Wave | static |

Every report page ends with: *"No known pattern found is not the same as safe."*

---

## How it fits with the other repos

```
           ┌──────────────────────────┐
 users ───▶│  dome-frontend (this)    │
           └───┬───────────────┬──────┘
   REST API    │               │  wallet-signed transactions (curators)
               ▼               ▼  + direct reads to verify
     ┌──────────────┐   ┌─────────────────────────────┐
     │ dome-backend │──▶│ dome-contracts               │
     │ API, scans,  │   │ Dome Registry on Stellar     │
     │ indexer      │   └─────────────────────────────┘
     └──────────────┘
```

- **dome-backend** does all scanning. The frontend never clones, parses or runs repository code itself.
- **dome-contracts** publishes `@dome-security/registry-bindings`, the typed client this app uses for wallet actions and for spot-checking backend data against the chain.

---

## Stack

| Concern | Choice |
|---|---|
| Framework | React + TypeScript, built with Vite (static build, deployable to any static host) |
| Routing | React Router |
| Data fetching | TanStack Query |
| Styling | CSS modules with design tokens; light and dark themes |
| Stellar | `@stellar/stellar-sdk`, `@stellar/freighter-api`, `@dome-security/registry-bindings` |
| Hashing | Web Crypto `crypto.subtle.digest("SHA-256", …)` |
| Testing | Vitest + Testing Library for components, Playwright for end-to-end |

The build is a static site, so the frontend has no server of its own and no secrets.

---

## Security rules for this frontend

1. **Never render repository-supplied text as HTML.** File paths, rule hits and repo names are rendered as plain text. No `dangerouslySetInnerHTML` anywhere, enforced by lint.
2. **Verdict wording comes from the app, not the repo.** The backend sends rule IDs; the frontend maps them to fixed, translated text. A malicious repo cannot change what the user reads.
3. **Files are hashed locally.** `/check/file` never uploads file contents. Only the hash is sent.
4. **Strict Content Security Policy.** No inline scripts, no third-party trackers or analytics scripts, connections only to the Dome API and Stellar RPC.
5. **Wallet actions are explicit.** Curator actions build one transaction per click, show a plain-language summary (what, which indicator, which network) before asking Freighter to sign, and never request or handle secret keys.
6. **Testnet by default.** Mainnet curator actions are behind a visible network switch.
7. **Minimal build config.** In 2026 attackers hid payloads at the end of files like `postcss.config.mjs` and `tailwind.config.js`. Our config files are small, owned by CODEOWNERS, and scanned by Dome on every PR. No install scripts, `npm ci --ignore-scripts` in CI.

---

## Design and accessibility

- Works on a phone first. Many contributors will check a link from their phone before touching their laptop.
- WCAG 2.2 AA: keyboard navigable, visible focus, colour is never the only signal (🔴/🟠/⚪ always come with text).
- Plain language. The guides are written for someone who has just seen a scary antivirus alert, not for security engineers.
- Fast on slow connections: code-split routes, no heavy UI kits, images optimized.

---

## Development

Requirements: Node 20+, pnpm. A local `dome-backend` (or the shared testnet API) and the Freighter extension for curator pages.

```bash
pnpm install --ignore-scripts
cp .env.example .env.local     # VITE_DOME_API_URL, VITE_STELLAR_NETWORK=testnet, VITE_REGISTRY_CONTRACT_ID
pnpm dev                       # http://localhost:5173
pnpm test                      # unit + component tests
pnpm test:e2e                  # Playwright against a mocked API
```

Use a dedicated browser profile with only a **testnet** Freighter wallet for development. Never connect a wallet holding real funds to a dev build.

```
dome-frontend/
├─ src/
│  ├─ routes/          # one folder per page
│  ├─ components/      # report table, finding badge, file dropzone, wallet button
│  ├─ lib/
│  │  ├─ api.ts        # typed client for dome-backend
│  │  ├─ registry.ts   # wrappers over @dome-security/registry-bindings
│  │  ├─ hash.ts       # Web Crypto SHA-256 helpers
│  │  └─ rules.ts      # rule ID → fixed display text
│  ├─ content/guides/  # markdown for the guides, rendered as safe text
│  └─ styles/          # tokens, themes
├─ e2e/                # Playwright tests
└─ public/
```

---

## Roadmap

| Milestone | Scope |
|---|---|
| **M1 Shell** | Layout, routing, themes, home page, guides |
| **M2 Check** | `/check/repo` with live status, `/check/file` with local hashing, report components |
| **M3 Registry** | Explorer pages backed by the indexer, with chain verification |
| **M4 Maintainers** | GitHub sign-in, dashboard, Action setup flow |
| **M5 Curators** | Freighter connect, propose/approve/retract on testnet |
| **M6 Polish** | Accessibility audit, performance budget, translations |

---

## Contributing through Stellar Wave

This repo takes part in the **Stellar Wave Program on Drips**. Apply for an issue in the [Drips Wave app](https://www.drips.network/wave), **wait to be assigned**, and open a PR with `Closes #<issue>`. Points are awarded when the issue is closed as completed during an active Wave: **Trivial 100, Medium 150, High 200**. Maintainers set complexity. KYC in the Drips app is required to apply and withdraw. Read the [Drips Wave Terms and Rules](https://docs.drips.network/wave/terms-and-rules) first.

UI PRs need screenshots or a short recording (desktop and phone width), tests for new components, and no new dependencies without a reason in the PR description. AI help is fine, but you must understand and test what you submit.

**Sample Wave backlog**

| Issue | Complexity |
|---|---|
| App shell: layout, routing, light/dark themes with design tokens | Medium |
| Home page and `/guides/hardening` content and layout | Trivial |
| `/guides/infected`: step-by-step recovery guide with checklists | Medium |
| File dropzone with in-browser SHA-256 hashing and known-bad lookup | Medium |
| `/check/repo`: submit URL, poll status, render report with fixed-wording findings | High |
| Report table component with 🔴/🟠/⚪ badges, accessible labels and file links | Medium |
| Registry explorer list + indicator detail page | High |
| Freighter connect button with network display and testnet guard | Medium |
| Curator propose/approve flow with transaction summary before signing | High |
| Lint rule banning `dangerouslySetInnerHTML` + CSP headers config | Trivial |
| Playwright end-to-end tests for the check flows against a mocked API | Medium |

---

## Security

Report vulnerabilities privately through **Report a vulnerability** on this repo. `main` requires signed commits, blocks force-pushes, and requires code-owner review for build config, `.github/`, `package.json` and lockfiles.

## License

Apache-2.0 (proposed).

## References

- Freighter wallet developer docs: https://docs.freighter.app
- Stellar JavaScript SDK: https://github.com/stellar/js-stellar-sdk
- MDN, `SubtleCrypto.digest()`: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
- OWASP Cheat Sheet, Content Security Policy: https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Microsoft, *Developer-targeting campaign using malicious Next.js repositories* (why build config is an attack surface): https://www.microsoft.com/en-us/security/blog/2026/02/24/c2-developer-targeting-campaign/
- Drips Wave docs: https://docs.drips.network/wave
