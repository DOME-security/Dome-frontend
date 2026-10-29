import type { Severity, Verdict } from './types';

// Every word a user reads about a finding comes from this file. The backend
// sends rule IDs and severities; text from a scanned repository never reaches
// a verdict. Source: dome-backend docs/rules (generated from the engine).

export type RuleCategory = 'autorun' | 'payload' | 'intel' | 'stellar';

export interface RuleText {
  title: string;
  category: RuleCategory;
  /** Default level before grading; the finding's own severity wins. */
  severity: Severity;
  summary: string;
}

export const RULES: Record<string, RuleText> = {
  'DOME-AGT-001': {
    title: 'AI agent hooks or auto-approved tools',
    category: 'autorun',
    severity: 'review',
    summary: 'AI agent hooks and auto-approved tools: .claude/settings*.json, .cursor/hooks.json, .mcp.json, .cursor/mcp.json, .vscode/mcp.json.',
  },
  'DOME-AST-001': {
    title: 'Font file is not a font',
    category: 'payload',
    severity: 'review',
    summary: 'A file with a font extension whose bytes are not a real font (checked by format header fields, not just magic bytes).',
  },
  'DOME-AST-002': {
    title: 'Asset in an execution position',
    category: 'payload',
    severity: 'block',
    summary: 'An image or font asset referenced from an execution position (npm script, dev container hook, workflow step, shell script, fork, or read and evaluated).',
  },
  'DOME-CFG-001': {
    title: 'Code after the module body in a config file',
    category: 'payload',
    severity: 'review',
    summary: 'Code after the module body in JS/TS config files, especially after a long run of whitespace.',
  },
  'DOME-CFG-002': {
    title: 'Whitespace padding or very long line in source',
    category: 'payload',
    severity: 'review',
    summary: 'Very long lines or heavy whitespace padding in source and config files.',
  },
  'DOME-CFG-003': {
    title: 'Runtime code construction in config or route code',
    category: 'payload',
    severity: 'review',
    summary: 'Runtime code construction (eval, new Function, vm.runIn*, detached hidden child_process spawns) in config or route files.',
  },
  'DOME-DEV-001': {
    title: 'Dev container lifecycle command',
    category: 'autorun',
    severity: 'review',
    summary: '.devcontainer/devcontainer.json initializeCommand, onCreateCommand, postCreateCommand, postStartCommand or postAttachCommand added or changed.',
  },
  'DOME-ENV-001': {
    title: 'Encoded URL in .env with code that sends the environment',
    category: 'payload',
    severity: 'review',
    summary: 'Base64-encoded URLs in .env files combined with code that sends process.env over the network.',
  },
  'DOME-GHA-001': {
    title: 'Workflow added, changed or risky',
    category: 'autorun',
    severity: 'review',
    summary: 'New or changed workflow under .github/workflows/, weighted up for pull_request_target, secrets passed to curl/wget, or posting to raw IPs.',
  },
  'DOME-GIT-001': {
    title: '.gitignore stops ignoring .vscode or .env',
    category: 'autorun',
    severity: 'info',
    summary: '.gitignore change that stops ignoring .vscode or .env.',
  },
  'DOME-GIT-002': {
    title: 'Git hooks committed to the repository',
    category: 'autorun',
    severity: 'review',
    summary: 'Git hooks committed to the repo (.husky/, .githooks/, simple-git-hooks) or a core.hooksPath setting.',
  },
  'DOME-IOC-001': {
    title: 'Known-bad file hash',
    category: 'intel',
    severity: 'block',
    summary: 'File hashes on the known-bad list (synced from the Dome Registry and public advisories).',
  },
  'DOME-IOC-002': {
    title: 'Published campaign marker',
    category: 'intel',
    severity: 'block',
    summary: 'Published campaign markers (for example the signatures in OpenSourceMalware\'s PolinRider YARA rule).',
  },
  'DOME-IOC-003': {
    title: 'Known malicious npm package',
    category: 'intel',
    severity: 'block',
    summary: 'Dependencies on known malicious npm packages.',
  },
  'DOME-IOC-004': {
    title: 'Known staging or C2 domain in an executable position',
    category: 'intel',
    severity: 'block',
    summary: 'Known staging and C2 domains in executable positions (tasks, scripts, hooks, workflows, config and route code).',
  },
  'DOME-NPM-001': {
    title: 'Install script added or changed',
    category: 'autorun',
    severity: 'review',
    summary: 'preinstall, install, postinstall or prepare scripts added or changed (and binding.gyp, which npm builds on install).',
  },
  'DOME-NPM-002': {
    title: 'Install script runs an unexpected file',
    category: 'autorun',
    severity: 'review',
    summary: 'An install script runs a file that is not tracked source or a known build output.',
  },
  'DOME-PRP-001': {
    title: 'Propagation script rewrites history',
    category: 'payload',
    severity: 'review',
    summary: 'Propagation scripts that rewind the clock, amend the last commit and force-push.',
  },
  'DOME-STL-001': {
    title: 'Code reads Stellar CLI identities',
    category: 'stellar',
    severity: 'review',
    summary: 'Code that reads Stellar CLI identities (~/.config/stellar/identity/*.toml, plaintext unless created with --secure-store).',
  },
  'DOME-STL-002': {
    title: 'Code reads browser wallet extension storage',
    category: 'stellar',
    severity: 'review',
    summary: 'Code that reads browser wallet extension storage (Freighter and others) from a project file.',
  },
  'DOME-STL-003': {
    title: 'Hard-coded Stellar secret key',
    category: 'stellar',
    severity: 'review',
    summary: 'Hard-coded Stellar secret keys (S… strkeys with a valid checksum) committed to the repo.',
  },
  'DOME-VSC-001': {
    title: 'Task runs on folder open',
    category: 'autorun',
    severity: 'review',
    summary: 'A .vscode/tasks.json or *.code-workspace task sets runOptions.runOn to folderOpen.',
  },
  'DOME-VSC-002': {
    title: 'Automatic tasks turned on',
    category: 'autorun',
    severity: 'review',
    summary: 'Workspace settings set task.allowAutomaticTasks to on.',
  },
  'DOME-VSC-003': {
    title: '.vscode hidden from view',
    category: 'autorun',
    severity: 'review',
    summary: 'files.exclude or search.exclude hides .vscode or tasks.json.',
  },
  'DOME-VSC-004': {
    title: 'Task runs a non-script file with Node',
    category: 'autorun',
    severity: 'block',
    summary: 'A task command runs a font, image or other non-script file with node (string or array form, sh -c, -r/--import, stdin).',
  },
  'DOME-VSC-005': {
    title: 'Task downloads and runs code',
    category: 'autorun',
    severity: 'block',
    summary: 'A task command downloads and pipes to a shell (curl … | sh, wget … | bash, PowerShell iwr | iex).',
  },
  'DOME-VSC-006': {
    title: 'Task output hidden',
    category: 'autorun',
    severity: 'info',
    summary: 'Task options hide output (presentation.reveal: never, presentation.echo: false, hide: true) on a task that also runs on folder open or runs a payload.',
  },
};

