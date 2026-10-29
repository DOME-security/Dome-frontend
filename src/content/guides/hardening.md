# Harden your editor and repository

Most auto-run attacks need one of a few switches to be on. Turn them off once and the commonest attacks stop working. This page covers your editor first, then the repositories you maintain.

## Your editor

### Keep Workspace Trust on

VS Code and Cursor open unknown folders in **Restricted Mode** when Workspace Trust is on. In Restricted Mode tasks, debugging and many extensions do not run.

- [ ] Make sure `security.workspace.trust.enabled` is `true` (the default).
- [ ] When a folder asks "Do you trust the authors?", choose **No** unless you have checked it. You can still read every file.
- [ ] Do not trust a whole parent folder such as your home directory or `~/projects`.

### Turn automatic tasks off

A task in `.vscode/tasks.json` with `"runOn": "folderOpen"` runs as soon as a trusted folder opens.

- [ ] In your **user** settings, set `task.allowAutomaticTasks` to `off`.
- [ ] Watch for repositories that hide `.vscode` with `files.exclude`. Dome reports this as DOME-VSC-003.

### Be careful with installs and agents

- [ ] Run `npm install --ignore-scripts` (or set `ignore-scripts=true` in `.npmrc`) for code you have not reviewed.
- [ ] Open unknown repositories in a dev container or a throwaway virtual machine with no wallets or keys.
- [ ] Review `.claude/`, `.cursor/` and `.mcp.json` files before letting an AI agent work in a repository: they can run commands.

## Your repositories

### Protect the default branch

- [ ] Add a **ruleset** for `main` that requires pull requests, blocks force-pushes and blocks deletion.
- [ ] Require **signed commits**, so a stolen token alone cannot push code in your name.
- [ ] Require status checks to pass, including a Dome scan.

### Use CODEOWNERS for the files attackers target

Attackers hide payloads in files reviewers skim. Make those files need a named reviewer:

- `/.vscode/  @your-org/maintainers`
- `/.github/  @your-org/maintainers`
- `/.devcontainer/  @your-org/maintainers`
- `package.json  @your-org/maintainers`
- `*.config.*  @your-org/maintainers`

- [ ] Add a `CODEOWNERS` file like the one above and turn on **Require review from Code Owners** in the ruleset.

### Run Dome on every pull request

- [ ] Add the Dome GitHub Action. It runs on `pull_request` (never `pull_request_target`) with read-only permissions, so a fork cannot use it to reach your secrets. Setup steps are in the [dome-backend README](https://github.com/DOME-security/Dome-backend#readme).
- [ ] Pin every third-party action to a full commit SHA.

> Dome looks for known patterns. A clean result means no known pattern was found, not that the code is safe. Keep reviewing.
