import rulesFile from '../vendor/rules.json';
import { m } from '../i18n';
import type { Severity, Verdict } from './types';

// Every word a user reads about a finding comes from the app. The backend
// sends rule IDs, reason keys and severities; the text for them comes from
// dome-backend's rule metadata, vendored at a pinned commit in
// src/vendor/rules.json (refresh with scripts/sync-rules.mjs).
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
    id: RULE_ID.test(ruleId) ? ruleId : m.unknownRule.id,
    known: false,
    title: m.unknownRule.title,
    category: 'autorun',
    severity: 'review',
    summary: m.unknownRule.summary,
    reasons: {},
    references: [],
  };
}

/** The rule's own wording for a reason key, or null. Never the API's `reason` field. */
export function reasonText(rule: RuleText, reasonKey: string): string | null {
  return Object.hasOwn(rule.reasons, reasonKey) ? rule.reasons[reasonKey]! : null;
}

export const SEVERITY_TEXT: Record<Severity, { label: string; icon: string; description: string }> = m.severity;

export const SEVERITY_ORDER: Record<Severity, number> = { block: 0, review: 1, info: 2 };

const VERDICT_TONE: Record<Verdict, Severity | 'clean'> = {
  block: 'block',
  review: 'review',
  clean: 'clean',
  incomplete: 'review',
};

export const VERDICT_TEXT: Record<Verdict, { label: string; summary: string; tone: Severity | 'clean' }> = Object.fromEntries(
  (Object.keys(VERDICT_TONE) as Verdict[]).map((v) => [v, { ...m.verdict[v], tone: VERDICT_TONE[v] }]),
) as Record<Verdict, { label: string; summary: string; tone: Severity | 'clean' }>;

export const INCOMPLETE_TEXT: Record<string, string> = m.incomplete;

/** Shown at the end of every report. */
export const HONESTY_NOTICE = m.honestyNotice;
