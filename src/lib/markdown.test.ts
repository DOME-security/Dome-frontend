import { describe, expect, it } from 'vitest';
import { parseInline, parseMarkdown, safeHref, slugify } from './markdown';

describe('safeHref', () => {
  it.each(['https://example.org/a?b=c', '/guides/hardening', '#step-1'])('allows %s', (href) => {
    expect(safeHref(href)).not.toBeNull();
  });

  it.each(['javascript:alert(1)', 'data:text/html,x', 'http://example.org', '//evil.example', 'https://u:p@example.org', 'vbscript:x'])(
    'blocks %s',
    (href) => {
      expect(safeHref(href)).toBeNull();
    },
  );
});

describe('parseInline', () => {
  it('parses bold, emphasis, code and links', () => {
    expect(parseInline('a **b** *c* `d` [e](/f)')).toEqual([
      { type: 'text', text: 'a ' },
      { type: 'strong', children: [{ type: 'text', text: 'b' }] },
      { type: 'text', text: ' ' },
      { type: 'em', children: [{ type: 'text', text: 'c' }] },
      { type: 'text', text: ' ' },
      { type: 'code', text: 'd' },
      { type: 'text', text: ' ' },
      { type: 'link', href: '/f', children: [{ type: 'text', text: 'e' }] },
    ]);
  });

  it('turns unsafe links into plain text and keeps HTML as text', () => {
    expect(parseInline('[click](javascript:alert(1))')).toEqual([
      { type: 'text', text: 'click' },
      { type: 'text', text: ')' },
    ]);
    expect(parseInline('<img src=x onerror=alert(1)>')).toEqual([{ type: 'text', text: '<img src=x onerror=alert(1)>' }]);
  });
});

describe('parseMarkdown', () => {
  const doc = parseMarkdown(`# Title

Summary line
continues here.

## Step one

- [ ] first
- [ ] second
  continued

1. a
2. b

> careful
> now
`);

  it('reads the title and summary', () => {
    expect(doc.title).toBe('Title');
    expect(doc.summary).toBe('Summary line continues here.');
  });

  it('parses headings with ids, checklists, ordered lists and callouts', () => {
    expect(doc.blocks.map((b) => b.type)).toEqual(['paragraph', 'heading', 'list', 'list', 'callout']);
    expect(doc.blocks[1]).toMatchObject({ level: 2, id: 'step-one' });
    expect(doc.blocks[2]).toMatchObject({ ordered: false, items: [{ checkbox: true }, { checkbox: true }] });
    expect(doc.blocks[3]).toMatchObject({ ordered: true });
    expect(doc.blocks[4]).toEqual({ type: 'callout', children: [{ type: 'text', text: 'careful now' }] });
  });

  it('slugifies headings', () => {
    expect(slugify('1. Disconnect the machine!')).toBe('1-disconnect-the-machine');
  });
});
