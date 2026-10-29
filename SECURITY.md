# Security policy

## Reporting a vulnerability

Use **Report a vulnerability** on this repository's Security tab to report privately. Please do not open public issues or pull requests for vulnerabilities until a fix is released. We credit reporters who want credit.

Useful reports include any way for text from a scanned repository, the Dome API or the registry to be rendered as HTML or script; a way to change the wording of a verdict; a page that uploads file contents instead of a hash; a Content Security Policy bypass; and anything that makes a curator sign a transaction other than the one summarised on screen (once curator actions ship).

## Scope

In scope: the web app in this repository, its build configuration and its CI.

Out of scope: the scanner, API and indexer (`dome-backend`) and the on-chain registry (`dome-contracts`); report those in their own repositories.

## How the app protects users

- No HTML rendering of external text. `dangerouslySetInnerHTML`, `innerHTML`, `insertAdjacentHTML`, `eval` and `javascript:` URLs are lint errors, and `config/eslint.test.ts` proves the rules fire.
- Verdict wording comes from `src/lib/rules.ts` and error wording from `src/lib/api.ts`. The `reason` and `error` fields in API responses are never displayed.
- `/check/file` hashes files with Web Crypto in the browser. Only the hash is sent.
- Production builds carry a strict CSP (`config/security-headers.ts`): scripts and styles from the app's origin only, network access only to the app and the Dome API.
- No install scripts (`.npmrc` sets `ignore-scripts=true`; pnpm blocks dependency builds), exact dependency versions, a 7-day minimum release age, and SHA-pinned GitHub Actions on `pull_request` with a read-only token. `scripts/check-hygiene.sh` enforces this in CI.

## Repository protections

`main` is meant to require signed commits, block force-pushes, and require code-owner review for build config, `.github/`, `package.json` and lockfiles. That protection is _planned_ until `CODEOWNERS` and the branch rules are set up.

## Malicious content

Never submit real malware, real obfuscated payloads or live attacker URLs. Test fixtures are inert look-alikes, such as a `tasks.json` whose command is `echo DOME_FIXTURE`. Such PRs are closed and reported.
