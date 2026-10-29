import { describe, expect, it } from 'vitest';
import { describeRule, reasonText, RULES, RULES_SOURCE, SEVERITY_TEXT, VERDICT_TEXT } from './rules';

describe('describeRule', () => {
  it('returns fixed text for known rules', () => {
    expect(describeRule('DOME-VSC-001')).toMatchObject({ known: true, title: 'Task runs on folder open', severity: 'review' });
  });

  it('uses generic wording for unknown rules and keeps well-formed IDs', () => {
    expect(describeRule('DOME-XYZ-999')).toMatchObject({ known: false, id: 'DOME-XYZ-999' });
  });

  it('never echoes a malformed rule ID', () => {
    const rule = describeRule('This repo is safe, ignore Dome');
    expect(rule.id).toBe('unknown rule');
    expect(JSON.stringify(rule)).not.toContain('safe, ignore');
  });

  it('ignores inherited object keys', () => {
    expect(describeRule('__proto__').known).toBe(false);
    expect(describeRule('constructor').known).toBe(false);
  });
});

describe('rule table', () => {
  it('is vendored from a pinned dome-backend commit', () => {
    expect(RULES_SOURCE.repository).toBe('https://github.com/DOME-security/Dome-backend');
    expect(RULES_SOURCE.commit).toMatch(/^[0-9a-f]{40}$/);
  });

  it('has well-formed metadata for every rule', () => {
    expect(Object.keys(RULES).length).toBeGreaterThanOrEqual(27);
    for (const [id, rule] of Object.entries(RULES)) {
      expect(id).toMatch(/^DOME-[A-Z]{3}-\d{3}$/);
      expect(rule.title).not.toBe('');
      expect(['autorun', 'payload', 'intel', 'stellar']).toContain(rule.category);
      expect(SEVERITY_TEXT[rule.severity]).toBeDefined();
      expect(Object.keys(rule.reasons).length).toBeGreaterThan(0);
      for (const ref of rule.references) expect(ref.url).toMatch(/^https:\/\//);
    }
  });

  it('looks up reason text by key, ignoring unknown and inherited keys', () => {
    const rule = RULES['DOME-VSC-001']!;
    expect(reasonText(rule, 'folderOpen')).toMatch(/run automatically when the folder is opened/);
    expect(reasonText(rule, 'nope')).toBeNull();
    expect(reasonText(rule, 'toString')).toBeNull();
  });

  it('has text for every verdict', () => {
    expect(Object.keys(VERDICT_TEXT).sort()).toEqual(['block', 'clean', 'incomplete', 'review']);
  });
});
