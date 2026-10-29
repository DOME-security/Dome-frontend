# I think I was infected

You opened a repository, ran `npm install`, or started a build, and now something feels wrong: an antivirus alert, a strange process, a wallet you did not touch. This page tells you what to do, in order. You do not need to be a security expert. Work through it calmly; speed matters more than perfection.

> If you think crypto is at risk, do step 2 first, from a different device.

## 1. Disconnect the machine

Stop the malware from talking to its owner while you work.

- [ ] Turn off Wi-Fi or unplug the network cable on the affected computer.
- [ ] Do not log in to anything else from this computer until you have finished this guide.
- [ ] Do not delete the repository yet. Note its URL and the time you opened it; you will need them to report it.

## 2. Secure your crypto, from a clean device

Attacks on developers often look for wallet extensions such as Freighter, and for Stellar CLI identities in `~/.config/stellar/identity/`.

- [ ] Use a different device you trust: a phone, or another computer that never opened the repository.
- [ ] Create a **new** wallet there and move funds out of any wallet that was on the affected machine.
- [ ] Treat every seed phrase and secret key that was ever on the affected machine as known to the attacker, even if it was encrypted.
- [ ] Revoke token approvals you no longer need.

## 3. Rotate your developer credentials, from a clean device

- [ ] **GitHub:** sign out of all sessions, change your password, and review two-factor settings.
- [ ] **GitHub tokens:** delete every personal access token and create new ones only where needed.
- [ ] **SSH keys:** remove the affected machine's SSH keys from GitHub and any server, then make new keys on a clean machine.
- [ ] **Signing keys:** revoke GPG or SSH signing keys that were on the machine.
- [ ] **npm and other registries:** revoke publish tokens and check for versions you did not publish.
- [ ] **Cloud and CI:** rotate API keys and secrets that were in `.env` files, shell history or config on the machine.
- [ ] **Browser:** change passwords saved in the browser on that machine, starting with email.

## 4. Check what the malware may have changed

- [ ] Look at your recent GitHub activity for pushes, force-pushes or new repositories you did not make.
- [ ] Check your own repositories for new or changed `.vscode/tasks.json`, `package.json` install scripts, workflow files, and config files with code at the very end.
- [ ] If you are a maintainer, tell your co-maintainers so they can review recent merges.

## 5. Clean or reset the machine

Removing one file is rarely enough: the payload may have installed something else.

- [ ] Back up only documents you need. Do not back up projects, scripts, browser profiles or dotfiles from the affected time.
- [ ] Reinstall the operating system from official media. This is the only reliable fix.
- [ ] Before you reconnect, turn on Workspace Trust and turn automatic tasks off (see [the hardening guide](/guides/hardening)).

## 6. Report it, or appeal a result

- [ ] Report the repository to GitHub with **Report repository** on its page, and include the URL and what happened.
- [ ] Tell the project's maintainers privately if it is a project you were contributing to.
- [ ] If the file is new, a Dome curator can add its fingerprint to the [Dome Registry](/registry) so others are warned.

If Dome flagged **your** repository and you believe it is wrong, open an issue on the [dome-backend repository](https://github.com/DOME-security/Dome-backend/issues) with the scan link. Results can be retracted publicly, so mistakes stay visible and get fixed.
