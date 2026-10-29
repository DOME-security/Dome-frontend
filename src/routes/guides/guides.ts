import type { LoaderFunctionArgs } from 'react-router';
import { parseMarkdown, type MarkdownDoc } from '../../lib/markdown';

// Each guide is its own chunk, loaded only when the page opens.
const sources = import.meta.glob<string>('../../content/guides/*.md', { query: '?raw', import: 'default' });

export const GUIDE_SLUGS = ['infected', 'hardening', 'wave'] as const;

export async function loadGuide(slug: string): Promise<MarkdownDoc | null> {
  const load = sources[`../../content/guides/${slug}.md`];
  return load ? parseMarkdown(await load()) : null;
}

export async function guideLoader({ params }: LoaderFunctionArgs): Promise<MarkdownDoc> {
  const guide = (GUIDE_SLUGS as readonly string[]).includes(params.slug ?? '') ? await loadGuide(params.slug!) : null;
  if (!guide) throw new Response('Not found', { status: 404 });
  return guide;
}
