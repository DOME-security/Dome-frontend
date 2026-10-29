// A deliberately small Markdown subset for the guides. It produces a tree of
// plain data that components render as React elements, so nothing is ever
// parsed as HTML: `<script>` in the source is shown as text.

export type Inline =
  | { type: 'text'; text: string }
  | { type: 'strong'; children: Inline[] }
  | { type: 'em'; children: Inline[] }
  | { type: 'code'; text: string }
  | { type: 'link'; href: string; children: Inline[] };

export type Block =
  | { type: 'heading'; level: 2 | 3; id: string; children: Inline[] }
  | { type: 'paragraph'; children: Inline[] }
  | { type: 'list'; ordered: boolean; items: { checkbox: boolean; children: Inline[] }[] }
  | { type: 'callout'; children: Inline[] };

export interface MarkdownDoc {
  title: string;
  summary: string;
  blocks: Block[];
}

/** Links must be https, a site path, or an in-page anchor. Anything else renders as plain text. */
export function safeHref(href: string): string | null {
  if (/^#[\w-]+$/.test(href)) return href;
  if (/^\/(?!\/)[\w\-./#?=&]*$/.test(href)) return href;
  try {
    const url = new URL(href);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

const INLINE = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\))/;

export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  let rest = text;
  while (rest) {
    const match = INLINE.exec(rest);
    if (!match) {
      out.push({ type: 'text', text: rest });
      break;
    }
    if (match.index > 0) out.push({ type: 'text', text: rest.slice(0, match.index) });
    const [whole, , strong, em, code, linkText, href] = match;
    if (strong !== undefined) out.push({ type: 'strong', children: parseInline(strong) });
    else if (em !== undefined) out.push({ type: 'em', children: parseInline(em) });
    else if (code !== undefined) out.push({ type: 'code', text: code });
    else if (linkText !== undefined && href !== undefined) {
      const safe = safeHref(href);
      out.push(safe ? { type: 'link', href: safe, children: parseInline(linkText) } : { type: 'text', text: linkText });
    }
    rest = rest.slice(match.index + whole.length);
  }
  return out;
}

function plainText(nodes: Inline[]): string {
  return nodes.map((n) => ('text' in n ? n.text : plainText(n.children))).join('');
}

const LIST_ITEM = /^(\s*)([-*]|\d+\.)\s+(\[ \]\s+)?(.*)$/;

/** Parses a guide: `# Title`, an optional summary paragraph, then blocks. */
export function parseMarkdown(source: string): MarkdownDoc {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const blocks: Block[] = [];
  let title = '';
  let paragraph: string[] = [];

  const flush = () => {
    if (paragraph.length) blocks.push({ type: 'paragraph', children: parseInline(paragraph.join(' ')) });
    paragraph = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const trimmed = line.trim();
    if (!trimmed) {
      flush();
      continue;
    }
    const heading = /^(#{1,3})\s+(.*)$/.exec(trimmed);
    if (heading) {
      flush();
      const level = heading[1]!.length;
      const children = parseInline(heading[2]!);
      if (level === 1) title = plainText(children);
      else blocks.push({ type: 'heading', level: level as 2 | 3, id: slugify(plainText(children)), children });
      continue;
    }
    if (trimmed.startsWith('>')) {
      flush();
      const quote: string[] = [];
      while (i < lines.length && lines[i]!.trim().startsWith('>')) {
        quote.push(lines[i]!.trim().replace(/^>\s?/, ''));
        i++;
      }
      i--;
      blocks.push({ type: 'callout', children: parseInline(quote.join(' ')) });
      continue;
    }
    const item = LIST_ITEM.exec(line);
    if (item) {
      flush();
      const ordered = /\d/.test(item[2]!);
      const items: { checkbox: boolean; children: Inline[] }[] = [];
      while (i < lines.length) {
        const m = LIST_ITEM.exec(lines[i]!);
        if (m && /\d/.test(m[2]!) === ordered) {
          items.push({ checkbox: Boolean(m[3]), children: parseInline(m[4]!) });
        } else if (lines[i]!.startsWith('  ') && lines[i]!.trim() && items.length) {
          // Continuation line of the previous item.
          const last = items[items.length - 1]!;
          last.children = [...last.children, { type: 'text', text: ' ' }, ...parseInline(lines[i]!.trim())];
        } else break;
        i++;
      }
      i--;
      blocks.push({ type: 'list', ordered, items });
      continue;
    }
    paragraph.push(trimmed);
  }
  flush();

  const first = blocks[0];
  const summary = first?.type === 'paragraph' ? plainText(first.children) : '';
  return { title, summary, blocks };
}
