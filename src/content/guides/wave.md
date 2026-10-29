# A safe review routine for Stellar Wave

During a Stellar Wave many new contributors open pull requests at once, and maintainers review faster than usual. In October 2026 auto-run attacks reached several Wave repositories through merged pull requests. This routine keeps both sides safe without slowing the Wave down.

## For maintainers

### Before the Wave starts

- [ ] Protect `main` with a ruleset: pull requests only, no force-pushes, signed commits, required checks.
- [ ] Add `CODEOWNERS` entries for `.vscode/`, `.github/`, `.devcontainer/`, `package.json`, lockfiles and build config files.
- [ ] Add the Dome GitHub Action in `enforce` mode so a 🔴 block result fails the check.
- [ ] Turn off automatic tasks in your own editor (see [the hardening guide](/guides/hardening)).

### For every pull request

1. Read the Dome check result first. A 🔴 block means do not check the branch out at all.
2. Review the diff on GitHub in the browser before you pull anything to your machine.
3. Look hardest at files that run without being asked: `.vscode/`, `.devcontainer/`, `.github/workflows/`, install scripts in `package.json`, git hooks, and config files such as `*.config.js`.
4. Scroll to the end of every changed config file. Payloads hide after long runs of spaces.
5. Be suspicious of binary files, fonts and images added in a pull request that is about code.
6. If you must run the branch, do it in a dev container or a codespace with no secrets, never on your daily machine.
7. Never use `pull_request_target` workflows that check out the pull request's code.

### If something gets through

- [ ] Revert the merge, then follow [I think I was infected](/guides/infected) on any machine that ran the code.
- [ ] Tell the Wave organisers and other maintainers so they can check for the same contributor or payload.
- [ ] Ask a Dome curator to add the file's fingerprint to the [Dome Registry](/registry).

## For contributors

- [ ] Check a repository with [Dome](/check/repo) before you clone it, and again before you open it in your editor.
- [ ] Keep Workspace Trust on and automatic tasks off. Open a new project in Restricted Mode first.
- [ ] Install with `npm install --ignore-scripts` until you have read `package.json`.
- [ ] Keep wallets and Stellar CLI identities off the machine you use for unknown repositories, or create identities with `--secure-store`.
- [ ] Never paste a seed phrase or secret key anywhere a repository asks for it. No legitimate Wave task needs one.

> Dome reports known patterns. A clean result is not a guarantee, so keep the habits above even when the check is green.
