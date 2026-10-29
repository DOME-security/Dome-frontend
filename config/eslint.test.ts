import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

// Proves the lint rules in eslint.config.js actually stop HTML rendering.
const eslint = new ESLint({ cwd: process.cwd() });

async function ruleIds(code: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath: 'src/__lint_fixture__.tsx' });
  return (result?.messages ?? []).map((m) => m.ruleId ?? 'parse-error');
}

describe('security lint rules', () => {
  it('bans dangerouslySetInnerHTML', async () => {
    expect(await ruleIds('export const A = (p: { t: string }) => <div dangerouslySetInnerHTML={{ __html: p.t }} />;\n')).toContain('react/no-danger');
  });

  it('bans innerHTML assignment and insertAdjacentHTML', async () => {
    const ids = await ruleIds("export function f(el: HTMLElement, t: string) {\n  el.innerHTML = t;\n  el.insertAdjacentHTML('beforeend', t);\n}\n");
    expect(ids.filter((id) => id === 'no-restricted-syntax')).toHaveLength(2);
  });

  it('bans eval and javascript: links', async () => {
    const ids = await ruleIds("export const run = (t: string) => eval(t);\nexport const L = () => <a href=\"javascript:void(0)\">x</a>;\n");
    expect(ids).toContain('no-eval');
    expect(ids).toContain('react/jsx-no-script-url');
  });

  it('accepts plain text rendering', async () => {
    expect(await ruleIds('export const A = (p: { t: string }) => <p>{p.t}</p>;\n')).toEqual([]);
  });
});
