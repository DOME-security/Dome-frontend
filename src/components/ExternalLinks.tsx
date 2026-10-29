import { safeHref } from '../lib/markdown';
import ui from '../styles/ui.module.css';

/** Evidence links from the registry: https only, shown by host so the full URL cannot impersonate app text. */
export function EvidenceLinks({ urls }: { urls: string[] }) {
  const safe = urls.map((u) => safeHref(u)).filter((u): u is string => Boolean(u && u.startsWith('https://')));
  if (!safe.length) return <span className={ui.muted}>None published</span>;
  return (
    <ul>
      {safe.map((href) => (
        <li key={href}>
          <a href={href} target="_blank" rel="noreferrer" className={ui.mono}>
            {new URL(href).host}
          </a>
        </li>
      ))}
    </ul>
  );
}
