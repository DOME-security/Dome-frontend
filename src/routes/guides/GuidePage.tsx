import { useLoaderData } from 'react-router';
import { m } from '../../i18n';
import { SafeMarkdown } from '../../components/SafeMarkdown';
import type { MarkdownDoc } from '../../lib/markdown';
import ui from '../../styles/ui.module.css';

export function GuidePage() {
  const guide = useLoaderData() as MarkdownDoc;
  const [intro, ...rest] = guide.blocks;
  const toc = rest.filter((b) => b.type === 'heading' && b.level === 2);
  return (
    <article className={ui.page}>
      <title>{m.app.titleSuffix(guide.title)}</title>
      <h1>{guide.title}</h1>
      {intro && <SafeMarkdown blocks={[intro]} />}
      {toc.length > 2 && (
        <nav aria-label={m.guides.toc} className={ui.card}>
          <strong>{m.guides.toc}</strong>
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