const RULE_ID = /^DOME-[A-Z]{3}-\d{3}$/;

/** Fixed text for a rule. Unknown IDs get generic wording; the ID itself is shown only if it has the expected shape. */
export function describeRule(ruleId: string): RuleText & { id: string; known: boolean } {
  const rule = Object.hasOwn(RULES, ruleId) ? RULES[ruleId] : undefined;
  if (rule) return { ...rule, id: ruleId, known: true };
  return {
    id: RULE_ID.test(ruleId) ? ruleId : 'unknown rule',
    known: false,
    title: 'A rule this version of the app does not know yet',
    category: 'autorun',
    severity: 'review',
    summary: 'Reload the page to get the latest app, or check the rule in the Dome documentation.',
  };
}

export const SEVERITY_TEXT: Record<Severity, { label: string; icon: string; description: string }> = {
  block: { label: 'Block', icon: '🔴', description: 'Do not open, install or run this until it has been reviewed.' },
  review: { label: 'Review', icon: '🟠', description: 'Read this before opening the folder in your editor or running anything.' },
  info: { label: 'Info', icon: '⚪', description: 'Worth knowing; not a problem on its own.' },
};

export const SEVERITY_ORDER: Record<Severity, number> = { block: 0, review: 1, info: 2 };

export const VERDICT_TEXT: Record<Verdict, { label: string; summary: string; tone: Severity | 'clean' }> = {
  block: {
    label: 'Blocked',
    summary: 'Dome found code that runs when you open, install or build this repository and matches a known attack pattern. Do not open it in your editor.',
    tone: 'block',
  },
  review: {
    label: 'Needs review',
    summary: 'Dome found code that can run automatically. Read the findings before you open the folder or run anything.',
    tone: 'review',
  },
  clean: {
    label: 'No known pattern found',
    summary: 'Dome did not find any known auto-run or payload pattern at this commit.',
    tone: 'clean',
  },
  incomplete: {
    label: 'Incomplete',
    summary: 'Dome could not read every file, so this result is not complete. Treat it as needing review.',
    tone: 'review',
  },
};

export const INCOMPLETE_TEXT: Record<string, string> = {
  'too-large': 'Too large to read',
  'read-error': 'Could not be read',
  'invalid-config': 'Configuration could not be parsed',
  'unsupported-entry': 'Unsupported file type',
};

/** Shown at the end of every report. */
export const HONESTY_NOTICE = 'No known pattern found is not the same as safe.';
