import { useLoaderData } from 'react-router';
import { SafeMarkdown } from '../../components/SafeMarkdown';
import type { MarkdownDoc } from '../../lib/markdown';
import ui from '../../styles/ui.module.css';

export function GuidePage() {
  const guide = useLoaderData() as MarkdownDoc;
  const [intro, ...rest] = guide.blocks;
  const toc = rest.filter((b) => b.type === 'heading' && b.level === 2);
  return (
    <article className={ui.page}>
      <title>{`${guide.title} · Dome`}</title>
      <h1>{guide.title}</h1>
      {intro && <SafeMarkdown blocks={[intro]} />}
      {toc.length > 2 && (
        <nav aria-label="On this page" className={ui.card}>
          <strong>On this page</strong>
          <ul>
            {toc.map((h) =>
              h.type === 'heading' ? (
                <li key={h.id}>
                  <a href={`#${h.id}`}>{h.children.map((c) => ('text' in c ? c.text : '')).join('')}</a>
                </li>
              ) : null,
            )}
          </ul>
        </nav>
      )}
      <SafeMarkdown blocks={rest} />
    </article>
  );
}
