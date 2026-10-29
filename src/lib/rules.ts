import rulesFile from '../../vendor/dome-backend/rules.json';
import type { Severity, Verdict } from './types';

// Every word a user reads about a finding comes from the app. The backend
// sends rule IDs, reason keys and severities; the text for them comes from
// dome-backend's rule metadata, vendored at a pinned commit in
// vendor/dome-backend/rules.json (refresh with scripts/sync-rules.mjs).
// Text from a scanned repository or the API never reaches a verdict.

export type RuleCategory = 'autorun' | 'payload' | 'intel' | 'stellar';

export interface RuleReference {
  title: string;
  url: string;
}

export interface RuleText {
  title: string;
  category: RuleCategory;
  /** Default level before grading; the finding's own severity wins. */
  severity: Severity;
  summary: string;
  /** Fixed text for each reason key the rule can report. */
  reasons: Record<string, string>;
  why?: string;
  references: RuleReference[];
}

export const RULES_SOURCE = rulesFile.source;

export const RULES: Record<string, RuleText> = Object.fromEntries(
  (rulesFile.rules as unknown as (RuleText & { id: string })[]).map(({ id, ...rule }) => [id, rule]),
);

const RULE_ID = /^DOME-[A-Z]{3}-\d{3}$/;

export interface DescribedRule extends RuleText {
  id: string;
  known: boolean;
}

/** Fixed text for a rule. Unknown IDs get generic wording; the ID itself is shown only if it has the expected shape. */
export function describeRule(ruleId: string): DescribedRule {
  const rule = Object.hasOwn(RULES, ruleId) ? RULES[ruleId] : undefined;
  if (rule) return { ...rule, id: ruleId, known: true };
  return {
    id: RULE_ID.test(ruleId) ? ruleId : 'unknown rule',
    known: false,
    title: 'A rule this version of the app does not know yet',
    category: 'autorun',
    severity: 'review',
    summary: 'Reload the page to get the latest app, or check the rule in the Dome documentation.',
    reasons: {},
    references: [],
  };
}

/** The rule's own wording for a reason key, or null. Never the API's `reason` field. */
export function reasonText(rule: RuleText, reasonKey: string): string | null {
  return Object.hasOwn(rule.reasons, reasonKey) ? rule.reasons[reasonKey]! : null;
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
    summary:
      'Dome found code that runs when you open, install or build this repository and matches a known attack pattern. Do not open it in your editor.',
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
