import { describe, expect, it } from 'vitest';
import { describeRule, RULES, SEVERITY_TEXT, VERDICT_TEXT } from './rules';

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
  it('covers every rule documented by dome-backend', () => {
    expect(Object.keys(RULES)).toHaveLength(27);
    for (const [id, rule] of Object.entries(RULES)) {
      expect(id).toMatch(/^DOME-[A-Z]{3}-\d{3}$/);
      expect(rule.title).not.toBe('');
      expect(SEVERITY_TEXT[rule.severity]).toBeDefined();
    }
  });

  it('has text for every verdict', () => {
    expect(Object.keys(VERDICT_TEXT).sort()).toEqual(['block', 'clean', 'incomplete', 'review']);
  });
});
